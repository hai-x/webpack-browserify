// the `url` npm package (browser port of the legacy Node API) ships no types
declare module 'url/url.js' {
  const legacy: Pick<
    typeof import('url'),
    'parse' | 'format' | 'resolve' | 'resolveObject'
  >
  export = legacy
}
