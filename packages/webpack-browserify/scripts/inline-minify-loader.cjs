// webpack's default minimizer names its minify functions by module path so
// worker threads can `require` them. Bundled, `require.resolve` yields a module
// id instead of a path, which minimizer-webpack-plugin rejects. Pass the
// functions themselves.
module.exports = function inlineMinifyLoader(source) {
  return source
    .replace(
      /\{\s*path:\s*require\.resolve\(("[^"]+")\),\s*export:\s*("[^"]+")\s*\}/g,
      (_, request, name) => `require(${request})[${name}]`
    )
    .replace(/require\.resolve\(("[^"]*Minify")\)/g, (_, request) => `require(${request})`)
}
