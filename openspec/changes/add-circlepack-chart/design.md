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
| Reset of inserted elements | own, small | `_insertElements` calls `updateElements(…, 'reset')` right after `parse`, before any layout exists, once per queued `push` or `splice`. |
| Clipping to the chart area | own, one method | The base `getMaxOverflow()` returns `false`, which disables clipping for a dataset without scales; returning 0 clips at the chart area. |
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
- An option to prefer a vertical or horizontal arrangement, which the requester called a longer-term goal; the orientation is chosen by fit.
- Placing small circles into the corners the cluster leaves empty, as suggested in the issue's discussion.
- `parsing: false`. Chart.js then stops keeping the parsed nodes in step with the elements; the documentation says it is unsupported.
- Filling a rectangle completely. Corners stay empty; how far the cluster follows the area's shape depends on the experiment (D6).
- One legend entry per circle. Making that the default later would be breaking; it is left as stock on purpose.

## Decisions

**D1. A standalone package with its own code.** No dependency on `chartjs-chart-treemap`; some small logic (the region rectangle) exists in both.
*Alternatives:* a second chart type inside the treemap package (dropped, see Context); depending on the treemap package (its internals would become public API); a shared core package (a third package to release).

**D2. No scales.** The chart area in pixels is the layout space; the controller's `linkScales()` is empty, as the doughnut controller's is.
*Alternative:* hidden linear scales as in the treemap, which make the zoom plugin work. They bring the configure-ordering workarounds the treemap needs and the question of what a circle is under one-axis zoom, for something the request never mentions. Adding scales later does not change the API.

**D3. The parsed node is `{ v, x, y, r }`**: the value, the centre in canvas pixels, and the packed radius before the spacing inset. Node `i`, element `i` and row `i` share one index; packing largest-first never reorders them. Element properties are `x`, `y`, `radius`, which Chart.js animates by default.

**D4. Options are read in `update()`, never in `parse()`.** `parse` only allocates nodes and marks the layout stale; `update()` runs after the options are rebuilt, reads the values through `key`, computes the rectangle from the chart area and `region`, lays out, and updates the elements. This removes the stale-option class of bugs by construction. The pack is recomputed only when the list of radii changed or, if P4 merges, the area's aspect ratio did; the fit runs every time. A resized chart must equal a new chart of that size.
One consequence is stated instead of worked around: `ctx.parsed` carries the value and geometry from the first `update()` on, but Chart.js builds the legend between `parse` and `update`, so a colour callback that the legend also uses should read the row, `ctx.raw`, which is always current.

**D5. Layout.** Radius is `√v` for a finite `v > 0`, else 0. Placement is front-chain packing (Wang, Wang, Dai, Wang 2006), written in-house from the published description: circles in descending radius (ties by index), each placed tangent to two neighbours on the outer chain, the chain shortened on overlap. The fit takes the cluster's bounding box, uses it as packed or transposed, whichever scales larger into the rectangle, scales it and centres it; when both orientations scale equally, as always in a square, the cluster stays as packed. Rows with radius 0 are not packed and sit at the rectangle's centre with radius 0. There is no randomness. Proportionality and the fit are properties of the packed radius; `spacing` then insets what is drawn (D7). Equal values are told apart by row index, so permuting the rows keeps the set of circles but may swap which of two equal rows gets which place. A dataset without a `region` uses the whole chart area, so two such datasets are drawn on top of each other; the documentation says to give each a region.

**D6. Aspect-aware placement, as an experiment with an exit (P4).** The front chain chooses where the next circle goes by the smallest distance from the cluster's centre, which makes the cluster round; a wide area then keeps empty ends. P4 measures that distance with the horizontal axis compressed by the area's aspect ratio (long side over short side; the transposition of D5 turns the result for a tall area), so the cluster grows as an ellipse shaped like the area. Tangency and the overlap rule are untouched.
This is unproven and nothing here has been run. P4 is accepted when, for seeded sets of 10, 50 and 200 circles in 2:1 and 3:1 rectangles, the share of the rectangle covered by circles is at least 15 % higher (relative) than with the round cluster, it is not lower in a square, and the maintainer has looked at rendered comparisons attached to the pull request: the numbers cannot see an ugly cluster. If it fails, P4 is closed unmerged, the "Wide area" scenario is removed from the spec, and the usage page states that the cluster is round.
It runs directly after the packing and layout pieces, so that its test measures the fit that ships, and before the rest of the package is built, because its outcome is what the requester's picture depends on, and because changing the arrangement after a release would change every published chart.
*Alternatives:* true rectangle packing (no standard algorithm for value-proportional circles); an opt-in option (it would have to be kept forever).

**D7. Spacing is an inset.** Each circle is drawn with radius `r − spacing`, so tangent neighbours are `2 × spacing` apart, exactly, at no cost to the layout. Negative spacing overlaps neighbours and may reach outside the area. A circle whose drawn radius is not positive is neither drawn nor hit. The default is 0: circles touch. Nothing is drawn outside the chart area: the controller clips to it, which also bounds a negative spacing and a circle a region pushes to the edge.

**D8. `borderWidth` is drawn inside the edge**, so borders never change the layout and neighbours still touch at the outer edge. It is scriptable like the colours, since nothing in the layout reads it. A value that is not a positive number counts as 0. The default is 1 (D18).

**D9. Labels: centred, and only where they fit.** Options under `labels`: `display` (scriptable, so one circle's label can be hidden), `formatter` (returns a string or an array of lines; receives the scriptable context), `color` (default black), `font` (default the chart's font), `padding` (default 3). The lines are centred on the circle as a block; the label is drawn only if every line fits the chord at its own height inside `radius − borderWidth − padding`, otherwise nothing is drawn. Small circles are the common case, and a missing label reads better than a clipped one. The default text is the row label and the value, or the value alone.
Row labels come from `chart.data.labels[i]`, the pie and doughnut convention; no option is needed.

**D10. `key` defaults to `'value'`** and is resolved with Chart.js's `resolveObjectKey`, so dotted paths work. Numbers need no key.

**D11. Hit testing, tooltip, legend, colours are stock.** `inRange` is the distance from the centre; the tooltip title is the row label and its body the dataset label and the value; the legend has one entry per dataset; with no colour configured all circles of a dataset share the dataset's colour, and a scriptable `backgroundColor` colours them individually.

**D12. Inserted rows grow in place.** `updateElements` does nothing while the layout is stale. In `update()`, after the layout, every element that has no position yet is given its final centre and radius 0 directly, and then all elements are updated in the requested mode. No list of pending resets is kept, so any number of `push`, `unshift` and `splice` calls between two updates is handled the same way. Without this a pushed row would fly in from the canvas origin.

**D13. A region is given in fractions of the chart area and clipped to it silently.** `left` and `top` default to 0, `width` and `height` to the rest; all are clamped to 0..1.

**D14. Peer dependency `chart.js >=4.0.0`**, as the sibling package. Only 4.6.1 was read; the integration tests of P12 run against the installed version, and nothing here is known to need a newer API.

**D15. Nothing is released before the last piece.** Until P14 the package is `"private": true`, `main-ci.yml` has no release job and there is no `.releaserc.json`, so commit types before P14 trigger nothing and each piece uses the type that describes it. P14 adds the release job and removes `private`.

**D16. The fleet's hooks and test helpers are used from the first piece.** The pre-commit hook skips scripts that do not exist yet, so it is safe with a partial toolchain.

**D17. What the design review changed.** Three reviews (architecture, complexity, scope) were checked against the Chart.js source and the template; these were accepted:

- A controller without scales is not clipped by Chart.js, so the controller clips to the chart area itself (D7, P9).
- A single record of a pending reset would have lost all but the last of several inserts; elements without a position are handled in `update()` instead, and this moved from its own `fix:` piece into the controller piece (D12).
- With aspect-aware placement the pack depends on the area's shape, so the cache key includes it and a resize must equal a new chart (D4).
- The experiment could not measure its acceptance number before the fit existed; the layout piece now comes first and the experiment's test calls it (D6, P4, P5).
- The documentation piece was certainly over the size limit and is split into P13 and P15.
- Every piece that adds a test suite wires it into `npm test`; the packing piece times 10 000 circles; `tooltipPosition` is inherited; the label fit test is not exported.
- The specs now say that proportionality and the fit hold before the spacing inset, what a dataset without a region does, that equal values may swap places when rows are permuted, where labels come from and how one is hidden, what `key` defaults to, and that there is one element per row whether or not a circle is drawn.
- Stated instead of fixed: `ctx.parsed` is not yet filled when Chart.js builds the legend (D4), `parsing: false` is unsupported, and two requests from the issue's discussion are non-goals.

**D18. The maintainer's decisions (2026-11-21).**

- Its own standalone package, `chartjs-chart-circlepack`, flat only in the first release (D1, Non-Goals).
- Chart type `circlepack`; default `spacing` 0; no anchor option; the script bundle registers on load; the fill experiment runs before publishing (D6).
- **No zoom plugin support in 1.0**: no scales (D2).
- **Labels are on by default**: `labels.display` defaults to `true`; a label still only appears where it fits (D9).
- **Circles get a default 1 px border** in the chart's border colour, drawn inside the edge, so that touching circles of one colour can be told apart with no configuration. `borderWidth: 0` removes it.
- **The first published version is 1.0.0**, what semantic-release gives a first release from `main`.

Decided by recommendation and open to change in the review of this design: the original issue in the treemap repository gets a comment with a link and is closed by hand after the first release, because that note can state what the chart does not do.

**D19. The skeleton's entry files contain only `export {}`.** An empty file emits a declaration that is not a module, and the package check's consumer compilations fail with TS2306.

## Risks / Trade-offs

- **The requester's picture fills a box; this may not.** The cluster is round unless P4 succeeds, and P4 can fail.
- **Numerical edge cases in the front chain** (radius ratios of 1e6, thousands of equal circles) are where circle packing implementations fail. P3's tests cover them with seeded inputs and a pairwise overlap check.
- **Cost is not measured.** A pack of n circles is about O(n√n). P3 records the time for 10 000 circles, so a too-slow algorithm shows before anything is built on it; P12 adds the benchmark of the update path. With P4 merged, every resize that changes the aspect ratio packs again.
- **The scaffold is copied, not shared.** Fixes to the template after P1 and P2 have to be carried over by hand, as between the existing sibling packages.
- **Maintainer prerequisites can stall pieces.** P2 needs the SonarCloud project and token (whether the shared CI fails without the token is not verified). P14 needs the npm trusted publisher, the Cloudflare Pages project and the repository made public. Whether npm allows a trusted publisher to be configured before the package exists is not verified; if it does not, the first publish is a one-off by hand.
- **P12 is wide** and close to the size limit.
- **Circles whose centre lies outside the chart area cannot be hovered**, a Chart.js rule; it only matters with negative spacing.
- **Labels are all-or-nothing.** A long label on a medium circle disappears where a shrunk or truncated one might have been wanted; overflow modes can be added later.

## Pieces

Sizes are estimates of changed lines without the lockfile, generated files and image baselines. The limit is 400.

| Piece | Type | Builds | Files | Failing test | Size | Waits on | Goal |
|---|---|---|---|---|---|---|---|
| P1 | `build:` | Package skeleton that lints, typechecks and builds three bundles and types | `package.json` (private), `rollup.config.js`, `tsconfig.json`, `biome.json`, `.gitignore`, `.editorconfig`, `.githooks/*`, `src/index.ts` and `src/index.esm.ts` containing only `export {}` (D19) | `npm test` runs the package check: exports, type conditions, built files | ~330 | — | advances |
| P2 | `ci:` | Pull request and main CI (shared job only), dependabot, Sonar properties | `.github/workflows/{pr-ci,main-ci}.yml`, `.github/dependabot.yml`, `sonar-project.properties` | CI runs and is green on the pull request | ~140 | P1; maintainer: SonarCloud project and `SONAR_TOKEN`, then branch rules | advances |
| P3 | `feat:` | Front-chain packing, the unit test runner in `npm test`, a seeded generator for tests | `src/pack.ts`, `src/pack.test.ts`, `test/helpers/random.ts`, `vitest.config.ts`, `tsconfig.test.json`, `package.json` | No pairwise overlap (n = 1, 2, 3, 50, 2000; equal radii; ratio 1e6); every circle touches another; repeat calls identical; 10 000 circles within a generous bound, the time recorded in the pull request | ~350 | P1 | advances |
| P5 | `feat:` | Layout: radii, undrawable values, orientation, fit | `src/layout.ts`, `src/layout.test.ts` | Box centred and touching two opposite sides; `[1]`; `[1, 1]` in both orientations; bad values; permuted rows give the same set of circles; empty rectangle gives no NaN | ~240 | P3 | advances |
| P4 | `feat:` | Experiment: aspect-aware placement (D6) | `src/pack.ts`, `src/layout.ts`, `src/layout.aspect.test.ts` | Through `layoutCircles`: covered share at least 15 % higher than the round cluster in 2:1, 3:1, 1:2 and 1:3 rectangles for seeded sets of 10, 50 and 200; not lower in a square; no overlap; connected; the same values laid out in 2:1 and then 1:1 equal a fresh 1:1 layout | ~170 | P5; the maintainer's look at the rendered comparison | advances; closed unmerged if it fails |
| P6 | `feat:` | Label fit and drawing | `src/label.ts`, `src/label.test.ts` | Through `drawLabel` with a mock context: chord-fit cases; several lines centred as a block; not drawn when too wide or empty | ~160 | P3 (the test runner) | advances |
| P7 | `feat:` | Element and types | `src/element.ts`, `src/types.ts`, `src/element.test.ts` | With a mock context: arc fill, inside border, nothing at radius ≤ 0, `inRange` false in the box corner, centre point | ~310 | P6 | advances |
| P8 | `test:` | Browser fixture harness in `npm test` | `vitest.browser.config.ts`, `tsconfig.tooling.json`, `test/setup.js`, `test/specs/fixtures.spec.js`, `test/specs/harness.spec.js`, `scripts/update-fixtures.mjs`, `package.json`, `biome.json` | A built-in chart renders at device pixel ratio 1 in Chromium and Firefox | ~170 | P1 | advances |
| P9 | `feat:` | Controller (clipping and in-place growth of inserted rows included), entry points (the script bundle registers), first fixtures | `src/controller.ts`, `src/index.ts`, `src/index.esm.ts`, `test/setup.js`, `test/specs/controller.spec.js`, `test/fixtures/basic/{basic,single,fourValues}` | The fixtures need the chart type; spec: registered, node `i` is row `i`, tooltip label and value, a pushed row starts at its final centre with radius 0 | ~390 | P5, P7, P8, and P4 merged or closed | advances |
| P10 | `test:` | Live-update spec | `test/specs/liveUpdate.spec.js` | Push, two pushes, `unshift` then `push`, splice, in-place edit and array replacement each equal a new chart, animation on and off, shared and scriptable options; in-place option changes apply on one update; a resize equals a new chart of that size | ~170 | P9 | advances |
| P11 | `test:` | Remaining fixtures | `test/fixtures/{basic,events}/{objectsKey,region,regionAtEdge,twoRegions,labels,labelsTooSmall,spacing,negativeSpacing,borderWidth,zeroValues,legendScriptable,hover,tooltip}` | The fixtures themselves | ~280 | P9 | advances |
| P12 | `test:` | Integration tests, type tests, benchmark smoke run in `npm test` | `test/integration/*`, `vitest.integration.config.ts`, `test/types/*`, `bench/update.mjs`, `package.json` — **wide** | The four consumers load the built package; `ChartData<'circlepack'>` type-checks; an unknown option is a type error | ~380 | P9 | advances |
| P13 | `docs:` | Documentation site: scaffold, index and integration pages, the `basic` sample | `astro.config.mjs`, `docs/**`, `src/content.config.ts`, `src/content/docs/{index.mdx,integration.mdx,samples/basic.md}`, `package.json` (icons and logos are binary and not counted) | `npm run docs` builds; the sample's controls change the option in place and the canvas changes | ~390 | P9 | advances |
| P15 | `docs:` | Usage page and the `labels` and `regions` samples | `src/content/docs/usage.md`, `src/content/docs/samples/{labels,regions}.md`, `astro.config.mjs` | Each sample's controls change the option in place and the canvas changes; the usage page documents every option of the type definitions | ~300 | P13, and P10 and P11 for the behaviour it documents | advances |
| P14 | `feat:` | Publish: remove `private`; add the release and docs-deploy jobs and `.releaserc.json`; readme with real usage | `package.json`, `.github/workflows/main-ci.yml`, `.releaserc.json`, `README.md` | The release job on `main` publishes the first version | ~150 | P10–P13, P15; maintainer: npm trusted publisher bound to `main-ci.yml`, Cloudflare Pages project and secrets, repository public | **completes** |

**Order.** Pieces are numbered as designed and never renumbered; the build order is the order of the table. The shortest path to the experiment's verdict is P1 → P3 → P5 → P4. P2 and P8 start once P1 is merged and are not on that path (P3 and P8 both edit `package.json` and `biome.json`, so the second rebases). P6 → P7 runs beside P5 → P4. P9 joins P5, P7, P8 and the outcome of P4, so that baselines are generated once. P10, P11, P12 and P13 run in parallel after P9 (P12 and P13 both add scripts to `package.json`); P15 follows P13. P14 is last.

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
// P4, if merged, passes the rectangle's long side over its short side to packCircles.
// P9 may split this into a pack cached on the radii (and the aspect) and a fit; the split stays inside src/layout.ts.

// P6 — src/label.ts
export type LabelFont = { string: string; lineHeight: number }
/** Draws the lines centred on (x, y) if every line, centred as a block, fits the chord at its top and
 *  bottom edge inside `radius`; returns whether it drew. Empty input (no lines, or only empty strings) draws nothing. */
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
  labels?: { [K in keyof CirclePackLabelsOptions]?: K extends 'formatter'
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
// tooltipPosition is the base class's: it already returns x and y.
export default class CirclePackElement extends Element<CirclePackProps, CirclePackOptions> {
  static readonly id = 'circlepack'
  static readonly defaults: { borderWidth: 1; labels: CirclePackLabelsOptions } // labels.display: true, padding: 3
  static readonly descriptors: { labels: { _fallback: true; _scriptable: (name: string) => boolean } } // all but 'formatter'
  static readonly defaultRoutes: { backgroundColor: 'backgroundColor'; borderColor: 'borderColor' }
  draw(ctx: CanvasRenderingContext2D): void // the label formatter is called with this.$context
  inRange(x: number, y: number, useFinalPosition?: boolean): boolean
  inXRange(x: number, useFinalPosition?: boolean): boolean
  inYRange(y: number, useFinalPosition?: boolean): boolean
  getCenterPoint(useFinalPosition?: boolean): { x: number; y: number }
}

// P9 — src/controller.ts
export default class CirclePackController extends DatasetController {
  static readonly id = 'circlepack'
  static readonly defaults: { dataElementType: 'circlepack'; key: 'value'; spacing: 0 }
  static readonly descriptors: { _indexable: false; labels: { _fallback: true; _scriptable: (name: string) => boolean } }
  linkScales(): void // empty
  getMaxOverflow(): number // 0: clip to the chart area
  parse(start: number, count: number): void // allocates nodes, reads no option
  update(mode: UpdateMode): void // values -> layout -> elements
  updateElements(elements: CirclePackElement[], start: number, count: number, mode: UpdateMode): void // no-op while the layout is stale
  getLabelAndValue(index: number): { label: string; value: string }
}
// update(): after the layout, an element whose x is undefined gets { x, y, radius: 0 } directly; then updateElements(all, mode).
```

Rules that cross pieces:

- Node, element and row share one index.
- The element's `radius` is `max(0, node.r − spacing)`.
- A radius that is not positive is never drawn or hit.
- The controller reads options only in `update()`.
- Every piece that adds a test suite adds it to the `test` script, because CI runs only `npm test`.

## Open Questions

None. The maintainer answered the four that the design raised on 2026-11-21; see D18.
