import path from 'path-browserify'
import { fs, webpack, type Configuration } from 'webpack-browserify'

export const CONFIG_PATH = '/webpack.config.js'
export const RSPACK_CONFIG_PATH = '/rspack.config.js'
export const CONFIG_PATHS = [CONFIG_PATH, RSPACK_CONFIG_PATH]

export const DEFAULT_CONFIG = `module.exports = {
  mode: 'development',
  devtool: false,
  entry: {
    main: '/src/index.js'
  },
  output: {
    path: '/dist',
    filename: '[name].js'
  }
}
`

export const DEFAULT_FILES: Record<string, string> = {
  '/src/index.js': `import { greet } from './greet.js'

console.log(greet('webpack'))

// dynamic import -> separate chunk
import('./lazy.js').then(({ answer }) => {
  console.log('the answer is', answer)
})
`,
  '/src/greet.js': `export const greet = (name) => \`Hello, \${name}!\`
`,
  '/src/lazy.js': `export const answer = 42
`
}

// modules a config may import; mirrors rspack playground
const CONFIG_MODULES: Record<string, unknown> = {
  webpack,
  '@rspack/core': webpack,
  path,
  fs: fs.fs
}

const requireConfigModule = (name: string) => {
  const key = name.replace(/^node:/, '')
  if (key in CONFIG_MODULES) return CONFIG_MODULES[key]
  throw new Error(
    `Unsupported import '${name}'. Supported imports: ${Object.keys(CONFIG_MODULES).join(', ')} (Node builtins also accept the node: prefix)`
  )
}

// oxlint-disable-next-line typescript/no-explicit-any
const interop = (m: any) => m?.default ?? m

const ID = '[A-Za-z_$][\\w$]*'

// `X, * as ns, { a as b }` -> const bindings
const bindImport = (clause: string, req: string) => {
  const out: string[] = []
  let rest = clause.trim()
  const def = new RegExp(`^(${ID})\\s*,?\\s*`).exec(rest)
  if (def) {
    out.push(`const ${def[1]} = __interop(${req})`)
    rest = rest.slice(def[0].length)
  }
  const ns = new RegExp(`^\\*\\s*as\\s+(${ID})`).exec(rest)
  if (ns) out.push(`const ${ns[1]} = ${req}`)
  const named = /^\{([^}]*)\}/.exec(rest)
  if (named) {
    out.push(`const {${named[1].replace(/\s+as\s+/g, ': ')}} = ${req}`)
  }
  return out.join('; ')
}

// minimal ESM -> CJS for config sources
export const esmToCjs = (source: string) =>
  source
    .replace(
      /^[ \t]*import\s*(['"])([^'"]+)\1[ \t]*;?/gm,
      (_, __, m) => `require(${JSON.stringify(m)})`
    )
    .replace(
      /^[ \t]*import\s+([^'"]+?)\s+from\s*(['"])([^'"]+)\2[ \t]*;?/gm,
      (_, clause, __, m) => bindImport(clause, `require(${JSON.stringify(m)})`)
    )
    .replace(/^[ \t]*export\s+default\s+/gm, 'module.exports = ')

// evaluate CommonJS or ESM config source
export function evalConfig(
  source: string,
  configPath = CONFIG_PATH
): Configuration {
  const fn = new Function(
    'module',
    'exports',
    'require',
    '__interop',
    '__dirname',
    '__filename',
    `var console = {}, global = globalThis, process = {};
${esmToCjs(source)}
return module.exports`
  )
  const module = { exports: {} }
  const result = interop(
    fn(
      module,
      module.exports,
      requireConfigModule,
      interop,
      path.dirname(configPath),
      configPath
    )
  )
  if (!result || typeof result !== 'object') {
    throw new Error('module.exports must be an object')
  }
  return result as Configuration
}
