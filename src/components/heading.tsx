import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils/cn'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface HeadingProps extends ComponentProps<'h1'> {
  level?: HeadingLevel
}

export const Heading = ({ level = 1, className, children, ...props }: HeadingProps) => {
  const Tag = `h${level}` as const

  return (
    <Tag className={cn('font-heading text-foreground text-4xl', className)} {...props}>
      {children}
    </Tag>
  )
}
