// The legend has one entry per dataset, not one per row. The first dataset's
// colour is a function of the row, ctx.raw: its legend box has the colour of
// the first circle, red, while its other circles are orange. The second
// dataset has no colour: all its circles and its legend box share the default
// colour. Each dataset has its own half of the chart area, below the legend.
export default {
  config: {
    data: {
      datasets: [
        {
          backgroundColor: (ctx) => (ctx.raw > 5 ? 'red' : 'orange'),
          data: [6, 4, 3, 2],
          label: 'scriptable',
          labels: { display: false },
          region: { width: 0.5 },
        },
        {
          data: [3, 2, 1],
          label: 'default',
          labels: { display: false },
          region: { left: 0.5 },
        },
      ],
      labels: ['a', 'b', 'c', 'd'],
    },
    options: {
      plugins: { legend: { display: true } },
    },
    type: 'circlepack',
  },
  options: {
    canvas: {
      height: 256,
      width: 512,
    },
    spriteText: true,
  },
}
