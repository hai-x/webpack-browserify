import type { Stats } from 'webpack-browserify'

type Compilation = Stats['compilation']
type Module = Compilation['modules'] extends Set<infer M> ? M : never
type Dependency = Module['dependencies'][number]
type Block = Module['blocks'][number]

export type GraphDependency = {
  type: string
  category: string
  request: string | null
  /** identifier of the resolved module */
  module: string | null
  /** lives in an async block (`import()`) */
  async: boolean
  weak: boolean
}

export type GraphModule = {
  id: string
  moduleId: string | null
  name: string
  type: string
  size: number
  depth: number | null
  chunks: string[]
  dependencies: GraphDependency[]
}

export type ModuleConnection = {
  from: string
  to: string
  type: string
  request: string | null
  async: boolean
  active: boolean
}

export type GraphChunk = {
  id: string
  name: string | null
  files: string[]
  modules: string[]
  groups: string[]
  size: number
  initial: boolean
  runtime: boolean
}

export type GraphChunkGroup = {
  id: string
  name: string | null
  kind: 'entrypoint' | 'async'
  chunks: string[]
  children: string[]
  parents: string[]
  origins: { module: string | null; request: string | null }[]
}

export type GraphData = {
  modules: GraphModule[]
  connections: ModuleConnection[]
  chunks: GraphChunk[]
  chunkGroups: GraphChunkGroup[]
}

const requestOf = (dep: Dependency | Block): string | null =>
  'request' in dep && typeof dep.request === 'string' ? dep.request : null

const chunkKey = (chunk: { id: string | number | null; debugId: number }) =>
  chunk.id === null ? `debug:${chunk.debugId}` : String(chunk.id)

export function extractGraph(compilation: Compilation): GraphData {
  const { moduleGraph, chunkGraph, requestShortener } = compilation
  const modules: GraphModule[] = []
  const connections: ModuleConnection[] = []
  const seenEdges = new Set<string>()

  // async block set to flag lazy connections
  const asyncDeps = new Set<Dependency>()
  const collect = (
    deps: Dependency[],
    blocks: Block[],
    async: boolean,
    out: GraphDependency[]
  ) => {
    for (const dep of deps) {
      if (async) asyncDeps.add(dep)
      const target = moduleGraph.getModule(dep)
      out.push({
        type: dep.type,
        category: dep.category,
        request: requestOf(dep),
        module: target ? target.identifier() : null,
        async,
        weak: 'weak' in dep && dep.weak === true
      })
    }
    for (const block of blocks) {
      collect(block.dependencies, block.blocks, true, out)
    }
  }

  for (const module of compilation.modules) {
    const dependencies: GraphDependency[] = []
    collect(module.dependencies, module.blocks, false, dependencies)
    const chunks: string[] = []
    for (const chunk of chunkGraph.getModuleChunksIterable(module)) {
      chunks.push(chunkKey(chunk))
    }
    const moduleId = chunkGraph.getModuleId(module)
    modules.push({
      id: module.identifier(),
      moduleId: moduleId === null ? null : String(moduleId),
      name: module.readableIdentifier(requestShortener),
      type: module.type,
      size: module.size(),
      depth: moduleGraph.getDepth(module),
      chunks,
      dependencies
    })

    for (const connection of moduleGraph.getOutgoingConnections(module)) {
      const dep = connection.dependency
      const from = module.identifier()
      const to = connection.module.identifier()
      const type = dep ? dep.type : 'connection'
      const key = `${from}\n${to}\n${type}`
      if (seenEdges.has(key)) continue
      seenEdges.add(key)
      connections.push({
        from,
        to,
        type,
        request: dep ? requestOf(dep) : null,
        async: dep ? asyncDeps.has(dep) : false,
        active: connection.isActive(undefined)
      })
    }
  }

  const entrypoints = new Set(compilation.entrypoints.values())
  const groupKey = (group: (typeof compilation.chunkGroups)[number]) =>
    group.name ?? `group:${group.id}`

  const chunkGroups: GraphChunkGroup[] = compilation.chunkGroups.map(
    (group) => ({
      id: groupKey(group),
      name: group.name ?? null,
      kind: entrypoints.has(group as never) ? 'entrypoint' : 'async',
      chunks: group.chunks.map(chunkKey),
      children: group.getChildren().map(groupKey),
      parents: group.getParents().map(groupKey),
      origins: group.origins.map((origin) => ({
        module: origin.module
          ? origin.module.readableIdentifier(requestShortener)
          : null,
        request: origin.request ?? null
      }))
    })
  )

  const chunks: GraphChunk[] = []
  for (const chunk of compilation.chunks) {
    const mods: string[] = []
    for (const module of chunkGraph.getChunkModulesIterable(chunk)) {
      mods.push(module.identifier())
    }
    const groups: string[] = []
    for (const group of chunk.groupsIterable) groups.push(groupKey(group))
    chunks.push({
      id: chunkKey(chunk),
      name: chunk.name ?? null,
      files: [...chunk.files],
      modules: mods,
      groups,
      size: chunkGraph.getChunkSize(chunk),
      initial: chunk.canBeInitial(),
      runtime: chunk.hasRuntime()
    })
  }

  return { modules, connections, chunks, chunkGroups }
}
