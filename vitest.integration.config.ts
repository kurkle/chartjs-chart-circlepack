import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

// The built ESM bundle must not register itself and the script bundle must, so
// this suite deliberately runs without test/setup.js, which registers the chart
// type. Each spec file runs in its own page.
export default defineConfig({
  test: {
    browser: {
      enabled: true,
      headless: true,
      instances: [{ browser: 'chromium' }],
      provider: playwright(),
      screenshotFailures: false,
    },
    globals: true,
    include: ['test/integration/browser-{module,script}/*.spec.js'],
  },
})
