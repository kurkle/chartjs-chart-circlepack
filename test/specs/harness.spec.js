import { createCanvas } from 'chartjs-test-utils'

// Proves the browser harness with a built-in chart, so that it does not depend
// on this package's chart type: test/setup.js pins the device pixel ratio, the
// image matcher compares pixels, and both browsers rasterize the canvas alike.
//
// The chart draws no text and nothing antialiased: scales, legend and title are
// hidden, and the one bar spans the whole width from the chart area's bottom to
// exactly half its height, so its edges lie on pixel boundaries. The expected
// image is drawn in the test rather than stored, so the result does not depend
// on the platform's font rendering.
const SIZE = 512
const RED = 'rgb(255, 0, 0)'

function halfHeightBar() {
  return window.acquireChart({
    data: {
      datasets: [
        {
          backgroundColor: RED,
          barPercentage: 1,
          borderWidth: 0,
          categoryPercentage: 1,
          data: [5],
          inflateAmount: 0,
        },
      ],
      labels: ['a'],
    },
    options: {
      animation: false,
      plugins: { legend: { display: false }, title: { display: false } },
      scales: {
        x: { display: false },
        y: { display: false, max: 10, min: 0 },
      },
    },
    type: 'bar',
  })
}

function expectedImage(top) {
  const ctx = createCanvas(SIZE, SIZE).getContext('2d')
  ctx.fillStyle = RED
  ctx.fillRect(0, top, SIZE, SIZE - top)
  return ctx.getImageData(0, 0, SIZE, SIZE)
}

describe('browser harness', () => {
  it('renders a built-in chart at device pixel ratio 1', () => {
    const chart = halfHeightBar()

    // Playwright's headless browsers already report a ratio of 1, so this does
    // not prove the pinning on this host. It guards against setup() losing it:
    // on a display with a higher ratio every reference image would be compared
    // at another size.
    expect(chart.currentDevicePixelRatio).toBe(1)
    expect(chart).toBeChartOfSize({ dh: SIZE, dw: SIZE, rh: SIZE, rw: SIZE })
    expect(chart).toEqualImageData(expectedImage(SIZE / 2), { threshold: 0, tolerance: 0 })
  })

  it('tells a different image apart', () => {
    const chart = halfHeightBar()

    expect(chart).not.toEqualImageData(expectedImage(SIZE / 2 + 1), {
      threshold: 0,
      tolerance: 0,
    })
  })
})
