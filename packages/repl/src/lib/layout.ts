export type LayoutNode = { id: string; width: number; height: number }
export type LayoutEdge = { from: string; to: string }
export type PositionedNode = LayoutNode & {
  x: number
  y: number
  layer: number
}
export type Layout = {
  nodes: Map<string, PositionedNode>
  width: number
  height: number
}

type Options = { gapX?: number; gapY?: number }

/** Left-to-right layered layout (longest path + barycenter ordering). */
export function layoutGraph(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  { gapX = 80, gapY = 16 }: Options = {}
): Layout {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const out = new Map<string, Set<string>>()
  const inn = new Map<string, Set<string>>()
  for (const n of nodes) {
    out.set(n.id, new Set())
    inn.set(n.id, new Set())
  }
  for (const e of edges) {
    if (e.from === e.to || !byId.has(e.from) || !byId.has(e.to)) continue
    out.get(e.from)?.add(e.to)
    inn.get(e.to)?.add(e.from)
  }

  // back edges found by DFS are ignored for layering
  const back = new Set<string>()
  const state = new Map<string, 1 | 2>()
  const visit = (id: string) => {
    state.set(id, 1)
    for (const next of out.get(id) ?? []) {
      const s = state.get(next)
      if (s === 1) back.add(`${id}\n${next}`)
      else if (!s) visit(next)
    }
    state.set(id, 2)
  }
  for (const n of nodes) if (!state.has(n.id)) visit(n.id)

  const layerOf = new Map<string, number>()
  const layer = (id: string): number => {
    const cached = layerOf.get(id)
    if (cached !== undefined) return cached
    layerOf.set(id, 0)
    let l = 0
    for (const p of inn.get(id) ?? []) {
      if (back.has(`${p}\n${id}`)) continue
      l = Math.max(l, layer(p) + 1)
    }
    layerOf.set(id, l)
    return l
  }
  const layers: string[][] = []
  for (const n of nodes) {
    const l = layer(n.id)
    ;(layers[l] ??= []).push(n.id)
  }
  for (let i = 0; i < layers.length; i++) layers[i] ??= []

  // barycenter sweeps
  const position = new Map<string, number>()
  const reindex = () => {
    for (const ids of layers) ids.forEach((id, i) => position.set(id, i))
  }
  const bary = (id: string, neighbours: Map<string, Set<string>>) => {
    const ns = [...(neighbours.get(id) ?? [])]
      .map((n) => position.get(n))
      .filter((p): p is number => p !== undefined)
    return ns.length
      ? ns.reduce((a, b) => a + b, 0) / ns.length
      : (position.get(id) ?? 0)
  }
  reindex()
  for (let sweep = 0; sweep < 4; sweep++) {
    const down = sweep % 2 === 0
    const order = down ? layers.keys() : [...layers.keys()].reverse().values()
    for (const l of order) {
      const neighbours = down ? inn : out
      layers[l].sort((a, b) => bary(a, neighbours) - bary(b, neighbours))
      reindex()
    }
  }

  // coordinates
  const positioned = new Map<string, PositionedNode>()
  const layerHeights = layers.map(
    (ids) =>
      ids.reduce((h, id) => h + (byId.get(id)?.height ?? 0), 0) +
      Math.max(0, ids.length - 1) * gapY
  )
  const totalHeight = Math.max(0, ...layerHeights)
  let x = 0
  layers.forEach((ids, l) => {
    const layerWidth = Math.max(0, ...ids.map((id) => byId.get(id)?.width ?? 0))
    let y = (totalHeight - layerHeights[l]) / 2
    for (const id of ids) {
      const node = byId.get(id)
      if (!node) continue
      positioned.set(id, {
        ...node,
        x: x + (layerWidth - node.width) / 2,
        y,
        layer: l
      })
      y += node.height + gapY
    }
    x += layerWidth + gapX
  })

  return {
    nodes: positioned,
    width: Math.max(0, x - gapX),
    height: totalHeight
  }
}
