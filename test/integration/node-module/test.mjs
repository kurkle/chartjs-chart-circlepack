// An ES module consumer: the package's `import` entry registers nothing, so the consumer does.
import { createCanvas } from '@napi-rs/canvas'
import { Chart } from 'chart.js'
import { CirclePackController, CirclePackElement } from 'chartjs-chart-circlepack'

import assert from 'node:assert/strict'

assert.equal(Chart.registry.controllers.items.circlepack, undefined, 'nothing registered on import')
Chart.register(CirclePackController, CirclePackElement)

const canvas = createCanvas(300, 320)
const chart = new Chart(canvas.getContext('2d'), {
  data: { datasets: [{ data: [6, 6, 4, 3, 2, 2, 1] }] },
  options: { animation: false },
  type: 'circlepack',
})
const meta = chart.getDatasetMeta(0)

assert.ok(meta.controller instanceof CirclePackController, 'the controller is the exported one')
assert.equal(meta.data.length, 7)
for (const element of meta.data) {
  assert.ok(element instanceof CirclePackElement, 'each element is the exported one')
  assert.ok(element.radius > 0, `circle radius ${element.radius} is not positive`)
}
chart.destroy()
console.log('node module: 7 circles')
