// Runs every documentation sample as the site does, and uses each of its controls.
// The site build only base64-encodes a sample's code; nothing evaluates it before a reader's
// browser does, so a broken sample, runtime or control would otherwise pass every check.
import { normalizeCharts } from '@kurkle/astro-chartjs-editor/charts'
import {
  getValueAtPath,
  indexOfValue,
  initialValueFor,
  normalizeChoices,
  setValueAtPath,
} from '@kurkle/astro-chartjs-editor/choices'
import { animator } from 'chart.js'

const files = import.meta.glob('../../src/content/docs/samples/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
})
// the fences the editor's remark plugin turns into live samples
const FENCE = /^```(?:js|javascript)[^\n]*\bchart-editor\b[^\n]*\n([\s\S]*?)^```/gm

const samples = Object.entries(files).flatMap(([file, text]) =>
  [...text.matchAll(FENCE)].map((match, i) => [`${file.split('/').at(-1)} #${i + 1}`, match[1]])
)

// As the editor's client evaluates a sample: the runtime's globals as bare names.
function evaluateSample(code, globals) {
  const module = { exports: {} }
  const names = Object.keys(globals)
  const fn = new Function('module', 'exports', ...names, `${code}\nreturn module.exports;`)
  return fn(module, module.exports, ...names.map((name) => globals[name]))
}

// As the client sizes a chart: the 420 px default height, filled without an aspect ratio.
function render(createChart, config) {
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position: relative; width: 600px; height: 420px'
  const canvas = document.createElement('canvas')
  wrapper.append(canvas)
  document.body.append(wrapper)
  config.options ??= {}
  if (!Object.hasOwn(config.options, 'maintainAspectRatio')) {
    config.options.maintainAspectRatio = false
  }
  return createChart(canvas, config)
}

async function settled(chart) {
  while (animator.running(chart)) {
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }
  return chart.canvas.toDataURL()
}

// Every value of a choice other than the one it starts on, then back to that one, so that each
// step is a change. The starting value is found as the editor finds it, so that an object value
// equal to the one in the code counts as the same.
function choiceSteps(choice, config) {
  const start = indexOfValue(choice.options, initialValueFor(choice, config))
  expect(start, `${choice.path}: the code's value is one of the choices`).not.toBe(-1)
  const values = choice.options.map((option) => option.value)
  return [...values.filter((_value, i) => i !== start), values[start]]
}

// The legend and the version label draw on any chart; only a circle has a radius.
function datasetsWithoutCircles(chart) {
  return chart.data.datasets
    .map((_dataset, i) => i)
    .filter((i) => !chart.getDatasetMeta(i).data.some((element) => element.radius > 0))
}

describe('documentation samples', () => {
  let runtime
  let wrappers = []

  beforeAll(async () => {
    // The site registers the built package; test/setup.js registered the source under the same
    // ids, and Chart.js keeps the first registration, so it is removed first.
    Chart.unregister(
      Chart.registry.getController('circlepack'),
      Chart.registry.getElement('circlepack')
    )
    // the site keeps the default colours that test/setup.js turns off
    Chart.defaults.plugins.colors.enabled = true
    runtime = await import('../../docs/chart-runtime.js')
  })

  afterEach(() => {
    for (const wrapper of wrappers) wrapper.remove()
    wrappers = []
  })

  it('finds the samples', () => {
    expect(samples.length).toBeGreaterThan(0)
  })

  it.each(samples)('%s renders and every control changes it in place', async (_name, code) => {
    const sample = await renderSample(runtime, code)
    wrappers.push(sample.chart.canvas.parentElement)
    expect(datasetsWithoutCircles(sample.chart), 'datasets that draw no circle').toEqual([])

    for (const choice of sample.choices) {
      // the path names an option the sample sets, so the control starts where the code does
      expect(getValueAtPath(sample.config, choice.path), choice.path).not.toBeUndefined()
      for (const value of choiceSteps(choice, sample.config)) {
        await sample.step(`${choice.path} = ${JSON.stringify(value)}`, () => {
          // as the editor applies a selection: written into the live config, then updated
          setValueAtPath(sample.config, choice.path, value)
          sample.chart.update()
        })
      }
    }

    for (const action of sample.actions) {
      await sample.step(`action ${action.name}`, () => action.handler(sample.chart))
    }
  })
})

async function renderSample({ createChart, globals }, code) {
  const sampleExports = evaluateSample(code, globals)
  const entries = normalizeCharts(sampleExports)
  // one chart per sample; a sample exporting `charts` needs this test extended first
  expect(sampleExports.charts, 'a sample exporting `charts`').toBeUndefined()
  const { config } = entries[0]
  const chart = render(createChart, config)
  let before = await settled(chart)

  // Runs one use of a control, and expects the same chart on the sample's own config, drawn
  // differently once the animation has ended.
  async function step(what, act) {
    act()
    const after = await settled(chart)
    expect(Chart.getChart(chart.canvas), `${what}: the same chart`).toBe(chart)
    expect(chart.config._config, `${what}: the sample's own config`).toBe(config)
    expect(after, `${what}: the canvas changed`).not.toEqual(before)
    before = after
  }

  return {
    actions: sampleExports.actions ?? [],
    chart,
    choices: normalizeChoices(sampleExports),
    config,
    step,
  }
}
