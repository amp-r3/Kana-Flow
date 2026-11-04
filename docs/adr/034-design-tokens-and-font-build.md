# ADR 034: Design Tokens and Font Build

- **Status:** In force. Refines [ADR 031](031-adopt-the-nekotype-design-system.md) and [ADR 032](032-font-weights-for-the-design-system.md), and replaces the font estimate of ADR 032 with measured figures.
- **Context:** The first P2 item replaces the palette, type and fonts before any screen is redesigned. The previous font script built only Noto Sans JP, silently skipped it without a source file, and did not build JetBrains Mono at all. The standard Noto subset of weight 400 measured 61.96 KB against the 45 KB limit because of OpenType feature closure. The exported Golos Text and JetBrains Mono lacked glyphs the interface uses (`←`, `→`, `✕`, Cyrillic in Mono, `ū`, `ō`, `é`).
- **Decision:**
  - **Tokens by hand.** `shared/styles/tokens.css` holds all colours, scales and text styles of `docs/design/source/tokens.json`. `tokens.test.ts` fails when a value differs. A generator was rejected: the export has one theme and changes rarely, and a generator needs a build step plus either a generated file in git or a build that depends on `docs/`.
  - **Tailwind defaults cleared.** The colour, text, font, radius, shadow, easing, animation and breakpoint sets are `initial`, so a class outside the scale produces no CSS. The same test lists the old and removed classes and fails on them in `*.tsx`. Only `sm` (640 px) remains as a breakpoint.
  - **Pinned font sources.** `scripts/subset-fonts.mjs` downloads the variable fonts from `google/fonts@2fe1e8c`, checks a SHA-256 and fails on a mismatch or a network error. It instances `wght` and sets `noLayoutClosure` (which also drops the JetBrains Mono ligatures that could join romaji such as `->`). CI does not build fonts: the `woff2` files are committed.
  - **Glyph sets.** Noto Sans JP: `glyphs.txt` (kana, words, phrases) plus `、。・` and `０–９`. JetBrains Mono: U+0020–007E, Cyrillic, `←→✕`. Golos Text: the same Latin and Cyrillic plus `ūōé←→·…—–«»×№`.
  - **No synthetic weights.** `font-synthesis: none`; `font-bold` is removed from kana.
  - **All five files are first load.** `/` uses every face, so lazy loading gains nothing. Font preload stays with the P2 text-stream item.
  - **SVG in the budget.** `check-budget.mjs` counts SVG assets of the initial chunk (the logo lockup is above Vite's inline limit) in the first load.
- **Measured:** Fonts 61.05 KB (Golos 9.38 and 9.55, JetBrains Mono 10.66 and 10.69, Noto 20.77); first load 94.69 KB gzip (HTML 0.30, JS 26.71, CSS 5.19, logo 1.45, fonts 61.05). ADR 032 estimated about 116 KB.
- **Consequences:** A class missing from the scale disappears silently, which the test guards. The prompt zone is 960 px wide until the P2 text stream replaces it. Cards, borders and fills are removed now, without changing the DOM.
