import { readFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST_DIR = join(process.cwd(), 'dist');

if (!existsSync(DIST_DIR)) {
  console.error('Error: dist/ does not exist. Run build first.');
  process.exit(1);
}

const assetsDir = join(DIST_DIR, 'assets');
const assetFiles = existsSync(assetsDir) ? readdirSync(assetsDir) : [];

let totalInitialJsGzip = 0;
let totalInitialCssGzip = 0;
let totalPreloadedFontsRaw = 0;
let allFirstLoadBytes = 0;

console.log('--- Chunk Breakdown (Initial vs Lazy) ---');

// 1. HTML
const indexHtmlPath = join(DIST_DIR, 'index.html');
const indexHtmlContent = existsSync(indexHtmlPath) ? readFileSync(indexHtmlPath) : Buffer.alloc(0);
const indexHtmlGzip = gzipSync(indexHtmlContent).length;
allFirstLoadBytes += indexHtmlGzip;
console.log(
  `[initial] dist/index.html: ${(indexHtmlContent.length / 1024).toFixed(2)} KB (raw), ${(indexHtmlGzip / 1024).toFixed(2)} KB (gzip)`,
);

// 2. Assets (JS, CSS, fonts)
for (const file of assetFiles) {
  const filePath = join(assetsDir, file);
  const stats = statSync(filePath);
  if (!stats.isFile()) continue;

  const content = readFileSync(filePath);
  const rawSize = stats.size;
  const rawKb = (rawSize / 1024).toFixed(2);

  if (file.endsWith('.js')) {
    const isLazyChunk = file.includes('words') || file.includes('phrases');
    const gzipSize = gzipSync(content).length;
    const gzipKb = (gzipSize / 1024).toFixed(2);

    if (isLazyChunk) {
      console.log(`[lazy]    dist/assets/${file}: ${rawKb} KB (raw), ${gzipKb} KB (gzip)`);
    } else {
      console.log(`[initial] dist/assets/${file}: ${rawKb} KB (raw), ${gzipKb} KB (gzip)`);
      totalInitialJsGzip += gzipSize;
      allFirstLoadBytes += gzipSize;
    }
  } else if (file.endsWith('.css')) {
    const gzipSize = gzipSync(content).length;
    const gzipKb = (gzipSize / 1024).toFixed(2);
    console.log(`[initial] dist/assets/${file}: ${rawKb} KB (raw), ${gzipKb} KB (gzip)`);
    totalInitialCssGzip += gzipSize;
    allFirstLoadBytes += gzipSize;
  }
}

// 3. Preloaded fonts
// Fonts in src/assets/fonts/ (committed woff2s)
const fontFiles = [];
const fontsDir = join(process.cwd(), 'src/assets/fonts');
if (existsSync(fontsDir)) {
  for (const file of readdirSync(fontsDir)) {
    if (file.endsWith('.woff2')) {
      const stats = statSync(join(fontsDir, file));
      const rawSize = stats.size;
      fontFiles.push({ name: file, size: rawSize });
      totalPreloadedFontsRaw += rawSize;
      allFirstLoadBytes += rawSize;
      console.log(`[preload font] ${file}: ${(rawSize / 1024).toFixed(2)} KB (raw woff2)`);
    }
  }
}

const JS_BUDGET_KB = 35;
const CSS_BUDGET_KB = 10;
const FONT_BUDGET_KB = 45;
const TOTAL_BUDGET_KB = 160;

const totalJsKb = totalInitialJsGzip / 1024;
const totalCssKb = totalInitialCssGzip / 1024;
const totalFontsKb = totalPreloadedFontsRaw / 1024;
const totalFirstLoadKb = allFirstLoadBytes / 1024;

console.log('\n--- Size Budget Summary ---');
console.log(`Initial HTML (gzip):       ${(indexHtmlGzip / 1024).toFixed(2)} KB`);
console.log(`Initial JS (gzip):         ${totalJsKb.toFixed(2)} KB / ${JS_BUDGET_KB} KB limit`);
console.log(`Initial CSS (gzip):        ${totalCssKb.toFixed(2)} KB / ${CSS_BUDGET_KB} KB limit`);
console.log(
  `Preloaded Fonts (woff2):   ${totalFontsKb.toFixed(2)} KB (budget limit: ${FONT_BUDGET_KB} KB per file)`,
);
console.log(
  `Total First Load:          ${totalFirstLoadKb.toFixed(2)} KB / ${TOTAL_BUDGET_KB} KB limit`,
);

let failed = false;

if (totalJsKb > JS_BUDGET_KB) {
  console.error(
    `FAILED: Initial JS exceeded budget (${totalJsKb.toFixed(2)} KB > ${JS_BUDGET_KB} KB)`,
  );
  failed = true;
}

if (totalCssKb > CSS_BUDGET_KB) {
  console.error(
    `FAILED: Initial CSS exceeded budget (${totalCssKb.toFixed(2)} KB > ${CSS_BUDGET_KB} KB)`,
  );
  failed = true;
}

for (const font of fontFiles) {
  const fontKb = font.size / 1024;
  if (fontKb > FONT_BUDGET_KB) {
    console.error(
      `FAILED: Font ${font.name} exceeded budget (${fontKb.toFixed(2)} KB > ${FONT_BUDGET_KB} KB)`,
    );
    failed = true;
  }
}

if (totalFirstLoadKb > TOTAL_BUDGET_KB) {
  console.error(
    `FAILED: Total first load exceeded budget (${totalFirstLoadKb.toFixed(2)} KB > ${TOTAL_BUDGET_KB} KB)`,
  );
  failed = true;
}

if (failed) {
  process.exit(1);
} else {
  console.log('All size budgets passed!');
}
