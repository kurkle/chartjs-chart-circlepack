// import.meta.glob resolves against this file, so the maps are built here.
//
// With the first fixture directory, import createFixtures from
// chartjs-test-utils, build
//   const specsFromFixtures = createFixtures({ configs, images, prefix: '../fixtures/' })
// and add one line per directory, e.g. describe('basic', specsFromFixtures('basic')).
// Not before: the suite of a directory without fixtures throws.
const configs = {
  ...import.meta.glob('../fixtures/**/*.js', { eager: true, import: 'default' }),
  ...import.meta.glob('../fixtures/**/*.json', { eager: true, import: 'default' }),
}
const images = import.meta.glob('../fixtures/**/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
})

describe('fixture files', () => {
  // createFixtures reports a config without an image, not an image without a
  // config: such an image would never be compared.
  it('has a config for every reference image', () => {
    const names = new Set(Object.keys(configs).map((path) => path.replace(/\.(js|json)$/, '')))
    const orphans = Object.keys(images).filter((path) => !names.has(path.replace(/\.png$/, '')))

    expect(orphans).toEqual([])
  })
})
