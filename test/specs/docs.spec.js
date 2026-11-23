// Keeps the documentation site in step with the package: every option of the type definitions is
// on the usage page, and the sidebar lists exactly the sample pages there are.
const raw = import.meta.glob(
  ['../../src/types.ts', '../../astro.config.mjs', '../../src/content/docs/**/*.{md,mdx}'],
  { eager: true, import: 'default', query: '?raw' }
)
const source = (path) => raw[`../../${path}`] ?? ''

/** The property names declared in the body of `interface name` or `type name = {`. */
function properties(text, name) {
  const code = text.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')
  const open = code.indexOf('{', code.search(new RegExp(`(interface|type) ${name}\\b`)))
  let depth = 0
  let end = open
  do {
    depth += { '{': 1, '}': -1 }[code[end]] ?? 0
    end++
  } while (depth > 0)
  // drop what nested types declare, so that only this type's own properties are left
  let body = code.slice(open + 1, end - 1)
  for (let prev; prev !== body; ) {
    prev = body
    body = body.replace(/\{[^{}]*\}|\[[^[\]]*\]|\([^()]*\)|<[^<>]*>/g, '')
  }
  return [...body.matchAll(/(?:^|[;,\n])\s*(\w+)\??\s*:/g)].map((match) => match[1])
}

describe('documentation site', () => {
  it('documents every option of the type definitions on the usage page', () => {
    const types = source('src/types.ts')
    const usage = source('src/content/docs/usage.md')
    const options = [
      ...properties(types, 'CirclePackControllerDatasetOptions').filter((n) => n !== 'labels'),
      ...properties(types, 'CirclePackLabelsOptions').map((n) => `labels.${n}`),
      ...properties(types, 'CirclePackRegion').map((n) => `region.${n}`),
    ]
    // guards the parsing above: a renamed type would otherwise find nothing to check
    expect(options).toContain('backgroundColor')
    expect(options).toContain('labels.formatter')
    expect(options).toContain('region.left')

    const missing = options.filter((name) => !usage.includes(`\`${name}\``))
    expect(missing, 'options not on the usage page').toEqual([])
  })

  it('lists every sample page in the sidebar, and nothing else', () => {
    const linked = [...source('astro.config.mjs').matchAll(/link: '\/samples\/([^/']+)\/'/g)]
      .map((match) => match[1])
      .sort()
    const pages = Object.keys(raw)
      .filter((path) => path.includes('/docs/samples/'))
      // Starlight's slug is the file name in lower case
      .map((path) =>
        path
          .split('/')
          .at(-1)
          .replace(/\.mdx?$/, '')
          .toLowerCase()
      )
      .sort()

    expect(linked).toEqual(pages)
  })
})
