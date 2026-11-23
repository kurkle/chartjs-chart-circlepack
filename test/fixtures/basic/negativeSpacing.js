// A spacing of -8: every drawn radius is 8 px larger, so neighbours overlap by
// 16 px, and the circles that touch the top and bottom of the chart area reach
// 8 px past it. The padding makes the chart area 480×224 at (16, 16), and those
// circles are cut flat at its edges: nothing is drawn in the padding. Rows
// alternate red and blue so that the overlaps show.
export default {
  config: {
    data: {
      datasets: [
        {
          backgroundColor: (ctx) => (ctx.dataIndex % 2 ? 'blue' : 'red'),
          data: [6, 6, 4, 3, 2, 2, 1],
          labels: { display: false },
          spacing: -8,
        },
      ],
    },
    options: {
      layout: { padding: 16 },
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
