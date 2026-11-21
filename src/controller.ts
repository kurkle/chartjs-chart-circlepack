import type { UpdateMode } from 'chart.js'
import type CirclePackElement from './element.js'
import type { CirclePackDataPoint, CirclePackRegion } from './types.js'

import { DatasetController } from 'chart.js'
import { resolveObjectKey } from 'chart.js/helpers'

import { layoutCircles, regionRect } from './layout.js'

/** NaN for anything that is not a number, so that a node's `v` is always a number. */
function rowValue(row: unknown, key: string): number {
  const value = typeof row === 'object' && row !== null ? resolveObjectKey(row, key) : row
  return typeof value === 'number' ? value : Number.NaN
}

type Options = { key: string; region?: CirclePackRegion; spacing: number }

export default class CirclePackController extends DatasetController<
  'circlepack',
  CirclePackElement
> {
  static readonly id = 'circlepack'

  static readonly defaults = { dataElementType: 'circlepack', key: 'value', spacing: 0 }

  // `labels` needs no entry here: the element's descriptors resolve it at every level.
  static readonly descriptors = { _indexable: false }

  // Chart.js sets this in configure(); its type definitions do not describe it.
  declare options: Options

  override linkScales(): void {
    // No scales, not even one the user configures: the stock method would link it, and the scale's
    // range would then be read through the base class's getMinMax, which throws reading
    // getUserBounds of the other axis's scale, which does not exist.
  }

  /** 0 clips the dataset at the chart area; the base class's false would not clip at all. */
  protected override getMaxOverflow(): number {
    return 0
  }

  /**
   * Allocates a node per row and reads no option: Chart.js parses before it rebuilds the options.
   * Fresh nodes, because the slots of inserted rows still hold the nodes that moved past them.
   * A NaN `x` marks a node that update() has not laid out yet.
   */
  override parse(start: number, count: number): void {
    const parsed = this.getMeta()._parsed
    for (let i = start; i < start + count; i++) {
      parsed[i] = { r: 0, v: Number.NaN, x: Number.NaN, y: Number.NaN }
    }
  }

  /** Chart.js calls this after rebuilding the options, so this is where every option is read. */
  override update(mode: UpdateMode): void {
    const { key, region } = this.options
    const meta = this.getMeta()
    const nodes = meta._parsed as CirclePackDataPoint[]
    const rows = this.getDataset().data
    const values = nodes.map((node, i) => (node.v = rowValue(rows[i], key)))
    layoutCircles(values, regionRect(this.chart.chartArea, region)).forEach((circle, i) => {
      Object.assign(nodes[i], circle)
    })

    // a new row grows in place rather than from wherever its element was created
    meta.data.forEach((element, i) => {
      if (element.x === undefined) {
        Object.assign(element, { radius: 0, x: nodes[i].x, y: nodes[i].y })
      }
    })
    this.updateElements(meta.data, 0, meta.data.length, mode)
  }

  /** Skips rows not laid out yet, as when Chart.js resets inserted rows right after parse(). */
  override updateElements(
    elements: CirclePackElement[],
    start: number,
    count: number,
    mode: UpdateMode
  ): void {
    // the first animated render grows each circle from its centre
    const reset = mode === 'reset'
    for (let i = start; i < start + count; i++) {
      const { r, x, y } = this.getParsed(i)
      if (Number.isNaN(x)) {
        continue
      }
      // read past the skip, so that no option is read before Chart.js has rebuilt them
      const { spacing } = this.options
      this.updateElement(
        elements[i],
        i,
        {
          options: this.resolveDataElementOptions(i, mode),
          radius: reset ? 0 : Math.max(0, r - spacing),
          x,
          y,
        },
        mode
      )
    }
  }

  /** The row label and the value, formatted as the circle's default label formats it. */
  protected override getLabelAndValue(index: number): { label: string; value: string } {
    const { data, options } = this.chart
    const label = data.labels?.[index]
    return {
      // An array stays one, so that the tooltip title shows it as lines, as the circle does.
      // Anything else is text: the tooltip shows no title for a falsy label, so a label of 0,
      // which the circle shows, must arrive as '0'.
      label: (Array.isArray(label) ? label : `${label ?? ''}`) as string,
      value: this.getParsed(index).v.toLocaleString(options.locale),
    }
  }
}
