// window-splitter pattern: role=separator is the semantic choice
// oxlint-disable jsx-a11y/prefer-tag-over-role
import { FC, ReactNode, useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  direction: 'horizontal' | 'vertical'
  defaultRatio?: number
  min?: number
  className?: string
  children: [ReactNode, ReactNode]
}

export const SplitPane: FC<Props> = ({
  direction,
  defaultRatio = 0.5,
  min = 0.15,
  className,
  children
}) => {
  const horizontal = direction === 'horizontal'
  const ref = useRef<HTMLDivElement>(null)
  const [ratio, setRatio] = useState(defaultRatio)
  const [dragging, setDragging] = useState(false)

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const pos = horizontal
        ? (e.clientX - rect.left) / rect.width
        : (e.clientY - rect.top) / rect.height
      setRatio(Math.min(1 - min, Math.max(min, pos)))
    },
    [dragging, horizontal, min]
  )

  return (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full min-h-0 min-w-0',
        horizontal ? 'flex-row' : 'flex-col',
        className
      )}
    >
      <div
        className="min-h-0 min-w-0 overflow-hidden"
        style={{ flexBasis: `${ratio * 100}%`, flexGrow: 0, flexShrink: 0 }}
      >
        {children[0]}
      </div>
      <div
        role="separator"
        aria-label="Resize panels"
        aria-orientation={horizontal ? 'vertical' : 'horizontal'}
        aria-valuenow={Math.round(ratio * 100)}
        className={cn(
          'group relative z-10 shrink-0 bg-border transition-colors',
          horizontal ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize',
          dragging && 'bg-brand'
        )}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setDragging(true)
        }}
        onPointerMove={onPointerMove}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        <div
          className={cn(
            'absolute group-hover:bg-brand/60',
            horizontal
              ? 'inset-y-0 -left-1 w-[7px]'
              : 'inset-x-0 -top-1 h-[7px]'
          )}
        />
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        {children[1]}
      </div>
      {dragging && (
        <div
          className={cn(
            'fixed inset-0 z-50 select-none',
            horizontal ? 'cursor-col-resize' : 'cursor-row-resize'
          )}
        />
      )}
    </div>
  )
}
