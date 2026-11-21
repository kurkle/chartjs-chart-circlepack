import type { LabelFont } from './label'

import { drawLabel } from './label'

/** The label font. Its widths are given per text in `WIDTHS`; any other font is far wider. */
const FONT_STRING = 'bold 12px label'

/**
 * Text widths in the label font. They are sums of powers of two, so that every position below is
 * exact, and `eight` and `six` sit exactly on a fit boundary.
 */
const WIDTHS: Record<string, number> = {
  '': 0,
  dot: 0.125,
  eight: 8,
  eightPlus: 8 + 2 ** -20,
  middle: 9.75,
  nine: 9.125,
  six: 6,
}

/** Width per character in any font other than the label font, so that measuring in it never fits. */
const OTHER_FONT_CHAR_WIDTH = 100

const X = 100
const Y = 50
const COLOR = '#123456'

type State = {
  fillStyle: unknown
  font: string
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
}

/** One line as it lands on the canvas: its horizontal extent, its vertical centre and its style. */
type Drawn = {
  centreY: number
  color: unknown
  font: string
  left: number
  right: number
  text: string
}

const INITIAL: State = {
  fillStyle: '#000000',
  font: '10px sans-serif',
  textAlign: 'start',
  textBaseline: 'alphabetic',
}

/**
 * A context that keeps the four properties a label touches, with `save` and `restore`, measures
 * text in the current font, and records where each `fillText` puts its text: the horizontal extent
 * follows `textAlign` (in a left-to-right canvas), the vertical centre is known only for the
 * `middle` baseline and is NaN otherwise. That is all a centred label can depend on.
 */
function mockContext() {
  const stack: State[] = []
  const state: State = { ...INITIAL }
  const drawn: Drawn[] = []
  const width = (text: string) =>
    state.font === FONT_STRING ? WIDTHS[text] : text.length * OTHER_FONT_CHAR_WIDTH
  const ctx = {
    fillText(text: string, x: number, y: number) {
      const w = width(text)
      // the share of the width left of x
      const before = { center: 0.5, end: 1, left: 0, right: 1, start: 0 }[state.textAlign]
      drawn.push({
        centreY: state.textBaseline === 'middle' ? y : Number.NaN,
        color: state.fillStyle,
        font: state.font,
        left: x - before * w,
        right: x + (1 - before) * w,
        text,
      })
    },
    measureText: (text: string) => ({ width: width(text) }),
    restore() {
      Object.assign(state, stack.pop())
    },
    save() {
      stack.push({ ...state })
    },
  }
  for (const key of Object.keys(INITIAL) as (keyof State)[]) {
    Object.defineProperty(ctx, key, {
      get: () => state[key],
      set: (value) => {
        ;(state as Record<keyof State, unknown>)[key] = value
      },
    })
  }
  return { ctx: ctx as unknown as CanvasRenderingContext2D, drawn, state }
}

function draw(lines: readonly string[], radius: number, lineHeight: number) {
  const { ctx, drawn, state } = mockContext()
  const font: LabelFont = { lineHeight, string: FONT_STRING }
  const result = drawLabel(ctx, lines, X, Y, radius, font, COLOR)
  return { drawn, result, state }
}

/** Line `i` of `count` lines centred as a block on (X, Y), drawn in the label font and colour. */
function centred(text: string, i: number, count: number, lineHeight: number): Drawn {
  const w = WIDTHS[text]
  return {
    centreY: Y - (count * lineHeight) / 2 + (i + 0.5) * lineHeight,
    color: COLOR,
    font: FONT_STRING,
    left: X - w / 2,
    right: X + w / 2,
    text,
  }
}

function block(lines: readonly string[], lineHeight: number): Drawn[] {
  return lines.map((text, i) => centred(text, i, lines.length, lineHeight))
}

describe('drawLabel', () => {
  describe('one line', () => {
    // radius 5, line height 6: both edges of the line are 3 from the centre, where the half chord is 4
    it('draws a line exactly as wide as the chord at its edges', () => {
      const { drawn, result } = draw(['eight'], 5, 6)
      expect(result).toBe(true)
      expect(drawn).toEqual(block(['eight'], 6))
    })

    it('draws nothing when the line is wider than that chord', () => {
      const { drawn, result } = draw(['eightPlus'], 5, 6)
      expect(result).toBe(false)
      expect(drawn).toEqual([])
    })

    it('draws nothing when the line is taller than the circle', () => {
      // the edges are 6 from the centre, outside a circle of radius 5
      const { drawn, result } = draw(['dot'], 5, 12)
      expect(result).toBe(false)
      expect(drawn).toEqual([])
    })
  })

  describe('several lines', () => {
    // radius 5, line height 3: each line has its outer edge 3 from the centre and its inner edge on it
    it('fits each line at its outer edge', () => {
      const { drawn, result } = draw(['eight', 'eight'], 5, 3)
      expect(result).toBe(true)
      expect(drawn).toEqual(block(['eight', 'eight'], 3))
    })

    it.each([[['eightPlus', 'eight']], [['eight', 'eightPlus']]])(
      'draws no line when one of %j is too wide at its outer edge',
      (lines) => {
        const { drawn, result } = draw(lines, 5, 3)
        expect(result).toBe(false)
        expect(drawn).toEqual([])
      }
    )

    // radius 5, line height 2, three lines: the outer lines have their outer edge 3 from the centre
    // (half chord 4), the middle line has both edges 1 from it (half chord √24 ≈ 4.899)
    it('lets a line nearer the centre be wider', () => {
      const lines = ['eight', 'middle', 'eight']
      const { drawn, result } = draw(lines, 5, 2)
      expect(result).toBe(true)
      expect(drawn).toEqual(block(lines, 2))
    })

    it.each([[['middle', 'eight', 'eight']], [['eight', 'eight', 'middle']]])(
      'draws nothing when the wide line of %j is at the edge of the block',
      (lines) => {
        const { drawn, result } = draw(lines, 5, 2)
        expect(result).toBe(false)
        expect(drawn).toEqual([])
      }
    )

    // radius 5, line height 2, four lines: the outer lines have their outer edge 4 from the centre
    // (half chord 3), the inner ones 2 from it (half chord √21 ≈ 4.583)
    it('centres an even number of lines on the centre', () => {
      const lines = ['six', 'nine', 'nine', 'six']
      const { drawn, result } = draw(lines, 5, 2)
      expect(result).toBe(true)
      expect(drawn).toEqual(block(lines, 2))
    })

    it('draws nothing when the block is taller than the circle', () => {
      // three lines of height 4 reach 6 from the centre
      const { drawn, result } = draw(['dot', 'dot', 'dot'], 5, 4)
      expect(result).toBe(false)
      expect(drawn).toEqual([])
    })

    it('keeps an empty line as a line of the block', () => {
      const { drawn, result } = draw(['', 'eight'], 5, 3)
      expect(result).toBe(true)
      expect(drawn.map((line) => line.centreY)).toEqual([Y - 1.5, Y + 1.5])
    })
  })

  describe('nothing to draw', () => {
    it.each([[[]], [['']], [['', '']]])('draws nothing for %j', (lines) => {
      const { drawn, result } = draw(lines, 50, 6)
      expect(result).toBe(false)
      expect(drawn).toEqual([])
    })

    it.each([0, -5])('draws nothing in a radius of %d', (radius) => {
      // the same line fits a radius of 5
      const { drawn, result } = draw(['eight'], radius, 6)
      expect(result).toBe(false)
      expect(drawn).toEqual([])
    })
  })

  describe('the context', () => {
    it.each([
      ['after drawing', ['eight']],
      ['when the label does not fit', ['eightPlus']],
      ['when there is nothing to draw', []],
    ])('is left as it was %s', (_, lines) => {
      const { state } = draw(lines, 5, 6)
      expect(state).toEqual(INITIAL)
    })
  })
})
