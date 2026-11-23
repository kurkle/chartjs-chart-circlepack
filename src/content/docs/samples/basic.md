---
title: Basic
---

```js chart-editor
// <block:setup:1>
const DATA_COUNT = 20;
const NUMBER_CFG = {count: DATA_COUNT, min: 1, max: 100, decimals: 0};
// </block:setup>

// <block:utils:2>
// The row is ctx.raw; the legend asks for the dataset's colour, which has no row.
function colorFromRaw(ctx) {
  const value = ctx.type === 'data' ? ctx.raw : 50;
  return helpers.color('rgb(54, 162, 235)')
    .alpha(0.2 + value / 125)
    .rgbString();
}
// </block:utils>

// <block:config:0>
const config = {
  type: 'circlepack',
  data: {
    datasets: [
      {
        label: 'My First dataset',
        data: Utils.numbers(NUMBER_CFG),
        backgroundColor: colorFromRaw,
        spacing: 0,
      }
    ],
  },
};
// </block:config>

const actions = [
  {
    name: 'Randomize',
    handler(chart) {
      chart.data.datasets.forEach(dataset => {
        dataset.data = Utils.numbers({...NUMBER_CFG, count: dataset.data.length});
      });
      chart.update();
    }
  },
  {
    name: 'Add Data',
    handler(chart) {
      chart.data.datasets.forEach(dataset => {
        dataset.data.push(...Utils.numbers({...NUMBER_CFG, count: 1}));
      });
      chart.update();
    }
  },
  {
    name: 'Remove Data',
    handler(chart) {
      chart.data.datasets.forEach(dataset => {
        dataset.data.pop();
      });
      chart.update();
    }
  },
];

module.exports = {
  actions,
  config,
  choices: [
    {
      path: 'data.datasets.0.spacing',
      control: 'radio',
      label: 'Spacing',
      values: [0, 1, 2, 4]
    }
  ]
};
```

Each value is a circle whose area is proportional to the value. The circles are packed largest first into one cluster, which is scaled to fit the chart area and centred in it.

With no options, each circle has a 1 pixel border in the chart's border colour, drawn inside the circle, and shows its value where the text fits. `spacing`, 0 by default, is how many pixels smaller each circle is drawn than its place in the cluster: neighbours that touch are twice that far apart, and the cluster keeps its place and size.
