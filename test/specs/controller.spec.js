// The classes are taken from the registry, where test/setup.js put them by
// importing the script entry, so that a missing registration is what fails.
const SIZE = { height: 256, width: 512 }

function circlepack(dataset, { canvas = SIZE, labels, options } = {}) {
  return window.acquireChart(
    {
      data: { datasets: [dataset], labels },
      options: { plugins: { legend: { display: false } }, ...options },
      type: 'circlepack',
    },
    { canvas }
  )
}

const radii = (chart) => chart.getDatasetMeta(0).data.map((element) => element.radius)
// getProps returns the element itself when nothing is animating
const final = (element) => {
  const { radius, x, y } = element.getProps(['x', 'y', 'radius'], true)
  return { radius, x, y }
}

describe('circlepack controller', () => {
  it('is registered by the script entry', () => {
    const meta = circlepack({ data: [1] }).getDatasetMeta(0)

    expect(meta.controller).toBeInstanceOf(Chart.registry.getController('circlepack'))
    expect(meta.data[0]).toBeInstanceOf(Chart.registry.getElement('circlepack'))
  })

  it('registers nothing from the module entry', async () => {
    const Controller = Chart.registry.getController('circlepack')
    const Element = Chart.registry.getElement('circlepack')
    Chart.unregister(Controller, Element)
    try {
      // not imported before this point, so importing it runs it
      const entry = await import('../../src/index.esm')

      expect(() => Chart.registry.getController('circlepack')).toThrow()
      expect(entry.CirclePackController).toBe(Controller)
      expect(entry.CirclePackElement).toBe(Element)
    } finally {
      Chart.register(Controller, Element)
    }
  })

  it('gives row, node and element one index, drawn or not', () => {
    const data = [1, 9, 0, 4]
    const seen = []
    const chart = circlepack({
      backgroundColor(ctx) {
        seen[ctx.dataIndex] = [ctx.raw, ctx.parsed.v]
        return 'red'
      },
      data,
    })
    const [one, nine, zero, four] = radii(chart)

    expect(seen).toEqual(data.map((value) => [value, value]))
    expect(nine / one).toBeCloseTo(3)
    expect(four / one).toBeCloseTo(2)
    expect(zero).toBe(0)
  })

  it('passes the row index to event handlers', async () => {
    let clicked
    const chart = circlepack(
      { data: [1, 0, 9] },
      { options: { onClick: (_event, items) => (clicked = items.map((item) => item.index)) } }
    )
    await window.triggerMouseEvent(chart, 'click', chart.getDatasetMeta(0).data[2])

    expect(clicked).toEqual([2])
  })

  it('formats the tooltip as the default label does', () => {
    const chart = circlepack(
      { data: [1234.5, 2], label: 'set' },
      { labels: ['alpha'], options: { locale: 'de-DE' } }
    )
    const meta = chart.getDatasetMeta(0)
    const { formatter } = Chart.registry.getElement('circlepack').defaults.labels
    chart.tooltip.setActiveElements([{ datasetIndex: 0, index: 0 }], meta.data[0])

    expect(formatter(meta.data[0].$context)).toEqual(['alpha', '1.234,5'])
    expect(chart.tooltip.title).toEqual(['alpha'])
    expect(chart.tooltip.body[0].lines).toEqual(['set: 1.234,5'])
    expect(meta.controller.getLabelAndValue(1)).toEqual({ label: '', value: '2' })
  })

  it('titles the tooltip with the lines of the row label the circle shows', () => {
    // the circle shows '0' and the value; the value alone for '', null and a missing label
    const labels = [0, '', null, ['x', 'y']]
    const chart = circlepack({ data: [5, 4, 3, 2, 1] }, { labels })
    const titles = chart.getDatasetMeta(0).data.map((element, index) => {
      chart.tooltip.setActiveElements([{ datasetIndex: 0, index }], element)
      return chart.tooltip.title
    })

    expect(titles).toEqual([['0'], [], [], ['x', 'y'], []])
  })

  it('reads objects through key, by default value', () => {
    const byDefault = circlepack({ data: [{ value: 4 }, { value: 1 }, null] })
    const byPath = circlepack({ data: [{ p: { n: 4 } }, { p: { n: 1 } }, {}], key: 'p.n' })
    // Chart.js resolves the keys x and y without a guard for null
    const byX = circlepack({ data: [{ x: 4 }, { x: 1 }, null], key: 'x' })

    for (const chart of [byDefault, byPath, byX]) {
      const [four, one, missing] = radii(chart)
      expect(four / one).toBeCloseTo(2)
      expect(missing).toBe(0)
      expect(chart.getDatasetMeta(0)._parsed[2].v).toBeNaN()
    }
  })

  it('draws no circle for a value it cannot draw, and nothing for no data', () => {
    const [four, ...rest] = radii(circlepack({ data: [4, -1, '9', Infinity, Number.NaN, 0, 1] }))
    const empty = circlepack({ backgroundColor: 'red', data: [] })

    expect(four).toBe(128)
    expect(rest).toEqual([0, 0, 0, 0, 0, 64])
    expect(empty.getDatasetMeta(0).data).toEqual([])
    expect(empty.ctx.getImageData(256, 128, 1, 1).data[3]).toBe(0)
  })

  it('puts two equal values one above the other in a tall area', () => {
    const [top, bottom] = circlepack({ data: [1, 1] }, { canvas: { height: 512, width: 256 } })
      .getDatasetMeta(0)
      .data.map(final)

    expect([top, bottom]).toEqual([
      { radius: 128, x: 128, y: 128 },
      { radius: 128, x: 128, y: 384 },
    ])
  })

  it('insets every drawn radius by spacing, down to 0', () => {
    // [4, 1] fits 512×256 with radii 128 and 64
    expect(radii(circlepack({ data: [4, 1] }))).toEqual([128, 64])
    expect(radii(circlepack({ data: [4, 1], spacing: 2 }))).toEqual([126, 62])
    expect(radii(circlepack({ data: [4, 1], spacing: 70 }))).toEqual([58, 0])
  })

  it('resolves dataset labels options per circle, the formatter as it is', () => {
    const formatter = () => 'text'
    const color = (ctx) => (ctx.dataIndex ? 'blue' : 'green')
    const chart = circlepack({ data: [1, 1], labels: { color, formatter } })
    const [first, second] = chart.getDatasetMeta(0).data.map((element) => element.options.labels)

    expect([first.color, second.color]).toEqual(['green', 'blue'])
    expect(first.formatter).toBe(formatter)
    expect(first.padding).toBe(3)
  })

  it('fits the cluster to its region of the chart area', () => {
    // the area is 472×216 at (40, 40), so its lower right quarter is 236×108 at (276, 148)
    const chart = circlepack(
      { data: [1], region: { left: 0.5, top: 0.5 } },
      { options: { layout: { padding: { left: 40, top: 40 } } } }
    )

    expect(final(chart.getDatasetMeta(0).data[0])).toEqual({ radius: 54, x: 394, y: 202 })
  })

  it('draws nothing outside the chart area', () => {
    // the area is 472×216 at (40, 40): radius 108, and 148 drawn
    const chart = circlepack(
      { backgroundColor: 'red', data: [1], spacing: -40 },
      { options: { layout: { padding: { left: 40, top: 40 } } } }
    )
    const alpha = (x, y) => chart.ctx.getImageData(x, y, 1, 1).data[3]

    expect(final(chart.getDatasetMeta(0).data[0])).toEqual({ radius: 148, x: 276, y: 148 })
    expect(alpha(276, 60)).toBe(255)
    expect(alpha(276, 20)).toBe(0)
  })

  it('starts the first render from radius 0 at the final centres', () => {
    const chart = circlepack({ data: [4, 1] }, { options: { animation: { duration: 60000 } } })

    for (const element of chart.getDatasetMeta(0).data) {
      const { radius, x, y } = final(element)
      expect(radius).toBeGreaterThan(0)
      expect(element).toMatchObject({ radius: 0, x, y })
    }
  })

  it('grows inserted rows in place and moves the others', () => {
    const chart = circlepack({ data: [4, 1] })
    const meta = chart.getDatasetMeta(0)
    const [before] = radii(chart)
    chart.options.animation = { duration: 60000 }
    const { data } = chart.data.datasets[0]
    data.unshift(2)
    data.push(3)
    chart.update()

    for (const element of [meta.data[0], meta.data[3]]) {
      const { radius, x, y } = final(element)
      expect(radius).toBeGreaterThan(0)
      expect(element).toMatchObject({ radius: 0, x, y })
    }
    expect(meta.data[1].radius).toBe(before)
    expect(final(meta.data[1]).radius).toBeLessThan(before)
    // each inserted row has its own node, laid out where a new chart puts it
    const fresh = circlepack({ data: [...data] }).getDatasetMeta(0).data
    expect(meta.data.map(final)).toEqual(fresh.map(final))
  })

  it('lays out the remaining rows when rows are removed', () => {
    const chart = circlepack({ data: [4, 2, 1, 3] })
    const { data } = chart.data.datasets[0]
    data.splice(1, 1)
    data.pop()
    chart.update()

    expect(chart.getDatasetMeta(0).data.map(final)).toEqual(
      circlepack({ data: [4, 1] })
        .getDatasetMeta(0)
        .data.map(final)
    )
  })

  it('moves the circles from their old places when a value changes', () => {
    const chart = circlepack({ data: [4, 1] })
    const before = chart.getDatasetMeta(0).data.map(final)
    chart.options.animation = { duration: 60000 }
    chart.data.datasets[0].data[1] = 4
    chart.update()
    const elements = chart.getDatasetMeta(0).data

    expect(elements.map(({ radius, x, y }) => ({ radius, x, y }))).toEqual(before)
    expect(elements.map(final)).toEqual(
      circlepack({ data: [4, 4] })
        .getDatasetMeta(0)
        .data.map(final)
    )
  })

  it('removes the circle of a row whose value can no longer be drawn', () => {
    const chart = circlepack({ data: [4, 1] })
    chart.data.datasets[0].data[1] = 'x'
    chart.update()

    expect(radii(chart)[1]).toBe(0)
    expect(chart.getDatasetMeta(0).data.map(final)).toEqual(
      circlepack({ data: [4, 'x'] })
        .getDatasetMeta(0)
        .data.map(final)
    )
  })

  it('sets the radius to 0 in reset mode only', () => {
    const chart = circlepack({ data: [4, 1] })
    for (const mode of ['none', 'resize', 'show', 'hide', 'active', 'default']) {
      chart.update(mode)
      expect({ mode, radii: radii(chart) }).toEqual({ mode, radii: [128, 64] })
    }
  })

  it('links no scale, even one that is configured', () => {
    const chart = circlepack({ data: [4, 1] }, { options: { scales: { x: { type: 'linear' } } } })

    expect(chart.scales.x.getMatchingVisibleMetas()).toEqual([])
  })

  it('does not index option arrays by row', () => {
    const colors = ['red', 'blue']
    const chart = circlepack({ backgroundColor: colors, data: [1, 1] })

    expect(chart.getDatasetMeta(0).data[1].options.backgroundColor).toEqual(colors)
  })
})
