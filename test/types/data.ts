import type { ChartData } from 'chart.js'

import '../../dist/index.esm'

const _numbers: ChartData<'circlepack'> = {
  datasets: [{ data: [15, 6, 6, 5, 4, 3, 2, 2] }],
  labels: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
}

// rows of any shape are read through `key`
const _objects: ChartData<'circlepack', { name: string; size: number }[]> = {
  datasets: [
    {
      data: [
        { name: 'a', size: 4 },
        { name: 'b', size: 1 },
      ],
      key: 'size',
    },
  ],
}
