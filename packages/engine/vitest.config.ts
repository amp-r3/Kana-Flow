import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      reporter: ['text-summary'],
      // P0 baseline, rounded down from the measured 91.91 / 78.94 / 100 / 96.66.
      // The spec target is 95% lines and branches for the engine; P1 raises these (phases.md).
      thresholds: {
        statements: 91,
        branches: 78,
        functions: 100,
        lines: 96,
      },
    },
  },
});
