import { describe, it, expect } from 'vitest';
import { loadContent } from './content-loader';

describe('content-loader', () => {
  it('dynamically loads words data', async () => {
    const words = await loadContent('words');
    expect(words.length).toBeGreaterThan(0);
    expect(words[0]?.id).toMatch(/^word:/);
  });

  it('dynamically loads phrases data', async () => {
    const phrases = await loadContent('phrases');
    expect(phrases.length).toBeGreaterThan(0);
    expect(phrases[0]?.id).toMatch(/^phrase:/);
  });
});
