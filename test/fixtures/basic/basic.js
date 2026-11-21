// Default options apart from the fill and the line height: the 1 px border in the chart's border
// colour, and each label as the row label over the value where it fits.
export default {
  config: {
    data: {
      datasets: [
        {
          backgroundColor: 'red',
          data: [6, 6, 4, 3, 2, 2, 1],
          // the sprite glyphs below are 16 px tall, more than the default line
          // height of 14.4 px, so two lines would overlap
          labels: { font: { lineHeight: '16px' } },
        },
      ],
      labels: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    },
    type: 'circlepack',
  },
  options: {
    canvas: {
      height: 256,
      width: 512,
    },
    // fixed glyphs, identical on every platform; measureText is replaced too,
    // so whether a label fits is the same everywhere
    spriteText: true,
  },
}
