// Labels on four large circles, two datasets in the two halves of the chart
// area. On the left, the default text: the row label over the value, and for a
// row label that is an array, each entry on its own line over the value. On
// the right, a formatter that returns three lines, and labels.display, a
// function, hides the second circle's label only.
//
// The fixture must fail when a word of a label changes, in both browsers:
// - with sprite text, one changed glyph is fewer differing pixels than the
//   default tolerance (0.1 % of the canvas, 131 px), so the labels are words;
//   changing "Karelia" to "Savonia" differs by 380 px, "Helsinki" to "Kotka"
//   by 342 px and "Kanta-Hame" to "Etela-Savo" by 244 px, in both browsers;
// - the sprite glyphs are blitted at the label's position, and at a fractional
//   position Firefox and Chromium blend them differently (labels like these on
//   circles at fractional centres were 359 px apart), so each circle's centre
//   is a whole pixel (two equal values side by side in a square region: radius
//   64 at x 64 and 192, y 128) and every line is an even number of pixels
//   wide, so that centring it keeps it on whole pixels. The two browsers then
//   draw this fixture identically.
export default {
  config: {
    data: {
      datasets: [
        {
          backgroundColor: 'red',
          data: [10, 10],
          region: { width: 0.5 },
        },
        {
          backgroundColor: 'red',
          data: [10, 10],
          labels: {
            display: (ctx) => ctx.dataIndex === 0,
            formatter: () => ['Lapland', 'Savonia', 'Finland'],
          },
          region: { left: 0.5 },
        },
      ],
      labels: ['North Karelia', ['Helsinki', 'Kanta-Hame']],
    },
    options: {
      datasets: {
        circlepack: {
          // the sprite glyphs are 16 px tall, more than the default line
          // height of 14.4 px, so two lines would overlap
          labels: { font: { lineHeight: '16px' } },
        },
      },
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
