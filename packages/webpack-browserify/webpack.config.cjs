const path = require('path')
const webpack = require('webpack')

module.exports = {
  mode: 'production',
  entry: {
    index: './src/index.ts'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader'
      },
      {
        test: /webpack[\\/]lib[\\/]util[\\/]publicPathPlaceholder\.js$/,
        loader: path.resolve(__dirname, 'scripts/split-placeholder-loader.cjs')
      },
      {
        test: /webpack[\\/]lib[\\/]Compilation\.js$/,
        loader: path.resolve(__dirname, 'scripts/pin-class-name-loader.cjs'),
        options: { name: 'Compilation' }
      },
      {
        test: /webpack[\\/]lib[\\/]javascript[\\/]JavascriptParser\.js$/,
        loader: path.resolve(__dirname, 'scripts/pin-class-name-loader.cjs'),
        options: { name: 'JavascriptParser' }
      }
    ]
  },
  resolve: {
    // Setting resolve.alias to false will tell webpack to ignore a module.
    alias: {
      // adds fileURLToPath/pathToFileURL on top of the `url` package
      url$: path.resolve(__dirname, 'src/shims/url.ts'),
      'jest-worker': false,
      // optional minifier engines of minimizer-webpack-plugin; terser stays
      'uglify-js': false,
      '@swc/core': false,
      '@swc/css': false,
      '@swc/html': false,
      '@minify-html/node': false,
      'clean-css': false,
      'html-minifier-terser': false,
      cssnano: false,
      csso: false,
      esbuild: false,
      lightningcss: false,
      postcss: false
    },
    // https://webpack.js.org/configuration/resolve/#resolvefallback
    fallback: {
      assert: require.resolve('assert'),
      buffer: require.resolve('buffer'),
      console: require.resolve('console-browserify'),
      constants: require.resolve('constants-browserify'),
      crypto: require.resolve('crypto-browserify'),
      domain: require.resolve('domain-browser'),
      events: require.resolve('events'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
      punycode: require.resolve('punycode'),
      process: require.resolve('process/browser'),
      querystring: require.resolve('querystring-es3'),
      stream: require.resolve('stream-browserify'),
      string_decoder: require.resolve('string_decoder'),
      sys: require.resolve('util'),
      timers: require.resolve('timers-browserify'),
      tty: require.resolve('tty-browserify'),
      url: require.resolve('url'),
      util: require.resolve('util'),
      vm: require.resolve('vm-browserify'),
      zlib: require.resolve('browserify-zlib'),
      fs: require.resolve('memfs'),
      module: require.resolve('builtin-modules/static'),
      // only used by the filesystem cache serializer
      v8: false
    }
  },
  devtool: false,
  plugins: [
    // map `node:` builtins onto the fallbacks above
    new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
      resource.request = resource.request.replace(/^node:/, '')
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ],
  optimization: {
    minimize: {
      // webpack matches hook registries by `constructor.name`
      javascript: { keep_classnames: true, compress: { passes: 2 } }
    }
  },
  output: {
    library: {
      type: 'module'
    },
    clean: true
  },
  experiments: {
    outputModule: true,
    topLevelAwait: true
  }
}
