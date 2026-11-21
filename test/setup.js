import { Chart, registerables } from 'chart.js'
import { acquireChart, afterEvent, setup, triggerMouseEvent } from 'chartjs-test-utils'

// Every Chart.js component, as a page loading the Chart.js script bundle has.
Chart.register(...registerables)

// Registers the image matchers and the per-spec chart cleanup, and pins the
// backing store to CSS pixels (devicePixelRatio = 1) so the reference PNGs stay
// comparable whatever the host display reports.
setup({ Chart })

// Fixture configs and specs use these as globals, as in the sibling packages.
globalThis.Chart = Chart
globalThis.acquireChart = acquireChart
globalThis.afterEvent = afterEvent
globalThis.triggerMouseEvent = triggerMouseEvent

// Disable colors plugin for tests.
Chart.defaults.plugins.colors.enabled = false
