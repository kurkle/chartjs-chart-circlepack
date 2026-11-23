// A page that loads Chart.js and then the script bundle with script tags: no import and no
// register call, so the bundle must register the chart type when it loads. Nothing is imported
// here, so the only Chart is the one the UMD build puts on window.

function load(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = resolve
    script.onerror = () => reject(new Error(`could not load ${src}`))
    document.head.appendChild(script)
  })
}

describe('browser script bundle integration', () => {
  it('creates a circlepack chart with no registration', async () => {
    await load('/node_modules/chart.js/dist/chart.umd.min.js')
    await load('/dist/chartjs-chart-circlepack.min.js')

    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 150
    document.body.appendChild(canvas)
    const chart = new window.Chart(canvas.getContext('2d'), {
      data: { datasets: [{ data: [6, 6, 4, 3, 2, 2, 1] }] },
      options: { animation: false },
      type: 'circlepack',
    })
    const meta = chart.getDatasetMeta(0)
    // the global the bundle defines: rollup names it after the package
    const { CirclePackController, CirclePackElement } = window['chartjs-chart-circlepack']

    expect(meta.controller).toBeInstanceOf(CirclePackController)
    expect(meta.data).toHaveLength(7)
    for (const element of meta.data) {
      expect(element).toBeInstanceOf(CirclePackElement)
      expect(element.radius).toBeGreaterThan(0)
    }
    chart.destroy()
    canvas.remove()
  })
})
