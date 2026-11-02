import { createBaseConfig } from '../../eslint.base.js';

export default [
  ...createBaseConfig(import.meta.dirname),
  {
    // shared/runtime is imported by the client: it must not pull in schemas or valibot.
    files: ['src/runtime.ts', 'src/runtime/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['valibot', './schemas*', '../schemas*', '**/schemas'],
              message: 'shared/runtime must not import shared/schemas or valibot.',
            },
          ],
        },
      ],
    },
  },
];
