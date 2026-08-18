/** biome-ignore-all lint/performance/noJsxPropsBind: Value specific */
import { IconSearch, IconX } from '@andrsrxn/icons'
import type { ComponentProps } from 'react'
import { Badge } from '@/components/badge'
import { RECOMMENDED_TAGS } from '@/lib/constants/resources'
import { useQueryState } from '@/lib/hooks/use-query-state'
import { cn } from '@/lib/utils/cn'
import { getBadgeVariant } from '@/lib/utils/resources'
import { capitalize } from '@/lib/utils/strings'

export const GlobalSearch = ({ className, ...props }: ComponentProps<'div'>) => {
  const [search, setSearch] = useQueryState('s', { defaultValue: '' })

  const handleTagClick = (tag: string) => {
    setSearch(prev => (prev?.toLowerCase() === tag.toLowerCase() ? '' : tag))
  }

  return (
    <div className={cn('', className)} {...props}>
      <div className='relative max-w-lg'>
        <IconSearch className='text-primary absolute top-1/2 left-3 z-10 size-5 -translate-y-1/2' />
        <input
          value={search || ''}
          onChange={e => setSearch(e.target.value)}
          placeholder='More than 250 resources...'
          className='border-input bg-background focus-visible:ring-offset-background focus-visible:ring-ring w-full border-2 px-3 py-2 pl-10 text-base focus-visible:ring-2 focus-visible:outline-none'
        />
        {search && search.length > 1 ? (
          <button
            type='button'
            onClick={() => setSearch('')}
            aria-label='Clear search'
            className='absolute top-1/2 right-3 z-10 -translate-y-1/2 cursor-pointer transition active:scale-98'>
            <IconX className='size-5' />
          </button>
        ) : null}
      </div>
      <div className='mt-5 grid gap-5'>
        <span className='block font-medium'>Suggested Tags</span>
        <div className='flex max-w-4xl flex-wrap gap-2'>
          {RECOMMENDED_TAGS.map(tag => (
            <button
              key={tag}
              type='button'
              className='rounded-full'
              onClick={() => handleTagClick(tag)}>
              <Badge
                variant={getBadgeVariant(tag)}
                className={`cursor-pointer border-2 font-medium transition active:scale-98 ${
                  search?.toLowerCase() === tag.toLowerCase()
                    ? 'border-white bg-white text-black'
                    : ''
                }`}
                size='lg'>
                {capitalize(tag)}
              </Badge>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
