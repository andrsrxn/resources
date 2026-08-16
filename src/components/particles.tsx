/** biome-ignore-all lint/suspicious/noBitwiseOperators: allowed for logic */
/** biome-ignore-all lint/style/noMagicNumbers: unnecessary to change */

import { type ComponentPropsWithoutRef, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface MousePosition {
  x: number
  y: number
}

function MousePosition(): MousePosition {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return mousePosition
}

interface ParticlesProps extends ComponentPropsWithoutRef<'div'> {
  className?: string
  quantity?: number
  staticity?: number
  ease?: number
  size?: number
  refresh?: boolean
  color?: string
  vx?: number
  vy?: number
}

function hexToRgb(hex: string): number[] {
  let _hex = hex.replace('#', '')
  if (_hex.length === 3) {
    _hex = _hex
      .split('')
      .map(char => char + char)
      .join('')
  }
  const hexInt = Number.parseInt(_hex, 16)
  return [(hexInt >> 16) & 255, (hexInt >> 8) & 255, hexInt & 255]
}

interface Circle {
  x: number
  y: number
  translateX: number
  translateY: number
  size: number
  alpha: number
  targetAlpha: number
  dx: number
  dy: number
  magnetism: number
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: calculations
export const ParticlesBackground = ({
  className = '',
  quantity = 150,
  staticity = 30,
  ease = 50,
  size = 0.4,
  refresh = false,
  color = '#ffffff',
  vx = 0,
  vy = 0,
  ...props
}: ParticlesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const context = useRef<CanvasRenderingContext2D | null>(null)
  const circles = useRef<Circle[]>([])
  const mousePosition = MousePosition()
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 })
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio
  const rafID = useRef<number | null>(null)
  const resizeTimeout = useRef<number>(null)
  // Pre-compute the rgb string once per color change — avoids per-frame allocation
  const rgbString = useRef<string>('')

  // biome-ignore lint/correctness/useExhaustiveDependencies: not necessary to include it
  useEffect(() => {
    rgbString.current = hexToRgb(color).join(', ')

    if (canvasRef.current) {
      context.current = canvasRef.current.getContext('2d')
    }
    initCanvas()
    animate()

    const handleResize = () => {
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current)
      }
      resizeTimeout.current = setTimeout(initCanvas, 200)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      if (rafID.current !== null) {
        window.cancelAnimationFrame(rafID.current)
      }
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current)
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [color])

  // biome-ignore lint/correctness/useExhaustiveDependencies: not necessary to include it
  useEffect(() => {
    onMouseMove()
  }, [mousePosition.x, mousePosition.y])

  // biome-ignore lint/correctness/useExhaustiveDependencies: not necessary to include it
  useEffect(() => {
    initCanvas()
  }, [refresh])

  const initCanvas = () => {
    resizeCanvas()
  }

  const onMouseMove = () => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const { w, h } = canvasSize.current
      const x = mousePosition.x - rect.left - w / 2
      const y = mousePosition.y - rect.top - h / 2
      if (x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2) {
        mouse.current.x = x
        mouse.current.y = y
      }
    }
  }

  const resizeCanvas = () => {
    if (canvasContainerRef.current && canvasRef.current && context.current) {
      canvasSize.current.w = canvasContainerRef.current.offsetWidth
      canvasSize.current.h = canvasContainerRef.current.offsetHeight

      canvasRef.current.width = canvasSize.current.w * dpr
      canvasRef.current.height = canvasSize.current.h * dpr
      canvasRef.current.style.width = `${canvasSize.current.w}px`
      canvasRef.current.style.height = `${canvasSize.current.h}px`
      context.current.scale(dpr, dpr)

      circles.current = []
      for (let i = 0; i < quantity; i++) {
        drawCircle(circleParams())
      }
    }
  }

  const circleParams = (): Circle => ({
    x: Math.floor(Math.random() * canvasSize.current.w),
    y: Math.floor(Math.random() * canvasSize.current.h),
    translateX: 0,
    translateY: 0,
    size: Math.floor(Math.random() * 2) + size,
    alpha: 0,
    targetAlpha: Number.parseFloat((Math.random() * 0.6 + 0.1).toFixed(1)),
    dx: (Math.random() - 0.5) * 0.1,
    dy: (Math.random() - 0.5) * 0.1,
    magnetism: 0.1 + Math.random() * 4,
  })

  const drawCircle = (circle: Circle, update = false) => {
    if (context.current) {
      const { x, y, translateX, translateY, size, alpha } = circle
      context.current.translate(translateX, translateY)
      context.current.beginPath()
      context.current.arc(x, y, size, 0, 2 * Math.PI)
      context.current.fillStyle = `rgba(${rgbString.current}, ${alpha})`
      context.current.fill()
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (!update) {
        circles.current.push(circle)
      }
    }
  }

  const clearContext = () => {
    if (context.current) {
      context.current.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h)
    }
  }

  const animate = () => {
    clearContext()
    const { w, h } = canvasSize.current

    // Iterate in reverse so splice doesn't skip the next element
    for (let i = circles.current.length - 1; i >= 0; i--) {
      const circle = circles.current[i]

      if (!circle) {
        continue
      }

      const closestEdge = Math.min(
        circle.x + circle.translateX - circle.size,
        w - circle.x - circle.translateX - circle.size,
        circle.y + circle.translateY - circle.size,
        h - circle.y - circle.translateY - circle.size
      )

      // Inline remap: ((value - 0) * (1 - 0)) / (20 - 0) + 0  →  clamp to [0, 1]
      const remapClosestEdge = Math.min(1, Math.max(0, closestEdge / 20))

      if (remapClosestEdge > 1) {
        circle.alpha = Math.min(circle.alpha + 0.02, circle.targetAlpha)
      } else {
        circle.alpha = circle.targetAlpha * remapClosestEdge
      }

      circle.x += circle.dx + vx
      circle.y += circle.dy + vy
      circle.translateX +=
        (mouse.current.x / (staticity / circle.magnetism) - circle.translateX) / ease
      circle.translateY +=
        (mouse.current.y / (staticity / circle.magnetism) - circle.translateY) / ease

      drawCircle(circle, true)

      if (
        circle.x < -circle.size ||
        circle.x > w + circle.size ||
        circle.y < -circle.size ||
        circle.y > h + circle.size
      ) {
        circles.current.splice(i, 1)
        drawCircle(circleParams())
      }
    }

    rafID.current = window.requestAnimationFrame(animate)
  }

  return (
    <div
      className={cn('pointer-events-none', className)}
      ref={canvasContainerRef}
      aria-hidden='true'
      {...props}>
      <canvas ref={canvasRef} className='size-full' />
    </div>
  )
}
