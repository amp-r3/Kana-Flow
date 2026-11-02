import { describe, it, expect } from 'vitest';
import { ESLint } from 'eslint';
import { isObject, isTestConfig, isKanaStats } from './runtime';

describe('shared/runtime guards', () => {
  it('isObject accepts plain objects only', () => {
    expect(isObject({})).toBe(true);
    expect(isObject(null)).toBe(false);
    expect(isObject([])).toBe(false);
    expect(isObject('x')).toBe(false);
  });

  it('isTestConfig accepts only the allowed durations and counts', () => {
    expect(isTestConfig({ kind: 'time', seconds: 60 })).toBe(true);
    expect(isTestConfig({ kind: 'count', prompts: 25 })).toBe(true);
    expect(isTestConfig({ kind: 'time', seconds: 45 })).toBe(false);
    expect(isTestConfig({ kind: 'count', prompts: 7 })).toBe(false);
    expect(isTestConfig({ kind: 'zen' })).toBe(false);
  });

  it('isKanaStats requires numeric a, m and t', () => {
    expect(isKanaStats({ a: 1, m: 0, t: 300 })).toBe(true);
    expect(isKanaStats({ a: '1', m: 0, t: 300 })).toBe(false);
    expect(isKanaStats({ a: 1, m: 0 })).toBe(false);
  });
});

describe('shared/runtime import restrictions', { timeout: 20000 }, () => {
  const eslint = new ESLint();

  it('rejects importing valibot or schemas', async () => {
    const [result] = await eslint.lintText(
      "import { object } from 'valibot';\nimport { s } from './schemas';\nexport const x = [object, s];\n",
      { filePath: 'src/runtime.ts' },
    );
    const hits = (result?.messages ?? []).filter((m) => m.ruleId === 'no-restricted-imports');
    expect(hits.length).toBe(2);
  });
});
