import type { Color } from 'chart.js'

/** The font a label is drawn in: the CSS font string and the line height in pixels. */
export type LabelFont = { string: string; lineHeight: number }

/**
 * Draws the lines centred on (x, y) if every line, centred as a block, fits the chord at its top and
 * bottom edge inside `radius`; returns whether it drew. Empty input (no lines, or only empty strings)
 * draws nothing.
 *
 * Each line is centred on the middle of its line box. It fits when half its width and the distance
 * from the centre to the edge of its line box farther from the centre are within `radius`, so a line
 * nearer the centre may be wider. If any line does not fit, nothing is drawn.
 */
export function drawLabel(
  ctx: CanvasRenderingContext2D,
  lines: readonly string[],
  x: number,
  y: number,
  radius: number,
  font: LabelFont,
  color: Color
): boolean {
  if (lines.every((line) => line === '')) {
    return false
  }
  const { lineHeight } = font
  // the top of the block, relative to y
  const top = (-lines.length * lineHeight) / 2
  ctx.save()
  ctx.font = font.string
  const fits = lines.every((line, i) => {
    const edge = Math.max(Math.abs(top + i * lineHeight), Math.abs(top + (i + 1) * lineHeight))
    const half = ctx.measureText(line).width / 2
    // a radius that is not positive fits nothing
    return Math.hypot(half, edge) <= radius
  })
  if (fits) {
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    lines.forEach((line, i) => {
      ctx.fillText(line, x, y + top + (i + 0.5) * lineHeight)
    })
  }
  ctx.restore()
  return fits
}
