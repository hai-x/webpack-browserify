import { Writable } from 'stream'
import 'setimmediate'
import hrtime from 'browser-process-hrtime'
import webpack from 'webpack'
import type { Compiler, Configuration, Stats } from 'webpack'

export type { Compiler, Configuration, Stats, Watching } from 'webpack'
export * as fs from 'memfs'
export { default as webpack } from 'webpack'

/** Callback invoked once a build finishes. */
export type BuildCallback = (err: null | Error, stats?: Stats) => void

export type WatchOptions = Parameters<Compiler['watch']>[0]

// memfs has no native watcher, poll instead
const DEFAULT_WATCH_OPTIONS: WatchOptions = { poll: 3000 }

// webpack only reads `isTTY`; nothing is written while `console` is set
const silentStream = Object.assign(
  new Writable({ write: (_chunk, _encoding, next) => next() }),
  { isTTY: false }
)

const BROWSER_LOGGING: Configuration['infrastructureLogging'] = {
  colors: true,
  debug: false,
  level: 'verbose',
  console,
  stream: silentStream
}

const toBrowserConfig = (options: Configuration): Configuration => ({
  ...options,
  infrastructureLogging: {
    ...BROWSER_LOGGING,
    ...options.infrastructureLogging
  }
})

const withPollingWatch = (compiler: Compiler): Compiler => {
  const watch = compiler.watch.bind(compiler)
  compiler.watch = (watchOptions, handler) =>
    watch({ ...DEFAULT_WATCH_OPTIONS, ...watchOptions }, handler)
  return compiler
}

/** Create a compiler; optionally run it right away like `webpack()`. */
function browserifyWebpack(options?: Configuration): Compiler
function browserifyWebpack(
  options: Configuration | undefined,
  callback: BuildCallback
): Compiler | null
function browserifyWebpack(
  options: Configuration = {},
  callback?: BuildCallback
): Compiler | null {
  const config = toBrowserConfig(options)
  const compiler = callback ? webpack(config, callback) : webpack(config)
  return compiler && withPollingWatch(compiler)
}

// `process/browser` lacks `hrtime`
const hrtimePolyfill: NodeJS.HRTime = Object.assign(
  (time?: [number, number]) => hrtime(time),
  {
    bigint: () => {
      const [seconds, nanoseconds] = hrtime()
      return BigInt(seconds) * 1_000_000_000n + BigInt(nanoseconds)
    }
  }
)
if (typeof process.hrtime !== 'function') process.hrtime = hrtimePolyfill

export default browserifyWebpack
