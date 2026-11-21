## Context

The request is [chartjs-chart-treemap issue 15](https://github.com/kurkle/chartjs-chart-treemap/issues/15): circles instead of rectangles, areas proportional to the values, a single level, "clustered around either the center or an arbitrary point" and scaled "as large as they can to fit in the bounding box". A first design placed it inside the treemap package as a second chart type; that was dropped because the reuse it promised was mostly needed for nested groups, which this release does not have, and it tied a different chart to the treemap's options and internals.

This repository holds a readme and the license. Everything else is new. Two things already exist elsewhere and shape the design.

**The sibling package as a template.** `chartjs-chart-treemap` carries the toolchain every chart package of this family uses. What is taken from it, and what changes:

| Template file | Taken | Change |
|---|---|---|
| `package.json` | yes | Name, description, keywords, URLs; bundle names `chartjs-chart-circlepack.{cjs,esm.js,min.js}` in `exports`, `main`, `module`, `jsdelivr`, `unpkg`, `sideEffects`. `"private": true` until the publishing piece. No zoom plugin. Scripts arrive with the piece that first needs them. |
| `rollup.config.js`, `tsconfig*.json`, `vitest*.config.ts`, `.gitignore`, `.editorconfig`, `.githooks/*`, `.github/dependabot.yml` | as is | Rollup reads its names from `package.json`. The pre-commit hook runs each script only if it exists. |
| `biome.json` | yes | Only the include globs for paths that exist. |
| `test/setup.js`, `test/specs/fixtures.spec.js`, `scripts/update-fixtures.mjs` | yes | One `describe` line per fixture directory. |
| `.github/workflows/pr-ci.yml`, `main-ci.yml` | yes | No `4.x` branch. `main-ci.yml` starts with the shared CI job only; the release and docs-deploy jobs arrive with the publishing piece. |
| `.releaserc.json` | publishing piece | `"branches": ["main"]`. |
| `sonar-project.properties` | yes | Project key and name. |
| `astro.config.mjs`, `docs/`, `src/content.config.ts`, index and integration pages | yes | Names, sidebar, the registered classes. The treemap's sample data is not taken. |
| `test/integration/*`, `test/types/*`, `bench/update.mjs` | yes | Names and the chart configuration. |

Constraints that come with the template: CI is the shared workflow of `kurkle/configs` (lint, typecheck, build, `npm test`); releases are cut by semantic-release from commit messages on `main`, merged by rebase, and published through npm trusted publishing, which is bound to the file name `main-ci.yml`; `npm test` ends with a package check (`exports` with `types` inside each condition, generated `.d.cts`); pixel fixtures run in Chromium and Firefox with the helpers of `chartjs-test-utils`; the documentation is Astro and Starlight with live samples whose controls write an option in place and call `chart.update()`.

**What Chart.js gives a plain dataset controller** (read in Chart.js 4.6.1). The treemap controller overrides much of the base class because it has more elements than rows. With one element per row almost all of that is stock:

| Concern | This package | Why |
|---|---|---|
| Element bookkeeping, `push`/`splice` on the data array | stock | `_resyncElements` parses on every update and inserts or removes elements to match the data length. |
| `parse` | own, trivial | The stock one dereferences the index scale; a chart without scales needs its own, as the doughnut controller has. |
| Scales | none: `linkScales()` is empty, as in the doughnut controller | See D2. |
| Option context | stock | `ctx.raw` is the row, `ctx.parsed` the node. |
| `update`, `updateElements`, `getLabelAndValue` | own | They are empty or scale-bound in the base class. |
| Reset of inserted elements | own, small | `_insertElements` calls `updateElements(…, 'reset')` right after `parse`, before any layout exists. |
| `draw`, hover, tooltip position, animated properties | stock | The base `draw` skips hidden elements and draws active ones last; `nearest`/`point` use the element's `inRange`; the default tooltip positioner uses `tooltipPosition()`; `x`, `y` and `radius` are animated numbers by default. |

Two Chart.js behaviours that have caused bugs in the sibling packages apply here: on an update, parsing runs before the controller's options are rebuilt, so an option read during `parse` is one update old; and `includeOptions(mode, sharedOptions)` must receive `undefined`, not an empty object, when options are not shared.

## Goals / Non-Goals

**Goals**

- A `circlepack` chart type: one circle per row, areas proportional to value, no overlaps, one cluster centred in and fitted to the dataset's area.
- The smallest package that does that well: no code that exists for features this release does not have.
- Live data and option changes work as in any Chart.js chart.
- No runtime dependency. Nothing is published before the package is usable and documented.

**Non-Goals** (each can be added later without a breaking change unless noted)

- Groups and nested circles, group captions, summed keys. With groups there are more circles than rows, so the documentation of this release says that "one circle per row" holds without groups.
- Value scaling (`log`, `sqrt`) and an "other" bucket.
- The zoom plugin (see D2).
- Label overflow modes, wrapping, alignment, per-line fonts, hover fonts.
- An anchor option for "an arbitrary point"; `region` positions a cluster.
- Filling a rectangle completely. Corners stay empty; how far the cluster follows the area's shape depends on the experiment (D6).
- One legend entry per circle. Making that the default later would be breaking; it is left as stock on purpose.

## Decisions

**D1. A standalone package with its own code.** No dependency on `chartjs-chart-treemap`; some small logic (the region rectangle) exists in both.
*Alternatives:* a second chart type inside the treemap package (dropped, see Context); depending on the treemap package (its internals would become public API); a shared core package (a third package to release).

**D2. No scales.** The chart area in pixels is the layout space; the controller's `linkScales()` is empty, as the doughnut controller's is.
*Alternative:* hidden linear scales as in the treemap, which make the zoom plugin work. They bring the configure-ordering workarounds the treemap needs and the question of what a circle is under one-axis zoom, for something the request never mentions. Adding scales later does not change the API. This is open question Q1.

**D3. The parsed node is `{ v, x, y, r }`**: the value, the centre in canvas pixels, and the packed radius before the spacing inset. Node `i`, element `i` and row `i` share one index; packing largest-first never reorders them. Element properties are `x`, `y`, `radius`, which Chart.js animates by default.

**D4. Options are read in `update()`, never in `parse()`.** `parse` only allocates nodes and marks the layout stale; `update()` runs after the options are rebuilt, reads the values through `key`, computes the rectangle from the chart area and `region`, lays out, and updates the elements. This removes the stale-option class of bugs by construction. The pack is recomputed only when the list of radii changed; the fit runs every time.

**D5. Layout.** Radius is `√v` for a finite `v > 0`, else 0. Placement is front-chain packing (Wang, Wang, Dai, Wang 2006), written in-house from the published description: circles in descending radius (ties by index), each placed tangent to two neighbours on the outer chain, the chain shortened on overlap. The fit takes the cluster's bounding box, uses it as packed or transposed, whichever scales larger into the rectangle, scales it and centres it. Rows with radius 0 are not packed and sit at the rectangle's centre with radius 0. There is no randomness.

**D6. Aspect-aware placement, as an experiment with an exit (P4).** The front chain chooses where the next circle goes by the smallest distance from the cluster's centre, which makes the cluster round; a wide area then keeps empty ends. P4 measures that distance with the horizontal axis compressed by the area's aspect ratio (long side over short side; the transposition of D5 turns the result for a tall area), so the cluster grows as an ellipse shaped like the area. Tangency and the overlap rule are untouched.
This is unproven and nothing here has been run. P4 is accepted when, for seeded sets of 10, 50 and 200 circles in 2:1 and 3:1 rectangles, the share of the rectangle covered by circles is at least 15 % higher (relative) than with the round cluster, it is not lower in a square, and the maintainer has looked at rendered comparisons attached to the pull request: the numbers cannot see an ugly cluster. If it fails, P4 is closed unmerged, the "Wide area" scenario is removed from the spec, and the usage page states that the cluster is round.
It runs directly after the packing piece, before the rest of the package is built, because its outcome is what the requester's picture depends on, and because changing the arrangement after a release would change every published chart.
*Alternatives:* true rectangle packing (no standard algorithm for value-proportional circles); an opt-in option (it would have to be kept forever).

**D7. Spacing is an inset.** Each circle is drawn with radius `r − spacing`, so tangent neighbours are `2 × spacing` apart, exactly, at no cost to the layout. Negative spacing overlaps neighbours and may reach outside the area. A circle whose drawn radius is not positive is neither drawn nor hit. The default is 0: circles touch.

**D8. `borderWidth` is drawn inside the edge**, so borders never change the layout and neighbours still touch at the outer edge. It is scriptable like the colours, since nothing in the layout reads it. A value that is not a number counts as 0.

**D9. Labels: centred, and only where they fit.** Options under `labels`: `display`, `formatter` (returns a string or an array of lines; receives the scriptable context), `color`, `font`, `padding` (default 3). The lines are centred on the circle as a block; the label is drawn only if every line fits the chord at its own height inside `radius − borderWidth − padding`, otherwise nothing is drawn. Small circles are the common case, and a missing label reads better than a clipped one. The default text is the row label and the value, or the value alone.
Row labels come from `chart.data.labels[i]`, the pie and doughnut convention; no option is needed.

**D10. `key` defaults to `'value'`** and is resolved with Chart.js's `resolveObjectKey`, so dotted paths work. Numbers need no key.

**D11. Hit testing, tooltip, legend, colours are stock.** `inRange` is the distance from the centre; the tooltip title is the row label and its body the dataset label and the value; the legend has one entry per dataset; with no colour configured all circles of a dataset share the dataset's colour, and a scriptable `backgroundColor` colours them individually.

**D12. Inserted rows grow in place.** A reset that arrives while the layout is stale is recorded and replayed by `update()` after the layout; without this a pushed row would fly in from the canvas origin.

**D13. A region outside the chart area is clipped silently.** The fractions are clamped to 0..1 and the documentation says so.

**D14. Peer dependency `chart.js >=4.0.0`**, as the sibling package. Only 4.6.1 was read; the integration tests of P12 run against the installed version, and nothing here is known to need a newer API.

**D15. Nothing is released before the last piece.** Until P14 the package is `"private": true`, `main-ci.yml` has no release job and there is no `.releaserc.json`, so commit types before P14 trigger nothing and each piece uses the type that describes it. P14 adds the release job and removes `private`.

**D16. The fleet's hooks and test helpers are used from the first piece.** The pre-commit hook skips scripts that do not exist yet, so it is safe with a partial toolchain.

## Risks / Trade-offs

- **The requester's picture fills a box; this may not.** The cluster is round unless P4 succeeds, and P4 can fail.
- **Numerical edge cases in the front chain** (radius ratios of 1e6, thousands of equal circles) are where circle packing implementations fail. P3's tests cover them with seeded inputs and a pairwise overlap check.
- **Cost is not measured.** A pack of n circles is about O(n√n). P12 adds a benchmark; nothing is known about 10 000 circles until then.
- **The scaffold is copied, not shared.** Fixes to the template after P1 and P2 have to be carried over by hand, as between the existing sibling packages.
- **Maintainer prerequisites can stall pieces.** P2 needs the SonarCloud project and token (whether the shared CI fails without the token is not verified). P14 needs the npm trusted publisher, the Cloudflare Pages project and the repository made public. Whether npm allows a trusted publisher to be configured before the package exists is not verified; if it does not, the first publish is a one-off by hand.
- **P12 and P13 are wide** and close to the size limit. P13 splits into scaffold and content if it overruns.
- **Labels are all-or-nothing.** A long label on a medium circle disappears where a shrunk or truncated one might have been wanted; overflow modes can be added later.

## Pieces

Sizes are estimates of changed lines without the lockfile, generated files and image baselines. The limit is 400.

| Piece | Type | Builds | Files | Failing test | Size | Waits on | Goal |
|---|---|---|---|---|---|---|---|
| P1 | `build:` | Package skeleton that lints, typechecks and builds three bundles and types | `package.json` (private), `rollup.config.js`, `tsconfig.json`, `biome.json`, `.gitignore`, `.editorconfig`, `.githooks/*`, empty `src/index.ts` and `src/index.esm.ts` | `npm test` runs the package check: exports, type conditions, built files | ~330 | — | advances |
| P2 | `ci:` | Pull request and main CI (shared job only), dependabot, Sonar properties | `.github/workflows/{pr-ci,main-ci}.yml`, `.github/dependabot.yml`, `sonar-project.properties` | CI runs and is green on the pull request | ~140 | P1; maintainer: SonarCloud project and `SONAR_TOKEN`, then branch rules | advances |
| P3 | `feat:` | Front-chain packing, the unit test runner, a seeded generator for tests | `src/pack.ts`, `src/pack.test.ts`, `test/helpers/random.ts`, `vitest.config.ts`, `tsconfig.test.json`, `package.json` | No pairwise overlap (n = 1, 2, 3, 50, 2000; equal radii; ratio 1e6); every circle touches another; repeat calls identical | ~340 | P1 | advances |
| P4 | `feat:` | Experiment: aspect-aware placement (D6) | `src/pack.ts`, `src/pack.aspect.test.ts` | Covered share at least 15 % higher than the round cluster in 2:1 and 3:1 rectangles for seeded sets of 10, 50 and 200; not lower in a square; no overlap; connected | ~150 | P3; the maintainer's look at the rendered comparison | advances; closed unmerged if it fails |
| P5 | `feat:` | Layout: radii, undrawable values, orientation, fit | `src/layout.ts`, `src/layout.test.ts` | Box centred and touching two opposite sides; `[1]`; `[1, 1]` in both orientations; bad values; row order does not matter; empty rectangle gives no NaN | ~240 | P3, and P4 merged or closed | advances |
| P6 | `feat:` | Label fit and drawing | `src/label.ts`, `src/label.test.ts` | Chord-fit cases; several lines centred as a block; not drawn when too wide | ~170 | P3 (the test runner) | advances |
| P7 | `feat:` | Element and types | `src/element.ts`, `src/types.ts`, `src/element.test.ts` | With a mock context: arc fill, inside border, nothing at radius ≤ 0, `inRange` false in the box corner, centre point | ~320 | P6 | advances |
| P8 | `test:` | Browser fixture harness | `vitest.browser.config.ts`, `tsconfig.tooling.json`, `test/setup.js`, `test/specs/fixtures.spec.js`, `test/specs/harness.spec.js`, `scripts/update-fixtures.mjs`, `package.json`, `biome.json` | A built-in chart renders at device pixel ratio 1 in Chromium and Firefox | ~170 | P1 | advances |
| P9 | `feat:` | Controller, entry points (the script bundle registers), first fixtures | `src/controller.ts`, `src/index.ts`, `src/index.esm.ts`, `test/setup.js`, `test/specs/controller.spec.js`, `test/fixtures/basic/{basic,single,fourValues,objectsKey,region}` | The fixtures need the chart type; spec: registered, node `i` is row `i`, tooltip label and value | ~380 | P5, P7, P8 | advances |
| P10 | `fix:` | Live updates: inserted rows grow in place; the live-update spec | `src/controller.ts`, `test/specs/liveUpdate.spec.js` | A pushed or spliced row starts at its final centre with radius 0; every mutation equals a new chart, animation on and off; in-place option changes apply on one update | ~200 | P9 | advances |
| P11 | `test:` | Remaining fixtures | `test/fixtures/{basic,events}/{labels,labelsTooSmall,spacing,negativeSpacing,borderWidth,twoRegions,zeroValues,hover,tooltip}` | The fixtures themselves | ~230 | P9 | advances |
| P12 | `test:` | Integration tests, type tests, benchmark smoke run in `npm test` | `test/integration/*`, `vitest.integration.config.ts`, `test/types/*`, `bench/update.mjs`, `package.json` — **wide** | The four consumers load the built package; `ChartData<'circlepack'>` type-checks; an unknown option is a type error | ~380 | P9 | advances |
| P13 | `docs:` | Documentation site: scaffold, usage page, three samples (basic, labels, regions) | `astro.config.mjs`, `docs/**`, `src/content.config.ts`, `src/content/docs/**`, `package.json` — **wide** | `npm run docs` builds; each sample's controls change the option in place and the canvas changes | ~390 | P9 | advances |
| P14 | `feat:` | Publish: remove `private`; add the release and docs-deploy jobs and `.releaserc.json`; readme with real usage | `package.json`, `.github/workflows/main-ci.yml`, `.releaserc.json`, `README.md` | The release job on `main` publishes the first version | ~150 | P10–P13; maintainer: npm trusted publisher bound to `main-ci.yml`, Cloudflare Pages project and secrets, repository public | **completes** |

**Order.** P2, P3 and P8 start once P1 is merged (P3 and P8 both edit `package.json` and `biome.json`, so the second rebases). P6 → P7 runs beside P4 → P5. P9 joins P5, P7 and P8. P10, P11, P12 and P13 run in parallel after P9 (P12 and P13 both add scripts to `package.json`). P14 is last.

## Contracts

```ts
// P3 — src/pack.ts
export type Circle = { x: number; y: number; r: number }
/** Precondition: every r finite and > 0. Places largest first (ties by index), first circle at the origin.
 *  Writes x and y in place; the array order is untouched. */
export function packCircles(circles: Circle[]): void
// If P4 merges: packCircles(circles: Circle[], aspect?: number) — aspect >= 1 is the target width over height, default 1.

// P3 — test/helpers/random.ts
export function seeded(seed: number): () => number // uniform in [0, 1)

// P5 — src/layout.ts
export type Rect = { x: number; y: number; w: number; h: number }
/** values[i] -> circles[i]. r = k * sqrt(v) for finite v > 0, else r = 0 at the rect centre.
 *  The bounding box of the positive circles is centred in rect and touches two opposite sides.
 *  Returns circles in canvas pixels; no NaN for any input. */
export function layoutCircles(values: readonly number[], rect: Rect): Circle[]
// P9 may split this into a pack cached on the radii and a fit; the split stays inside src/layout.ts.

// P6 — src/label.ts
export type LabelFont = { string: string; lineHeight: number }
/** True when every line, centred as a block on the circle, fits the chord at its top and bottom edge. */
export function labelFits(widths: readonly number[], lineHeight: number, radius: number): boolean
/** Draws the lines centred on (x, y) if they fit inside `radius`; returns whether it drew. */
export function drawLabel(
  ctx: CanvasRenderingContext2D, lines: readonly string[],
  x: number, y: number, radius: number, font: LabelFont, color: Color
): boolean

// P7 — src/types.ts
export type CirclePackDataPoint = { v: number; x: number; y: number; r: number }
export type CirclePackRegion = { left?: number; top?: number; width?: number; height?: number }
export type CirclePackScriptableContext = ScriptableContext<'circlepack'>
export type CirclePackLabelsOptions = {
  display: boolean
  formatter: (ctx: CirclePackScriptableContext) => string | string[]
  color: Color
  font: Partial<FontSpec>
  padding: number
}
export interface CirclePackOptions {
  backgroundColor: Color; borderColor: Color; borderWidth: number; labels: CirclePackLabelsOptions
}
export interface CirclePackControllerDatasetOptions {
  key?: string; spacing?: number; region?: CirclePackRegion; label?: string
  backgroundColor?: Scriptable<Color, CirclePackScriptableContext>
  borderColor?: Scriptable<Color, CirclePackScriptableContext>
  borderWidth?: Scriptable<number, CirclePackScriptableContext>
  hoverBackgroundColor?: Scriptable<Color, CirclePackScriptableContext>
  hoverBorderColor?: Scriptable<Color, CirclePackScriptableContext>
  hoverBorderWidth?: Scriptable<number, CirclePackScriptableContext>
  labels?: { [K in keyof CirclePackLabelsOptions]?: K extends 'formatter' | 'display'
    ? CirclePackLabelsOptions[K] : Scriptable<CirclePackLabelsOptions[K], CirclePackScriptableContext> }
}
declare module 'chart.js' {
  interface ChartTypeRegistry {
    circlepack: {
      chartOptions: CoreChartOptions<'circlepack'>
      datasetOptions: CirclePackControllerDatasetOptions
      defaultDataPoint: number
      metaExtensions: Record<string, never>
      parsedDataType: CirclePackDataPoint
      scales: never
    }
  }
}

// P7 — src/element.ts
export type CirclePackProps = { x: number; y: number; radius: number }
export default class CirclePackElement extends Element<CirclePackProps, CirclePackOptions> {
  static readonly id = 'circlepack'
  static readonly defaults: { borderWidth: 0; labels: CirclePackLabelsOptions }
  static readonly descriptors: { labels: { _fallback: true; _scriptable: (name: string) => boolean } } // all but 'formatter'
  static readonly defaultRoutes: { backgroundColor: 'backgroundColor'; borderColor: 'borderColor' }
  draw(ctx: CanvasRenderingContext2D): void // the label formatter is called with this.$context
  inRange(x: number, y: number, useFinalPosition?: boolean): boolean
  inXRange(x: number, useFinalPosition?: boolean): boolean
  inYRange(y: number, useFinalPosition?: boolean): boolean
  getCenterPoint(useFinalPosition?: boolean): { x: number; y: number }
  tooltipPosition(): { x: number; y: number }
}

// P9 — src/controller.ts
export default class CirclePackController extends DatasetController {
  static readonly id = 'circlepack'
  static readonly defaults: { dataElementType: 'circlepack'; key: 'value'; spacing: 0 }
  static readonly descriptors: { _indexable: false; labels: { _fallback: true; _scriptable: (name: string) => boolean } }
  linkScales(): void // empty
  parse(start: number, count: number): void // allocates nodes, reads no option
  update(mode: UpdateMode): void // values -> layout -> elements
  updateElements(elements: CirclePackElement[], start: number, count: number, mode: UpdateMode): void
  getLabelAndValue(index: number): { label: string; value: string }
}
// P10 adds: a reset arriving before the layout is recorded as [start, count] and replayed by update() after it.
```

Rules that cross pieces:

- Node, element and row share one index.
- The element's `radius` is `max(0, node.r − spacing)`.
- A radius that is not positive is never drawn or hit.
- The controller reads options only in `update()`.

## Open Questions

| # | Question | Piece | Options | Recommendation |
|---|---|---|---|---|
| Q1 | Zoom plugin support in the first release | P9 | none, no scales; hidden scales so that zoom works, circles becoming ellipses under one-axis zoom | None: the request never mentions zoom, and scales can be added later without changing the API. |
| Q2 | Default of `labels.display` | P7 | `true`; `false` as in the treemap | `true`: the requested chart is labelled circles, and labels only appear where they fit. |
| Q3 | First published version | P14 | 1.0.0, what semantic-release gives a first release; prereleases from a `next` branch first | 1.0.0: the experiment settles the one layout question that would change pixels afterwards. |
| Q4 | The original issue in the treemap repository | P14 | comment with a link and close it by hand after the first release; transfer the issue to this repository now | Comment and close by hand: the note can state what the chart does not do. |
