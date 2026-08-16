import { IconExternalLink } from '@andrsrxn/icons'
import type { ComponentProps } from 'react'
import { Badge } from '@/components/badge'
import { Heading } from '@/components/heading'
import { cn } from '@/lib/utils/cn'
import { getBadgeVariant } from '@/lib/utils/resources'

export interface CardProps extends ComponentProps<'div'> {
  title: string
  urlLabel: string
  url: string
  favicon: string
  tags: string[]
  inverted?: boolean
}

export const Card = ({
  className,
  title,
  urlLabel,
  url,
  favicon,
  tags,
  inverted,
  ...props
}: CardProps) => {
  return (
    <div className={cn('text-card-foreground flex gap-4', className)} {...props}>
      <div className='mt-1 shrink-0'>
        <div
          className={cn(
            'size-6 overflow-hidden rounded-full border border-white bg-white',
            inverted && 'bg-card'
          )}>
          <img
            src={favicon}
            decoding='async'
            loading='lazy'
            alt={title}
            className='size-full rounded-full object-cover'
          />
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <Heading level={3} className='text-2xl'>
          {title}
        </Heading>
        {tags && tags.length > 0 && (
          <div className='mb-2 flex flex-wrap gap-2'>
            {tags.map(tag => {
              const variant = getBadgeVariant(tag)
              return (
                <Badge variant={variant} border={variant !== 'base'} key={tag}>
                  {tag}
                </Badge>
              )
            })}
          </div>
        )}
        <div className='mt-auto'>
          <a
            href={url}
            target='_blank'
            rel='noopener noreferrer'
            className='font-body text-primary mt-2 flex w-full items-center gap-2 text-sm hover:underline hover:decoration-1 hover:underline-offset-1'>
            <span className='max-w-full truncate'>{urlLabel}</span>
            <span>
              <IconExternalLink className='size-4' />
            </span>
          </a>
        </div>
      </div>
    </div>
  )
}
