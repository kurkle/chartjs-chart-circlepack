// The default border is 1 px of the chart's border colour, rgba(0, 0, 0, 0.1),
// drawn inside the edge: too faint for an image fixture to notice if it went
// missing, so this reads the pixels instead. One circle of radius 128 at
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

describe('circlepack element', () => {
  it("draws a 1 px ring of the chart's border colour inside the edge by default", () => {
    const chart = circle()

    expect(Chart.defaults.borderColor).toBe('rgba(0,0,0,0.1)')
    // alpha 0.1 of 255, as both browsers round it
    expect(pixel(chart, 256, 0)).toEqual([0, 0, 0, 26])
    expect(pixel(chart, 256, 1)).toEqual([255, 0, 0, 255])
  })

  it('fills up to the edge with a border width of 0', () => {
    const chart = circle({ borderWidth: 0 })

    expect(pixel(chart, 256, 0)).toEqual([255, 0, 0, 255])
    expect(pixel(chart, 256, 1)).toEqual([255, 0, 0, 255])
  })
})
