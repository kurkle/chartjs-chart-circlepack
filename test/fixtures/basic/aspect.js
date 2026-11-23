import { seeded } from '../../helpers/random'

// 50 values in a 2:1 area take the shape of the area: the cluster grows as an
// ellipse 1.37 times as wide as tall (348 × 254 px drawn), touching the top and
// bottom, rather than as the round cluster a square area gives. Values uniform
// in [1, 100), seed 50, the set the layout's aspect test measures.
const random = seeded(50)

export default {
  config: {
    data: {
      datasets: [
        {
          backgroundColor: 'red',
          data: Array.from({ length: 50 }, () => 1 + 99 * random()),
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
