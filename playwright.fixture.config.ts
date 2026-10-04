import { defineConfig, devices } from '@playwright/test';

const port = process.env.JEKYLL_PORT ?? '4174';
process.env.TEST_FIXTURES = '1';
export default defineConfig({
  testDir: './tests/browser',
  testMatch: /.*(?:content|visual|contrast|hardening)\.spec\.ts/,
  snapshotPathTemplate: '{testDir}/__snapshots__/{arg}{ext}',
  fullyParallel: true,
  workers: 2,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/fixtures', open: 'never' }]],
  outputDir: 'test-results/fixtures',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  use: { baseURL: `http://127.0.0.1:${port}`, launchOptions: { headless: false }, trace: 'retain-on-failure', screenshot: 'only-on-failure', reducedMotion: 'reduce', ...devices['Desktop Chrome'] },
  projects: [{ name: 'chromium-fixtures', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `JEKYLL_PORT=${port} JEKYLL_CONFIG=_config.yml,tests/fixtures/config.yml JEKYLL_BASEURL=/preview JEKYLL_LIVERELOAD=0 ./scripts/serve.sh`,
    url: `http://127.0.0.1:${port}/preview/visual-home/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
