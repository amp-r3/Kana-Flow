import { defineConfig } from 'steiger';
import fsd from '@feature-sliced/steiger-plugin';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // The spec names the entities slices prompt, session, settings, stats, learn and user
    // (docs/spec/frontend.md); the rule would force one grammatical number on all of them.
    rules: {
      'fsd/inconsistent-naming': 'off',
    },
  },
  {
    files: ['src/shared/styles/**', 'src/shared/assets/**'],
    rules: {
      'fsd/public-api': 'off',
    },
  },
]);
