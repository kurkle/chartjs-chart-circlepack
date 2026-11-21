## Why

Chart.js has no chart type for circle packing: values drawn as touching circles whose areas are proportional to the values. It was requested in 2020 as [chartjs-chart-treemap issue 15](https://github.com/kurkle/chartjs-chart-treemap/issues/15), for a single level of circles, and is different enough from a treemap to be its own package.

## What Changes

- A new package, `chartjs-chart-circlepack`, providing the chart type `circlepack` with `CirclePackController` and `CirclePackElement`.
- Data is a list of numbers, or of objects read through a `key`. One circle per row; no grouping in this release.
- A circle-packing layout written in-house (front-chain packing). No runtime dependency; `chart.js` 4 is the only peer.
- The cluster is centred in the chart area, or in a `region` of it, and scaled until it touches two opposite sides.
- An experiment, run before anything is published, that shapes the cluster like the area it is drawn in. It has an acceptance test and an exit; if it fails the cluster stays round and the documentation says so.
- Labels centred in a circle, drawn only where they fit; round hit testing; circles animate from their own centre.
- The toolchain, CI, release and documentation set-up of the sibling chart packages.
- The script bundle registers the chart type on load; the module build leaves registration to the user.

## Capabilities

### New Capabilities

- `circle-packing-layout`: how values become non-overlapping circles that fill the dataset's area as one centred cluster.
- `circle-elements`: how a circle is drawn, labelled, hovered and animated.
- `circle-pack-chart-type`: what the package provides, how it is registered, and how it follows live changes.

### Modified Capabilities

None. This is the first change in the repository.

## Impact

- A new npm package. Nothing is published until the last piece; until then the package is marked private and the repository has no release job.
- Outside the code, the repository needs a SonarCloud project, an npm trusted publisher, a Cloudflare Pages project and branch rules, which only the maintainer can set up.
