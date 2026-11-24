/** One number format per locale; `undefined` is the runtime's default locale. */
const formats = new Map<string | undefined, Intl.NumberFormat>()

/**
 * The value as `value.toLocaleString(locale)` gives it, from a number format kept per locale.
 *
 * `toLocaleString` sets up its formatter again on every call, which in V8 makes it some 25 times
 * slower than `format` of a kept `Intl.NumberFormat`, with or without a locale; a chart formats one
 * value per circle on every update. Chart.js `formatNumber` keeps its formats too, but builds a
 * JSON key of the locale and the options on each call; this cache is keyed by the locale alone,
 * and it takes an undefined locale, which the chart's `options.locale` is by default.
 */
export function formatValue(value: number, locale: string | undefined): string {
  let format = formats.get(locale)
  if (!format) {
    format = new Intl.NumberFormat(locale)
    formats.set(locale, format)
  }
  return format.format(value)
}
