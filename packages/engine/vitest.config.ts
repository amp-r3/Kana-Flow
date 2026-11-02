import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/test-util.ts'],
      reporter: ['text-summary'],
      // P0 baseline, rounded down from the measured 91.91 / 78.94 / 100 / 96.66.
      // The spec target is 95% lines and branches for the engine; P1 raises these (phases.md).
      thresholds: {
        statements: 91,
        branches: 78,
        functions: 100,
        lines: 96,
        // The stream matcher is new in P1 and held to the spec target from the start (P1 raises
        // the rest of the package to the same level, phases.md).
        'src/matcher/**/*.ts': { statements: 95, branches: 95, functions: 95, lines: 95 },
      },
    },
  },
});
