import { createBaseConfig } from '../../eslint.base.js';

// The engine runs in the browser and in a Worker: no DOM, signals, storage, app aliases
// or any package. Only relative imports are allowed in the source (tests may use vitest).
export default [
  ...createBaseConfig(import.meta.dirname),
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^[^.]',
              message: '@nekotype/engine must not import packages or aliases; use relative paths.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'indexedDB'].map(
          (name) => ({ name, message: '@nekotype/engine must not touch browser APIs.' }),
        ),
      ],
    },
  },
  {
    files: ['src/**/*.test.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
];
