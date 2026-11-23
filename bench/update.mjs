/**
 * Update cost against data size.
 *
 * The controller lays out the whole dataset, pack and fit, on every update (design D4), whether
 * or not anything changed. This measures what that costs through Chart.js's update path, so that
 * it shows whether a cached pack is ever needed.
 *
 *   npm run bench
 *
 * `--smoke` runs one tiny size once, to prove the script still works against the built package.
 * `npm test` does that; the numbers it prints mean nothing. Every run checks that the chart it
 * timed has one circle per value, each with a positive radius.
 */
import { createCanvas } from '@napi-rs/canvas'
import { Chart } from 'chart.js'

import { CirclePackController, CirclePackElement } from '../dist/chartjs-chart-circlepack.esm.js'
import assert from 'node:assert/strict'

Chart.register(CirclePackController, CirclePackElement)

const smoke = process.argv.includes('--smoke')
const RUNS = smoke ? 1 : 9

const median = (values) => values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)]

function time(runs, fn) {
  const samples = []
  for (let i = 0; i < runs; i++) {
    const start = performance.now()
    fn()
    samples.push(performance.now() - start)
  }
  return median(samples)
}

// values in [1, 98), the same for every run
const values = (count) => Array.from({ length: count }, (_, i) => 1 + ((i * 37) % 97))

function measure(count) {
  const data = values(count)
  const canvas = createCanvas(800, 600)

  const start = performance.now()
  const chart = new Chart(canvas.getContext('2d'), {
    data: { datasets: [{ data }] },
    options: { animation: false, plugins: { legend: false, tooltip: false }, responsive: false },
    type: 'circlepack',
  })
  const create = performance.now() - start

  // an update with nothing changed, as on a resize or a plugin's update
  const idle = time(RUNS, () => chart.update('none'))

  let n = 0
  const edited = time(RUNS, () => {
    data[0] = 1 + (n++ % 90)
    chart.update('none')
  })

  // what was timed must be a laid-out chart; no timing is asserted
  const elements = chart.getDatasetMeta(0).data
  assert.equal(elements.length, count, 'one circle per value')
  for (const { radius } of elements) {
    assert.ok(Number.isFinite(radius) && radius > 0, `circle radius ${radius} is not positive`)
  }
  const circles = elements.length
  chart.destroy()
  return { circles, create, edited, idle }
}

const pad = (value, width) => String(value).padEnd(width)

console.log(`${pad('circles', 9)}${pad('create', 11)}${pad('update, idle', 15)}update, edited`)
for (const count of smoke ? [200] : [1000, 10000, 50000]) {
  const r = measure(count)
  console.log(
    pad(r.circles, 9) +
      pad(`${r.create.toFixed(1)} ms`, 11) +
      pad(`${r.idle.toFixed(1)} ms`, 15) +
      `${r.edited.toFixed(1)} ms`
  )
}
