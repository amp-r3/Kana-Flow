import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { isObject } from '@nekotype/shared/runtime';

const read = (rel: string): string =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

const tokensCss = read('./tokens.css');
const tokensJson: unknown = JSON.parse(read('../../../../../docs/design/source/tokens.json'));

// "--name: value;" pairs; whitespace and quote style are normalised.
const norm = (v: string): string => v.replace(/\s+/g, ' ').replace(/"/g, "'").trim();
const cssVars = new Map<string, string>();
for (const m of tokensCss.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
  const [, name, value] = m;
  if (name !== undefined && value !== undefined) cssVars.set(name, norm(value));
}

const asList = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string => {
  if (typeof v !== 'string') throw new Error(`expected a string, got ${typeof v}`);
  return v;
};
const section = (key: string): Record<string, unknown> => {
  if (!isObject(tokensJson)) throw new Error('tokens.json is not an object');
  const s = tokensJson[key];
  if (!isObject(s)) throw new Error(`tokens.json has no ${key}`);
  return s;
};
const alias = (v: string): string => v.replace(/^\{(.+)\}$/, 'var(--$1)');

function expectVar(name: string, value: string): void {
  expect(cssVars.get(`--${name}`), `--${name}`).toBe(norm(value));
}

describe('tokens.css matches docs/design/source/tokens.json', () => {
  it('colours', () => {
    const list = asList(section('color')['tokens']);
    expect(list.length).toBeGreaterThan(30);
    for (const token of list) {
      if (!isObject(token) || !isObject(token['value'])) throw new Error('bad colour token');
      expectVar(str(token['name']), alias(str(token['value']['dark'])));
    }
  });

  it('scales', () => {
    for (const key of ['spacing', 'radius', 'stroke', 'layout', 'duration', 'easing']) {
      const list = asList(section(key)['tokens']);
      expect(list.length, key).toBeGreaterThan(0);
      for (const token of list) {
        if (!isObject(token)) throw new Error(`bad ${key} token`);
        expectVar(str(token['name']), str(token['value']));
      }
    }
  });

  it('font families and text styles', () => {
    const type = section('type');
    const families = type['families'];
    if (!isObject(families)) throw new Error('no font families');
    for (const [name, value] of Object.entries(families)) expectVar(`font-${name}`, str(value));

    let styles = 0;
    for (const group of asList(type['groups'])) {
      if (!isObject(group)) throw new Error('bad group');
      for (const style of asList(group['styles'])) {
        if (!isObject(style)) throw new Error('bad style');
        const name = str(style['name']);
        expectVar(`text-${name}`, str(style['fontSize']));
        expectVar(`text-${name}--line-height`, str(style['lineHeight']));
        expectVar(`text-${name}--font-weight`, String(style['fontWeight']));
        const spacing = style['letterSpacing'];
        if (spacing === undefined) {
          expect(cssVars.has(`--text-${name}--letter-spacing`), name).toBe(false);
        } else {
          expectVar(`text-${name}--letter-spacing`, str(spacing));
        }
        styles += 1;
      }
    }
    expect(styles).toBe(19);
  });
});
