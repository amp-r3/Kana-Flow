import type { ContentItem } from '../model/types';

export async function loadContent(kind: 'words' | 'phrases'): Promise<readonly ContentItem[]> {
  if (kind === 'words') {
    const module = await import('../model/data/words');
    return module.wordsData;
  }
  const module = await import('../model/data/phrases');
  return module.phrasesData;
}
