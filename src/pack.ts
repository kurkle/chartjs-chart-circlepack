/**
 * Front-chain circle packing, after W. Wang, J. Wang, M. Dai and H. Wang, "Visualization of large
 * hierarchical data by circle packing" (CHI 2006).
 *
 * Circles are placed one at a time, largest first. The front chain is the closed loop of circles on
 * the outside of the cluster, kept counter-clockwise. Each new circle is placed tangent to the chain
 * circle closest to the origin and its successor, on the outer side. If it overlaps another chain
 * circle, the circles between are dropped from the chain and the placement is tried again against
 * the overlapped circle.
 *
 * With an aspect above 1, "closest" is measured with the horizontal axis compressed by the aspect,
 * so the cluster grows wider than tall, as an ellipse of about that shape.
 */

export type Circle = { x: number; y: number; r: number }

/** Relative tolerance of the overlap test, so that touching circles do not count as overlapping. */
const EPSILON = 1e-12

/** Relative tolerance of the distance comparison, so that rounding does not break a tie. */
const TIE = 1e-12

type Chain = { next: number[]; prev: number[]; size: number }

/** Whether two circles overlap by more than rounding. */
function overlaps(a: Circle, b: Circle): boolean {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const s = a.r + b.r
  return dx * dx + dy * dy < s * s * (1 - EPSILON)
}

/**
 * The height of a triangle over its side `base`, from the area by Kahan's form of Heron's formula,
 * which stays accurate for the needle-thin triangles that a very large and a very small circle make.
 * The clamp only guards against rounding when the triangle is degenerate (the three centres in line).
 */
function height(base: number, side1: number, side2: number): number {
  const [p, q, r] = [base, side1, side2].sort((u, v) => v - u)
  const product = (p + (q + r)) * (r - (p - q)) * (r + (p - q)) * (p + (q - r))
  return Math.sqrt(Math.max(0, product)) / (2 * base)
}

/** Places `c` tangent to `a` and `b`, on the right-hand side of the direction from `a` to `b`. */
function place(a: Circle, b: Circle, c: Circle): void {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const d = Math.hypot(dx, dy)
  const ra = a.r + c.r
  const rb = b.r + c.r
  // the distance from a along a→b to the foot of the height
  const t = (d * d + ra * ra - rb * rb) / (2 * d)
  const h = height(d, ra, rb)
  c.x = a.x + (t * dx + h * dy) / d
  c.y = a.y + (t * dy - h * dx) / d
}

/**
 * The chain circle whose centre is closest to the origin, x divided by `aspect` (exact for 1, so
 * the default measures the plain distance bit for bit). Distances equal up to rounding are a tie,
 * won by the first found from `head`, so that rounding does not decide where equal circles go.
 */
function closest(circles: readonly Circle[], chain: Chain, head: number, aspect: number): number {
  let best = head
  let bestDistance = Number.POSITIVE_INFINITY
  let i = head
  do {
    const x = circles[i].x / aspect
    const y = circles[i].y
    const distance = x * x + y * y
    if (distance < bestDistance * (1 - TIE)) {
      best = i
      bestDistance = distance
    }
    i = chain.next[i]
  } while (i !== head)
  return best
}

/** Links `a` directly to `b`, dropping `removed` chain circles that were between them. */
function link(chain: Chain, a: number, b: number, removed: number): void {
  chain.next[a] = b
  chain.prev[b] = a
  chain.size -= removed
}

/**
 * Looks for a chain circle other than `m` and `n` that `c` overlaps, alternately forward from `n`
 * and backward from `m`, so that the overlap nearest to the pair is found first. On an overlap the
 * chain is shortened and the new pair returned; without one, null.
 */
function shorten(
  circles: readonly Circle[],
  chain: Chain,
  m: number,
  n: number,
  c: Circle
): [number, number] | null {
  let forward = chain.next[n]
  let backward = chain.prev[m]
  for (let step = 0; step < chain.size - 2; step++) {
    const removed = (step >> 1) + 1
    if (step % 2 === 0) {
      if (overlaps(c, circles[forward])) {
        link(chain, m, forward, removed)
        return [m, forward]
      }
      forward = chain.next[forward]
    } else {
      if (overlaps(c, circles[backward])) {
        link(chain, backward, n, removed)
        return [backward, n]
      }
      backward = chain.prev[backward]
    }
  }
  return null
}

/**
 * Packs circles so that they touch and do not overlap.
 * Precondition: every r finite and > 0. Places largest first (ties by index), first circle at the
 * origin. Writes x and y in place; the array order is untouched.
 * `aspect` >= 1 is the target width over height of the cluster; 1, the default, makes it round.
 */
export function packCircles(circles: Circle[], aspect = 1): void {
  const count = circles.length
  // Array.prototype.sort is stable, so equal radii keep their index order
  const order = circles.map((_, i) => i).sort((i, j) => circles[j].r - circles[i].r)
  const [first, second, third] = order.map((i) => circles[i])
  if (first) {
    first.x = 0
    first.y = 0
  }
  if (second) {
    second.x = first.r + second.r
    second.y = 0
  }
  if (!third) {
    return
  }
  // on the left of first → second, so that the chain first → second → third runs counter-clockwise
  place(second, first, third)

  const chain: Chain = { next: new Array(count), prev: new Array(count), size: 3 }
  for (let k = 0; k < 3; k++) {
    link(chain, order[k], order[(k + 1) % 3], 0)
  }

  let head = order[2]
  for (let k = 3; k < count; k++) {
    const index = order[k]
    const circle = circles[index]
    let m = closest(circles, chain, head, aspect)
    let n = chain.next[m]
    place(circles[m], circles[n], circle)
    for (let pair = shorten(circles, chain, m, n, circle); pair; ) {
      ;[m, n] = pair
      place(circles[m], circles[n], circle)
      pair = shorten(circles, chain, m, n, circle)
    }
    link(chain, m, index, 0)
    link(chain, index, n, -1)
    head = index
  }
}
