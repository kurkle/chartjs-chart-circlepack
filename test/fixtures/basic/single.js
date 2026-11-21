// One value in a 512×256 chart area: one circle of diameter 256 at the centre.
// The fixture is about the circle, so the label is off: a label is too few
// pixels for the image comparison to notice a change in it.
export default {
  config: {
    data: {
      datasets: [
        {
          backgroundColor: 'red',
          data: [1],
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
