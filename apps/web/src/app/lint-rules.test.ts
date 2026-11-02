import { describe, it, expect } from 'vitest';
import { ESLint } from 'eslint';

describe('lint-rules: strict TypeScript and architecture enforcement', { timeout: 20000 }, () => {
  const eslint = new ESLint();

  async function getLintErrors(code: string) {
    const [result] = await eslint.lintText(code, { filePath: 'src/app/main.tsx' });
    return result?.messages ?? [];
  }

  it('rejects any type', async () => {
    const messages = await getLintErrors('export const x: any = 1;\n');
    expect(messages.some((m) => m.ruleId === '@typescript-eslint/no-explicit-any')).toBe(true);
  });

  it('rejects "as T" type assertions', async () => {
    const messages = await getLintErrors('export const x = 1 as number;\n');
    expect(messages.some((m) => m.ruleId === '@typescript-eslint/consistent-type-assertions')).toBe(
      true,
    );
  });

  it('rejects @ts-ignore comments', async () => {
    const messages = await getLintErrors('// @ts-ignore\nexport const x = 1;\n');
    expect(messages.some((m) => m.ruleId === '@typescript-eslint/ban-ts-comment')).toBe(true);
  });

  it('rejects non-null assertion !', async () => {
    const messages = await getLintErrors('const y: number | null = 1;\nexport const x = y!;\n');
    expect(messages.some((m) => m.ruleId === '@typescript-eslint/no-non-null-assertion')).toBe(
      true,
    );
  });

  it('rejects export default', async () => {
    const messages = await getLintErrors('const x = 1;\nexport default x;\n');
    expect(
      messages.some(
        (m) =>
          m.ruleId === 'no-restricted-syntax' && m.message.includes('Export default is forbidden'),
      ),
    ).toBe(true);
  });

  it('rejects export * wildcard exports', async () => {
    const messages = await getLintErrors('export * from "./App";\n');
    expect(
      messages.some(
        (m) => m.ruleId === 'no-restricted-syntax' && m.message.includes('Export * is forbidden'),
      ),
    ).toBe(true);
  });

  it('rejects inline eslint-disable directives', async () => {
    const messages = await getLintErrors('/* eslint-disable */\nexport const x = 1;\n');
    expect(messages.some((m) => m.message.includes('noInlineConfig'))).toBe(true);
  });

  it('rejects client imports of shared/schemas, content and api', async () => {
    const messages = await getLintErrors(
      "import a from '@nekotype/shared/schemas';\nimport b from '@nekotype/content';\nimport c from '@nekotype/api';\nexport const x = [a, b, c];\n",
    );
    expect(messages.filter((m) => m.ruleId === 'no-restricted-imports').length).toBe(3);
  });
});
