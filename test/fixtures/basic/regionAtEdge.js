// A region that reaches past the right, top and bottom of the chart area, which
// the padding makes 480×224 at (16, 16). The cluster is fitted to the part of
// the region inside it, 120×224 at its right edge: two equal circles of
// diameter 112, one above the other, touching the top and bottom of the chart
// area. Nothing is drawn in the 16 px of padding around it.
export default {
  config: {
    data: {
      datasets: [
        {
          backgroundColor: 'red',
          data: [1, 1],
          labels: { display: false },
          region: { height: 2, left: 0.75, top: -0.5, width: 0.5 },
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
