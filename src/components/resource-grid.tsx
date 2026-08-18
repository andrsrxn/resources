import { IconCleaningBrush } from '@andrsrxn/icons'
import type { ComponentProps } from 'react'
import { useMemo } from 'react'
import { Card } from '@/components/card'
import { FloatingTOC } from '@/components/floating-toc'
import { Heading } from '@/components/heading'
import { RESOURCES } from '@/lib/constants/resources'
import { useQueryState } from '@/lib/hooks/use-query-state'
import { cn } from '@/lib/utils/cn'
import { camelToTitleCase, capitalize, slugify } from '@/lib/utils/strings'

export const ResourceGrid = ({ className, ...props }: ComponentProps<'div'>) => {
  const [search] = useQueryState('s')

  const filteredResources = useMemo(() => {
    const query = search?.trim().toLowerCase()
    if (!query) {
      return Object.entries(RESOURCES)
    }

    return Object.entries(RESOURCES)
      .map(([groupKey, group]) => {
        const groupTitle = camelToTitleCase(groupKey).toLowerCase()
        const isGroupMatch = groupTitle.includes(query) || groupKey.toLowerCase().includes(query)

        const matchingCategories = Object.entries(group.categories)
          .map(([subKey, subCategory]) => {
            const subTitle = camelToTitleCase(subKey).toLowerCase()
            const isSubMatch =
              isGroupMatch || subTitle.includes(query) || subKey.toLowerCase().includes(query)

            const filteredItems = isSubMatch
              ? subCategory.items
              : subCategory.items.filter(item => {
                  const titleMatch = item.title.toLowerCase().includes(query)
                  const tagsMatch = item.tags.some(tag => tag.toLowerCase().includes(query))
                  return titleMatch || tagsMatch
                })

            return [subKey, { ...subCategory, items: filteredItems }] as const
          })
          .filter(([_, subCategory]) => subCategory.items.length > 0)

        return [
          groupKey,
          {
            ...group,
            categories: Object.fromEntries(matchingCategories),
          },
        ] as const
      })
      .filter(([_, group]) => Object.keys(group.categories).length > 0)
  }, [search])

  if (filteredResources.length === 0) {
    return (
      <div
        className={cn(
          '-mb-26 flex flex-col items-center justify-center gap-2 py-26 text-center',
          className
        )}
        {...props}>
        <span className='bg-card flex size-12 items-center justify-center rounded-lg border'>
          <IconCleaningBrush className='size-8' />
        </span>
        <Heading level={3}>No resources found</Heading>
        <p className='text-muted-foreground text-lg'>
          Try another term or adjust your search for{' '}
          <strong className='font-medium'>"{search}"</strong>.
        </p>
      </div>
    )
  }

  const tocCategories = filteredResources.map(([groupKey, group]) => {
    const categoryLabel = groupKey === 'seo' ? 'SEO' : capitalize(camelToTitleCase(groupKey))
    const categoryId = slugify(groupKey)
    return {
      category: categoryLabel,
      id: categoryId,
      subcategories: Object.keys(group.categories).map(subKey => {
        const name = camelToTitleCase(subKey)
        return { name: capitalize(name), id: `${categoryId}-${slugify(name)}` }
      }),
    }
  })

  return (
    <div className={cn('grid gap-20', className)} {...props}>
      <FloatingTOC categories={tocCategories} />

      <hr className='mt-14 -mb-6 border-b' />

      <div id='main-content' className='grid gap-20'>
        {filteredResources.map(([groupKey, group]) => {
          const groupTitle = groupKey === 'seo' ? 'SEO' : capitalize(camelToTitleCase(groupKey))
          const groupId = slugify(groupKey)
          const categoriesList = Object.entries(group.categories)

          return (
            <section key={groupKey} className='grid gap-10'>
              <Heading level={2} className='laptop:text-6xl text-5xl' id={groupId}>
                {groupTitle}
              </Heading>

              <div className='grid gap-20'>
                {categoriesList.map(([subKey, subCategory]) => {
                  const subTitle = camelToTitleCase(subKey)
                  const subId = `${groupId}-${slugify(subTitle)}`
                  const itemsCount = subCategory.items.length

                  return (
                    <div key={`${groupKey}-${subKey}`} className='grid gap-4'>
                      <Heading level={2} className='text-4xl' id={subId}>
                        {subTitle}{' '}
                        {itemsCount > 1 ? (
                          <span className='text-muted-foreground text-[0.9em]'>({itemsCount})</span>
                        ) : null}
                      </Heading>

                      <div className='tablet:grid-cols-2 laptop:grid-cols-3 desktop:grid-cols-4 mt-6 grid gap-x-6 gap-y-12'>
                        {subCategory.items.map(item => {
                          const cardId = `${subId}-${slugify(camelToTitleCase(item.title))}`

                          return (
                            <Card
                              key={`${cardId}`}
                              id={cardId}
                              title={item.title}
                              urlLabel={item.url}
                              url={item.url}
                              favicon={item.favicon}
                              tags={item.tags}
                              inverted={item.inverted}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
