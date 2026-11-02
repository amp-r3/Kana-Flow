import boundaries from 'eslint-plugin-boundaries';
import { createBaseConfig } from '../../eslint.base.js';

// Feature-Sliced Design layers are enforced on top of the shared strict base config.
export default [
  ...createBaseConfig(import.meta.dirname),
  {
    files: ['src/**/*.{ts,tsx}'],
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
];
