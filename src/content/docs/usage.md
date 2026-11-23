---
title: Usage
---

A circle pack chart draws each row of a dataset as a circle whose area is proportional to the row's value. The circles are packed largest first into one cluster that touches without overlapping, and the cluster is scaled to fit the dataset's area and centred in it.

```js
new Chart(ctx, {
  type: 'circlepack',
  data: {
    labels: ['Sleep', 'Work', 'Commute'],
    datasets: [{ label: 'Hours in a week', data: [56, 40, 8] }],
  },
})
```

## Data

`data` is an array with one row per circle. Rows are numbers, or objects whose value is read through `key`:

```js
datasets: [{
  data: [{ name: 'Helsinki', stats: { population: 684000 } }, { name: 'Espoo', stats: { population: 318000 } }],
  key: 'stats.population',
}]
```

`key` defaults to `'value'` and takes a dotted path. A row whose value is 0, negative, missing, `null`, NaN, infinite or not a number gets no circle and cannot be hovered; the other circles are laid out as if it were absent. The data array is read, never written: edit it in place or replace it, then call `chart.update()`.

There is one element per row: circle `i`, element `i` and row `i` share the index `ctx.dataIndex`, whether or not a circle is drawn for the row. This holds because a chart has no groups.

The label of a row is `data.labels[i]`, as in a pie chart. It is the first line of the circle's label and the title of its tooltip. A label that is an array is shown as several lines.

## Where options go

* `data.datasets[i]`: options for one dataset.
* `options.datasets.circlepack`: options for every circlepack dataset.
* `options.elements.circlepack`: the circle options (the second table below) for every circle. The dataset options `key`, `spacing` and `region` are not read from here.

### Dataset options

These are read once per dataset. They take plain values only: an array is not indexed and a function is not called. A `key` that is an array or a function throws for object rows, a `spacing` that is an array or a function leaves every circle undrawn, a `region` that is an array or a function is ignored, so the dataset fills the whole area, and a function inside `region` draws nothing.

| Name | Type | Default | Description
| ---- | ---- | ---- | ----
| `data` | `number[]` \| `object[]` | **required** | One row per circle.
| `key` | `string` | `'value'` | The property of an object row that holds its value. Dotted paths work.
| `label` | `string` | `undefined` | The dataset's name in the legend and the tooltip.
| `spacing` | `number` | `0` | How many pixels smaller each circle is drawn than its place in the cluster. Circles that touch are `2 × spacing` apart; a negative value overlaps them. A circle not larger than `spacing` is neither drawn nor hovered.
| `region` | `object` | the chart area | The part of the chart area the dataset is laid out in. See [Regions](#regions).

### Circle options

These are resolved per circle. Each can be [scriptable](https://www.chartjs.org/docs/latest/general/options.html#scriptable-options), a function called with the circle's context, or an array indexed per circle: circle `i` takes entry `i`, starting again from the first entry past the end. A function may also return such an array.

| Name | Type | Default | Description
| ---- | ---- | ---- | ----
| `backgroundColor` | [`Color`](https://www.chartjs.org/docs/latest/general/colors.html) | see [Default colours](#default-colours) | The fill.
| `borderColor` | `Color` | see [Default colours](#default-colours) | The border, drawn inside the circle's edge, so it never changes the layout.
| `borderWidth` | `number` | `1` | The border's width in pixels. `0` draws no border.
| `hoverBackgroundColor` | `Color` | derived from `backgroundColor` | The fill of a hovered circle.
| `hoverBorderColor` | `Color` | derived from `borderColor` | The border of a hovered circle.
| `hoverBorderWidth` | `number` | `borderWidth` | The border width of a hovered circle.
| `labels` | `object` | | See [Labels](#labels).

The legend has one entry per dataset; with a scriptable `backgroundColor` it shows the first circle's colour.

### Default colours

With Chart.js's Colors plugin registered and enabled, as it is with `chart.js/auto`, the UMD build or `Chart.register(...registerables)`, every circle of a dataset gets the dataset's palette colour: the fill at 0.5 alpha and the border opaque, so the first dataset is `rgba(54, 162, 235, 0.5)` with a `rgb(54, 162, 235)` border. The plugin colours nothing in the chart when any dataset, `options` or `options.elements.circlepack` sets a `backgroundColor` or a `borderColor`, or when `Chart.defaults.backgroundColor` or `Chart.defaults.borderColor` has been changed. Then, and without the plugin, the defaults are `Chart.defaults.backgroundColor` and `Chart.defaults.borderColor`, both `rgba(0,0,0,0.1)` unless changed. The hover colours are derived from whichever colours apply.

The plugin does not look at `options.datasets.circlepack`: a colour set only there is overridden by the palette colour the plugin writes on the dataset. To use your own colours, set them on the dataset, in `options` or in `options.elements.circlepack`, or turn the plugin off with `plugins: { colors: { enabled: false } }`.

A colour callback should read the row, `ctx.raw`. `ctx.parsed` holds the circle's value and geometry (`v`, `x`, `y`, `r`) once the circle is laid out, but Chart.js builds the legend before each layout, so a callback that reads `ctx.parsed` for the legend gets NaN or the previous value.

```js
backgroundColor: (ctx) => (ctx.raw > 50 ? 'tomato' : 'steelblue')
```

## Labels

Each circle shows its label centred in it, and only if every line fits inside the circle, within its border and `labels.padding`. Small circles are the common case, and a missing label reads better than a clipped one. Without a formatter the label is the row label and, on the next line, the value; without a row label it is the value alone.

| Name | Type | Default | Description
| ---- | ---- | ---- | ----
| `labels.display` | `boolean` | `true` | Whether to draw the label. A function returning `false` hides one circle's label.
| `labels.formatter` | `function` | row label and value | `(ctx) => string \| string[]`. An array is drawn as one line per entry; an empty string, `null` or nothing draws no label.
| `labels.color` | `Color` | `'black'` | The text colour.
| `labels.font` | [`Font`](https://www.chartjs.org/docs/latest/general/fonts.html) | the chart's font | The text font.
| `labels.padding` | `number` | `3` | Pixels kept free between the text and the border.

`labels.display`, `labels.color`, `labels.font` and `labels.padding` are scriptable and indexed per circle, as the circle options are. `labels.formatter` is called for each circle with the circle's context, but it is not indexed: give one function. Text that does not fit is not wrapped, shrunk or truncated.

## Regions

Every dataset is laid out in the whole chart area unless it has a `region`, so two datasets without one are drawn over each other, the first over the second. Give each dataset its own region:

| Name | Default | Meaning
| ---- | ---- | ----
| `region.left` | `0` | The left edge, as a fraction of the chart area's width.
| `region.top` | `0` | The top edge, as a fraction of its height.
| `region.width` | the rest | The width, as a fraction of its width.
| `region.height` | the rest | The height, as a fraction of its height.

```js
datasets: [
  { label: 'This year', data: thisYear, region: { width: 0.5 } },
  { label: 'Last year', data: lastYear, region: { left: 0.5 } },
]
```

The fractions are clamped to 0..1, and a region reaching past the chart area is cut at its edge. The cluster is centred in its region and fitted to it. Pointing at a region finds only the circles drawn there.

## The shape of the cluster

The cluster is shaped toward the proportions of its area: in an area twice as wide as it is tall, a dataset of about 50 values or more packs into a wide cluster that covers clearly more of the area than a round one would. A dataset of a few values forms one ring around its largest circle and stays round or nearly so whatever the area, so expect no better coverage from a small dataset in a wide or tall area. In a square area the cluster is round.

The layout is deterministic: the same data in the same area gives the same circles. Rows with equal values may swap places when the rows are reordered.

## Not supported

* Groups and nested circles.
* The zoom plugin: the chart has no scales.
* Label overflow: wrapping, ellipsis, alignment and per-line fonts.
* `parsing: false`.
