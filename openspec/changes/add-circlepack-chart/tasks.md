## 1. P1 — Package skeleton (`build:`)

- [ ] 1.1 Add `package.json` (private, name, description, keywords, URLs, bundle names in `exports`/`main`/`module`/`jsdelivr`/`unpkg`/`sideEffects`, peer `chart.js >=4.0.0`, scripts `build`, `lint`, `format`, `typecheck`, `test` = `test:pack`, `prepare`) so that `npm test` fails on the missing build output
- [ ] 1.2 Add `rollup.config.js`, `tsconfig.json`, `biome.json` (only globs for existing paths), `.gitignore`, `.editorconfig`, `.githooks/*` from the sibling package
- [ ] 1.3 Add empty `src/index.ts` and `src/index.esm.ts`
- [ ] 1.4 Run `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`

## 2. P2 — Continuous integration (`ci:`)

- [ ] 2.1 Confirm with the maintainer that the SonarCloud project and `SONAR_TOKEN` exist
- [ ] 2.2 Add `.github/workflows/pr-ci.yml` and `main-ci.yml` (shared CI job only, branch `main`), `.github/dependabot.yml`, `sonar-project.properties`
- [ ] 2.3 Read the pull request's check runs: every job ran and is green

## 3. P3 — Front-chain packing (`feat:`)

- [ ] 3.1 Add `vitest.config.ts`, `tsconfig.test.json`, the `test:unit` script, and `test/helpers/random.ts`
- [ ] 3.2 Write `src/pack.test.ts`: no pairwise overlap (n = 1, 2, 3, 50, 2000; equal radii; ratio 1e6), every circle touches another, array order untouched, repeat calls identical
- [ ] 3.3 Implement `packCircles` in `src/pack.ts`

## 4. P4 — Aspect-aware placement (`feat:`, experiment)

- [ ] 4.1 Write `src/pack.aspect.test.ts`: covered share at least 15 % higher than with `aspect` 1 in 2:1 and 3:1 rectangles for seeded sets of 10, 50 and 200; not lower in a square; no overlap; connected
- [ ] 4.2 Add the optional `aspect` parameter to `packCircles`
- [ ] 4.3 Render the round and the aspect-aware cluster for the test sets and attach the images to the pull request
- [ ] 4.4 If 4.1 cannot be met or the maintainer rejects the look: close the pull request unmerged, remove the "Wide area" scenario from `specs/circle-packing-layout/spec.md`, record the result in `design.md` D6

## 5. P5 — Layout (`feat:`)

- [ ] 5.1 Confirm P4 is merged or closed
- [ ] 5.2 Write `src/layout.test.ts`: bounding box centred and touching two opposite sides, `[1]` gives diameter `min(W, H)`, `[1, 1]` in a wide and a tall rectangle, undrawable values get radius 0, permuted rows keep their circles, an empty rectangle gives no NaN
- [ ] 5.3 Implement `layoutCircles` in `src/layout.ts`

## 6. P6 — Labels (`feat:`)

- [ ] 6.1 Write `src/label.test.ts`: chord-fit cases for one and several lines, block centring, nothing drawn when a line is too wide
- [ ] 6.2 Implement `labelFits` and `drawLabel` in `src/label.ts`

## 7. P7 — Element and types (`feat:`)

- [ ] 7.1 Write `src/element.test.ts` with a mock context: arc fill, inside border clamped to the radius, nothing at radius ≤ 0, `inRange` false in the box corner, `inXRange`/`inYRange`, centre point, label drawn through `drawLabel`
- [ ] 7.2 Add `src/types.ts` with the option types and the `ChartTypeRegistry` entry
- [ ] 7.3 Implement `CirclePackElement` in `src/element.ts`

## 8. P8 — Browser fixture harness (`test:`)

- [ ] 8.1 Add `vitest.browser.config.ts`, `tsconfig.tooling.json`, `test/setup.js`, `test/specs/fixtures.spec.js`, `scripts/update-fixtures.mjs`, the `test:fixture` and `fixtures:update` scripts with their browser-install pre-scripts
- [ ] 8.2 Write `test/specs/harness.spec.js`: a built-in chart type renders at device pixel ratio 1; run it in Chromium and Firefox

## 9. P9 — Controller and entry points (`feat:`)

- [ ] 9.1 Add `test/fixtures/basic/{basic,single,fourValues,objectsKey,region}` configs (`fourValues` is `[65, 46, 14, 11]` in a 2:1 canvas) and the `describe` line (fails: no such chart type)
- [ ] 9.2 Write `test/specs/controller.spec.js`: the type is registered, node `i` belongs to row `i`, tooltip label and value, a region outside the area is clipped
- [ ] 9.3 Implement `CirclePackController` in `src/controller.ts`; options are read only in `update()`
- [ ] 9.4 Export the classes and types from both entry points; register in `src/index.ts` only
- [ ] 9.5 Generate the baselines, look at each image, run both browsers

## 10. P10 — Live updates (`fix:`)

- [ ] 10.1 Write `test/specs/liveUpdate.spec.js`: push, splice, in-place edit and array replacement each equal a new chart, with animation on and off, with shared and scriptable options; a pushed row starts at its final centre with radius 0; `key`, `spacing`, `region` and an element option changed in place apply on one update
- [ ] 10.2 Record a reset that arrives before the layout and replay it in `update()`

## 11. P11 — Remaining fixtures (`test:`)

- [ ] 11.1 Add `test/fixtures/{basic,events}/{labels,labelsTooSmall,spacing,negativeSpacing,borderWidth,twoRegions,zeroValues,hover,tooltip}`
- [ ] 11.2 Generate the baselines, look at each image, run both browsers

## 12. P12 — Integration, types, benchmark (`test:`)

- [ ] 12.1 Add `test/integration/{browser-module,node-commonjs,node-module,webpack}` and `vitest.integration.config.ts`; each loads the built package and creates a chart
- [ ] 12.2 Add `test/types/`: `ChartData<'circlepack'>` type-checks, an unknown option is an expected error, registration type-checks
- [ ] 12.3 Add `bench/update.mjs` with a smoke mode in `npm test`; record the time for 10 000 circles in the pull request

## 13. P13 — Documentation (`docs:`)

- [ ] 13.1 Add `astro.config.mjs`, `docs/`, `src/content.config.ts`, the index and integration pages, the `docs` scripts
- [ ] 13.2 Write the usage page: data shapes, every option with its default, what is not supported (groups, zoom, label overflow), "one circle per row" holds without groups, the shape of the cluster as P4 left it
- [ ] 13.3 Write the samples `basic`, `labels` and `regions`
- [ ] 13.4 Open each sample, use every control and every value of it: no error and the canvas changes when it should

## 14. P14 — Publish (`feat:`)

- [ ] 14.1 Confirm with the maintainer: npm trusted publisher bound to `main-ci.yml`, Cloudflare Pages project and secrets, repository public
- [ ] 14.2 Add `.releaserc.json` and run its commit analysis and note generation against this repository's history locally
- [ ] 14.3 Remove `"private"`, add the release and docs-deploy jobs to `main-ci.yml`, write the readme with installation and usage
- [ ] 14.4 After the merge, read the version from the npm registry and open the published documentation
