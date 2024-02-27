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
            }
        ]
    },
    resolve: {
        // Setting resolve.alias to false will tell webpack to ignore a module.
        alias: {
            'jest-worker': false,
            'uglify-js': false,
            '@swc/core': false,
            esbuild: false,
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
        }
    },
    devtool: 'source-map',
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser'
        })
    ],
    output: {
        library: {
            type: 'module'
        },
        clean: true
    },
    experiments: {
        outputModule: true,
        topLevelAwait: true
    },
}
