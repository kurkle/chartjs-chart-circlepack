// A 4 px blue border, drawn inside each circle's edge, so neighbours still
// touch at their outer edges, ring against ring. The width is scriptable: the
// smallest circle's is -2, which is not a positive number and counts as 0, so
// that circle has no ring.
export default {
  config: {
    data: {
      datasets: [
        {
          backgroundColor: 'red',
          borderColor: 'blue',
          borderWidth: (ctx) => (ctx.dataIndex === 3 ? -2 : 4),
          data: [65, 46, 14, 11],
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
