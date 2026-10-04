import { defineConfig, devices } from '@playwright/test';

const port = process.env.JEKYLL_PORT ?? '4173';
export default defineConfig({
  testDir: './tests/browser',
  testMatch: /.*(?:smoke|navigation|contrast|hardening)\.spec\.ts/,
  fullyParallel: true,
  workers: 2,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/real', open: 'never' }]],
  outputDir: 'test-results/real',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  use: { baseURL: `http://127.0.0.1:${port}`, launchOptions: { headless: false }, trace: 'retain-on-failure', screenshot: 'only-on-failure', reducedMotion: 'reduce', ...devices['Desktop Chrome'] },
  projects: [{ name: 'chromium-real-content', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `JEKYLL_PORT=${port} JEKYLL_CONFIG=_config.yml JEKYLL_BASEURL=/preview JEKYLL_LIVERELOAD=0 ./scripts/serve.sh`,
    url: `http://127.0.0.1:${port}/preview/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
