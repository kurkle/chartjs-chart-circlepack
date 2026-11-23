// The values of basic with a spacing of 4: every drawn radius is 4 px smaller,
// so neighbours that touch in basic are 8 px apart here. The layout is that of
// basic, so the gaps are even and the cluster no longer reaches the top and
// bottom by 4 px.
export default {
  config: {
    data: {
      datasets: [
        {
          backgroundColor: 'red',
          data: [6, 6, 4, 3, 2, 2, 1],
          labels: { display: false },
          spacing: 4,
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
