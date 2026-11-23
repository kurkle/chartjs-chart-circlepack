import { Chart } from 'chart.js'
import { CirclePackController, CirclePackElement } from 'chartjs-chart-circlepack'

Chart.register(CirclePackController, CirclePackElement)

export { Chart, CirclePackController, CirclePackElement }
