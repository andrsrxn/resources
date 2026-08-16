import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils/cn'

export interface BadgeProps extends ComponentProps<'span'> {
  size?: 'md' | 'lg'
  variant?:
    | 'red'
    | 'blue'
    | 'green'
    | 'yellow'
    | 'purple'
    | 'orange'
    | 'pink'
    | 'teal'
    | 'lime'
    | 'emerald'
    | 'sky'
    | 'indigo'
    | 'violet'
    | 'slate'
    | 'white'
    | 'cyan'
    | 'base'
  indicator?: boolean
  border?: boolean
}

const variants = {
  red: {
    background: 'bg-red-500/10',
    color: 'text-red-400',
    border: 'border-red-500/20',
  },
  blue: {
    background: 'bg-blue-500/10',
    color: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  green: {
    background: 'bg-green-500/10',
    color: 'text-green-400',
    border: 'border-green-500/20',
  },
  yellow: {
    background: 'bg-yellow-500/10',
    color: 'text-yellow-400',
    border: 'border-yellow-500/20',
  },
  purple: {
    background: 'bg-purple-500/10',
    color: 'text-purple-400',
    border: 'border-purple-500/20',
  },
  orange: {
    background: 'bg-orange-500/10',
    color: 'text-orange-400',
    border: 'border-orange-500/20',
  },
  pink: {
    background: 'bg-pink-500/10',
    color: 'text-pink-400',
    border: 'border-pink-500/20',
  },
  teal: {
    background: 'bg-teal-500/10',
    color: 'text-teal-400',
    border: 'border-teal-500/20',
  },
  lime: {
    background: 'bg-lime-500/10',
    color: 'text-lime-400',
    border: 'border-lime-500/20',
  },
  emerald: {
    background: 'bg-emerald-500/10',
    color: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  sky: {
    background: 'bg-sky-500/10',
    color: 'text-sky-400',
    border: 'border-sky-500/20',
  },
  indigo: {
    background: 'bg-indigo-500/10',
    color: 'text-indigo-400',
    border: 'border-indigo-500/20',
  },
  violet: {
    background: 'bg-violet-500/10',
    color: 'text-violet-400',
    border: 'border-violet-500/20',
  },
  slate: {
    background: 'bg-slate-500/10',
    color: 'text-slate-400',
    border: 'border-slate-500/20',
  },

  white: {
    background: 'bg-white/10',
    color: 'text-white/80',
    border: 'border-white/30',
  },
  cyan: {
    background: 'bg-cyan-500/10',
    color: 'text-cyan-400',
    border: 'border-cyan-500/20',
  },
  base: {
    background: 'bg-muted',
    color: 'text-muted-foreground',
    border: 'border-muted-foreground/20',
  },
} as const

export const Badge = ({
  className,
  variant = 'base',
  size = 'md',
  children,
  indicator = false,
  border: includeBorder = false,
  ...props
}: BadgeProps) => {
  const { background, color, border } = variants[variant]

  return (
    <span
      className={cn(
        'inline-flex h-max items-center gap-2 rounded-full border-transparent text-xs leading-none',
        size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs',
        includeBorder && 'border',
        border,
        background,
        color,
        className
      )}
      {...props}>
      {indicator ? <span className={cn('inline-block size-2 rounded-full', background)} /> : null}
      {children}
    </span>
  )
}
