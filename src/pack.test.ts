import type { Circle } from './pack'

import { seeded } from '../test/helpers/random'
import { packCircles } from './pack'

/** Relative tolerance for "overlaps" and "touches": far below anything a canvas can show. */
const TOLERANCE = 1e-9

/**
 * The largest allowed spread: the radius of the circle that encloses the cluster, about its
 * area-weighted centroid, over the radius of one disc with the circles' total area. 1.5 means the
 * circles cover at least 44 % of that enclosing disc. The packs below spread 1.10 to 1.22 (cover
 * 67 % or more); placing at the chain circle farthest from the centre instead spreads them 3.1 to 40.
 */
const MAX_SPREAD = 1.5

/**
 * Generous on purpose, so that a loaded CI runner does not fail it: packing the 10 000 circles below
 * took about 40 ms (median of 20 runs, at most 46 ms) on a laptop with Node 24.
 */
const TIME_BOUND_MS = 2000

function circlesOf(radii: readonly number[]): Circle[] {
  return radii.map((r) => ({ r, x: Number.NaN, y: Number.NaN }))
}

/** Radii of values uniform in [1, 100), as a chart of such values would have. */
function randomRadii(n: number, seed: number): number[] {
  const random = seeded(seed)
  return Array.from({ length: n }, () => Math.sqrt(1 + 99 * random()))
}

/** Radii spread evenly on a log scale over [1, 1e6]. */
function logRadii(n: number, seed: number): number[] {
  const random = seeded(seed)
  return Array.from({ length: n }, () => 10 ** (6 * random()))
}

/** The gap between two circles relative to their radii: negative when they overlap. */
function gap(a: Circle, b: Circle): number {
  return (Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r) / (a.r + b.r)
}

/**
 * Every pair of circles whose centres are within twice the largest radius, found through a uniform
 * grid of that cell size. Any two circles that overlap or touch are that close, so the result
 * contains every such pair.
 */
function nearPairs(circles: readonly Circle[]): [number, number][] {
  const size = 2 * Math.max(...circles.map((c) => c.r)) * (1 + 1e-6)
  const cells = new Map<string, number[]>()
  const cellOf = (c: Circle) => [Math.floor(c.x / size), Math.floor(c.y / size)]
  circles.forEach((c, i) => {
    const key = cellOf(c).join()
    cells.set(key, [...(cells.get(key) ?? []), i])
  })
  const offsets = [-1, 0, 1].flatMap((dx) => [-1, 0, 1].map((dy) => [dx, dy]))
  return circles.flatMap((c, i) => {
    const [cx, cy] = cellOf(c)
    return offsets
      .flatMap(([dx, dy]) => cells.get([cx + dx, cy + dy].join()) ?? [])
      .filter((j) => j > i)
      .map((j): [number, number] => [i, j])
  })
}

/** The overlapping pairs, and for each circle the circles it touches. */
function contacts(circles: readonly Circle[]): { overlaps: string[]; touching: number[][] } {
  const overlaps: string[] = []
  const touching: number[][] = circles.map(() => [])
  for (const [i, j] of nearPairs(circles)) {
    const g = gap(circles[i], circles[j])
    if (g < -TOLERANCE) overlaps.push(`${i} and ${j} overlap by ${-g} of their radii`)
    if (Math.abs(g) <= TOLERANCE) {
      touching[i].push(j)
      touching[j].push(i)
    }
  }
  return { overlaps, touching }
}

/** The number of circles reachable from circle 0 through touching circles. */
function reachable(touching: readonly number[][]): number {
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
  return seen.size
}

function expectPacked(circles: readonly Circle[]): void {
  expect(circles.every((c) => Number.isFinite(c.x) && Number.isFinite(c.y))).toBe(true)
  const { overlaps, touching } = contacts(circles)
  expect(overlaps.slice(0, 5)).toEqual([])
  if (circles.length > 1) {
    expect(touching.flatMap((t, i) => (t.length ? [] : [i]))).toEqual([])
    expect(reachable(touching)).toBe(circles.length)
  }
}

/** See MAX_SPREAD. */
function spread(circles: readonly Circle[]): number {
  let area = 0
  let cx = 0
  let cy = 0
  for (const c of circles) {
    area += c.r * c.r
    cx += c.x * c.r * c.r
    cy += c.y * c.r * c.r
  }
  cx /= area
  cy /= area
  const enclosing = Math.max(...circles.map((c) => Math.hypot(c.x - cx, c.y - cy) + c.r))
  return enclosing / Math.sqrt(area)
}

/**
 * The position of a circle on the hexagonal lattice of touching circles of radius `scale`, within
 * `tolerance` of a lattice spacing.
 */
function lattice(c: Circle, scale = 1, tolerance = 1e-9): string {
  const j = c.y / scale / Math.sqrt(3)
  const i = (c.x / scale - j) / 2
  const on = Math.abs(i - Math.round(i)) < tolerance && Math.abs(j - Math.round(j)) < tolerance
  return on ? `${Math.round(i)},${Math.round(j)}` : `off the lattice at ${c.x},${c.y}`
}

/** Where 22 equal circles go: see the lattice tests. */
const EQUAL_LATTICE = [
  '0,0',
  '1,0',
  '0,1',
  '1,-1',
  '0,-1',
  '-1,0',
  '-1,1',
  '-1,2',
  '-2,1',
  '-1,-1',
  '1,-2',
  '2,-1',
  '1,1',
  '0,2',
  '-2,2',
  '-2,0',
  '0,-2',
  '2,-2',
  '2,0',
  '1,2',
  '-2,3',
  '-3,1',
]

describe('packCircles', () => {
  it('does nothing for an empty array', () => {
    const circles: Circle[] = []
    packCircles(circles)
    expect(circles).toEqual([])
  })

  it('places a single circle at the origin', () => {
    const circles = circlesOf([3])
    packCircles(circles)
    expect(circles).toEqual([{ r: 3, x: 0, y: 0 }])
  })

  it('places two circles touching, the larger at the origin', () => {
    const circles = circlesOf([1, 2])
    packCircles(circles)
    expect(circles[1]).toMatchObject({ x: 0, y: 0 })
    expect(Math.hypot(circles[0].x, circles[0].y)).toBeCloseTo(3, 12)
    expectPacked(circles)
  })

  it('places three circles each touching the other two', () => {
    const circles = circlesOf([1, 3, 2])
    packCircles(circles)
    expect(circles[1]).toMatchObject({ x: 0, y: 0 })
    expectPacked(circles)
    expect(contacts(circles).touching.map((t) => t.length)).toEqual([2, 2, 2])
  })

  for (const n of [50, 2000]) {
    it(`packs ${n} circles of random sizes into a compact cluster without overlap`, () => {
      const circles = circlesOf(randomRadii(n, n))
      packCircles(circles)
      expectPacked(circles)
      expect(spread(circles)).toBeLessThan(MAX_SPREAD)
    })
  }

  it('packs 1000 equal circles into a compact cluster without overlap', () => {
    const circles = circlesOf(new Array(1000).fill(5))
    packCircles(circles)
    expectPacked(circles)
    expect(spread(circles)).toBeLessThan(MAX_SPREAD)
  })

  it('packs one circle a million times larger than 99 others', () => {
    const radii = new Array(99).fill(1)
    radii.splice(40, 0, 1e6)
    const circles = circlesOf(radii)
    packCircles(circles)
    expect(circles[40]).toMatchObject({ x: 0, y: 0 })
    expectPacked(circles)
  })

  it('packs 300 circles whose radii span a ratio of 1e6 into a compact cluster', () => {
    const circles = circlesOf(logRadii(300, 7))
    packCircles(circles)
    expectPacked(circles)
    expect(spread(circles)).toBeLessThan(MAX_SPREAD)
  })

  it('places a circle that only nearly fits without overlapping the chain', () => {
    // radii equal to within 1e-6: a placed circle overlaps a third one by far less than its radius
    const random = seeded(1)
    const circles = circlesOf(Array.from({ length: 30 }, () => 1 + 1e-6 * random()))
    packCircles(circles)
    expectPacked(circles)
  })

  // Equal circles touch more than the two they are placed against, and several chain circles are
  // equally close to the origin up to rounding. The order pins that a circle exactly touching a
  // third stays on the chain, and that the first of the closest chain circles is chosen. Both
  // tolerances are relative, so the order is the same at every scale.
  for (const scale of [1, 1e-3, 1e3]) {
    it(`places equal circles of radius ${scale} in a fixed order on the hexagonal lattice`, () => {
      const circles = circlesOf(new Array(22).fill(scale))
      packCircles(circles)
      expect(circles.map((c) => lattice(c, scale))).toEqual(EQUAL_LATTICE)
    })
  }

  it('chooses a chain circle nearer by more than rounding over the first one found', () => {
    // Ten equal circles end in a tie among the ring around the first, which the first one found
    // wins. Each 1e-9 smaller than the one before, the same circles leave the ring circles at
    // distances that differ by about 5e-10 of their radius, and the nearest one wins.
    const equal = circlesOf(new Array(10).fill(1))
    packCircles(equal)
    expect(lattice(equal[9])).toBe('-1,-1')
    const shrinking = circlesOf(Array.from({ length: 10 }, (_, k) => 1 - k * 1e-9))
    packCircles(shrinking)
    expect(shrinking.map((c) => lattice(c, 1, 1e-6))).toEqual([
      ...EQUAL_LATTICE.slice(0, 9),
      '-2,2',
    ])
  })

  it('places the largest circle first and the lowest index first among equal ones', () => {
    const circles = circlesOf([1, 4, 2, 4])
    packCircles(circles)
    expect(circles[1]).toMatchObject({ x: 0, y: 0 })
    expect(circles[3]).not.toMatchObject({ x: 0, y: 0 })
  })

  it('leaves the array order and the radii untouched', () => {
    const radii = randomRadii(200, 3).sort((a, b) => a - b)
    const circles = circlesOf(radii)
    const before = [...circles]
    packCircles(circles)
    expect(circles).toHaveLength(before.length)
    circles.forEach((c, i) => {
      expect(c).toBe(before[i])
      expect(c.r).toBe(radii[i])
    })
  })

  it('gives identical results on repeated calls', () => {
    const radii = randomRadii(500, 11)
    const first = circlesOf(radii)
    const second = circlesOf(radii)
    packCircles(first)
    packCircles(second)
    expect(second).toEqual(first)
    packCircles(first)
    expect(second).toEqual(first)
  })

  it(`packs 10 000 circles within ${TIME_BOUND_MS} ms`, () => {
    const circles = circlesOf(randomRadii(10_000, 10_000))
    const start = performance.now()
    packCircles(circles)
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(TIME_BOUND_MS)
    expectPacked(circles)
    expect(spread(circles)).toBeLessThan(MAX_SPREAD)
  })
})
