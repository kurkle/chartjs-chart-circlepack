// A CommonJS consumer: the package's `require` entry registers the chart type when it loads.
const assert = require('node:assert/strict')
const { createCanvas } = require('@napi-rs/canvas')
const { Chart } = require('chart.js')

// side-effects
const { CirclePackController, CirclePackElement } = require('chartjs-chart-circlepack')

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
console.log('node commonjs: 7 circles')
