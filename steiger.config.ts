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
]);
