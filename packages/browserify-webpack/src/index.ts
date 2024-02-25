import memfs from 'memfs'
import webpack from 'webpack'
import type { Compiler, Configuration, Stats } from 'webpack'

const _webpack = (
  o: Configuration,
  c: (err?: Error | null | undefined, stats?: Stats) => void
): Compiler => {
  const _o: Configuration = {
    ...o,
    ...{
      infrastructureLogging: {
        colors: true,
        debug: false,
        level: 'verbose',
        console: window.console,
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        stream: { isTTY: false } as any
      }
    }
  }
  const ins = webpack(_o, c)

  return {
    ...ins,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    watch: (o: any, c: any) => {
      return ins.watch(
        {
          poll: 3000,
          ...o
        },
        c
      )
    }
  } as Compiler
}

const runtimePolyfill = async () => {
  // process.hrtime
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  process.hrtime = (await import('browser-process-hrtime')).default as any

  // setImmediate
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  ;(window as any).setImmediate =
    typeof setImmediate === 'function'
      ? setImmediate
      : (cb: () => void) => {
          setTimeout(cb, 0)
        }
}

await runtimePolyfill()

export default _webpack
export const fs = memfs
