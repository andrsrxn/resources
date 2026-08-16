import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils/cn'

export interface TextProps extends ComponentProps<'p'> {
  variant?: 'primary' | 'secondary'
}

const variants = {
  primary: 'text-foreground',
  secondary: 'text-muted-foreground',
} as const

export const Text = ({ className, variant = 'primary', children, ...props }: TextProps) => {
  return (
    <p className={cn('font-body max-w-prose text-pretty', variants[variant], className)} {...props}>
      {children}
    </p>
  )
}
