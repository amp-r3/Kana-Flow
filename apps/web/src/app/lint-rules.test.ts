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

  it('rejects visible text and accessible names that are not from i18n', async () => {
    const text = await getLintErrors('export const A = () => <p>Hello there</p>;\n');
    expect(text.some((m) => m.message.includes('Visible text must come from shared/i18n'))).toBe(
      true,
    );
    const label = await getLintErrors('export const B = () => <button aria-label="Close" />;\n');
    expect(
      label.some((m) => m.message.includes('Accessible names must come from shared/i18n')),
    ).toBe(true);
    const prop = await getLintErrors('export const C = () => <Seg ariaLabel="Close" />;\n');
    expect(
      prop.some((m) => m.message.includes('Accessible names must come from shared/i18n')),
    ).toBe(true);
  });

  it('rejects a single letter as visible text', async () => {
    const messages = await getLintErrors('export const A = () => <b>{1}s</b>;\n');
    expect(
      messages.some((m) => m.message.includes('Visible text must come from shared/i18n')),
    ).toBe(true);
  });

  it('accepts text from t() and symbols without letters', async () => {
    const messages = await getLintErrors(
      "const t = (k: string) => k;\nexport const A = () => <p aria-label={t('a')}>{t('b')} ✕ 1</p>;\n",
    );
    expect(messages.filter((m) => m.ruleId === 'no-restricted-syntax')).toEqual([]);
  });

  it('rejects client imports of shared/schemas, content and api', async () => {
    const messages = await getLintErrors(
      "import a from '@nekotype/shared/schemas';\nimport b from '@nekotype/content';\nimport c from '@nekotype/api';\nexport const x = [a, b, c];\n",
    );
    expect(messages.filter((m) => m.ruleId === 'no-restricted-imports').length).toBe(3);
  });
});
