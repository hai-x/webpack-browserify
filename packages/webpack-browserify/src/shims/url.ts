import { resolve as resolvePath } from 'path'
import legacy from 'url/url.js'

// legacy API from the `url` package
export const parse = legacy.parse
export const format = legacy.format
export const resolve = legacy.resolve
export const resolveObject = legacy.resolveObject

// WHATWG API from the browser
export const URL = globalThis.URL
export const URLSearchParams = globalThis.URLSearchParams

// Node helpers missing from the `url` package
export function fileURLToPath(url: string | URL): string {
  const parsed = typeof url === 'string' ? new URL(url) : url
  if (parsed.protocol !== 'file:') {
    throw new TypeError('The URL must be of scheme file')
  }
  return decodeURIComponent(parsed.pathname)
}

export function pathToFileURL(path: string): URL {
  const encoded = resolvePath(path)
    .replace(/%/g, '%25')
    .replace(/\\/g, '%5C')
    .replace(/\n/g, '%0A')
    .replace(/\r/g, '%0D')
    .replace(/\t/g, '%09')
  return new URL(`file://${encoded}`)
}
