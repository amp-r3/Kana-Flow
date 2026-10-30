import { defineConfig } from 'steiger';
import fsd from '@feature-sliced/steiger-plugin';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    files: ['src/shared/styles/**', 'src/shared/assets/**'],
    rules: {
      'fsd/public-api': 'off',
    },
  },
  {
    rules: {
      // Disabled for phase-by-phase development so newly created domain entities
      // pass lint before features/widgets that consume them are implemented.
      'fsd/insignificant-slice': 'off',
    },
  },
]);
