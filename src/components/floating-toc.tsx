import { cn } from '@/lib/utils/cn'
import type { ComponentProps } from 'react'
import { useEffect, useRef, useState } from 'react'

interface TOCSubcategory {
  name: string
  id: string
}

interface TOCCategory {
  category: string
  id: string
  subcategories: TOCSubcategory[]
}

interface FloatingTOCProps extends ComponentProps<'nav'> {
  className?: string
  categories?: TOCCategory[]
}

export const FloatingTOC = ({ className, categories, ...props }: FloatingTOCProps) => {
  if (!categories) return null

  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())
  const [activeSubId, setActiveSubId] = useState<string | null>(null)
  const tocFlyoutRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Use a Set for O(1) category lookups inside the observer callback
    const categoryIdSet = new Set(categories.map(c => c.id))
    const allIds: string[] = [
      ...categoryIdSet,
      ...categories.flatMap(c => c.subcategories.map(s => s.id)),
    ]

    const elements = allIds
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    const visibilityMap = new Map<string, boolean>()

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          visibilityMap.set(entry.target.id, entry.isIntersecting)
        }

        const currentVisible = new Set<string>()
        for (const [id, isVis] of visibilityMap.entries()) {
          if (isVis) currentVisible.add(id)
        }
        setVisibleIds(new Set(currentVisible))

        // Pick the topmost visible subcategory
        const visibleSubElements = elements.filter(
          el => currentVisible.has(el.id) && !categoryIdSet.has(el.id)
        )

        if (visibleSubElements.length > 0) {
          visibleSubElements.sort(
            (a, b) =>
              Math.abs(a.getBoundingClientRect().top) - Math.abs(b.getBoundingClientRect().top)
          )
          setActiveSubId(visibleSubElements[0]?.id ?? null)
        } else {
          // Fall back to last subcategory that has scrolled past the top
          const passedSubElements = elements
            .filter(el => !categoryIdSet.has(el.id))
            .filter(el => el.getBoundingClientRect().top <= 120)

          setActiveSubId(passedSubElements[passedSubElements.length - 1]?.id ?? null)
        }
      },
      {
        rootMargin: '-60px 0px -60px 0px',
        // Single threshold is enough, rootMargin already scopes the active zone
        threshold: 0,
      }
    )

    for (const el of elements) {
      observer.observe(el)
    }

    return () => {
      observer.disconnect()
    }
  }, [categories])

  const handleTOCMouseEnter = () => {
    if (!tocFlyoutRef.current || !activeSubId) return
    const activeSubLink = tocFlyoutRef.current.querySelector<HTMLElement>(
      `[data-sub-id="${activeSubId}"]`
    )
    activeSubLink?.scrollIntoView({ block: 'center', behavior: 'instant' })
  }

  return (
    <nav
      aria-label='Table of contents'
      className={cn(
        'animate-slide-in-right group animate-duration-500 bg-card fixed top-1/2 right-2 z-50 w-10 -translate-y-1/2 border px-1.5 py-2',
        className
      )}
      {...props}>
      {/* indicators — decorative, hidden from AT */}
      <div aria-hidden className='grid w-full gap-2'>
        {categories.map(({ id: catId, subcategories }) => {
          const isCategoryVisible = visibleIds.has(catId)
          const hasVisibleSub = subcategories.some(
            sub => visibleIds.has(sub.id) || activeSubId === sub.id
          )
          const isActive = isCategoryVisible || hasVisibleSub

          return (
            <div
              key={catId}
              className={cn(
                'h-1 w-full rounded-full transition-colors duration-200',
                isActive ? 'bg-white' : 'bg-border'
              )}
            />
          )
        })}
      </div>

      {/* flyout TOC */}
      <div
        ref={tocFlyoutRef}
        onMouseEnter={handleTOCMouseEnter}
        className='bg-card pointer-events-none absolute top-1/2 right-0 grid h-max max-h-[calc(100dvh-100px)] w-max max-w-xl translate-x-4 -translate-y-1/2 gap-2 overflow-y-auto border p-4 opacity-0 transition-all duration-300 select-none group-focus-within:pointer-events-auto group-focus-within:translate-x-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100'
        data-lenis-prevent>
        <ul>
          {categories.map(({ category, id: catId, subcategories }) => {
            const isCategoryActive =
              visibleIds.has(catId) ||
              subcategories.some(sub => visibleIds.has(sub.id) || activeSubId === sub.id)

            return (
              <li key={catId}>
                <a
                  href={`#${catId}`}
                  className={cn(
                    'block w-full underline-offset-1 transition-colors duration-150 hover:underline',
                    isCategoryActive ? 'font-medium text-white' : 'text-muted-foreground'
                  )}>
                  {category}
                </a>
                {subcategories.length > 0 && (
                  <ul className='my-2 grid gap-1.5 pl-4'>
                    {subcategories.map(sub => {
                      const isSubActive = visibleIds.has(sub.id) || activeSubId === sub.id
                      return (
                        <li key={sub.id}>
                          <a
                            href={`#${sub.id}`}
                            data-sub-id={sub.id}
                            className={cn(
                              'block w-full underline-offset-1 transition-colors duration-150 hover:underline',
                              isSubActive ? 'font-medium text-white' : 'text-muted-foreground'
                            )}>
                            {sub.name}
                          </a>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
