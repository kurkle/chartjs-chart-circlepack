import type { Rect } from './layout'
import type { Circle } from './pack'

import { seeded } from '../test/helpers/random'
import { layoutCircles, regionRect } from './layout'

/** Relative tolerance for "touches" and "equal": far below anything a canvas can show. */
const TOLERANCE = 1e-9

const WIDE: Rect = { h: 200, w: 600, x: 5, y: 7 }
const TALL: Rect = { h: 600, w: 200, x: 5, y: 7 }
const SQUARE: Rect = { h: 300, w: 300, x: 5, y: 7 }
const NEAR_SQUARE: Rect = { h: 250, w: 300, x: -40, y: 12 }

/** Values uniform in [1, 100). */
function randomValues(n: number, seed: number): number[] {
  const random = seeded(seed)
  return Array.from({ length: n }, () => 1 + 99 * random())
}

/** The rows in an order shuffled by a seeded Fisher-Yates shuffle. */
function shuffled<T>(items: readonly T[], seed: number): T[] {
  const random = seeded(seed)
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function bounds(circles: readonly Circle[]) {
  const drawn = circles.filter((c) => c.r > 0)
  const left = Math.min(...drawn.map((c) => c.x - c.r))
  const right = Math.max(...drawn.map((c) => c.x + c.r))
  const top = Math.min(...drawn.map((c) => c.y - c.r))
  const bottom = Math.max(...drawn.map((c) => c.y + c.r))
  return { bottom, height: bottom - top, left, right, top, width: right - left }
}

function expectNear(actual: number, expected: number, scale: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOLERANCE * scale)
}

/** The circles as a set: sorted, so that the order of the rows does not matter. */
function asSet(circles: readonly Circle[]): Circle[] {
  return [...circles].sort((a, b) => a.x - b.x || a.y - b.y || a.r - b.r)
}

describe('layoutCircles', () => {
  it('returns no circles for no values', () => {
    expect(layoutCircles([], WIDE)).toEqual([])
  })

  it('fits a single value to the short side, at the centre', () => {
    const rect = { h: 256, w: 512, x: 10, y: 20 }
    expect(layoutCircles([1], rect)).toEqual([{ r: 128, x: 266, y: 148 }])
    expect(layoutCircles([1], { h: 512, w: 256, x: 10, y: 20 })).toEqual([
      { r: 128, x: 138, y: 276 },
    ])
  })

  it('puts two equal values side by side in a wide rectangle', () => {
    expect(asSet(layoutCircles([1, 1], { h: 100, w: 400, x: 0, y: 0 }))).toEqual([
      { r: 50, x: 150, y: 50 },
      { r: 50, x: 250, y: 50 },
    ])
  })

  it('puts two equal values one above the other in a tall rectangle', () => {
    expect(asSet(layoutCircles([1, 1], { h: 400, w: 100, x: 0, y: 0 }))).toEqual([
      { r: 50, x: 50, y: 150 },
      { r: 50, x: 50, y: 250 },
    ])
  })

  it('keeps the cluster as packed in a square, where both orientations fit equally', () => {
    expect(asSet(layoutCircles([1, 1], { h: 200, w: 200, x: 0, y: 0 }))).toEqual([
      { r: 50, x: 50, y: 100 },
      { r: 50, x: 150, y: 100 },
    ])
  })

  it('gives a value four times larger twice the radius', () => {
    const [a, b] = layoutCircles([4, 1], WIDE)
    expectNear(a.r, 2 * b.r, a.r)
  })

  for (const [name, rect] of Object.entries({ NEAR_SQUARE, SQUARE, TALL, WIDE })) {
    it(`centres the cluster in a ${name} rectangle, touching two opposite sides`, () => {
      const values = randomValues(50, 5)
      const circles = layoutCircles(values, rect)
      const box = bounds(circles)
      const size = Math.max(rect.w, rect.h)
      expectNear((box.left + box.right) / 2, rect.x + rect.w / 2, size)
      expectNear((box.top + box.bottom) / 2, rect.y + rect.h / 2, size)
      expect(box.width).toBeLessThanOrEqual(rect.w * (1 + TOLERANCE))
      expect(box.height).toBeLessThanOrEqual(rect.h * (1 + TOLERANCE))
      expect(Math.max(box.width / rect.w, box.height / rect.h)).toBeCloseTo(1, 9)
      // the other orientation, the box turned by a quarter, would not fit larger
      expect(Math.min(rect.w / box.height, rect.h / box.width)).toBeLessThanOrEqual(1 + TOLERANCE)
      // one scale for all: the area over the value is the same for every circle
      const ratio = circles[0].r ** 2 / values[0]
      circles.forEach((c, i) => {
        expectNear(c.r ** 2 / values[i], ratio, ratio)
      })
    })
  }

  it('turns the cluster when the turned box fits larger', () => {
    // The same values, one rectangle the transpose of the other: the clusters are mirror images.
    // This holds for a cluster shaped like its area as long as the pack sees the same shape for a
    // rectangle and its transpose (long side over short side) and the fit turns it for the tall one.
    const values = randomValues(50, 5)
    const wide = layoutCircles(values, { h: 200, w: 600, x: 0, y: 0 })
    const tall = layoutCircles(values, { h: 600, w: 200, x: 0, y: 0 })
    tall.forEach((c, i) => {
      expectNear(c.x, wide[i].y, 600)
      expectNear(c.y, wide[i].x, 600)
      expectNear(c.r, wide[i].r, 600)
    })
  })

  it('gives undrawable values radius 0 at the centre and lays out the others without them', () => {
    const undrawable = [0, -1, Number.NaN, Infinity, -Infinity, null, undefined, '9', {}, [4]]
    // Values are typed as numbers, but rows read through a key can hold anything; the cast passes
    // such values to check that none of them is drawn.
    const values = [4, ...undrawable, 1] as unknown as number[]
    const circles = layoutCircles(values, WIDE)
    expect(circles).toHaveLength(values.length)
    const [first, second] = layoutCircles([4, 1], WIDE)
    expect(circles[0]).toEqual(first)
    expect(circles[values.length - 1]).toEqual(second)
    for (const c of circles.slice(1, -1)) {
      expect(c).toEqual({ r: 0, x: 305, y: 107 })
    }
  })

  it('gives every circle radius 0 at the centre when no value can be drawn', () => {
    const values = [0, Number.NaN, -3] as number[]
    expect(layoutCircles(values, WIDE)).toEqual(new Array(3).fill({ r: 0, x: 305, y: 107 }))
  })

  it('gives the same set of circles for permuted rows', () => {
    // integer values, so that many rows are equal and may swap places
    const random = seeded(9)
    const values = [
      ...Array.from({ length: 40 }, () => 1 + Math.floor(10 * random())),
      0,
      Number.NaN,
    ]
    const permuted = shuffled(values, 4)
    expect(asSet(layoutCircles(permuted, NEAR_SQUARE))).toEqual(
      asSet(layoutCircles(values, NEAR_SQUARE))
    )
  })

  for (const rect of [
    { h: 100, w: 0, x: 10, y: 20 },
    { h: 0, w: 100, x: 10, y: 20 },
    { h: 0, w: 0, x: 10, y: 20 },
  ]) {
    it(`gives radius 0 at the centre in a ${rect.w}×${rect.h} rectangle`, () => {
      const centre = { r: 0, x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }
      expect(layoutCircles([4, 1, 9], rect)).toEqual(new Array(3).fill(centre))
    })
  }

  it('lays out values too large to square without overflowing', () => {
    // the square of the root of Number.MAX_VALUE is still finite, but twice the root squared is not
    const values = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE / 4]
    const circles = layoutCircles(values, SQUARE)
    expect(circles.every((c) => Number.isFinite(c.x) && Number.isFinite(c.y) && c.r > 0)).toBe(true)
    expectNear(circles[0].r, 2 * circles[3].r, circles[0].r)
  })

  it('lays out the smallest and the largest value together', () => {
    const circles = layoutCircles([Number.MAX_VALUE, Number.MIN_VALUE, 1, 2], SQUARE)
    expect(circles.every((c) => Number.isFinite(c.x) && Number.isFinite(c.y) && c.r > 0)).toBe(true)
  })
})

describe('regionRect', () => {
  const AREA = { bottom: 220, height: 200, left: 10, right: 410, top: 20, width: 400 }

  it.each([
    [undefined, { h: 200, w: 400, x: 10, y: 20 }],
    [{ left: 0.5 }, { h: 200, w: 200, x: 210, y: 20 }],
    [
      { left: 0.75, width: 0.5 },
      { h: 200, w: 100, x: 310, y: 20 },
    ],
    [
      { left: -1, width: 0.25 },
      { h: 200, w: 100, x: 10, y: 20 },
    ],
    [{ left: 2 }, { h: 200, w: 0, x: 410, y: 20 }],
    [{ width: -1 }, { h: 200, w: 0, x: 10, y: 20 }],
    [
      { height: 0.5, top: 0.75 },
      { h: 50, w: 400, x: 10, y: 170 },
    ],
    [
      { height: 0.25, top: -1 },
      { h: 50, w: 400, x: 10, y: 20 },
    ],
    [{ top: 2 }, { h: 0, w: 400, x: 10, y: 220 }],
    [{ height: -1 }, { h: 0, w: 400, x: 10, y: 20 }],
  ])('cuts the region %j to the chart area', (region, expected) => {
    expect(regionRect(AREA, region)).toEqual(expected)
  })
})
