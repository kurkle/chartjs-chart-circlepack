/**
 * Renders the picture on the documentation's front page, docs/public/circlepack.png, from the
 * built package in a real browser.
 *
 * The chart is the Basic sample with fixed values: 20 circles, coloured by value, with the default
 * border and labels. Run it after a change to how a circle is drawn, then look at the picture.
 *
 *   npm run docs:picture
 */

import { chromium } from 'playwright'
import sharp from 'sharp'

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const resolve = (path) => fileURLToPath(new URL(path, import.meta.url))
const output = resolve('../docs/public/circlepack.png')

// CSS pixels; the page is rendered at twice that, so that the picture is sharp on a dense screen
const WIDTH = 518
const HEIGHT = 392

const values = [98, 92, 88, 88, 67, 64, 58, 48, 48, 44, 44, 41, 38, 24, 24, 22, 19, 16, 7, 3]

// the canvas is rasterized by the CPU, as in the fixture suite
const browser = await chromium.launch({ args: ['--disable-accelerated-2d-canvas'] })
try {
  const page = await browser.newPage({
    deviceScaleFactor: 2,
    viewport: { height: HEIGHT, width: WIDTH },
  })
  await page.setContent(
    `<body style="margin:0"><div style="width:${WIDTH}px;height:${HEIGHT}px"><canvas></canvas></div></body>`
  )
  // the script bundles, as a page that loads them with <script> tags gets them
  await page.addScriptTag({
    path: fileURLToPath(new URL('chart.umd.min.js', import.meta.resolve('chart.js'))),
  })
  await page.addScriptTag({ path: resolve('../dist/chartjs-chart-circlepack.min.js') })

  const dataUrl = await page.evaluate((data) => {
    const { Chart } = globalThis
    const chart = new Chart(document.querySelector('canvas'), {
      data: {
        datasets: [
          {
            // as the Basic sample colours a circle
            backgroundColor: (ctx) =>
              Chart.helpers
                .color('rgb(54, 162, 235)')
                .alpha(0.2 + (ctx.type === 'data' ? ctx.raw : 50) / 125)
                .rgbString(),
            data,
          },
        ],
      },
      options: {
        animation: false,
        maintainAspectRatio: false,
        plugins: { legend: false, tooltip: false },
      },
      type: 'circlepack',
    })
    return chart.canvas.toDataURL('image/png')
  }, values)

  const png = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64')
  // a palette of 256 colours keeps the file small; the chart has far fewer distinct colours
  await writeFile(output, await sharp(png).png({ compressionLevel: 9, palette: true }).toBuffer())
  console.log(`wrote ${output}`)
} finally {
  await browser.close()
}
