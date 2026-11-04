import { defineConfig, devices } from '@playwright/test';

// WebKit in mobile emulation runs next to Chromium (docs/spec/quality.md). It needs its own
// system libraries (`playwright install --with-deps chromium webkit`); a machine without them
// can set E2E_SKIP_WEBKIT=1. CI always runs it.
const skipWebkit = process.env['E2E_SKIP_WEBKIT'] === '1' && process.env['CI'] === undefined;

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    ...(skipWebkit
      ? []
      : [
          {
            name: 'webkit-mobile',
            use: { ...devices['iPhone 13'] },
          },
        ]),
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:5173',
    // Locally (pre-push hook) reuse a running `pnpm run dev`; in CI always start a fresh server.
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
