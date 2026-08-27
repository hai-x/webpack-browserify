import { ChevronDown, ChevronRight, Network } from 'lucide-react'
import { FC, Fragment, useMemo, useState } from 'react'
import { GraphCanvas } from '@/components/graph-canvas'
import type { GraphChunk, GraphData, GraphModule } from '@/lib/graph'
import { layoutGraph, type PositionedNode } from '@/lib/layout'
import { cn, formatBytes } from '@/lib/utils'
import { useStore } from '@/store'

type Tab = 'dependencies' | 'modules' | 'chunks'

const TABS: { id: Tab; label: string }[] = [
  { id: 'modules', label: 'Module graph' },
  { id: 'chunks', label: 'Chunk graph' },
  { id: 'dependencies', label: 'Dependencies' }
]

const CHAR_W = 6.6

const ellipsis = (s: string, max: number) =>
  s.length <= max ? s : `${s.slice(0, max / 2 - 1)}…${s.slice(-(max / 2))}`

const edgePath = (a: PositionedNode, b: PositionedNode) => {
  const x1 = a.x + a.width
  const y1 = a.y + a.height / 2
  const x2 = b.x
  const y2 = b.y + b.height / 2
  const dx = Math.max(40, Math.abs(x2 - x1) / 2)
  return `M${x1} ${y1} C${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
}

const typeStripe = (type: string) =>
  type.startsWith('javascript')
    ? 'fill-brand'
    : type.startsWith('css')
      ? 'fill-warning'
      : type.startsWith('asset')
        ? 'fill-success'
        : 'fill-muted-foreground'

const Legend: FC<{ items: [string, string][] }> = ({ items }) => (
  <>
    {items.map(([cls, label]) => (
      <span key={label} className="flex items-center gap-1">
        <span className={cn('inline-block h-2 w-4 rounded-sm', cls)} />
        {label}
      </span>
    ))}
  </>
)

/* ---------------- module graph ---------------- */

const MODULE_H = 40

const ModuleGraphView: FC<{
  graph: GraphData
  selected: string | null
  onSelect: (id: string | null) => void
}> = ({ graph: fullGraph, selected, onSelect }) => {
  const [hover, setHover] = useState<string | null>(null)
  const [showRuntime, setShowRuntime] = useState(false)
  const graph = useMemo(() => {
    if (showRuntime) return fullGraph
    const modules = fullGraph.modules.filter((m) => m.type !== 'runtime')
    const keep = new Set(modules.map((m) => m.id))
    return {
      ...fullGraph,
      modules,
      connections: fullGraph.connections.filter(
        (c) => keep.has(c.from) && keep.has(c.to)
      )
    }
  }, [fullGraph, showRuntime])
  const runtimeCount = fullGraph.modules.length - graph.modules.length
  const labels = useMemo(
    () => new Map(graph.modules.map((m) => [m.id, ellipsis(m.name, 36)])),
    [graph]
  )
  const layout = useMemo(
    () =>
      layoutGraph(
        graph.modules.map((m) => ({
          id: m.id,
          width: Math.max(130, (labels.get(m.id)?.length ?? 0) * CHAR_W + 28),
          height: MODULE_H
        })),
        graph.connections,
        { gapX: 90, gapY: 18 }
      ),
    [graph, labels]
  )
  const focus = hover ?? selected
  const related = useMemo(() => {
    const set = new Set<string>()
    if (!focus) return set
    set.add(focus)
    for (const c of graph.connections) {
      if (c.from === focus) set.add(c.to)
      if (c.to === focus) set.add(c.from)
    }
    return set
  }, [focus, graph])

  return (
    <GraphCanvas
      contentWidth={layout.width}
      contentHeight={layout.height}
      fitKey={graph}
      onNodeClick={(id) => onSelect(id === selected ? null : id)}
      onNodeHover={setHover}
      toolbar={
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            className="h-3 w-3 accent-[hsl(var(--brand))]"
            checked={showRuntime}
            onChange={(e) => setShowRuntime(e.target.checked)}
          />
          runtime modules
          {!showRuntime && runtimeCount > 0 && ` (${runtimeCount} hidden)`}
        </label>
      }
      legend={
        <Legend
          items={[
            ['bg-muted-foreground/60', 'import'],
            ['bg-brand', 'import() / async'],
            ['bg-danger', 'inactive connection']
          ]}
        />
      }
    >
      {graph.connections.map((edge) => {
        const a = layout.nodes.get(edge.from)
        const b = layout.nodes.get(edge.to)
        if (!a || !b) return null
        const touching = edge.from === focus || edge.to === focus
        const dim = focus !== null && !touching
        const marker = !edge.active
          ? 'edge-inactive'
          : touching
            ? 'edge-focus'
            : edge.async
              ? 'edge-async'
              : 'edge'
        const key = `${edge.from}→${edge.to}:${edge.type}`
        const mx = (a.x + a.width + b.x) / 2
        const my = (a.y + b.y + (a.height + b.height) / 2) / 2
        return (
          <Fragment key={key}>
            <path
              d={edgePath(a, b)}
              fill="none"
              markerEnd={`url(#arrow-${marker})`}
              strokeDasharray={edge.async ? '5 4' : undefined}
              className={cn(
                'transition-opacity',
                !edge.active
                  ? 'stroke-danger'
                  : touching
                    ? 'stroke-foreground'
                    : edge.async
                      ? 'stroke-brand'
                      : 'stroke-muted-foreground/60'
              )}
              strokeWidth={touching ? 1.75 : 1.25}
              opacity={dim ? 0.15 : 1}
            />
            {touching && (
              <text
                x={mx}
                y={my - 5}
                textAnchor="middle"
                className="pointer-events-none fill-muted-foreground font-mono text-[9px]"
              >
                {edge.type}
                {edge.request ? ` · ${edge.request}` : ''}
              </text>
            )}
          </Fragment>
        )
      })}
      {graph.modules.map((m) => {
        const n = layout.nodes.get(m.id)
        if (!n) return null
        const isFocus = focus === m.id
        const dim = focus !== null && !related.has(m.id)
        return (
          <g
            key={m.id}
            data-node-id={m.id}
            transform={`translate(${n.x} ${n.y})`}
            className="cursor-pointer transition-opacity"
            opacity={dim ? 0.3 : 1}
          >
            <title>
              {m.name}
              {'\n'}
              {m.type} · {formatBytes(m.size)} · depth {m.depth ?? '–'}
              {'\n'}chunks: {m.chunks.join(', ') || '–'}
            </title>
            <rect
              width={n.width}
              height={n.height}
              rx={6}
              className={cn(
                'fill-surface',
                isFocus || selected === m.id
                  ? 'stroke-brand'
                  : m.depth === 0
                    ? 'stroke-brand/50'
                    : 'stroke-border'
              )}
              strokeWidth={isFocus || selected === m.id ? 2 : 1}
            />
            <rect
              x={0}
              y={8}
              width={3}
              height={n.height - 16}
              rx={1.5}
              className={typeStripe(m.type)}
            />
            <text
              x={12}
              y={17}
              className="fill-foreground font-mono text-[11px]"
            >
              {labels.get(m.id)}
            </text>
            <text x={12} y={31} className="fill-muted-foreground text-[9px]">
              {m.type} · {formatBytes(m.size)}
              {m.moduleId && m.moduleId !== m.name ? ` · id ${m.moduleId}` : ''}
            </text>
          </g>
        )
      })}
    </GraphCanvas>
  )
}

/* ---------------- chunk graph ---------------- */

const GROUP_W = 240
const GROUP_HEADER = 34
const CHUNK_H = 44
const PAD = 8

const ChunkGraphView: FC<{ graph: GraphData }> = ({ graph }) => {
  const [hover, setHover] = useState<string | null>(null)
  const chunkById = useMemo(
    () => new Map(graph.chunks.map((c) => [c.id, c])),
    [graph]
  )
  const moduleName = useMemo(
    () => new Map(graph.modules.map((m) => [m.id, m.name])),
    [graph]
  )
  const layout = useMemo(
    () =>
      layoutGraph(
        graph.chunkGroups.map((g) => ({
          id: g.id,
          width: GROUP_W,
          height:
            GROUP_HEADER +
            PAD +
            Math.max(1, g.chunks.length) * (CHUNK_H + 6) -
            6 +
            PAD
        })),
        graph.chunkGroups.flatMap((g) =>
          g.children.map((c) => ({ from: g.id, to: c }))
        ),
        { gapX: 70, gapY: 24 }
      ),
    [graph]
  )
  const hoverChunk = hover?.startsWith('chunk:') ? hover.slice(6) : null
  const hoverGroup = hover && !hover.startsWith('chunk:') ? hover : null

  const chunkTitle = (c: GraphChunk) =>
    [
      `chunk ${c.name ?? c.id}`,
      `files: ${c.files.join(', ') || '–'}`,
      `size: ${formatBytes(c.size)}`,
      `groups: ${c.groups.join(', ')}`,
      '',
      'modules:',
      ...c.modules.map((id) => `  ${moduleName.get(id) ?? id}`)
    ].join('\n')

  return (
    <GraphCanvas
      contentWidth={layout.width}
      contentHeight={layout.height}
      fitKey={graph}
      onNodeHover={setHover}
      legend={
        <Legend
          items={[
            ['bg-brand', 'entrypoint'],
            ['border border-dashed border-muted-foreground', 'async group'],
            ['bg-muted-foreground/60', 'parent → child']
          ]}
        />
      }
    >
      {graph.chunkGroups.flatMap((g) =>
        g.children.map((child) => {
          const a = layout.nodes.get(g.id)
          const b = layout.nodes.get(child)
          if (!a || !b) return null
          const touching = hoverGroup === g.id || hoverGroup === child
          return (
            <path
              key={`${g.id}→${child}`}
              d={edgePath(a, b)}
              fill="none"
              markerEnd={`url(#arrow-${touching ? 'edge-focus' : 'edge'})`}
              className={
                touching ? 'stroke-foreground' : 'stroke-muted-foreground/60'
              }
              strokeWidth={touching ? 1.75 : 1.25}
            />
          )
        })
      )}
      {graph.chunkGroups.map((g) => {
        const n = layout.nodes.get(g.id)
        if (!n) return null
        const entry = g.kind === 'entrypoint'
        const origin = g.origins.find((o) => o.request || o.module)
        return (
          <g
            key={g.id}
            data-node-id={g.id}
            transform={`translate(${n.x} ${n.y})`}
          >
            <rect
              width={n.width}
              height={n.height}
              rx={8}
              strokeDasharray={entry ? undefined : '4 3'}
              className={cn(
                'fill-surface',
                hoverGroup === g.id
                  ? 'stroke-foreground'
                  : entry
                    ? 'stroke-brand'
                    : 'stroke-muted-foreground/70'
              )}
              strokeWidth={hoverGroup === g.id ? 2 : 1}
            />
            <text
              x={10}
              y={15}
              className="fill-foreground font-mono text-[11px] font-semibold"
            >
              {ellipsis(g.name ?? g.id.replace(/^group:/, ''), 22)}
            </text>
            <text
              x={n.width - 10}
              y={15}
              textAnchor="end"
              className={cn(
                'text-[9px] uppercase tracking-wide',
                entry ? 'fill-brand' : 'fill-muted-foreground'
              )}
            >
              {g.kind}
            </text>
            <text x={10} y={27} className="fill-muted-foreground text-[9px]">
              {origin
                ? `from ${ellipsis(origin.module ?? '', 18)}${
                    origin.request ? ` · ${ellipsis(origin.request, 18)}` : ''
                  }`
                : `${g.chunks.length} chunk${g.chunks.length === 1 ? '' : 's'}`}
            </text>
            {g.chunks.map((chunkId, i) => {
              const c = chunkById.get(chunkId)
              if (!c) return null
              const y = GROUP_HEADER + PAD + i * (CHUNK_H + 6)
              const shared = c.groups.length > 1
              const active = hoverChunk === c.id
              return (
                <g
                  key={chunkId}
                  data-node-id={`chunk:${c.id}`}
                  transform={`translate(${PAD} ${y})`}
                  className="cursor-default"
                >
                  <title>{chunkTitle(c)}</title>
                  <rect
                    width={n.width - PAD * 2}
                    height={CHUNK_H}
                    rx={5}
                    className={cn(
                      'fill-background',
                      active ? 'stroke-brand' : 'stroke-border'
                    )}
                    strokeWidth={active ? 1.5 : 1}
                  />
                  <text
                    x={8}
                    y={17}
                    className="fill-foreground font-mono text-[10px]"
                  >
                    {ellipsis(c.name ?? `chunk ${c.id}`, 20)}
                  </text>
                  <text
                    x={n.width - PAD * 2 - 8}
                    y={17}
                    textAnchor="end"
                    className="fill-muted-foreground text-[8px] uppercase tracking-wide"
                  >
                    {[
                      c.runtime && 'runtime',
                      c.initial && 'initial',
                      shared && 'shared'
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </text>
                  <text
                    x={8}
                    y={33}
                    className="fill-muted-foreground font-mono text-[9px]"
                  >
                    {ellipsis(c.files[0] ?? '(no file)', 20)} ·{' '}
                    {c.modules.length} mod · {formatBytes(c.size)}
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}
    </GraphCanvas>
  )
}

/* ---------------- dependencies ---------------- */

const DependenciesView: FC<{
  graph: GraphData
  selected: string | null
  onSelect: (id: string | null) => void
}> = ({ graph, selected, onSelect }) => {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const moduleName = useMemo(
    () => new Map(graph.modules.map((m) => [m.id, m.name])),
    [graph]
  )
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const modules = useMemo(
    () => [...graph.modules].sort((a, b) => (a.depth ?? 99) - (b.depth ?? 99)),
    [graph]
  )

  return (
    <div className="h-full overflow-auto p-2 text-xs">
      {modules.map((m: GraphModule) => {
        const open = !collapsed.has(m.id)
        const isSelected = selected === m.id
        return (
          <div
            key={m.id}
            className={cn(
              'mb-1 rounded-md border',
              isSelected ? 'border-brand' : 'border-border'
            )}
          >
            <div className="flex items-center gap-1 pr-2">
              <button
                type="button"
                className="flex h-7 w-6 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
                onClick={() => toggle(m.id)}
                title={open ? 'Collapse' : 'Expand'}
              >
                {open ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
              <button
                type="button"
                className="flex h-7 min-w-0 flex-1 items-center gap-2 text-left"
                onClick={() => onSelect(isSelected ? null : m.id)}
              >
                <span className="truncate font-mono text-foreground">
                  {m.name}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {m.type} · {formatBytes(m.size)} · {m.dependencies.length} dep
                  {m.dependencies.length === 1 ? '' : 's'}
                </span>
              </button>
            </div>
            {open && (
              <div className="border-t">
                {m.dependencies.length === 0 && (
                  <div className="px-3 py-1.5 text-muted-foreground">
                    no dependencies
                  </div>
                )}
                {m.dependencies.map((d, i) => (
                  <div
                    key={`${i}-${d.type}-${d.request ?? ''}`}
                    className="flex items-center gap-2 border-b border-border/50 px-3 py-1 last:border-b-0"
                  >
                    <span
                      className={cn(
                        'w-4 shrink-0 text-center text-[9px]',
                        d.async ? 'text-brand' : 'text-muted-foreground/50'
                      )}
                      title={d.async ? 'inside an async block' : 'sync'}
                    >
                      {d.async ? '⇢' : '→'}
                    </span>
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {d.type}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono">
                      {d.request ?? (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </span>
                    {d.weak && (
                      <span className="shrink-0 text-[9px] uppercase text-warning">
                        weak
                      </span>
                    )}
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {d.category}
                    </span>
                    {d.module && (
                      <button
                        type="button"
                        className="max-w-[40%] shrink-0 truncate font-mono text-[10px] text-brand hover:underline"
                        onClick={() => onSelect(d.module)}
                        title={moduleName.get(d.module) ?? d.module}
                      >
                        ↳ {ellipsis(moduleName.get(d.module) ?? d.module, 28)}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ---------------- panel ---------------- */

export const GraphPanel: FC = () => {
  const graph = useStore((s) => s.graph)
  const status = useStore((s) => s.status)
  const [tab, setTab] = useState<Tab>('modules')
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-stretch border-b bg-surface text-xs">
        <div
          className="flex items-center px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          title={
            graph
              ? `${graph.modules.length} modules · ${graph.connections.length} connections · ${graph.chunks.length} chunks · ${graph.chunkGroups.length} chunk groups`
              : undefined
          }
        >
          Graph
        </div>
        <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'relative shrink-0 border-r px-3 transition-colors',
                tab === t.id
                  ? 'bg-background text-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
              )}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute inset-x-0 -bottom-px h-px bg-brand" />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {!graph ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Network className="h-6 w-6 opacity-40" />
            <span className="text-xs">
              {status === 'building'
                ? 'Building…'
                : 'Run a build to inspect the module and chunk graphs'}
            </span>
          </div>
        ) : tab === 'modules' ? (
          <ModuleGraphView
            graph={graph}
            selected={selected}
            onSelect={setSelected}
          />
        ) : tab === 'chunks' ? (
          <ChunkGraphView graph={graph} />
        ) : (
          <DependenciesView
            graph={graph}
            selected={selected}
            onSelect={setSelected}
          />
        )}
      </div>
    </div>
  )
}
