import '../../dist/index.esm'
import type { CirclePackScriptableContext } from '../../dist/index.esm'

import { Chart } from 'chart.js'

const _chart = new Chart('test', {
  data: {
    datasets: [
      {
        backgroundColor: (ctx: CirclePackScriptableContext) => (ctx.raw === 1 ? 'red' : 'blue'),
        borderColor: 'white',
        borderWidth: 2,
        data: [15, 6, 6, 5, 4, 3, 2, 2],
        key: 'value',
        label: 'Basic circle pack',
        labels: {
          color: 'white',
          display: (ctx) => ctx.parsed.r > 10,
          font: { size: 10 },
          formatter: (ctx) => `${ctx.parsed.v}`,
          padding: 4,
        },
        region: { height: 1, left: 0, top: 0, width: 0.5 },
        spacing: 1,
      },
    ],
  },
  options: { plugins: { legend: { display: false } } },
  type: 'circlepack',
})

const _unknown = new Chart('test', {
  data: {
    datasets: [
      {
        data: [1],
        // @ts-expect-error: not an option of the circlepack dataset
        groups: ['region'],
      },
      {
        data: [1],
        // @ts-expect-error: a region is given in fractions, which are numbers
        region: { left: 'x' },
      },
    ],
  },
  type: 'circlepack',
})
