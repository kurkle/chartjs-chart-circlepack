// Values that cannot be drawn among four that can: no circle is drawn for 0, a
// negative value, null, NaN, an infinite value or a string, and the others are
// laid out as if those rows were absent, so the image is that of fourValues
// without labels.
export default {
  config: {
    data: {
      datasets: [
        {
          backgroundColor: 'red',
          data: [0, 65, -46, 46, null, Number.NaN, 14, Number.POSITIVE_INFINITY, '20', 11],
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
