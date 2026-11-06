import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// CI runs in the Playwright image (ADR 054). Its browsers are built for one version of Playwright,
// so the tag of the image must be the version that pnpm-lock.yaml installs.
const repoRoot = join(import.meta.dirname, '../../../..');

function lockedVersion(): string | undefined {
  const lock = readFileSync(join(repoRoot, 'pnpm-lock.yaml'), 'utf-8');
  return /^ {2}'@playwright\/test@(\d+\.\d+\.\d+)':/m.exec(lock)?.[1];
}

function imageVersion(): string | undefined {
  const workflow = readFileSync(join(repoRoot, '.github/workflows/deploy.yml'), 'utf-8');
  return /image: mcr\.microsoft\.com\/playwright:v(\d+\.\d+\.\d+)-/.exec(workflow)?.[1];
}

describe('CI container image', () => {
  it('has the version of @playwright/test that pnpm-lock.yaml installs', () => {
    const locked = lockedVersion();
    expect(locked, '@playwright/test is not in pnpm-lock.yaml').toBeDefined();
    expect(
      imageVersion(),
      `Update the tag of the Playwright image in .github/workflows/deploy.yml to v${locked ?? '?'}`,
    ).toBe(locked);
  });
});
