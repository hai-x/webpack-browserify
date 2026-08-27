import { Maximize2, Minus, Plus } from 'lucide-react'
import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type Transform = { x: number; y: number; k: number }

type Props = {
  contentWidth: number
  contentHeight: number
  /** changes trigger a re-fit */
  fitKey: unknown
  onNodeClick?: (id: string | null) => void
  onNodeHover?: (id: string | null) => void
  legend?: ReactNode
  toolbar?: ReactNode
  children: ReactNode
}

const PADDING = 24

export const MARKERS = [
  { id: 'edge', className: 'fill-muted-foreground/60' },
  { id: 'edge-async', className: 'fill-brand' },
  { id: 'edge-inactive', className: 'fill-danger' },
  { id: 'edge-focus', className: 'fill-foreground' }
] as const

const nodeIdOf = (target: EventTarget | null) =>
  target instanceof Element
    ? (target.closest('[data-node-id]')?.getAttribute('data-node-id') ?? null)
    : null

export const GraphCanvas: FC<Props> = ({
  contentWidth,
  contentHeight,
  fitKey,
  onNodeClick,
  onNodeHover,
  legend,
  toolbar,
  children
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [t, setT] = useState<Transform>({ x: PADDING, y: PADDING, k: 1 })
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null)

  const fit = useCallback(() => {
    const el = ref.current
    if (!el || !contentWidth || !contentHeight) return
    const { width, height } = el.getBoundingClientRect()
    const k = Math.min(
      1,
      (width - PADDING * 2) / contentWidth,
      (height - PADDING * 2) / contentHeight
    )
    setT({
      k,
      x: (width - contentWidth * k) / 2,
      y: (height - contentHeight * k) / 2
    })
  }, [contentWidth, contentHeight])

  useEffect(fit, [fit, fitKey])

  // refit when the pane is resized
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [fit])

  // zoom around the viewport point (px, py)
  const zoomBy = (factor: number, px: number, py: number) =>
    setT((prev) => {
      const k = Math.min(4, Math.max(0.1, prev.k * factor))
      return {
        k,
        x: px - ((px - prev.x) * k) / prev.k,
        y: py - ((py - prev.y) * k) / prev.k
      }
    })

  // toolbar buttons zoom around the viewport centre
  const zoomCenter = (factor: number, button: HTMLElement) => {
    const rect = button.closest('[data-canvas]')?.getBoundingClientRect()
    if (rect) zoomBy(factor, rect.width / 2, rect.height / 2)
  }

  return (
    <div
      ref={ref}
      data-canvas
      className="relative h-full w-full overflow-hidden bg-background"
      onWheel={(e) => {
        e.preventDefault()
        const rect = e.currentTarget.getBoundingClientRect()
        zoomBy(
          Math.exp(-e.deltaY * 0.0015),
          e.clientX - rect.left,
          e.clientY - rect.top
        )
      }}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        drag.current = { x: e.clientX, y: e.clientY, moved: false }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d) return
        const dx = e.clientX - d.x
        const dy = e.clientY - d.y
        if (!d.moved && Math.hypot(dx, dy) < 3) return
        if (!d.moved) setDragging(true)
        d.moved = true
        d.x = e.clientX
        d.y = e.clientY
        setT((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
      }}
      onPointerUp={(e) => {
        const d = drag.current
        drag.current = null
        setDragging(false)
        if (d && !d.moved) onNodeClick?.(nodeIdOf(e.target))
      }}
      onPointerOver={(e) => onNodeHover?.(nodeIdOf(e.target))}
      onPointerLeave={() => onNodeHover?.(null)}
    >
      <svg
        className={cn(
          'h-full w-full touch-none select-none',
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
        aria-label="graph"
      >
        <defs>
          {MARKERS.map(({ id, className }) => (
            <marker
              key={id}
              id={`arrow-${id}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className={className} />
            </marker>
          ))}
        </defs>
        <g transform={`translate(${t.x} ${t.y}) scale(${t.k})`}>{children}</g>
      </svg>
      <div className="absolute right-2 top-2 flex flex-col overflow-hidden rounded-md border bg-surface shadow-sm">
        {[
          { icon: Plus, title: 'Zoom in', factor: 1.25 },
          { icon: Minus, title: 'Zoom out', factor: 0.8 },
          { icon: Maximize2, title: 'Fit', factor: 0 }
        ].map(({ icon: Icon, title, factor }) => (
          <button
            key={title}
            type="button"
            title={title}
            onClick={(e) =>
              factor ? zoomCenter(factor, e.currentTarget) : fit()
            }
            onPointerDown={(e) => e.stopPropagation()}
            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
      {toolbar && (
        <div
          className="absolute left-2 top-2 flex items-center gap-2 rounded-md border bg-surface/90 px-2 py-1 text-[10px] text-muted-foreground"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {toolbar}
        </div>
      )}
      {legend && (
        <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-3 rounded-md border bg-surface/90 px-2 py-1 text-[10px] text-muted-foreground">
          {legend}
        </div>
      )}
    </div>
  )
}
