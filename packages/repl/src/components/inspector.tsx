import { FileOutput, Network } from 'lucide-react'
import { FC } from 'react'
import { GraphPanel } from '@/components/graph-panel'
import { OutputPane } from '@/components/output-pane'
import { cn } from '@/lib/utils'
import { useStore, type RightPane } from '@/store'

const PANES: {
  id: RightPane
  label: string
  icon: typeof Network
  side: 'left' | 'right'
}[] = [
  { id: 'output', label: 'Output', icon: FileOutput, side: 'left' },
  { id: 'graph', label: 'Graph', icon: Network, side: 'right' }
]

/** collapsed pane: slim vertical strip that expands on click */
const CollapsedStrip: FC<{
  label: string
  icon: typeof Network
  side: 'left' | 'right'
  onClick: () => void
}> = ({ label, icon: Icon, side, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={`Show ${label.toLowerCase()}`}
    className={cn(
      'flex w-9 shrink-0 flex-col items-center gap-3 bg-surface pt-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
      side === 'left' ? 'border-r' : 'border-l'
    )}
  >
    <Icon className="h-4 w-4" />
    <span className="text-[11px] font-semibold uppercase tracking-wider [writing-mode:vertical-rl]">
      {label}
    </span>
  </button>
)

/** Output and Graph share the space; only one is expanded at a time */
export const Inspector: FC = () => {
  const rightPane = useStore((s) => s.rightPane)
  const setRightPane = useStore((s) => s.setRightPane)

  return (
    <div className="flex h-full min-w-0">
      {PANES.map((pane) =>
        pane.id === rightPane ? (
          <div key={pane.id} className="min-w-0 flex-1">
            {pane.id === 'output' ? <OutputPane /> : <GraphPanel />}
          </div>
        ) : (
          <CollapsedStrip
            key={pane.id}
            label={pane.label}
            icon={pane.icon}
            side={pane.side}
            onClick={() => setRightPane(pane.id)}
          />
        )
      )}
    </div>
  )
}
