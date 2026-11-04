# ADR 032: Font Weights for the Design System

- **Status:** In force. Supersedes [ADR 010](010-font-subsets-and-included-weights.md) when the design-system fonts land in P2.
- **Context:** The [design system](031-adopt-the-nekotype-design-system.md) adds Golos Text for the interface and asks for eight weights: Golos 400/500/600, JetBrains Mono 300/400/500, Noto Sans JP 400/500. Golos measures about 56 KB for its three weights (`@fontsource/golos-text` 5.3.0, Cyrillic and Latin, not subsetted). With the other fonts estimated from the current subsets, the full set is about 134 KB, and first load reaches about 166 KB against the 160 KB budget before any P2 code.
- **Decision:**
  - **Golos Text:** 400 and 500, subsetted to Basic Latin and Cyrillic.
  - **JetBrains Mono:** 400 and 500.
  - **Noto Sans JP:** 400, kana subset, replacing 700.
  - The styles that used other weights change: `mono-hero` to 400, `ui-heading` to 500, `jp-vertical` to 400.
- **Justification:** The estimate falls to about 84 KB of fonts and about 116 KB of first load, leaving room for P2 code. `check-budget.mjs` confirms the real figures when the fonts land. Alternatives rejected: all eight weights (over budget); a single weight per family (loses the hierarchy between labels and body text).
