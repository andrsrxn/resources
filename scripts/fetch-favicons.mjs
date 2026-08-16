import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const publicDir = path.join(rootDir, 'public')
const publicFaviconsDir = path.join(publicDir, 'favicons')
const resourcesFilePath = path.join(rootDir, 'src', 'lib', 'constants', 'resources.ts')

function slugify(text) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'favicon'
  )
}

function getExtFromContentType(contentType, defaultExt = 'png') {
  if (!contentType) return defaultExt
  const ct = contentType.toLowerCase()
  if (ct.includes('svg')) return 'svg'
  if (ct.includes('webp')) return 'webp'
  if (ct.includes('png')) return 'png'
  if (ct.includes('x-icon') || ct.includes('vnd.microsoft.icon') || ct.includes('ico')) return 'ico'
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg'
  if (ct.includes('gif')) return 'gif'
  return defaultExt
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        ...(options.headers || {}),
      },
    })
    return res
  } finally {
    clearTimeout(timeoutId)
  }
}

async function tryFetchImage(url) {
  try {
    const res = await fetchWithTimeout(url)
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      return null
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 40) return null

    let ext = getExtFromContentType(contentType, '')
    if (!ext) {
      const pathnameExt = path.extname(new URL(url).pathname).replace('.', '').toLowerCase()
      if (['png', 'ico', 'svg', 'webp', 'jpg', 'jpeg'].includes(pathnameExt)) {
        ext = pathnameExt === 'jpeg' ? 'jpg' : pathnameExt
      } else {
        ext = 'png'
      }
    }
    return { buffer, ext }
  } catch {
    return null
  }
}

function extractFaviconLinks(html, baseUrl) {
  const iconLinks = []
  const linkRegex = /<link\b([^>]*?)>/gi
  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const attrs = match[1]
    const relMatch = attrs.match(/rel=["']([^"']+)["']/i)
    const hrefMatch = attrs.match(/href=["']([^"']+)["']/i)
    if (relMatch && hrefMatch) {
      const rel = relMatch[1].toLowerCase()
      if (rel.includes('icon') || rel.includes('apple-touch-icon')) {
        try {
          const resolvedUrl = new URL(hrefMatch[1], baseUrl).href
          const sizesMatch = attrs.match(/sizes=["']([^"']+)["']/i)
          let sizeScore = 0
          if (rel.includes('apple-touch-icon')) sizeScore += 20
          if (sizesMatch) {
            const [w] = sizesMatch[1].split('x').map(Number)
            if (w) sizeScore += w
          }
          if (resolvedUrl.endsWith('.svg')) sizeScore += 50
          iconLinks.push({ url: resolvedUrl, score: sizeScore })
        } catch {}
      }
    }
  }
  iconLinks.sort((a, b) => b.score - a.score)
  return iconLinks.map(i => i.url)
}

async function fetchFavicon(item) {
  const targetUrl = item.url
  let hostname = ''
  let origin = ''
  try {
    const parsed = new URL(targetUrl)
    hostname = parsed.hostname
    origin = parsed.origin
  } catch {
    return null
  }

  // 1. Try HTML scraping for high-res icons (SVG, Apple Touch Icon, etc.)
  try {
    const pageRes = await fetchWithTimeout(targetUrl, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    }, 5000)

    if (pageRes.ok) {
      const html = await pageRes.text()
      const iconCandidates = extractFaviconLinks(html, targetUrl)
      for (const iconUrl of iconCandidates) {
        const img = await tryFetchImage(iconUrl)
        if (img) return img
      }
    }
  } catch {}

  // 2. Try Google S2 Favicon API (returns high quality 128px PNG)
  try {
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(targetUrl)}&sz=128`
    const img = await tryFetchImage(googleFaviconUrl)
    if (img) return img
  } catch {}

  // 3. Try direct origin /favicon.ico
  try {
    const directFaviconUrl = `${origin}/favicon.ico`
    const img = await tryFetchImage(directFaviconUrl)
    if (img) return img
  } catch {}

  // 4. Try IconHorse API
  try {
    const iconHorseUrl = `https://icon.horse/icon/${hostname}`
    const img = await tryFetchImage(iconHorseUrl)
    if (img) return img
  } catch {}

  // 5. Try unavatar.io
  try {
    const unavatarUrl = `https://unavatar.io/${hostname}`
    const img = await tryFetchImage(unavatarUrl)
    if (img) return img
  } catch {}

  // 6. Try DuckDuckGo Favicon API
  try {
    const ddgFaviconUrl = `https://icons.duckduckgo.com/ip3/${hostname}.ico`
    const img = await tryFetchImage(ddgFaviconUrl)
    if (img) return img
  } catch {}

  return null
}

function checkExistingFaviconFile(item, slug) {
  // 1. If item already has a favicon path defined, check if that file exists in public/
  if (item.favicon && typeof item.favicon === 'string') {
    const relativeClean = item.favicon.startsWith('/') ? item.favicon.slice(1) : item.favicon
    const fullPath = path.join(publicDir, relativeClean)
    if (fsSync.existsSync(fullPath)) {
      try {
        const stat = fsSync.statSync(fullPath)
        if (stat.size > 0) {
          return item.favicon.startsWith('/') ? item.favicon : `/${item.favicon}`
        }
      } catch {}
    }
  }

  // 2. Check if a favicon with matching slug exists in public/favicons/
  const possibleExtensions = ['svg', 'png', 'ico', 'webp', 'jpg', 'jpeg']
  for (const ext of possibleExtensions) {
    const fileName = `${slug}.${ext}`
    const fullPath = path.join(publicFaviconsDir, fileName)
    if (fsSync.existsSync(fullPath)) {
      try {
        const stat = fsSync.statSync(fullPath)
        if (stat.size > 0) {
          return `/favicons/${fileName}`
        }
      } catch {}
    }
  }

  return null
}

async function main() {
  console.log('--- Starting Favicon Fetcher ---')

  if (!fsSync.existsSync(publicFaviconsDir)) {
    await fs.mkdir(publicFaviconsDir, { recursive: true })
  }

  // Read original source file content
  const originalCode = await fs.readFile(resourcesFilePath, 'utf8')

  // Import resources dynamically
  const resourcesModule = await import(`file://${resourcesFilePath}?t=${Date.now()}`)
  const resources = resourcesModule.RESOURCES

  // Collect all items
  const items = []
  for (const [sectionKey, section] of Object.entries(resources)) {
    for (const [categoryKey, category] of Object.entries(section.categories || {})) {
      for (const item of category.items || []) {
        if (item.url) {
          items.push(item)
        }
      }
    }
  }

  console.log(`Found ${items.length} items to check.`)

  const slugToUrl = new Map()
  const itemFaviconMap = new Map()
  let completed = 0
  let skippedCount = 0
  let downloadedCount = 0

  function getUniqueSlug(item) {
    const baseSlug = slugify(item.title)
    if (!slugToUrl.has(baseSlug)) {
      slugToUrl.set(baseSlug, item.url)
      return baseSlug
    }
    if (slugToUrl.get(baseSlug) === item.url) {
      return baseSlug
    }
    try {
      const host = new URL(item.url).hostname.replace(/[^a-z0-9]/gi, '-')
      const uniqueSlug = `${baseSlug}-${host}`
      slugToUrl.set(uniqueSlug, item.url)
      return uniqueSlug
    } catch {
      const uniqueSlug = `${baseSlug}-2`
      slugToUrl.set(uniqueSlug, item.url)
      return uniqueSlug
    }
  }

  const queue = [...items]
  const CONCURRENCY = 12

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift()
      if (!item) break

      const slug = getUniqueSlug(item)

      // Reused from current run if same URL was already processed
      if (itemFaviconMap.has(item.url)) {
        completed++
        console.log(`[${completed}/${items.length}] Reused in-memory: ${item.title} -> ${itemFaviconMap.get(item.url)}`)
        continue
      }

      // Check if favicon already exists in public folder -> SKIP downloading
      const existingFaviconPath = checkExistingFaviconFile(item, slug)
      if (existingFaviconPath) {
        itemFaviconMap.set(item.url, existingFaviconPath)
        completed++
        skippedCount++
        console.log(`[${completed}/${items.length}] Skipped (already exists): ${item.title} -> ${existingFaviconPath}`)
        continue
      }

      // Download only if not present
      try {
        const result = await fetchFavicon(item)
        if (result && result.buffer) {
          const fileName = `${slug}.${result.ext}`
          const filePath = path.join(publicFaviconsDir, fileName)
          await fs.writeFile(filePath, result.buffer)
          const faviconPath = `/favicons/${fileName}`
          itemFaviconMap.set(item.url, faviconPath)
          completed++
          downloadedCount++
          console.log(`[${completed}/${items.length}] Downloaded: ${item.title} -> ${faviconPath} (${result.buffer.length} B)`)
        } else {
          completed++
          console.warn(`[${completed}/${items.length}] Could not fetch icon for: ${item.title} (${item.url})`)
        }
      } catch (err) {
        completed++
        console.error(`[${completed}/${items.length}] Error fetching for ${item.title}: ${err.message}`)
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

  console.log(`\nSummary: ${skippedCount} already existed (skipped), ${downloadedCount} newly downloaded.`)
  console.log('--- Updating resources.ts with favicon attributes if needed ---')

  let updatedContent = originalCode
  const newlineChar = originalCode.includes('\r\n') ? '\r\n' : '\n'

  for (const item of items) {
    const faviconPath = itemFaviconMap.get(item.url)
    if (!faviconPath) continue

    const escapedUrl = item.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // 1. Check if a favicon attribute already exists directly below the url attribute
    const existingFaviconRegex = new RegExp(
      `(url:\\s*['"]${escapedUrl}['"],?\\r?\\n)([ \\t]*)favicon:\\s*['"][^'"]*['"]`,
      'g'
    )

    if (existingFaviconRegex.test(updatedContent)) {
      updatedContent = updatedContent.replace(
        existingFaviconRegex,
        `$1$2favicon: '${faviconPath}'`
      )
    } else {
      // 2. Insert favicon attribute right below url attribute
      const urlLineRegex = new RegExp(`([ \\t]*)(url:\\s*['"]${escapedUrl}['"],?)(\\r?\\n)`, 'g')
      updatedContent = updatedContent.replace(urlLineRegex, (match, indent, urlLine) => {
        const withComma = urlLine.endsWith(',') ? urlLine : `${urlLine},`
        return `${indent}${withComma}${newlineChar}${indent}favicon: '${faviconPath}',${newlineChar}`
      })
    }
  }

  if (updatedContent !== originalCode) {
    await fs.writeFile(resourcesFilePath, updatedContent, 'utf8')
    console.log(`Updated ${resourcesFilePath}`)
  } else {
    console.log('No changes needed in resources.ts (all attributes up to date).')
  }

  console.log('Done!')
}

main().catch(err => {
  console.error('Fatal error in fetch-favicons:', err)
  process.exit(1)
})
