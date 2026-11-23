---
title: Regions
---

```js chart-editor
// <block:setup:1>
const NUMBER_CFG = {count: 60, min: 1, max: 100, decimals: 0};
// </block:setup>

// <block:config:0>
const config = {
  type: 'circlepack',
  data: {
    datasets: [
      {
        label: 'This year',
        data: Utils.numbers(NUMBER_CFG),
        region: {height: 0.5},
        spacing: 1,
        labels: {display: false},
      },
      {
        label: 'Last year',
        data: Utils.numbers(NUMBER_CFG),
        region: {top: 0.5},
        spacing: 1,
        labels: {display: false},
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
    {
      path: 'data.datasets.0.region',
      label: 'This year',
      values: [
        {value: {height: 0.5}, label: 'Top half'},
        {value: {width: 0.5}, label: 'Left half'},
        {value: {}, label: 'Whole area'},
      ]
    },
    {
      path: 'data.datasets.1.region',
      label: 'Last year',
      values: [
        {value: {top: 0.5}, label: 'Bottom half'},
        {value: {left: 0.5}, label: 'Right half'},
        {value: {}, label: 'Whole area'},
      ]
    },
  ]
};
```

Each dataset is laid out in its own `region`, given in fractions of the chart area. Without one, a dataset fills the whole area: choose **Whole area** for both and the first is drawn over the second.

With 60 values each, the clusters take the shape of their regions: wide in the top and bottom halves, taller in the left and right halves. A dataset of a few values would stay nearly round.
