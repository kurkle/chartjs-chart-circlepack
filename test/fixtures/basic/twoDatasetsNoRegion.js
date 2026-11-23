// Two datasets without a region overlap by design: each fills the whole chart
// area. Chart.js draws the datasets from the last to the first (sorted by
// `order`, then index), so the first is drawn over the second, as in every
// chart type: the red circle of diameter 256 covers the middle of the two blue
// circles beside it.
export default {
  config: {
    data: {
      datasets: [
        {
          backgroundColor: 'red',
          data: [1],
          labels: { display: false },
        },
        {
          backgroundColor: 'blue',
          data: [1, 1],
          labels: { display: false },
        },
      ],
    },
    type: 'circlepack',
  },
  options: {
    canvas: {
      height: 256,
      width: 512,
    },
  },
}
