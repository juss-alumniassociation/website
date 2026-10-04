import { defineConfig, devices } from '@playwright/test';

const jekyllPort = process.env.JEKYLL_PORT ?? '4000';

export default defineConfig({
  testDir: './tests/browser',
  snapshotPathTemplate: '{testDir}/__snapshots__/{arg}{ext}',
  fullyParallel: true,
  workers: 2,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  outputDir: 'test-results',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: `http://127.0.0.1:${jekyllPort}`,
    launchOptions: { headless: false },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    reducedMotion: 'reduce',
    ...devices['Desktop Chrome'],
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `JEKYLL_PORT=${jekyllPort} JEKYLL_CONFIG=_config.yml,tests/fixtures/config.yml JEKYLL_BASEURL=/preview JEKYLL_LIVERELOAD=0 ./scripts/serve.sh`,
    url: `http://127.0.0.1:${jekyllPort}/preview/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
