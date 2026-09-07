import browserifyWebpack, { fs } from 'webpack-browserify'
import { create } from 'zustand'
import {
  CONFIG_PATH,
  DEFAULT_CONFIG,
  DEFAULT_FILES,
  evalConfig
} from '@/lib/config'
import { extractGraph, type GraphData } from '@/lib/graph'
import { disposeModel } from '@/lib/monaco'
import { readSnapshotFromUrl, resolveRspackVersion } from '@/lib/share'

export type Diagnostic = {
  level: 'error' | 'warning'
  message: string
  module?: string
  /** stack or extra details */
  details?: string
}

export type BuildStatus = 'idle' | 'building' | 'success' | 'error'

export type RightPane = 'output' | 'graph'

type State = {
  files: Record<string, string>
  activeFile: string
  config: string
  configPath: string
  rspackVersion: string | null
  output: Record<string, string>
  graph: GraphData | null
  outputPath: string
  activeOutput: string | null
  diagnostics: Diagnostic[]
  status: BuildStatus
  duration: number | null
  version: string | null
  autoBuild: boolean
  sidebarOpen: boolean
  rightPane: RightPane
}

type Actions = {
  setFile: (path: string, content: string) => void
  addFile: () => string
  renameFile: (from: string, to: string) => boolean
  removeFile: (path: string) => void
  setActiveFile: (path: string) => void
  setConfig: (source: string) => void
  setActiveOutput: (path: string) => void
  toggleAutoBuild: () => void
  toggleSidebar: () => void
  setRightPane: (pane: RightPane) => void
  build: () => void
}

const sortByKey = <T>(obj: Record<string, T>) =>
  Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))
  ) as Record<string, T>

export const normalizePath = (p: string) => {
  let v = p.trim().replace(/\\/g, '/').replace(/\/+/g, '/')
  if (!v.startsWith('/')) v = `/${v}`
  return v
}

const dirname = (p: string) => p.slice(0, p.lastIndexOf('/')) || '/'

const writeFile = (path: string, content: string) => {
  fs.vol.mkdirSync(dirname(path), { recursive: true })
  fs.vol.writeFileSync(path, content)
}

const readOutput = (outputPath: string) => {
  if (!fs.vol.existsSync(outputPath)) return {}
  const entries = fs.vol.toJSON(outputPath) as Record<string, string | null>
  const files: Record<string, string> = {}
  for (const [path, content] of Object.entries(entries)) {
    if (typeof content === 'string') files[path] = content
  }
  return sortByKey(files)
}

const shared = readSnapshotFromUrl()
const configPath = shared?.configPath ?? CONFIG_PATH
const initialFiles = sortByKey(
  Object.fromEntries(
    Object.entries(shared?.files || DEFAULT_FILES).map(([p, c]) => [
      normalizePath(p),
      c
    ])
  )
)
for (const [path, content] of Object.entries(initialFiles)) {
  writeFile(path, content)
}

let queued = false

export const useStore = create<State & Actions>()((set, get) => ({
  files: initialFiles,
  activeFile:
    Object.keys(initialFiles).find((p) => /\/index\.[cm]?[jt]sx?$/.test(p)) ||
    Object.keys(initialFiles)[0] ||
    configPath,
  config: shared?.config ?? DEFAULT_CONFIG,
  configPath,
  rspackVersion: shared?.rspackVersion ?? null,
  output: {},
  graph: null,
  outputPath: '/dist',
  activeOutput: null,
  diagnostics: [],
  status: 'idle',
  duration: null,
  version: null,
  autoBuild: true,
  sidebarOpen: true,
  rightPane: 'output',

  setFile: (path, content) => {
    writeFile(path, content)
    set((s) => ({ files: { ...s.files, [path]: content } }))
  },

  addFile: () => {
    const { files } = get()
    let n = 1
    let path = '/src/module.js'
    while (path in files) path = `/src/module-${n++}.js`
    writeFile(path, '')
    set((s) => ({
      files: sortByKey({ ...s.files, [path]: '' }),
      activeFile: path
    }))
    return path
  },

  renameFile: (from, rawTo) => {
    const to = normalizePath(rawTo)
    const { files } = get()
    if (to === from) return true
    if (to === '/' || to in files) return false
    fs.vol.mkdirSync(dirname(to), { recursive: true })
    fs.vol.renameSync(from, to)
    disposeModel(from)
    set((s) => {
      const next = { ...s.files }
      const content = next[from]
      delete next[from]
      next[to] = content
      return {
        files: sortByKey(next),
        activeFile: s.activeFile === from ? to : s.activeFile
      }
    })
    return true
  },

  removeFile: (path) => {
    const { files } = get()
    if (Object.keys(files).length <= 1) return
    fs.vol.rmSync(path, { force: true })
    disposeModel(path)
    set((s) => {
      const next = { ...s.files }
      delete next[path]
      const remaining = Object.keys(next)
      return {
        files: next,
        activeFile: s.activeFile === path ? remaining[0] : s.activeFile
      }
    })
  },

  setActiveFile: (path) => set({ activeFile: path }),

  setConfig: (source) => set({ config: source }),

  setActiveOutput: (path) => set({ activeOutput: path }),

  toggleAutoBuild: () => set((s) => ({ autoBuild: !s.autoBuild })),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setRightPane: (pane) => set({ rightPane: pane }),

  build: () => {
    if (get().status === 'building') {
      queued = true
      return
    }
    const fail = (message: string) =>
      set({
        status: 'error',
        duration: null,
        diagnostics: [{ level: 'error', message }]
      })

    let config: ReturnType<typeof evalConfig>
    try {
      config = evalConfig(get().config, get().configPath)
    } catch (e) {
      fail(`${get().configPath.slice(1)}: ${(e as Error).message}`)
      return
    }

    const outputPath = normalizePath(
      typeof config.output?.path === 'string' ? config.output.path : '/dist'
    )
    if (outputPath !== '/' && fs.vol.existsSync(outputPath)) {
      fs.vol.rmSync(outputPath, { recursive: true, force: true })
    }

    set({ status: 'building', diagnostics: [], outputPath })
    const start = performance.now()

    const finish = (
      err: Error | null | undefined,
      stats?: Parameters<
        NonNullable<Parameters<typeof browserifyWebpack>[1]>
      >[1]
    ) => {
      const duration = Math.round(performance.now() - start)
      const diagnostics: Diagnostic[] = []
      if (err) {
        diagnostics.push({
          level: 'error',
          message: err.message,
          details: err.stack
        })
      }
      if (stats) {
        const json = stats.toJson({
          all: false,
          errors: true,
          warnings: true,
          errorDetails: true,
          errorStack: true
        })
        for (const w of json.warnings || []) {
          diagnostics.push({
            level: 'warning',
            message: w.message,
            module: w.moduleName,
            details: w.details
          })
        }
        for (const e of json.errors || []) {
          diagnostics.push({
            level: 'error',
            message: e.message,
            module: e.moduleName,
            details: e.details ?? e.stack
          })
        }
      }
      const output = readOutput(outputPath)
      const outputKeys = Object.keys(output)
      let graph: GraphData | null = null
      try {
        graph = stats ? extractGraph(stats.compilation) : null
      } catch (e) {
        console.warn('[playground] graph extraction failed', e)
      }
      const { activeOutput, version } = get()
      set({
        status: diagnostics.some((d) => d.level === 'error')
          ? 'error'
          : 'success',
        duration,
        diagnostics,
        output,
        graph,
        activeOutput:
          activeOutput && activeOutput in output
            ? activeOutput
            : outputKeys[0] || null,
        version:
          // oxlint-disable-next-line typescript/no-explicit-any
          (stats?.compilation.compiler as any)?.webpack?.version ?? version
      })
      if (queued) {
        queued = false
        get().build()
      }
    }

    try {
      browserifyWebpack(config, finish)
    } catch (e) {
      finish(e as Error)
    }
  }
}))

// rspack links need a version; fetch it unless the shared hash had one
if (!shared?.rspackVersion) {
  resolveRspackVersion().then((rspackVersion) =>
    useStore.setState({ rspackVersion })
  )
}

export const useSnapshot = () =>
  useStore((s) => ({
    files: s.files,
    config: s.config,
    configPath: s.configPath
  }))
