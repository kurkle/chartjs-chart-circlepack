/**
 * Rewrites the fixture reference images from a real browser render.
 *
 * Regenerating a reference image is never routine: it means accepting that the
 * output changed. Run it deliberately, then read the diff.
 *
 *   npm run fixtures:update
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// The installed Vitest CLI, run by this Node binary, so that nothing is looked
// up through PATH.
const vitest = fileURLToPath(new URL('vitest.mjs', import.meta.resolve('vitest/package.json')))

const result = spawnSync(
  process.execPath,
  [vitest, 'run', '--config', 'vitest.browser.config.ts', ...process.argv.slice(2)],
  { env: { ...process.env, UPDATE_FIXTURES: '1' }, stdio: 'inherit' }
)

process.exit(result.status ?? 1)
