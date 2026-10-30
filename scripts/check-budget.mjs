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
let fontFiles = [];
let allFirstLoadBytes = 0;

// Read dist/index.html to find initial entry chunks
const indexHtmlPath = join(DIST_DIR, 'index.html');
const indexHtmlContent = existsSync(indexHtmlPath) ? readFileSync(indexHtmlPath) : Buffer.alloc(0);
const indexHtmlGzip = gzipSync(indexHtmlContent).length;
allFirstLoadBytes += indexHtmlGzip;

for (const file of assetFiles) {
  const filePath = join(assetsDir, file);
  const stats = statSync(filePath);
  if (!stats.isFile()) continue;

  const content = readFileSync(filePath);

  if (file.endsWith('.js')) {
    // Exclude dynamically imported content chunks from first-load JS budget
    const isLazyChunk = file.includes('words') || file.includes('phrases');
    const gzipSize = gzipSync(content).length;
    if (!isLazyChunk) {
      totalInitialJsGzip += gzipSize;
      allFirstLoadBytes += gzipSize;
    }
  } else if (file.endsWith('.css')) {
    const gzipSize = gzipSync(content).length;
    totalInitialCssGzip += gzipSize;
    allFirstLoadBytes += gzipSize;
  } else if (file.endsWith('.woff2')) {
    // woff2 is already compressed; budget is <= 45 KB per file
    const rawSize = stats.size;
    fontFiles.push({ name: file, size: rawSize });
    allFirstLoadBytes += rawSize;
  }
}

// Also check font files in public or src/assets/fonts if applicable
const fontsDir = join(process.cwd(), 'src/assets/fonts');
if (existsSync(fontsDir)) {
  for (const file of readdirSync(fontsDir)) {
    if (file.endsWith('.woff2') && !fontFiles.some(f => f.name === file)) {
      const stats = statSync(join(fontsDir, file));
      fontFiles.push({ name: file, size: stats.size });
      // If not already in dist, include in font budget check
    }
  }
}

const JS_BUDGET_KB = 35;
const CSS_BUDGET_KB = 10;
const FONT_BUDGET_KB = 45;
const TOTAL_BUDGET_KB = 160;

const totalJsKb = totalInitialJsGzip / 1024;
const totalCssKb = totalInitialCssGzip / 1024;
const totalFirstLoadKb = allFirstLoadBytes / 1024;

console.log('--- Size Budget Verification ---');
console.log(`Initial JS (gzip): ${totalJsKb.toFixed(2)} KB / ${JS_BUDGET_KB} KB limit`);
console.log(`Initial CSS (gzip): ${totalCssKb.toFixed(2)} KB / ${CSS_BUDGET_KB} KB limit`);

let failed = false;

if (totalJsKb > JS_BUDGET_KB) {
  console.error(`FAILED: Initial JS exceeded budget (${totalJsKb.toFixed(2)} KB > ${JS_BUDGET_KB} KB)`);
  failed = true;
}

if (totalCssKb > CSS_BUDGET_KB) {
  console.error(`FAILED: Initial CSS exceeded budget (${totalCssKb.toFixed(2)} KB > ${CSS_BUDGET_KB} KB)`);
  failed = true;
}

for (const font of fontFiles) {
  const fontKb = font.size / 1024;
  console.log(`Font [${font.name}]: ${fontKb.toFixed(2)} KB / ${FONT_BUDGET_KB} KB limit`);
  if (fontKb > FONT_BUDGET_KB) {
    console.error(`FAILED: Font ${font.name} exceeded budget (${fontKb.toFixed(2)} KB > ${FONT_BUDGET_KB} KB)`);
    failed = true;
  }
}

console.log(`Total first load: ${totalFirstLoadKb.toFixed(2)} KB / ${TOTAL_BUDGET_KB} KB limit`);
if (totalFirstLoadKb > TOTAL_BUDGET_KB) {
  console.error(`FAILED: Total first load exceeded budget (${totalFirstLoadKb.toFixed(2)} KB > ${TOTAL_BUDGET_KB} KB)`);
  failed = true;
}

if (failed) {
  process.exit(1);
} else {
  console.log('All size budgets passed!');
}
