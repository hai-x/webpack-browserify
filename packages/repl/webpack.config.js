import path from 'node:path'
import { fileURLToPath } from 'node:url'
import MinimizerPlugin from 'minimizer-webpack-plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default (_env, argv) => {
  const isProd = argv.mode === 'production'

  return {
    mode: isProd ? 'production' : 'development',
    target: ['web', 'es2022'],
    entry: {
      index: './index.html'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProd ? 'assets/[name].[contenthash:8].js' : '[name].js',
      cssFilename: isProd ? 'assets/[name].[contenthash:8].css' : '[name].css',
      htmlFilename: '[name].html',
      publicPath: '/',
      clean: true
    },
    experiments: {
      css: true,
      html: true
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
      tsconfig: true
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          loader: 'swc-loader',
          options: {
            jsc: {
              target: 'es2022',
              parser: { syntax: 'typescript', tsx: true },
              transform: {
                react: { runtime: 'automatic', development: !isProd }
              }
            }
          }
        },
        {
          test: /\.css$/,
          use: ['postcss-loader']
        }
      ]
    },
    optimization: {
      minimizer: [
        '...',
        isProd
          ? new MinimizerPlugin({
              test: /\.css$/i,
              minify: MinimizerPlugin.cssnanoMinify
            })
          : null
      ].filter(Boolean)
    },
    performance: { hints: false },
    devtool: false,
    devServer: {
      historyApiFallback: true,
      open: true
    }
  }
}
