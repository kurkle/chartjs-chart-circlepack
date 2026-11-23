// A chart changed in place and updated must equal a new chart created with the same data, options
// and size. The two are compared once every animation has finished, in two ways: the elements'
// current geometry and resolved options, which name the circle and the property that differs, and
// the pixels, which also see what is drawn from them, such as the label text.
import { animator } from 'chart.js'

const SIZE = { height: 256, width: 512 }
const DURATION = 40

function circlepack(dataset, { animation = false, canvas = SIZE } = {}) {
  return window.acquireChart(
    {
      data: { datasets: [dataset] },
      options: {
        animation: animation && { duration: DURATION },
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      },
      type: 'circlepack',
    },
    { canvas }
  )
}

/** Resolves once no animation of the chart is running, so that what it shows is final. */
async function settle(chart) {
  while (animator.running(chart)) {
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

/** The current, not the final, geometry: after settle() an animation that stopped short shows. */
function state(chart) {
  return chart.getDatasetMeta(0).data.map(({ options, radius, x, y }) => ({
    options: {
      backgroundColor: options.backgroundColor,
      borderColor: options.borderColor,
      borderWidth: options.borderWidth,
      labels: {
        color: options.labels.color,
        display: options.labels.display,
        padding: options.labels.padding,
      },
    },
    radius,
    x,
    y,
  }))
}

/** How many bytes of the two canvases differ; a count, so that a failure does not print both. */
function pixelDiff(a, b) {
  const one = a.ctx.getImageData(0, 0, a.width, a.height).data
  const two = b.ctx.getImageData(0, 0, b.width, b.height).data
  if (one.length !== two.length) {
    return Number.POSITIVE_INFINITY
  }
  let count = 0
  for (let i = 0; i < one.length; i++) {
    if (one[i] !== two[i]) {
      count++
    }
  }
  return count
}

async function expectSameAsNew(chart, dataset, canvas = SIZE) {
  await settle(chart)
  const fresh = circlepack(dataset, { canvas })

  expect(state(chart)).toEqual(state(fresh))
  expect(pixelDiff(chart, fresh)).toBe(0)
}

/** The element's centre and radius at the end of its animation. */
const final = (element) => element.getProps(['x', 'y', 'radius'], true)

// Every dataset that is mutated or resized has a region and a spacing, so that an update that
// lays out without them, or with stale ones, shows.
const PLACEMENT = () => ({ region: { left: 0.5, top: 0.25 }, spacing: 2 })

const OPTIONS = {
  'dataset-level options': () => ({
    ...PLACEMENT(),
    backgroundColor: 'rgba(0, 128, 255, 0.5)',
    borderColor: 'navy',
    borderWidth: 3,
    labels: { color: 'white' },
  }),
  'scriptable options': () => ({
    ...PLACEMENT(),
    // by value and by index, so that a row that moves to another index must be resolved again
    backgroundColor: (ctx) => `hsl(${ctx.raw * 40}, 70%, 50%)`,
    borderWidth: (ctx) => ctx.dataIndex % 3,
    labels: { display: (ctx) => ctx.raw > 3 },
  }),
}

// Each changes the dataset of [5, 3, 8, 1, 6] and returns the indexes of the rows it inserts.
const MUTATIONS = {
  'a new data array': (dataset) => {
    dataset.data = [2, 9, 4]
    return []
  },
  'a push': ({ data }) => {
    data.push(4)
    return [5]
  },
  // Chart.js removes the two elements and inserts three
  'a splice': ({ data }) => {
    data.splice(1, 2, 9, 4, 2)
    return [1, 2, 3]
  },
  'an edit in place': ({ data }) => {
    data[2] = 2
    return []
  },
  'an unshift, then a push': ({ data }) => {
    data.unshift(7)
    data.push(2)
    return [0, 6]
  },
  'two pushes': ({ data }) => {
    data.push(4)
    data.push(2)
    return [5, 6]
  },
}

const optionsDataset = () => ({
  backgroundColor: 'red',
  data: [
    { a: 9, b: 1 },
    { a: 1, b: 4 },
    { a: 4, b: 9 },
  ],
  key: 'a',
  labels: { color: 'black' },
})

// Each changes one option of optionsDataset() in place.
const CHANGES = {
  'a labels option': (dataset) => {
    dataset.labels.color = 'white'
  },
  'an element option': (dataset) => {
    dataset.backgroundColor = 'green'
  },
  key: (dataset) => {
    dataset.key = 'b'
  },
  region: (dataset) => {
    dataset.region = { left: 0.5, top: 0.25 }
  },
  spacing: (dataset) => {
    dataset.spacing = 6
  },
}

// a tall and a square chart, whose regions are shaped unlike that of the 512×256 one
const SIZES = [
  { height: 512, width: 256 },
  { height: 300, width: 300 },
]

/** Every inserted circle starts at radius 0 at its own final centre, so that it grows in place. */
function expectGrowingInPlace(chart, inserted) {
  // the layout changes, so something moves; otherwise the case would test no animation
  expect(animator.running(chart)).toBe(true)
  const elements = chart.getDatasetMeta(0).data
  for (const index of inserted) {
    const element = elements[index]
    const { x, y } = final(element)
    expect({ index, radius: element.radius, x: element.x, y: element.y }).toEqual({
      index,
      radius: 0,
      x,
      y,
    })
  }
}

async function mutated(animation, options, mutate) {
  const dataset = { ...options(), data: [5, 3, 8, 1, 6] }
  const chart = circlepack(dataset, { animation })
  await settle(chart)
  const inserted = mutate(dataset)
  chart.update()

  if (animation) {
    expectGrowingInPlace(chart, inserted)
  }
  await expectSameAsNew(chart, { ...options(), data: [...dataset.data] })
}

async function changed(animation, change) {
  const dataset = optionsDataset()
  const chart = circlepack(dataset, { animation })
  await settle(chart)
  const before = state(chart)
  change(dataset)
  chart.update()

  const expected = optionsDataset()
  change(expected)
  await expectSameAsNew(chart, expected)
  // the change shows, so that the comparison above is not of two unchanged charts
  expect(state(chart)).not.toEqual(before)
}

async function resized(animation, size) {
  const dataset = () => ({ ...PLACEMENT(), data: [5, 3, 8, 1, 6, 2, 7, 4] })
  const chart = circlepack(dataset(), { animation })
  await settle(chart)
  chart.resize(size.width, size.height)

  expect({ height: chart.height, width: chart.width }).toEqual(size)
  await expectSameAsNew(chart, dataset(), size)
}

// [name, (animation) => spec], run once without animation and once with it
const CASES = [
  ...Object.entries(OPTIONS).flatMap(([optionsName, options]) =>
    Object.entries(MUTATIONS).map(([mutationName, mutate]) => [
      `equals a new chart after ${mutationName}, with ${optionsName}`,
      (animation) => mutated(animation, options, mutate),
    ])
  ),
  ...Object.entries(CHANGES).map(([name, change]) => [
    `applies ${name} changed in place on one update`,
    (animation) => changed(animation, change),
  ]),
  ...SIZES.map((size) => [
    `equals a new chart of ${size.width}×${size.height} when resized to it`,
    (animation) => resized(animation, size),
  ]),
]

describe('circlepack live update', () => {
  for (const animation of [false, true]) {
    describe(animation ? 'with animation' : 'without animation', () => {
      for (const [name, spec] of CASES) {
        it(name, () => spec(animation))
      }
    })
  }
})
