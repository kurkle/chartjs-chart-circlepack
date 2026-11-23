// The default border is 1 px of the chart's border colour, rgba(0, 0, 0, 0.1),
// painted over the fill inside the edge: too faint for an image fixture to
// notice if it went missing, so this reads the pixels instead. One circle of radius 128 at
// (256, 128): the top row of pixels lies between 127 and 128 px from the
// centre, which is the ring, and the next row is inside it.
function circle(dataset) {
  return window.acquireChart(
    {
      data: {
        datasets: [{ backgroundColor: 'red', data: [1], labels: { display: false }, ...dataset }],
      },
      options: { plugins: { legend: { display: false } } },
      type: 'circlepack',
    },
    { canvas: { height: 256, width: 512 } }
  )
}

const pixel = (chart, x, y) => [...chart.ctx.getImageData(x, y, 1, 1).data]

/** The alphas of the pixels whose centres lie within `distance` of the circle's centre (256, 128). */
function alphasWithin(chart, distance) {
  const { data } = chart.ctx.getImageData(0, 0, 512, 256)
  const alphas = []
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 512; x++) {
      if (Math.hypot(x + 0.5 - 256, y + 0.5 - 128) <= distance) {
        alphas.push(data[(y * 512 + x) * 4 + 3])
      }
    }
  }
  return alphas
}

describe('circlepack element', () => {
  it("draws a 1 px ring of the chart's border colour inside the edge by default", () => {
    const chart = circle()

    expect(Chart.defaults.borderColor).toBe('rgba(0,0,0,0.1)')
    // 10 % black over the red fill, 255 × 0.9 = 229.5, as both browsers round it
    expect(pixel(chart, 256, 0)).toEqual([229, 0, 0, 255])
    expect(pixel(chart, 256, 1)).toEqual([255, 0, 0, 255])
  })

  // Anti-aliasing the fill's edge and the border's inner edge separately on the same circle leaves
  // their partial coverages summing to less than 1: a light, half-transparent seam.
  it('leaves no seam between an opaque border and the fill', () => {
    const chart = circle({ borderColor: 'blue', borderWidth: 4 })

    // everything but the anti-aliased outer edge is opaque
    expect(new Set(alphasWithin(chart, 126.5))).toEqual(new Set([255]))
  })

  it('leaves no seam between an opaque border and a translucent fill', () => {
    const chart = circle({
      backgroundColor: 'rgba(255, 0, 0, 0.5)',
      borderColor: 'blue',
      borderWidth: 4,
    })

    // nothing inside the outer edge is more transparent than the fill
    expect(Math.min(...alphasWithin(chart, 126.5))).toBeGreaterThanOrEqual(127)
  })

  it('paints a translucent border over the fill', () => {
    const chart = circle({ borderColor: 'rgba(0, 0, 255, 0.5)', borderWidth: 4 })

    // the middle of the ring, 2 px inside the edge: half blue over the red fill
    expect(pixel(chart, 256, 2)).toEqual([127, 0, 128, 255])
    expect(pixel(chart, 256, 8)).toEqual([255, 0, 0, 255])
  })

  it('fills up to the edge with a border width of 0', () => {
    const chart = circle({ borderWidth: 0 })

    expect(pixel(chart, 256, 0)).toEqual([255, 0, 0, 255])
    expect(pixel(chart, 256, 1)).toEqual([255, 0, 0, 255])
  })
})
