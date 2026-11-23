import { Chart } from 'chart.js'

import {
  CirclePackController,
  CirclePackElement,
} from '../../../dist/chartjs-chart-circlepack.esm.js'

describe('browser esm integration', () => {
  const getRegisteredController = () => Chart.registry.controllers.items.circlepack
  const getRegisteredElement = () => Chart.registry.elements.items.circlepack
  let canvas

  afterEach(() => {
    canvas?.remove()
    canvas = null
    Chart.unregister(CirclePackController, CirclePackElement)
  })

  it('requires explicit registration for the built esm bundle', () => {
    expect(getRegisteredController()).toBeUndefined()
    expect(getRegisteredElement()).toBeUndefined()
  })

  it('imports the built esm bundle and creates a circlepack chart after registration', () => {
    Chart.register(CirclePackController, CirclePackElement)

    expect(getRegisteredController()).toBe(CirclePackController)
    expect(getRegisteredElement()).toBe(CirclePackElement)

    canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 150
    document.body.appendChild(canvas)

    const chart = new Chart(canvas.getContext('2d'), {
      data: { datasets: [{ data: [6, 6, 4, 3, 2, 2, 1] }] },
      options: { animation: false },
      type: 'circlepack',
    })
    const meta = chart.getDatasetMeta(0)

    expect(meta.controller).toBeInstanceOf(CirclePackController)
    expect(meta.data).toHaveLength(7)
    for (const element of meta.data) {
      expect(element).toBeInstanceOf(CirclePackElement)
      expect(element.radius).toBeGreaterThan(0)
    }

    chart.destroy()
  })
})
