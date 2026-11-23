// Two datasets, each in its own region, given by some of the fractions only.
// The first fills the left half: left and top default to 0, height to all of
// it. The second is the middle half of the right half's height, 256×128 from
// (256, 64): its width defaults to the rest, so its two equal circles sit side
// by side and fill that rectangle.
export default {
  config: {
    data: {
      datasets: [
        {
          backgroundColor: 'red',
          data: [6, 6, 4, 3, 2, 2, 1],
          labels: { display: false },
          region: { width: 0.5 },
        },
        {
          backgroundColor: 'blue',
          data: [1, 1],
          labels: { display: false },
          region: { height: 0.5, left: 0.5, top: 0.25 },
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
