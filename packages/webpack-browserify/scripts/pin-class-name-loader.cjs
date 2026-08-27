// webpack matches some objects by `constructor.name` (createHooksRegistry,
// hmr/parserHooks). Pin the name so it survives minification by consumers.
module.exports = function pinClassNameLoader(source) {
  const { name } = this.getOptions()
  return `${source}\nObject.defineProperty(${name}, "name", { value: "${name}" });\n`
}
