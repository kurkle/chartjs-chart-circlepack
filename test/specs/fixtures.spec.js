import { createFixtures } from 'chartjs-test-utils'

// import.meta.glob resolves against this file, so the maps are built here.
// One describe line per fixture directory: the suite of a directory without
// fixtures throws.
const configs = {
  ...import.meta.glob('../fixtures/**/*.js', { eager: true, import: 'default' }),
  ...import.meta.glob('../fixtures/**/*.json', { eager: true, import: 'default' }),
}
const images = import.meta.glob('../fixtures/**/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
})

const specsFromFixtures = createFixtures({ configs, images, prefix: '../fixtures/' })

describe('fixtures', () => {
  describe('basic', specsFromFixtures('basic'))
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
