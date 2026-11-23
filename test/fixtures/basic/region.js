// A region of the right half: the cluster is centred in that 256×256 square
// and touches two of its opposite sides, and the left half stays empty.
export default {
  config: {
    data: {
      datasets: [
        {
          backgroundColor: 'red',
          data: [6, 6, 4, 3, 2, 2, 1],
          labels: { display: false },
          region: { left: 0.5, width: 0.5 },
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
