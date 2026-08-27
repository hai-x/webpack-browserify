// An outer webpack (with `experiments.css`) rewrites `__WEBPACK_CSS_*`
// placeholders in every JS asset it emits, which would blank the constants
// of the bundled webpack. Split the literals so they are built at runtime.
module.exports = function splitPlaceholderLoader(source) {
  return source.replace(
    /"(__WEBPACK_CSS_)([A-Z_]+)"/g,
    (_, head, tail) => `["${head}", "${tail}"].join("")`
  )
}
