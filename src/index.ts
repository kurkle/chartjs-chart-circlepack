import { Chart } from 'chart.js'

import CirclePackController from './controller.js'
import CirclePackElement from './element.js'

// The script bundle registers on load; the module build (index.esm.ts) leaves it to the user.
Chart.register(CirclePackController, CirclePackElement)

export type { CirclePackProps } from './element.js'
export type {
  CirclePackControllerDatasetOptions,
  CirclePackDataPoint,
  CirclePackLabelsOptions,
  CirclePackOptions,
  CirclePackRegion,
  CirclePackScriptableContext,
} from './types.js'

export { CirclePackController, CirclePackElement }
