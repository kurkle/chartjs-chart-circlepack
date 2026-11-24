# chartjs-chart-circlepack

[![npm](https://img.shields.io/npm/v/chartjs-chart-circlepack.svg)](https://www.npmjs.com/package/chartjs-chart-circlepack)
![GitHub](https://img.shields.io/github/license/kurkle/chartjs-chart-circlepack.svg)

A [Chart.js](https://www.chartjs.org/) chart type for circle packing: each value is a circle whose area is proportional to the value, and the circles touch without overlapping in one cluster fitted to the chart area.

Documentation and live samples: https://chartjs-chart-circlepack.pages.dev

## Installation

```bash
npm install chartjs-chart-circlepack
```

Chart.js 4.0 or newer is required.

## Usage

With a bundler, register the controller and the element:

```js
import { Chart, registerables } from 'chart.js'
import { CirclePackController, CirclePackElement } from 'chartjs-chart-circlepack'

Chart.register(...registerables, CirclePackController, CirclePackElement)

new Chart(document.getElementById('chart'), {
  type: 'circlepack',
  data: {
    labels: ['Sleep', 'Work', 'Commute'],
    datasets: [{ label: 'Hours in a week', data: [56, 40, 8] }],
  },
})
```

The script bundle registers the chart type when it loads:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-chart-circlepack"></script>
```

Rows can be numbers, or objects read through `key`. Labels come from `data.labels` and are drawn where they fit; `spacing` puts a gap between the circles, and `region` lays a dataset out in a part of the chart area. The [usage page](https://chartjs-chart-circlepack.pages.dev/usage/) lists every option.

## License

`chartjs-chart-circlepack` is available under the [MIT license](LICENSE).
