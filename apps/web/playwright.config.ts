import { defineConfig, devices } from '@playwright/test';

// WebKit in mobile emulation runs next to Chromium (docs/spec/quality.md). It needs its own
// system libraries (`playwright install --with-deps chromium webkit`); a machine without them
// can set E2E_SKIP_WEBKIT=1. CI always runs it.
const skipWebkit = process.env['E2E_SKIP_WEBKIT'] === '1' && process.env['CI'] === undefined;

// The tests run against a Vite server of their own, on a port that is not the development one
// (5173). They never reuse a server that is already there: a dev server kept running while you
// work can serve an older build of the code, and the tests would then pass or fail because of it,
// not because of the code under test. If the port is taken the run stops and says so.
const port = Number(process.env['E2E_PORT'] ?? 5273);
const baseURL = `http://localhost:${port}`;

// The latency test needs a production-like build with the probe in it, served by `vite preview`: a
// development server is not what a user gets. It has its own port too (docs/spec/quality.md).
const latencyPort = Number(process.env['E2E_LATENCY_PORT'] ?? 5373);
const latencyURL = `http://localhost:${latencyPort}`;
const LATENCY_SPEC = /latency\.spec\.ts/;

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: LATENCY_SPEC,
      use: { ...devices['Desktop Chrome'] },
    },
    ...(skipWebkit
      ? []
      : [
          {
            name: 'webkit-mobile',
            testIgnore: LATENCY_SPEC,
            use: { ...devices['iPhone 13'] },
          },
        ]),
    {
      // Chromium only: the throttling is a DevTools protocol feature.
      name: 'latency',
      testMatch: LATENCY_SPEC,
      timeout: 180000,
      use: { ...devices['Desktop Chrome'], baseURL: latencyURL },
    },
  ],
  webServer: [
    {
      command: `pnpm exec vite --port ${port} --strictPort`,
      url: baseURL,
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: `pnpm run build:probe && pnpm exec vite preview --outDir dist-probe --port ${latencyPort} --strictPort`,
      url: latencyURL,
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
