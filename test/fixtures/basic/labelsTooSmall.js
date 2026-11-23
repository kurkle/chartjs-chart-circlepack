// The same label, "Label" over "10", on circles of falling size, one dataset
// each in regions side by side: radius 128, 64 and 32, then two circles of
// radius 28 one above the other, then radius 4. The label is drawn whole where
// both lines fit inside the circle less its border and the padding, and not at
// all where they do not; it is never cut off.
//
// The two circles of radius 28 have a 2 px border, and the label needs
// hypot(36 / 2, 16) = 24.08 px. With the default padding of 3 the room is
// 28 - 2 - 3 = 23 px, so the upper one has no label; the lower one has a
// padding of 0, room 26 px, and has it. Without the padding the upper one
// would have 26 px, and with the padding but not the border 25 px: either
// shows its label. The margins are 0.9 to 1.9 px, and exact: with sprite text
// measureText is the sprite's, whole pixels per glyph, on every platform.
//
// Each centre is a whole pixel and each line an even number of pixels wide,
// so the sprite text lands on whole pixels and both browsers draw it alike.
const dataset = (region, more) => ({ backgroundColor: 'red', data: [10], region, ...more })
const small = { borderColor: 'blue', borderWidth: 2 }

export default {
  config: {
    data: {
      datasets: [
        dataset({ left: 0, width: 0.5 }),
        dataset({ left: 0.5, width: 0.25 }),
        dataset({ left: 0.75, width: 0.125 }),
        dataset({ height: 0.5, left: 0.875, top: 0, width: 0.109375 }, small),
        dataset(
          { height: 0.5, left: 0.875, top: 0.5, width: 0.109375 },
          { ...small, labels: { padding: 0 } }
        ),
        dataset({ left: 0.984375, width: 0.015625 }),
      ],
      labels: ['Label'],
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
