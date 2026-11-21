import type { ChartArea } from 'chart.js'
import type { Circle } from './pack.js'
import type { CirclePackRegion } from './types.js'

import { packCircles } from './pack.js'

export type Rect = { x: number; y: number; w: number; h: number }

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max)

/**
 * The part of the chart area a dataset is laid out in. The region's fractions are clamped to 0..1,
 * `left` and `top` default to 0, and `width` and `height` default to the rest and are cut at it.
 */
export function regionRect(area: ChartArea, region: CirclePackRegion | undefined): Rect {
  const left = clamp(region?.left ?? 0, 1)
  const top = clamp(region?.top ?? 0, 1)
  return {
    h: area.height * clamp(region?.height ?? 1, 1 - top),
    w: area.width * clamp(region?.width ?? 1, 1 - left),
    x: area.left + area.width * left,
    y: area.top + area.height * top,
  }
}

/** The radius of a value before scaling: √v for a finite v > 0, else 0. */
function root(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.sqrt(value) : 0
}

/**
 * Lays the values out as one packed cluster fitted to `rect`: values[i] -> circles[i].
 * r = k * √v for finite v > 0, else r = 0 at the rect centre. The cluster is packed with
 * aspect = long side / short side, so it is wide for a tall rect too. An empty rect gives a
 * meaningless aspect, which is harmless: the fit then scales every circle to 0. The cluster's
 * bounding box is used as packed or turned by a quarter (x and y swapped), whichever scales larger;
 * when both scale equally, as always in a square, it stays as packed. The box is centred in rect
 * and touches two opposite sides. Returns circles in canvas pixels; no NaN for any values in a finite rect with w, h >= 0.
 */
export function layoutCircles(values: readonly number[], rect: Rect): Circle[] {
  const cx = rect.x + rect.w / 2
  const cy = rect.y + rect.h / 2
  const roots = values.map(root)
  const largest = roots.reduce((a, b) => Math.max(a, b), 0)
  if (!largest) {
    return roots.map(() => ({ r: 0, x: cx, y: cy }))
  }
  // packed with the largest radius 1, so that squaring the roots of huge values cannot overflow
  const circles = roots.map((r) => ({ r: r / largest, x: cx, y: cy }))
  const drawn = circles.filter((c) => c.r > 0)
  packCircles(drawn, Math.max(rect.w, rect.h) / Math.min(rect.w, rect.h))

  let left = Number.POSITIVE_INFINITY
  let right = Number.NEGATIVE_INFINITY
  let top = Number.POSITIVE_INFINITY
  let bottom = Number.NEGATIVE_INFINITY
  for (const c of drawn) {
    left = Math.min(left, c.x - c.r)
    right = Math.max(right, c.x + c.r)
    top = Math.min(top, c.y - c.r)
    bottom = Math.max(bottom, c.y + c.r)
  }
  const width = right - left
  const height = bottom - top
  const packed = Math.min(rect.w / width, rect.h / height)
  const turned = Math.min(rect.w / height, rect.h / width)
  const turn = turned > packed
  const k = turn ? turned : packed
  const mx = (left + right) / 2
  const my = (top + bottom) / 2
  for (const c of drawn) {
    const dx = c.x - mx
    const dy = c.y - my
    c.x = cx + k * (turn ? dy : dx)
    c.y = cy + k * (turn ? dx : dy)
    c.r *= k
  }
  return circles
}
