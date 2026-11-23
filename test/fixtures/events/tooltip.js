// The pointer over the second of two equal circles: the tooltip shows the row
// label as its title and the dataset label with the value as its body, and its
// caret points at the centre of the circle, (384, 128). That centre is a whole
// pixel, so the tooltip's sprite text lands on whole pixels and both browsers
// draw it alike.
export default {
  config: {
    data: {
      datasets: [
        {
          backgroundColor: 'red',
          data: [1, 1],
          label: 'values',
          labels: { display: false },
        },
      ],
      labels: ['first', 'second'],
    },
    options: {
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
    },
    type: 'circlepack',
  },
  options: {
    canvas: {
      height: 256,
      width: 512,
    },
    async run(chart) {
      await window.triggerMouseEvent(chart, 'mousemove', chart.getDatasetMeta(0).data[1])
    },
    spriteText: true,
  },
}
