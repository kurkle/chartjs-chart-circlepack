// A few values in a 2:1 area: the cluster is the one a square area gives, as
// aspect-aware placement moves none of these four circles. It is about 1.3
// times as wide as tall, touches the top and bottom and is centred.
export default {
  config: {
    data: {
      datasets: [
        {
          backgroundColor: 'red',
          data: [65, 46, 14, 11],
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
    spriteText: true,
  },
}
