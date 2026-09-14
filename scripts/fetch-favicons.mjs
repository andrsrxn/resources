import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

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

async function processToWebp(buffer) {
  return await sharp(buffer)
    .resize(64, 64, { fit: 'cover', position: 'center' })
    .webp({ quality: 80 })
    .toBuffer()
}

function generateInitialSvg(title) {
  const cleanTitle = (title || '').trim()
  const char = cleanTitle[0] || '?'
  const initial = char
    .toUpperCase()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  const colors = [
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#f43f5e',
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#10b981',
    '#06b6d4',
    '#0ea5e9',
    '#3b82f6',
  ]
  let hash = 0
  for (let i = 0; i < cleanTitle.length; i++) {
    hash = (hash << 5) - hash + cleanTitle.charCodeAt(i)
    hash |= 0
  }
  const bg = colors[Math.abs(hash) % colors.length]

  return `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="16" fill="${bg}"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700">${initial}</text>
</svg>`
}

async function generateInitialWebp(title) {
  const svg = generateInitialSvg(title)
  return await processToWebp(Buffer.from(svg))
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 4000) {
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

async function tryFetchImageBuffer(url) {
  try {
    const res = await fetchWithTimeout(url)
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      return null
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 40) return null
    return buffer
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

async function fetchFaviconBuffer(item) {
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

  // 1. Google S2 Favicon API (128px PNG)
  try {
    const googleUrl = `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(targetUrl)}&sz=128`
    const buf = await tryFetchImageBuffer(googleUrl)
    if (buf && buf.length > 500) return buf
  } catch {}

  // 2. DuckDuckGo Favicon API
  try {
    const ddgUrl = `https://icons.duckduckgo.com/ip3/${hostname}.ico`
    const buf = await tryFetchImageBuffer(ddgUrl)
    if (buf && buf.length > 300) return buf
  } catch {}

  // 3. Direct origin /favicon.ico
  try {
    const directUrl = `${origin}/favicon.ico`
    const buf = await tryFetchImageBuffer(directUrl)
    if (buf) return buf
  } catch {}

  // 4. IconHorse API
  try {
    const iconHorseUrl = `https://icon.horse/icon/${hostname}`
    const buf = await tryFetchImageBuffer(iconHorseUrl)
    if (buf && buf.length > 300) return buf
  } catch {}

  // 5. HTML scraping for high-res icons (SVG, Apple Touch Icon)
  try {
    const pageRes = await fetchWithTimeout(
      targetUrl,
      { headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' } },
      3000
    )

    if (pageRes.ok) {
      const html = await pageRes.text()
      const iconCandidates = extractFaviconLinks(html, targetUrl)
      for (const iconUrl of iconCandidates) {
        const buf = await tryFetchImageBuffer(iconUrl)
        if (buf) return buf
      }
    }
  } catch {}

  return null
}

async function getExistingLocalBuffer(item, slug) {
  if (item.favicon && typeof item.favicon === 'string') {
    const relPath = item.favicon.startsWith('/') ? item.favicon.slice(1) : item.favicon
    const fullPath = path.join(publicDir, relPath)
    if (fsSync.existsSync(fullPath)) {
      try {
        const buf = await fs.readFile(fullPath)
        if (buf.length > 0) return buf
      } catch {}
    }
  }

  const exts = ['svg', 'png', 'ico', 'jpg', 'jpeg', 'webp']
  for (const ext of exts) {
    const fullPath = path.join(publicFaviconsDir, `${slug}.${ext}`)
    if (fsSync.existsSync(fullPath)) {
      try {
        const buf = await fs.readFile(fullPath)
        if (buf.length > 0) return buf
      } catch {}
    }
  }

  return null
}

async function main() {
  if (!fsSync.existsSync(publicFaviconsDir)) {
    await fs.mkdir(publicFaviconsDir, { recursive: true })
  }

  const originalCode = await fs.readFile(resourcesFilePath, 'utf8')
  const resourcesModule = await import(`file://${resourcesFilePath}?t=${Date.now()}`)
  const resources = resourcesModule.RESOURCES

  const items = []
  for (const [, section] of Object.entries(resources)) {
    for (const [, category] of Object.entries(section.categories || {})) {
      for (const item of category.items || []) {
        if (item.url) {
          items.push(item)
        }
      }
    }
  }

  const slugToUrl = new Map()
  const itemFaviconMap = new Map()
  let totalCreated = 0
  let totalSkipped = 0

  function checkFaviconPathExists(faviconPath) {
    if (!faviconPath || typeof faviconPath !== 'string' || faviconPath.trim() === '') {
      return false
    }
    const relPath = faviconPath.startsWith('/') ? faviconPath.slice(1) : faviconPath
    const fullPath = path.join(publicDir, relPath)
    if (fsSync.existsSync(fullPath)) {
      try {
        const stat = fsSync.statSync(fullPath)
        return stat.size > 0
      } catch {}
    }
    return false
  }

  function shouldProcessItem(item) {
    if (!item.favicon || typeof item.favicon !== 'string' || item.favicon.trim() === '') {
      return true
    }
    return !checkFaviconPathExists(item.favicon)
  }

  function getUniqueSlug(item) {
    const baseSlug = slugify(item.title)
    if (!slugToUrl.has(baseSlug)) {
      slugToUrl.set(baseSlug, item.url)
      return baseSlug
    }
    const existingUrl = slugToUrl.get(baseSlug)
    if (existingUrl === item.url) {
      return baseSlug
    }

    if (shouldProcessItem(item)) {
      console.warn(
        `Warning: "${item.title}" (${item.url}) shares the exact name "${baseSlug}" with another item (${existingUrl}). Consider changing the name or setting the same favicon path as the existing one.`
      )
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

  // Pre-register existing items whose favicon files actually exist into slugToUrl map
  for (const item of items) {
    if (!shouldProcessItem(item)) {
      const baseSlug = slugify(item.title)
      if (!slugToUrl.has(baseSlug)) {
        slugToUrl.set(baseSlug, item.url)
      }
    }
  }

  const queue = [...items]
  const CONCURRENCY = 16

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift()
      if (!item) break

      // Skip items that have a favicon set AND the file exists on disk
      if (!shouldProcessItem(item)) {
        totalSkipped++
        continue
      }

      if (itemFaviconMap.has(item.url)) {
        totalSkipped++
        continue
      }

      const slug = getUniqueSlug(item)
      const targetFileName = `${slug}.webp`
      const targetFilePath = path.join(publicFaviconsDir, targetFileName)
      const faviconUrl = `/favicons/${targetFileName}`

      // If target webp image already exists on disk -> do NOT fetch, just set path
      if (fsSync.existsSync(targetFilePath)) {
        try {
          const stat = fsSync.statSync(targetFilePath)
          if (stat.size > 0) {
            itemFaviconMap.set(item.url, faviconUrl)
            totalSkipped++
            continue
          }
        } catch {}
      }

      // If file does not exist at all and favicon URL is empty string -> fetch/generate
      let webpBuffer = null

      const localBuf = await getExistingLocalBuffer(item, slug)
      if (localBuf) {
        try {
          webpBuffer = await processToWebp(localBuf)
        } catch {}
      }

      if (!webpBuffer) {
        const fetchedBuf = await fetchFaviconBuffer(item)
        if (fetchedBuf) {
          try {
            webpBuffer = await processToWebp(fetchedBuf)
          } catch {}
        }
      }

      if (!webpBuffer) {
        try {
          webpBuffer = await generateInitialWebp(item.title)
        } catch {}
      }

      if (webpBuffer) {
        await fs.writeFile(targetFilePath, webpBuffer)
        itemFaviconMap.set(item.url, faviconUrl)
        totalCreated++
        console.log('Created: ' + targetFileName)
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

  let updatedContent = originalCode
  const newlineChar = originalCode.includes('\r\n') ? '\r\n' : '\n'

  updatedContent = updatedContent.replace(
    /([ \t]*url:\s*['"]([^'"]+)['"],?\r?\n)([ \t]*favicon:\s*['"][^'"]*['"],?\r?\n)?/g,
    (match, urlLineWithIndent, url) => {
      const faviconPath = itemFaviconMap.get(url)
      if (!faviconPath) return match

      const indent = urlLineWithIndent.match(/^[ \t]*/)[0]
      const cleanUrlLine = urlLineWithIndent.trimEnd()
      const urlLineWithComma = cleanUrlLine.endsWith(',') ? cleanUrlLine : `${cleanUrlLine},`

      return `${urlLineWithComma}${newlineChar}${indent}favicon: '${faviconPath}',${newlineChar}`
    }
  )

  if (updatedContent !== originalCode) {
    await fs.writeFile(resourcesFilePath, updatedContent, 'utf8')
  }

  console.log(`
  =========================================
  Total created: ${totalCreated}
  Total skipped: ${totalSkipped}
  Total favicons: ${items.length}
  =========================================
  `)
}

main().catch(err => {
  console.error('Fatal error in fetch-favicons:', err)
  process.exit(1)
})
