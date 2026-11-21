import type { Rect } from './layout'
import type { Circle } from './pack'

import { seeded } from '../test/helpers/random'
import { layoutCircles } from './layout'
import { packCircles } from './pack'

/** Relative tolerance for "touches", "overlaps" and "not lower": far below anything a canvas can show. */
const TOLERANCE = 1e-9

/**
 * The relative gain in covered share over the round cluster that a set of 50 or 200 values must
 * reach in a rectangle that is not square (design D6). Ten values form one ring around the largest
 * circle, which the aspect cannot change: they must only not cover less.
 */
const MIN_GAIN = 0.15

const SETS = [50, 200]

const SMALL_SET = 10

/** Enough circles for the cluster's proportions to settle close to the aspect. */
const LARGE_SET = 1000

/**
 * The share of the aspect that the cluster of LARGE_SET circles must reach in width over height.
 * Packed at aspect 3, sets of 1000 values reach 0.915 to 0.935 of it over 20 seeds. Applying the
 * aspect more weakly falls well short: capped at 2.5, at most 0.79; capped at 2, 0.63; its square
 * root, 0.55.
 */
const MIN_ELONGATION = 0.85

const RECTS: Record<string, Rect> = {
  '1:2': { h: 400, w: 200, x: 0, y: 0 },
  '1:3': { h: 600, w: 200, x: 0, y: 0 },
  '2:1': { h: 200, w: 400, x: 0, y: 0 },
  '3:1': { h: 200, w: 600, x: 0, y: 0 },
}

const SQUARE: Rect = { h: 300, w: 300, x: 0, y: 0 }

/** n values uniform in [1, 100), seeded with n. */
function values(n: number): number[] {
  const random = seeded(n)
  return Array.from({ length: n }, () => 1 + 99 * random())
}

function bounds(circles: readonly Circle[]): { width: number; height: number } {
  const width =
    Math.max(...circles.map((c) => c.x + c.r)) - Math.min(...circles.map((c) => c.x - c.r))
  const height =
    Math.max(...circles.map((c) => c.y + c.r)) - Math.min(...circles.map((c) => c.y - c.r))
  return { height, width }
}

/** The share of the rectangle that the circles cover. */
function share(circles: readonly Circle[], rect: Rect): number {
  return (Math.PI * circles.reduce((sum, c) => sum + c.r * c.r, 0)) / (rect.w * rect.h)
}

/**
 * The share that the round cluster covers in `rect`: the cluster laid out in a square, where the
 * pack is not shaped, scaled into `rect` in the better of its two orientations.
 */
function roundShare(values: readonly number[], rect: Rect): number {
  const unit = layoutCircles(values, { h: 1, w: 1, x: 0, y: 0 })
  const { width, height } = bounds(unit)
  const scale = Math.max(
    Math.min(rect.w / width, rect.h / height),
    Math.min(rect.w / height, rect.h / width)
  )
  return share(unit, rect) * scale * scale
}

/** Overlapping pairs, and whether all circles are connected through touching ones. */
function contacts(circles: readonly Circle[]): { overlaps: string[]; connected: boolean } {
  const overlaps: string[] = []
  const touching: number[][] = circles.map(() => [])
  circles.forEach((a, i) => {
    circles.slice(i + 1).forEach((b, k) => {
      const j = i + 1 + k
      const gap = (Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r) / (a.r + b.r)
      if (gap < -TOLERANCE) overlaps.push(`${i} and ${j} overlap by ${-gap} of their radii`)
      if (Math.abs(gap) <= TOLERANCE) {
        touching[i].push(j)
        touching[j].push(i)
      }
    })
  })
  const seen = new Set([0])
  const queue = [0]
  while (queue.length) {
    for (const j of touching[queue.pop() as number]) {
      if (!seen.has(j)) {
        seen.add(j)
        queue.push(j)
      }
    }
  }
  return { connected: seen.size === circles.length, overlaps }
}

describe('layoutCircles shapes the cluster like its area', () => {
  for (const n of SETS) {
    for (const [name, rect] of Object.entries(RECTS)) {
      it(`covers at least ${MIN_GAIN * 100} % more of a ${name} rectangle than the round cluster, ${n} values`, () => {
        const v = values(n)
        const circles = layoutCircles(v, rect)
        expect(contacts(circles)).toEqual({ connected: true, overlaps: [] })
        expect(share(circles, rect) / roundShare(v, rect) - 1).toBeGreaterThanOrEqual(MIN_GAIN)
      })
    }
  }

  for (const [name, rect] of Object.entries(RECTS)) {
    it(`covers no less of a ${name} rectangle than the round cluster, ${SMALL_SET} values`, () => {
      const v = values(SMALL_SET)
      const circles = layoutCircles(v, rect)
      expect(contacts(circles)).toEqual({ connected: true, overlaps: [] })
      expect(share(circles, rect) / roundShare(v, rect)).toBeGreaterThanOrEqual(1 - TOLERANCE)
    })
  }

  for (const n of [SMALL_SET, ...SETS]) {
    it(`covers no less of a square than the round cluster, ${n} values`, () => {
      const v = values(n)
      const circles = layoutCircles(v, SQUARE)
      expect(contacts(circles)).toEqual({ connected: true, overlaps: [] })
      expect(share(circles, SQUARE) / roundShare(v, SQUARE)).toBeGreaterThanOrEqual(1 - TOLERANCE)
    })
  }

  it('packs as wide as the aspect asks, but no wider, for an aspect above 1', () => {
    // The fit turns a tall cluster for a wide area, so only the pack itself shows the direction
    // and the strength of the aspect. With enough circles the cluster is never more elongated
    // than the aspect it was given, and it reaches most of it.
    const proportions = (aspect: number) => {
      const circles = values(LARGE_SET).map((v) => ({ r: Math.sqrt(v), x: 0, y: 0 }))
      packCircles(circles, aspect)
      const { width, height } = bounds(circles)
      return width / height
    }
    expect(proportions(3)).toBeGreaterThan(proportions(1))
    expect(proportions(3)).toBeLessThanOrEqual(3)
    expect(proportions(3)).toBeGreaterThanOrEqual(MIN_ELONGATION * 3)
  })

  it('packs with the long side over the short side, as packed in a wide area and turned in a tall one', () => {
    const v = values(200)
    // radii as the layout packs them, largest 1, so that both packs do the same arithmetic
    const largest = Math.sqrt(Math.max(...v))
    const packed = v.map((value) => ({ r: Math.sqrt(value) / largest, x: 0, y: 0 }))
    packCircles(packed, 3)
    const wide = layoutCircles(v, RECTS['3:1'])
    const tall = layoutCircles(v, RECTS['1:3'])
    // the layout is the pack moved and scaled, so each offset from circle 0 is the pack's times k
    const k = wide[0].r / packed[0].r
    packed.forEach((p, i) => {
      const dx = k * (p.x - packed[0].x)
      const dy = k * (p.y - packed[0].y)
      expect(Math.abs(wide[i].x - wide[0].x - dx)).toBeLessThanOrEqual(TOLERANCE * 600)
      expect(Math.abs(wide[i].y - wide[0].y - dy)).toBeLessThanOrEqual(TOLERANCE * 600)
      expect(Math.abs(tall[i].x - tall[0].x - dy)).toBeLessThanOrEqual(TOLERANCE * 600)
      expect(Math.abs(tall[i].y - tall[0].y - dx)).toBeLessThanOrEqual(TOLERANCE * 600)
    })
  })

  it('keeps nothing from one layout to the next', () => {
    const v = values(50)
    const fresh = layoutCircles(v, SQUARE)
    layoutCircles(v, RECTS['2:1'])
    expect(layoutCircles(v, SQUARE)).toEqual(fresh)
  })
})
