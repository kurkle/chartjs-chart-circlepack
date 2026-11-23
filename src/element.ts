import type {
  CirclePackLabelsOptions,
  CirclePackOptions,
  CirclePackScriptableContext,
} from './types.js'

import { Element } from 'chart.js'
import { toFont } from 'chart.js/helpers'

import { drawLabel } from './label.js'

export type CirclePackProps = { x: number; y: number; radius: number }

const TAU = 2 * Math.PI

/**
 * The lines of a label: none for null, undefined or an empty string, one per entry of an array,
 * otherwise the value as one line. Entries and other values are shown as text.
 */
function toLines(value: unknown): string[] {
  return value === null || value === undefined || value === ''
    ? []
    : ([] as unknown[]).concat(value).map(String)
}

/**
 * The row label, one line per entry when it is an array, and the value on the line after it; or the
 * value alone when the row has no label.
 */
function formatter(ctx: CirclePackScriptableContext): string | string[] {
  // in V8 this is faster than chart.js formatNumber, and it takes an undefined locale
  const value = ctx.parsed.v.toLocaleString(ctx.chart.options.locale)
  const lines = toLines(ctx.chart.data.labels?.[ctx.dataIndex])
  return lines.length ? [...lines, value] : value
}

/** The border width drawn: a value that is not a positive number is 0, and it is at most the radius. */
function borderWidthOf(value: unknown, radius: number): number {
  return typeof value === 'number' && value > 0 ? Math.min(value, radius) : 0
}

export default class CirclePackElement extends Element<CirclePackProps, CirclePackOptions> {
  static readonly id = 'circlepack'

  static override readonly defaults: { borderWidth: 1; labels: CirclePackLabelsOptions } = {
    borderWidth: 1,
    labels: {
      color: 'black',
      display: true,
      font: {},
      formatter,
      padding: 3,
    },
  }

  static readonly descriptors = {
    labels: {
      _fallback: true,
      _scriptable: (name: string) => name !== 'formatter',
    },
  }

  static override readonly defaultRoutes = {
    backgroundColor: 'backgroundColor',
    borderColor: 'borderColor',
  }

  declare radius: number
  declare $context: CirclePackScriptableContext

  /** Fills the circle, paints its border over the fill as a ring inside the edge, and the label over both. */
  draw(ctx: CanvasRenderingContext2D): void {
    const { options, radius, x, y } = this
    if (radius <= 0) {
      return
    }
    const inner = radius - borderWidthOf(options.borderWidth, radius)

    // The ring is painted over the fill, as Chart.js paints its own borders. A fill that stopped at
    // the ring would leave a light seam where the two anti-aliased edges meet.
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, TAU)
    ctx.fillStyle = options.backgroundColor
    ctx.fill()

    if (inner < radius) {
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, TAU)
      ctx.arc(x, y, inner, 0, TAU)
      ctx.fillStyle = options.borderColor
      ctx.fill('evenodd')
    }

    const { labels } = options
    if (labels.display) {
      const lines = toLines(labels.formatter(this.$context))
      drawLabel(ctx, lines, x, y, inner - labels.padding, toFont(labels.font), labels.color)
    }
  }

  inRange(mouseX: number, mouseY: number, useFinalPosition?: boolean): boolean {
    const { radius, x, y } = this.getProps(['x', 'y', 'radius'], useFinalPosition)
    return radius > 0 && Math.hypot(mouseX - x, mouseY - y) <= radius
  }

  inXRange(mouseX: number, useFinalPosition?: boolean): boolean {
    const { radius, x } = this.getProps(['x', 'radius'], useFinalPosition)
    return radius > 0 && Math.abs(mouseX - x) <= radius
  }

  inYRange(mouseY: number, useFinalPosition?: boolean): boolean {
    const { radius, y } = this.getProps(['y', 'radius'], useFinalPosition)
    return radius > 0 && Math.abs(mouseY - y) <= radius
  }

  getCenterPoint(useFinalPosition?: boolean): { x: number; y: number } {
    const { x, y } = this.getProps(['x', 'y'], useFinalPosition)
    return { x, y }
  }
}
