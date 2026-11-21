## 1. P1 — Package skeleton (`build:`)

- [x] 1.1 Add `package.json` (private, name, description, keywords, URLs, bundle names in `exports`/`main`/`module`/`jsdelivr`/`unpkg`/`sideEffects`, peer `chart.js >=4.0.0`, scripts `build`, `lint`, `format`, `typecheck`, `test` = `test:pack`, `prepare`) so that `npm test` fails on the missing build output
- [x] 1.2 Add `rollup.config.js`, `tsconfig.json`, `biome.json` (only globs for existing paths), `.gitignore`, `.editorconfig`, `.githooks/*` from the sibling package
- [x] 1.3 Add `src/index.ts` and `src/index.esm.ts` containing only `export {}` (an empty file emits a declaration that is not a module; see design D19)
- [x] 1.4 Run `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`

## 2. P2 — Continuous integration (`ci:`)

- [x] 2.1 Confirm with the maintainer that the SonarCloud project and `SONAR_TOKEN` exist
- [x] 2.2 Add `.github/workflows/pr-ci.yml` and `main-ci.yml` (shared CI job only, branch `main`), `.github/dependabot.yml`, `sonar-project.properties`
- [x] 2.3 Read the pull request's check runs: every job ran and is green

## 3. P3 — Front-chain packing (`feat:`)

- [x] 3.1 Add `vitest.config.ts`, `tsconfig.test.json`, the `test:unit` script chained into `test`, and `test/helpers/random.ts`
- [x] 3.2 Write `src/pack.test.ts`: no pairwise overlap (n = 1, 2, 3, 50, 2000; equal radii; ratio 1e6), every circle touches another, array order untouched, repeat calls identical, 10 000 circles within a generous time bound (record the time in the pull request)
- [x] 3.3 Implement `packCircles` in `src/pack.ts`

## 4. P4 — Aspect-aware placement, built after P5 (`feat:`, experiment)

- [x] 4.1 Write `src/layout.aspect.test.ts` against `layoutCircles`: covered share at least 15 % higher than with `aspect` 1 in 2:1, 3:1, 1:2 and 1:3 rectangles for seeded sets of 50 and 200, not lower for the seeded set of 10; not lower in a square for any set; no overlap; connected; the same values laid out in 2:1 and then 1:1 equal a fresh 1:1 layout
- [x] 4.2 Add the optional `aspect` parameter to `packCircles` and pass the rectangle's long side over its short side from `layoutCircles`
- [x] 4.3 Render the round and the aspect-aware cluster for the test sets and give the comparison to the maintainer with the measurements
- [x] 4.4 Pin the direction and strength of `aspect` at the pack: `packCircles(circles, 3)` packs no more elongated than 3 and reaches a stated share of it, and `layoutCircles` lays out that pack unturned in a 3:1 rectangle and turned in a 1:3 one

## 5. P5 — Layout, built before P4 (`feat:`)

- [x] 5.1 Write `src/layout.test.ts`: bounding box centred and touching two opposite sides, `[1]` gives diameter `min(W, H)`, `[1, 1]` in a wide and a tall rectangle, undrawable values get radius 0, permuted rows give the same set of circles, an empty rectangle gives no NaN
- [x] 5.2 Implement `layoutCircles` in `src/layout.ts`

## 6. P6 — Labels (`feat:`)

- [x] 6.1 Write `src/label.test.ts` through `drawLabel` with a mock context: chord-fit cases for one and several lines, block centring, nothing drawn when a line is too wide or the text is empty
- [x] 6.2 Implement `drawLabel` in `src/label.ts`

## 7. P7 — Element and types (`feat:`)

- [ ] 7.1 Write `src/element.test.ts` with a mock context: arc fill, inside border clamped to the radius, nothing at radius ≤ 0, `inRange` false in the box corner, `inXRange`/`inYRange`, centre point, label drawn through `drawLabel`
- [ ] 7.2 Add `src/types.ts` with the option types and the `ChartTypeRegistry` entry
- [ ] 7.3 Implement `CirclePackElement` in `src/element.ts` with the defaults `borderWidth: 1`, `labels.display: true`, `labels.padding: 3`

## 8. P8 — Browser fixture harness (`test:`)

- [x] 8.1 Add `vitest.browser.config.ts`, `tsconfig.tooling.json`, `test/setup.js`, `test/specs/fixtures.spec.js`, `scripts/update-fixtures.mjs`, the `test:fixture` (chained into `test`) and `fixtures:update` scripts with their browser-install pre-scripts
- [x] 8.2 Write `test/specs/harness.spec.js`: a built-in chart type renders at device pixel ratio 1; run it in Chromium and Firefox

## 9. P9 — Controller and entry points (`feat:`)

- [ ] 9.0 Start from a `main` that has P4, so the baselines are generated once, with the placement that ships
- [ ] 9.1 Add `test/fixtures/basic/{basic,single,fourValues}` configs (`fourValues` is `[65, 46, 14, 11]` in a 2:1 canvas) and the `describe` line (fails: no such chart type)
- [ ] 9.2 Write `test/specs/controller.spec.js`: the type is registered, node `i` belongs to row `i`, tooltip label and value, a pushed row starts at its final centre with radius 0
- [ ] 9.3 Implement `CirclePackController` in `src/controller.ts`: options are read only in `update()`, `getMaxOverflow()` returns 0, `updateElements` does nothing while the layout is stale, and `update()` places elements that have no position yet
- [ ] 9.4 Export the classes and types from both entry points; register in `src/index.ts` only
- [ ] 9.5 Generate the baselines, look at each image, run both browsers

## 10. P10 — Live-update spec (`test:`)

- [ ] 10.1 Write `test/specs/liveUpdate.spec.js`: push, two pushes, `unshift` then `push`, splice, in-place edit and array replacement each equal a new chart, with animation on and off, with shared and scriptable options; `key`, `spacing`, `region` and an element option changed in place apply on one update; a resized chart equals a new chart of that size
- [ ] 10.2 Fix in the controller whatever the spec finds, as its own commit

## 11. P11 — Remaining fixtures (`test:`)

- [ ] 11.1 Add `test/fixtures/{basic,events}/{objectsKey,region,regionAtEdge,twoRegions,labels,labelsTooSmall,spacing,negativeSpacing,borderWidth,zeroValues,legendScriptable,hover,tooltip}`; `regionAtEdge` and `negativeSpacing` show that nothing is drawn outside the chart area
- [ ] 11.2 Generate the baselines, look at each image, run both browsers

## 12. P12 — Integration, types, benchmark (`test:`)

- [ ] 12.1 Add `test/integration/{browser-module,node-commonjs,node-module,webpack}` and `vitest.integration.config.ts`; each loads the built package and creates a chart; chain the scripts into `test`
- [ ] 12.2 Add `test/types/`: `ChartData<'circlepack'>` type-checks, an unknown option is an expected error, registration type-checks
- [ ] 12.3 Add `bench/update.mjs` with a smoke mode in `npm test`; record the time for 10 000 circles in the pull request

## 13. P13 — Documentation site (`docs:`)

- [ ] 13.1 Add `astro.config.mjs`, `docs/`, `src/content.config.ts`, the index and integration pages, the `docs` scripts
- [ ] 13.2 Write the sample `basic`
- [ ] 13.3 Open the sample, use every control and every value of it: no error and the canvas changes when it should

## 14. P14 — Publish (`feat:`)

- [ ] 14.1 Confirm with the maintainer: npm trusted publisher bound to `main-ci.yml`, Cloudflare Pages project and secrets, repository public
- [ ] 14.2 Add `.releaserc.json` and run its commit analysis and note generation against this repository's history locally
- [ ] 14.3 Remove `"private"`, add the release and docs-deploy jobs to `main-ci.yml`, write the readme with installation and usage
- [ ] 14.4 After the merge, read the version from the npm registry and open the published documentation

## 15. P15 — Usage page and samples, built after P13 and before P14 (`docs:`)

- [ ] 15.1 Write the usage page: data shapes; every option with its default; where labels come from; give each dataset a region; colour callbacks should read `ctx.raw`; what is not supported (groups, zoom, label overflow, `parsing: false`); one element per row holds without groups; the shape of the cluster: shaped toward the area's proportions when there are enough values (measured from about 50), while small datasets stay round or nearly so; promise no gain in coverage for small datasets (design D6)
- [ ] 15.2 Write the samples `labels` and `regions` and add them to the sidebar
- [ ] 15.3 Open each sample, use every control and every value of it: no error and the canvas changes when it should
