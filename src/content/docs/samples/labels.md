---
title: Labels
---

```js chart-editor
// <block:setup:1>
const ACTIVITIES = [
  'Sleep', 'Work', 'Family', 'Cooking', 'Commute', 'Exercise',
  'Reading', 'Shopping', 'Cleaning', 'Friends', 'Games', 'Music',
];
const NUMBER_CFG = {count: ACTIVITIES.length, min: 1, max: 60, decimals: 0};
// </block:setup>

// <block:formatters:2>
function labelAndValue(ctx) {
  return [ctx.chart.data.labels[ctx.dataIndex], ctx.raw + ' h'];
}
function labelOnly(ctx) {
  return ctx.chart.data.labels[ctx.dataIndex];
}
function valueOnly(ctx) {
  return ctx.raw + ' h';
}
// </block:formatters>

// <block:config:0>
const config = {
  type: 'circlepack',
  data: {
    labels: ACTIVITIES,
    datasets: [
      {
        label: 'Hours in a week',
        data: Utils.numbers(NUMBER_CFG),
        // an array is indexed per circle, from the start again past its end
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)', 'rgba(255, 99, 132, 0.5)', 'rgba(75, 192, 192, 0.5)',
          'rgba(255, 159, 64, 0.5)', 'rgba(153, 102, 255, 0.5)', 'rgba(255, 205, 86, 0.5)',
        ],
        labels: {
          display: true,
          formatter: labelAndValue,
          // the row is ctx.raw: the activities over 40 hours in red
          color: (ctx) => (ctx.raw > 40 ? 'firebrick' : 'black'),
          font: {size: 14},
        },
      }
    ],
  },
  options: {
    plugins: {
      legend: {display: false},
    },
  },
};
// </block:config>

const actions = [
  {
    name: 'Randomize',
    handler(chart) {
      chart.data.datasets.forEach(dataset => {
        dataset.data = Utils.numbers(NUMBER_CFG);
      });
      chart.update();
    }
  },
];

module.exports = {
  actions,
  config,
  choices: [
    {path: 'data.datasets.0.labels.display', values: [true, false], label: 'Display'},
    {
      path: 'data.datasets.0.labels.formatter',
      label: 'Formatter',
      values: [
        {value: labelAndValue, label: 'Label and value'},
        {value: labelOnly, label: 'Label'},
        {value: valueOnly, label: 'Value'},
      ]
    },
    {path: 'data.datasets.0.labels.font.size', values: [10, 14, 18], label: 'Font size'},
  ]
};
```

The label of each circle comes from `data.labels`, as in a pie chart. It is drawn centred in the circle, and only where every line fits: a larger font leaves more of the small circles without a label, and none is clipped.

`formatter` returns the text, an array for several lines. `color` is a function of the row, `ctx.raw`, that marks the activities over 40 hours, and `backgroundColor` is an array that colours the circles in turn.
