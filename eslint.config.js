import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'legacy/**',
      'node_modules/**',
      'coverage/**',
      'scripts/font-src/**',
      'src/assets/fonts/**',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [...tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error',
    },
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        {
          type: 'app',
          pattern: 'src/app/**',
          partialMatch: false,
        },
        {
          type: 'pages',
          pattern: 'src/pages/*',
          capture: ['slice'],
        },
        {
          type: 'widgets',
          pattern: 'src/widgets/*',
          capture: ['slice'],
        },
        {
          type: 'features',
          pattern: 'src/features/*',
          capture: ['slice'],
        },
        {
          type: 'entities',
          pattern: 'src/entities/*',
          capture: ['slice'],
        },
        {
          type: 'shared',
          pattern: 'src/shared/**',
          partialMatch: false,
        },
      ],
      'boundaries/include': ['src/**/*'],
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'never',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
        },
      ],
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportAllDeclaration',
          message: 'Export * is forbidden. Use explicit named re-exports.',
        },
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Export default is forbidden except in config files.',
        },
      ],
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'app' } },
              allow: [
                {
                  to: {
                    element: {
                      type: ['app', 'pages', 'widgets', 'features', 'entities', 'shared'],
                    },
                  },
                },
              ],
            },
            {
              from: { element: { type: 'pages' } },
              allow: [
                {
                  to: {
                    element: { type: ['widgets', 'features', 'entities', 'shared'] },
                  },
                },
                {
                  to: {
                    element: {
                      type: 'pages',
                      captured: { slice: '{{from.captured.slice}}' },
                    },
                  },
                },
              ],
            },
            {
              from: { element: { type: 'widgets' } },
              allow: [
                {
                  to: {
                    element: { type: ['features', 'entities', 'shared'] },
                  },
                },
                {
                  to: {
                    element: {
                      type: 'widgets',
                      captured: { slice: '{{from.captured.slice}}' },
                    },
                  },
                },
              ],
            },
            {
              from: { element: { type: 'features' } },
              allow: [
                {
                  to: {
                    element: { type: ['entities', 'shared'] },
                  },
                },
                {
                  to: {
                    element: {
                      type: 'features',
                      captured: { slice: '{{from.captured.slice}}' },
                    },
                  },
                },
              ],
            },
            {
              from: { element: { type: 'entities' } },
              allow: [
                {
                  to: {
                    element: { type: 'shared' },
                  },
                },
                {
                  to: {
                    element: {
                      type: 'entities',
                      captured: { slice: '{{from.captured.slice}}' },
                    },
                  },
                },
              ],
            },
            {
              from: { element: { type: 'shared' } },
              allow: [
                {
                  to: {
                    element: { type: 'shared' },
                  },
                },
              ],
            },
            {
              disallow: [
                {
                  to: {
                    element: {
                      type: ['pages', 'widgets', 'features', 'entities'],
                      captured: { slice: '!{{from.captured.slice}}' },
                    },
                    target: '!index.ts',
                  },
                  message: 'A slice can only be imported via its public index.ts',
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.config.*', 'scripts/**/*'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
);
