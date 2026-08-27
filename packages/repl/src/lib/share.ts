import { CONFIG_PATHS } from '@/lib/config'

export type Snapshot = {
  files: Record<string, string>
  config: string
  configPath: string
  version?: string | null
  rspackVersion?: string | null
}

export type SharedSnapshot = {
  files: Record<string, string>
  config?: string
  configPath?: string
  rspackVersion?: string
}

// rspack playground share format: `#<base64>` of { rspackVersion, inputFiles }
type ShareFile = { filename: string; text: string }
type ShareData = {
  webpackVersion?: string
  rspackVersion?: string
  inputFiles: ShareFile[]
}

const LEGACY_PARAM = 'code'

const stripSlash = (p: string) => p.replace(/^\/+/, '')

const CONFIG_FILES = new Set(CONFIG_PATHS.map(stripSlash))

const toBase64 = (str: string) => {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

const fromBase64 = (b64: string) => {
  // accept url-safe alphabet too
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

const toShareData = (s: Snapshot): ShareData => ({
  ...(s.version ? { webpackVersion: s.version } : {}),
  ...(typeof s.rspackVersion === 'string'
    ? { rspackVersion: s.rspackVersion }
    : {}),
  inputFiles: [
    { filename: stripSlash(s.configPath), text: s.config },
    ...Object.entries(s.files).map(([filename, text]) => ({
      filename: stripSlash(filename),
      text
    }))
  ]
})

const fromShareData = (data: ShareData): SharedSnapshot => {
  const files: Record<string, string> = {}
  let config: string | undefined
  let configPath: string | undefined
  for (const f of data.inputFiles) {
    if (typeof f?.filename !== 'string' || typeof f.text !== 'string') continue
    const name = stripSlash(f.filename)
    if (CONFIG_FILES.has(name)) {
      config = f.text
      configPath = `/${name}`
    } else {
      files[f.filename] = f.text
    }
  }
  return {
    files,
    config,
    configPath,
    ...(typeof data.rspackVersion === 'string'
      ? { rspackVersion: data.rspackVersion }
      : {})
  }
}

const parseLegacy = (raw: string): SharedSnapshot | null => {
  const parsed = JSON.parse(fromBase64(raw)) as Partial<Snapshot>
  if (!parsed.files || typeof parsed.config !== 'string') return null
  return { files: parsed.files, config: parsed.config }
}

export const encodeSnapshot = (s: Snapshot) =>
  toBase64(JSON.stringify(toShareData(s)))

export const decodeSnapshot = (hash: string): SharedSnapshot | null => {
  if (!hash) return null
  try {
    if (hash.startsWith(`${LEGACY_PARAM}=`)) {
      return parseLegacy(hash.slice(LEGACY_PARAM.length + 1))
    }
    const data = JSON.parse(fromBase64(hash)) as Partial<ShareData>
    if (!data || !Array.isArray(data.inputFiles)) return null
    return fromShareData(data as ShareData)
  } catch {
    return null
  }
}

export const readSnapshotFromUrl = () => decodeSnapshot(location.hash.slice(1))

export const writeSnapshotToUrl = (s: Snapshot) => {
  history.replaceState(null, '', `#${encodeSnapshot(s)}`)
  return location.href
}
