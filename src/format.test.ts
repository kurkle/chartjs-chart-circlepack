import { formatValue } from './format'

const VALUES = [0, -0, 7, -5.5, 1234.5, 0.1 + 0.2, 1234567.891, 1e21, Number.NaN, Infinity]

describe('formatValue', () => {
  // undefined is the runtime's locale; de-DE and fi-FI group and separate decimals differently
  it.each([undefined, 'de-DE', 'fi-FI'])(
    'gives what toLocaleString gives in locale %s',
    (locale) => {
      for (const value of VALUES) {
        expect(formatValue(value, locale)).toBe(value.toLocaleString(locale))
      }
    }
  )

  it('follows a locale that changes between calls', () => {
    for (const locale of ['de-DE', undefined, 'en-US', 'de-DE', 'fi-FI', undefined]) {
      expect(formatValue(1234.5, locale)).toBe((1234.5).toLocaleString(locale))
    }
  })

  it('builds one number format per locale', () => {
    const NumberFormat = vi.spyOn(Intl, 'NumberFormat')
    try {
      for (let i = 0; i < 3; i++) {
        formatValue(i, 'sv-SE')
        formatValue(i, 'nb-NO')
      }
      expect(NumberFormat.mock.calls).toEqual([['sv-SE'], ['nb-NO']])
    } finally {
      NumberFormat.mockRestore()
    }
  })
})
