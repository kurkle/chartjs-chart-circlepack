// Rows are objects sized through a dotted key, and one row has no such
// property: it is not drawn and the others are laid out as if it were absent.
// The values are those of fourValues, so the image is the same. The rows' own
// names are not labels: each label is the value alone.
export default {
  config: {
    data: {
      datasets: [
        {
          backgroundColor: 'red',
          data: [
            { name: 'a', stats: { population: 65 } },
            { name: 'b', stats: { population: 46 } },
            { name: 'c', stats: {} },
            { name: 'd', stats: { population: 14 } },
            { name: 'e', stats: { population: 11 } },
          ],
          key: 'stats.population',
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
