# ADR 010: Font Subsets and Included Weights

- **Status:** Superseded by [ADR 032](032-font-weights-for-the-design-system.md) when the design-system fonts land in P2.
- **Context:** Meet strict size budgets (≤ 45 KB per font file) for both Japanese glyphs and UI typography.
- **Decision:**
  - **Noto Sans JP**: Single **Bold (700)** weight (`NotoSansJP-subset.woff2`, 16.45 KB), subsetted to the 157 kana, digraphs, and punctuation characters in `glyphs.txt`. Bold weight is chosen for maximum legibility on dark surfaces.
  - **JetBrains Mono / UI Monospace**: Single **Regular (400)** weight (`JetBrainsMono-subset.woff2`, 14.95 KB), subsetted to Basic Latin and Cyrillic glyphs.
- **Justification:** Avoids loading unused weights, keeping total font weight at 31.4 KB, well within the 160 KB total first-load budget.
