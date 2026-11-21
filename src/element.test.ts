import type { ChartConfiguration, ScriptableContext } from 'chart.js'
import type { CirclePackDataPoint, CirclePackOptions, CirclePackScriptableContext } from './types'

import CirclePackElement from './element'

const { drawLabel, log } = vi.hoisted(() => {
  const log: string[] = []
  return { drawLabel: vi.fn((..._args: unknown[]) => log.push('label') > 0), log }
})

vi.mock('./label', () => ({ drawLabel }))

const X = 100
const Y = 50
const TAU = 2 * Math.PI

/** A band of radii around the centre painted in one colour. */
type Band = { color: unknown; from: number; to: number }
type Paint = Band & { x: number; y: number }
type Arc = { r: number; x: number; y: number }

/**
 * A context that turns what is filled into painted bands of radii. Paths may only hold full,
 * concentric circles, as a circle's are, and an arc with a negative radius throws, as on a real
 * canvas. A fill paints where the number of circles around a radius is non-zero, or odd for
 * 'evenodd' (the element draws every arc in the same direction). Every paint and every label is
 * logged in order, so that what lies on top is known.
 */
function mockContext() {
  const paints: Paint[] = []
  let path: Arc[] = []
  const ctx = {
    arc(x: number, y: number, r: number, start: number, end: number) {
      if (r < 0) {
        throw new RangeError(`IndexSizeError: negative radius ${r}`)
      }
      if (Math.abs(end - start) < TAU - 1e-12) {
        throw new Error('the mock supports full circles only')
      }
      path.push({ r, x, y })
    },
    beginPath() {
      path = []
    },
    fill(rule: CanvasFillRule = 'nonzero') {
      const { x, y } = concentric(path)
      const radii = [0, ...new Set(path.map((arc) => arc.r))].sort((a, b) => a - b)
      for (let i = 1; i < radii.length; i++) {
        const mid = (radii[i - 1] + radii[i]) / 2
        const around = path.filter((arc) => arc.r > mid).length
        if (rule === 'evenodd' ? around % 2 !== 0 : around !== 0) {
          paint({ color: ctx.fillStyle, from: radii[i - 1], to: radii[i], x, y })
        }
      }
    },
    fillStyle: '#000000' as unknown,
  }
  function paint(band: Paint) {
    if (band.to > band.from) {
      paints.push(band)
      log.push('paint')
    }
  }
  return { ctx: ctx as unknown as CanvasRenderingContext2D, paints }
}

function concentric(path: readonly Arc[]): { x: number; y: number } {
  const [{ x, y }] = path
  if (path.some((arc) => arc.x !== x || arc.y !== y)) {
    throw new Error('the mock supports concentric circles only')
  }
  return { x, y }
}

/** The colour seen at each radius: the last paint covering it, merged into bands. */
function visible(paints: readonly Paint[]): Band[] {
  const radii = [...new Set(paints.flatMap((p) => [p.from, p.to]))].sort((a, b) => a - b)
  const bands: Band[] = []
  for (let i = 1; i < radii.length; i++) {
    const mid = (radii[i - 1] + radii[i]) / 2
    const top = paints.filter((p) => p.from < mid && mid < p.to).at(-1)
    const last = bands.at(-1)
    if (!top) {
      continue
    }
    if (last && last.color === top.color && last.to === radii[i - 1]) {
      last.to = radii[i]
    } else {
      bands.push({ color: top.color, from: radii[i - 1], to: radii[i] })
    }
  }
  return bands
}

const CONTEXT = { dataIndex: 0, type: 'data' } as unknown as CirclePackScriptableContext

function options(overrides: Partial<CirclePackOptions> = {}): CirclePackOptions {
  return {
    backgroundColor: 'background',
    borderColor: 'border',
    borderWidth: 0,
    labels: {
      color: 'label',
      display: true,
      font: { family: 'f', lineHeight: 1.5, size: 10 },
      formatter: () => 'text',
      padding: 5,
    },
    ...overrides,
  }
}

function element(radius: number, overrides: Partial<CirclePackOptions> = {}): CirclePackElement {
  const el = new CirclePackElement()
  Object.assign(el, { $context: CONTEXT, options: options(overrides), radius, x: X, y: Y })
  return el
}

function draw(el: CirclePackElement) {
  const { ctx, paints } = mockContext()
  el.draw(ctx)
  return { ctx, paints }
}

beforeEach(() => {
  drawLabel.mockClear()
  log.length = 0
})

describe('CirclePackElement', () => {
  describe('draw', () => {
    it('fills the circle at its centre', () => {
      const { paints } = draw(element(20))
      expect(paints.every((p) => p.x === X && p.y === Y)).toBe(true)
      expect(visible(paints)).toEqual([{ color: 'background', from: 0, to: 20 }])
    })

    it('draws the border inside the edge, not over the fill', () => {
      const { paints } = draw(element(20, { borderWidth: 4 }))
      expect(paints.every((p) => p.x === X && p.y === Y)).toBe(true)
      // nothing is painted twice, so that translucent colours do not mix
      expect(paints.map((p) => p.to - p.from).reduce((a, b) => a + b)).toBe(20)
      expect(visible(paints)).toEqual([
        { color: 'background', from: 0, to: 16 },
        { color: 'border', from: 16, to: 20 },
      ])
    })

    it.each([20, 30])('clamps a border of %d to the radius', (borderWidth) => {
      const { paints } = draw(element(20, { borderWidth }))
      expect(visible(paints)).toEqual([{ color: 'border', from: 0, to: 20 }])
    })

    it.each([[undefined], [Number.NaN], ['4'], [-2]])(
      'counts a border width of %j as 0',
      (borderWidth) => {
        const { paints } = draw(element(20, { borderWidth: borderWidth as number }))
        expect(visible(paints)).toEqual([{ color: 'background', from: 0, to: 20 }])
      }
    )

    it.each([0, -3])('draws nothing at radius %d', (radius) => {
      const { paints } = draw(element(radius, { borderWidth: 1 }))
      expect(paints).toEqual([])
      expect(drawLabel).not.toHaveBeenCalled()
    })
  })

  describe('label', () => {
    it('is drawn over the circle through drawLabel, inside the border and the padding', () => {
      const { ctx } = draw(element(20, { borderWidth: 2 }))
      // 20 − borderWidth 2 − padding 5
      expect(drawLabel).toHaveBeenCalledExactlyOnceWith(
        ctx,
        ['text'],
        X,
        Y,
        13,
        expect.objectContaining({ lineHeight: 15, string: 'normal 10px f' }),
        'label'
      )
      expect(log.at(-1)).toBe('label')
      expect(log).toContain('paint')
    })

    it('counts a border width that is not a number as 0', () => {
      draw(element(20, { borderWidth: '4' as unknown as number }))
      expect(drawLabel.mock.calls[0][4]).toBe(15)
    })

    it('draws each entry of an array as a line', () => {
      const labels = { ...options().labels, formatter: () => ['one', 'two'] }
      draw(element(20, { labels }))
      expect(drawLabel.mock.calls[0][1]).toEqual(['one', 'two'])
    })

    it.each([[null], [undefined], ['']])(
      'passes no lines, so that nothing is drawn, when the formatter returns %j',
      (result) => {
        const labels = { ...options().labels, formatter: () => result as unknown as string }
        draw(element(20, { labels }))
        expect(drawLabel.mock.calls[0][1]).toEqual([])
      }
    )

    it('draws the entries of an array as text, whatever they are', () => {
      const labels = { ...options().labels, formatter: () => [null, 'x', 0] as unknown as string[] }
      draw(element(20, { labels }))
      expect(drawLabel.mock.calls[0][1]).toEqual(['null', 'x', '0'])
    })

    it("calls the formatter with the element's context", () => {
      const formatter = vi.fn(() => 'text')
      draw(element(20, { labels: { ...options().labels, formatter } }))
      expect(formatter).toHaveBeenCalledWith(CONTEXT)
    })

    it('is not drawn when labels.display is false', () => {
      const { paints } = draw(element(20, { labels: { ...options().labels, display: false } }))
      expect(drawLabel).not.toHaveBeenCalled()
      expect(visible(paints)).toEqual([{ color: 'background', from: 0, to: 20 }])
    })
  })

  describe('hit testing', () => {
    // radius 5 at (100, 50): (103, 54) is exactly on the edge
    it.each([
      [X, Y, true],
      [X + 3, Y + 4, true],
      [X - 3, Y - 4, true],
      [X + 3, Y + 4.001, false],
      [X + 3, Y + 4.00001, false],
      [X + 4.9, Y + 4.9, false],
      [X - 4.9, Y - 4.9, false],
    ])('inRange(%d, %d) is %s', (x, y, expected) => {
      expect(element(5).inRange(x, y)).toBe(expected)
    })

    it.each([
      [X + 5, true],
      [X - 5, true],
      [X + 5.001, false],
      [X + 5.00001, false],
      [X - 5.001, false],
      [X - 5.00001, false],
    ])('inXRange(%d) is %s', (x, expected) => {
      expect(element(5).inXRange(x)).toBe(expected)
    })

    it.each([
      [Y + 5, true],
      [Y - 5, true],
      [Y + 5.001, false],
      [Y + 5.00001, false],
      [Y - 5.001, false],
      [Y - 5.00001, false],
    ])('inYRange(%d) is %s', (y, expected) => {
      expect(element(5).inYRange(y)).toBe(expected)
    })

    it.each([0, -3])('hits nothing at radius %d, not even the centre', (radius) => {
      const el = element(radius)
      expect([el.inRange(X, Y), el.inXRange(X), el.inYRange(Y)]).toEqual([false, false, false])
    })

    it('uses the final position when asked', () => {
      const el = element(5)
      const to = (value: number) => ({ _to: value, active: () => true })
      Object.assign(el, { $animations: { radius: to(10), x: to(300), y: to(200) } })
      expect([el.inRange(309, 200, true), el.inRange(309, 200)]).toEqual([true, false])
      expect([el.inRange(X, Y, true), el.inRange(X, Y)]).toEqual([false, true])
      expect([el.inXRange(309, true), el.inXRange(309)]).toEqual([true, false])
      expect([el.inYRange(209, true), el.inYRange(209)]).toEqual([true, false])
      expect(el.getCenterPoint(true)).toEqual({ x: 300, y: 200 })
      expect(el.tooltipPosition(true)).toEqual({ x: 300, y: 200 })
    })

    it('has its centre as centre point and tooltip position', () => {
      const el = element(5)
      expect(el.getCenterPoint()).toEqual({ x: X, y: Y })
      expect(el.tooltipPosition(false)).toEqual({ x: X, y: Y })
    })
  })

  describe('definition', () => {
    it('is registered as circlepack with its defaults and routes', () => {
      expect(CirclePackElement.id).toBe('circlepack')
      const { formatter, ...labels } = CirclePackElement.defaults.labels
      expect(CirclePackElement.defaults.borderWidth).toBe(1)
      expect(labels).toEqual({ color: 'black', display: true, font: {}, padding: 3 })
      expect(formatter).toBeTypeOf('function')
      expect(CirclePackElement.defaultRoutes).toEqual({
        backgroundColor: 'backgroundColor',
        borderColor: 'borderColor',
      })
    })

    it('makes every label option but the formatter scriptable', () => {
      const { labels } = CirclePackElement.descriptors
      expect(labels._fallback).toBe(true)
      expect(
        ['color', 'display', 'font', 'formatter', 'padding'].filter(labels._scriptable)
      ).toEqual(['color', 'display', 'font', 'padding'])
    })

    it('starts without a position', () => {
      const el = new CirclePackElement()
      expect([el.x, el.y, el.radius]).toEqual([undefined, undefined, undefined])
    })
  })

  describe('default formatter', () => {
    const { formatter } = CirclePackElement.defaults.labels
    // a locale other than the runtime's, so that the value is shown in the chart's locale
    const contextOf = (labels: unknown[] | undefined, raw: unknown) =>
      ({
        chart: { data: { labels }, options: { locale: 'de-DE' } },
        dataIndex: 1,
        parsed: { r: 1, v: 1234.5, x: 0, y: 0 },
        raw,
      }) as unknown as CirclePackScriptableContext

    it('gives the row label and, on a second line, the value in the chart locale', () => {
      expect(formatter(contextOf(['a', 'Apples'], 1234.5))).toEqual(['Apples', '1.234,5'])
    })

    it('gives a numeric row label, 0 included, as text', () => {
      expect(formatter(contextOf(['a', 0], 1234.5))).toEqual(['0', '1.234,5'])
    })

    it.each([
      ['no labels', undefined],
      ['no label for the row', ['a']],
      ['a null label', ['a', null]],
      ['an empty label', ['a', '']],
      ['an empty array as label', ['a', []]],
    ])('gives the value alone with %s', (_, labels) => {
      expect(formatter(contextOf(labels, 1234.5))).toBe('1.234,5')
    })

    it('gives each entry of an array label its own line, then the value', () => {
      expect(formatter(contextOf(['a', ['Green', 'apples']], 1234.5))).toEqual([
        'Green',
        'apples',
        '1.234,5',
      ])
    })

    it('ignores a name the row has of its own', () => {
      expect(formatter(contextOf(undefined, { name: 'Apples', value: 1234.5 }))).toBe('1.234,5')
    })
  })

  describe('types', () => {
    it('registers the chart type with its options', () => {
      const config = {
        data: {
          datasets: [
            {
              backgroundColor: (ctx: CirclePackScriptableContext) => (ctx.raw ? 'red' : 'blue'),
              borderColor: (ctx) => (ctx.active ? 'black' : 'white'),
              borderWidth: 2,
              data: [1, 2, 3],
              hoverBackgroundColor: (ctx) => (ctx.active ? 'red' : 'blue'),
              hoverBorderColor: (ctx) => (ctx.active ? 'black' : 'white'),
              hoverBorderWidth: (ctx) => ctx.dataIndex,
              key: 'value',
              label: 'Fruit',
              labels: {
                color: (ctx) => (ctx.active ? 'white' : 'black'),
                display: (ctx) => ctx.dataIndex > 0,
                formatter: () => ['a', 'b'],
                padding: (ctx) => ctx.dataIndex,
              },
              region: { height: 0.5, left: 0.5, top: 0.25, width: 0.5 },
              spacing: 1,
            },
          ],
          labels: ['a', 'b', 'c'],
        },
        type: 'circlepack',
      } satisfies ChartConfiguration<'circlepack'>
      const unknownOption: ChartConfiguration<'circlepack'> = {
        data: {
          datasets: [
            {
              data: [1],
              // @ts-expect-error: not an option of the circlepack dataset
              notAnOption: true,
            },
          ],
        },
        type: 'circlepack',
      }
      const wrongDisplay: ChartConfiguration<'circlepack'> = {
        data: {
          datasets: [
            {
              data: [1],
              // @ts-expect-error: display is a boolean
              labels: { display: 'yes' },
            },
            {
              data: [1],
              // @ts-expect-error: the formatter is not scriptable, so it cannot return a formatter
              labels: { formatter: () => () => 'a' },
            },
          ],
        },
        type: 'circlepack',
      }
      type Node = { v: number; x: number; y: number; r: number }
      expectTypeOf<CirclePackDataPoint>().toEqualTypeOf<Node>()
      expectTypeOf<ScriptableContext<'circlepack'>['parsed']>().toEqualTypeOf<Node>()
      expect([config.type, unknownOption.type, wrongDisplay.type]).toEqual([
        'circlepack',
        'circlepack',
        'circlepack',
      ])
    })
  })
})
