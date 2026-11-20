import type { BadgeProps } from '@/components/badge'
import { Badge } from '@/components/badge'
import { useQueryState } from '@/lib/hooks/use-query-state'
import { slugify } from '@/lib/utils/strings'

export const CardBadge = ({
  variant,
  tag,
  ...props
}: { variant: BadgeProps['variant']; tag: string } & BadgeProps) => {
  const [_, setSearch] = useQueryState('s')

  const handleClick = () => {
    setSearch(tag.toLowerCase())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type='button'
      className='h-max cursor-pointer rounded-full leading-none hover:brightness-150'
      onClick={handleClick}>
      <Badge variant={variant} border={variant !== 'base'} key={tag} {...props}>
        {tag}
      </Badge>
    </button>
  )
}
