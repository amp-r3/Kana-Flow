import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ROUTE_PATHS } from './route-paths';

const redirects = readFileSync(
  fileURLToPath(new URL('../../public/_redirects', import.meta.url)),
  'utf-8',
);

describe('_redirects: every screen but / opens the single page application', () => {
  const rules = redirects
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))
    .map((line) => line.split(/\s+/));

  it('rewrites each known route to /index.html with status 200, and nothing else', () => {
    const expected = ROUTE_PATHS.filter((path) => path !== '/');
    expect(rules.map((rule) => rule[0])).toEqual(expected);
    for (const rule of rules) {
      expect(rule.slice(1)).toEqual(['/index.html', '200']);
    }
  });

  it('has no catch-all rule, so unknown paths and missing assets still answer 404', () => {
    expect(rules.some((rule) => rule[0]?.includes('*'))).toBe(false);
  });
});
