import { describe, it, expect } from 'vitest';
import { ESLint } from 'eslint';

describe('engine isolation (lint)', { timeout: 20000 }, () => {
  const eslint = new ESLint();

  async function ruleIds(code: string): Promise<(string | null)[]> {
    const [result] = await eslint.lintText(code, { filePath: 'src/engine.ts' });
    return (result?.messages ?? []).map((m) => m.ruleId);
  }

  it('rejects package and alias imports in the engine source', async () => {
    const ids = await ruleIds(
      "import { signal } from '@preact/signals';\nimport { x } from '@/shared/lib';\nimport { y } from 'node:fs';\nexport const z = [signal, x, y];\n",
    );
    expect(ids.filter((id) => id === 'no-restricted-imports').length).toBe(3);
  });

  it('rejects browser globals in the engine source', async () => {
    const ids = await ruleIds('export const z = window;\nexport const k = localStorage;\n');
    expect(ids.filter((id) => id === 'no-restricted-globals').length).toBe(2);
  });

  it('allows relative imports', async () => {
    const ids = await ruleIds(
      "import type { KanaKey } from './types';\nexport type K = KanaKey;\n",
    );
    expect(ids).not.toContain('no-restricted-imports');
  });
});
