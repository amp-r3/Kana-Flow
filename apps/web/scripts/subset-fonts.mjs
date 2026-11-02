import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import subsetFont from 'subset-font';

import { allKanaRows } from '@nekotype/engine';
import { wordsData } from '../src/entities/kana/model/data/words.ts';
import { phrasesData } from '../src/entities/kana/model/data/phrases.ts';

const chars = new Set();

// Special / combo chars from plan section 11.3
const mandatoryChars = 'ーっッゃゅょャュョァィゥェォ';
for (const ch of mandatoryChars) {
  chars.add(ch);
}

for (const row of allKanaRows) {
  for (const entry of row.entries) {
    if (entry.hiragana) {
      for (const ch of entry.hiragana) chars.add(ch);
    }
    for (const ch of entry.katakana) chars.add(ch);
  }
}

for (const w of wordsData) {
  for (const ch of w.text) chars.add(ch);
}

for (const p of phrasesData) {
  for (const ch of p.text) chars.add(ch);
}

const sortedGlyphs = Array.from(chars).sort().join('');
const glyphsPath = join(process.cwd(), 'glyphs.txt');
writeFileSync(glyphsPath, sortedGlyphs, 'utf-8');
console.log(`Updated glyphs.txt (${chars.size} glyphs)`);

const fontSrcDir = join(process.cwd(), 'scripts/font-src');
const notoSansSrc = join(fontSrcDir, 'NotoSansJP.ttf');
const fontsOutputDir = join(process.cwd(), 'src/assets/fonts');

if (!existsSync(fontsOutputDir)) {
  mkdirSync(fontsOutputDir, { recursive: true });
}

if (existsSync(notoSansSrc)) {
  const fontBuffer = readFileSync(notoSansSrc);
  const subsetWoff2 = await subsetFont(fontBuffer, sortedGlyphs, { targetFormat: 'woff2' });
  writeFileSync(join(fontsOutputDir, 'NotoSansJP-subset.woff2'), subsetWoff2);
  console.log(`Generated NotoSansJP-subset.woff2 (${(subsetWoff2.length / 1024).toFixed(2)} KB)`);
} else {
  console.log('scripts/font-src/NotoSansJP.ttf not found. Committed font files remain unchanged.');
}
