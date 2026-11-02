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
      // Spec target for the engine (docs/spec/quality.md): 95% lines and branches. The package
      // measures 100% after P1; the thresholds leave room for a defensive branch, not for a gap.
      thresholds: { statements: 95, branches: 95, functions: 95, lines: 95 },
    },
  },
});
