# Architecture Decisions Record (DECISIONS.md)

### ADR 001: Preact and @preact/signals
- **Context:** Need Monkeytype-level instant keystroke response while keeping JS bundle ≤ 35 KB gzip.
- **Decision:** Use Preact with `@preact/signals`.
- **Justification:** Preact weighs ~4 KB gzip, and signals allow bypass of component tree re-renders for ultra-low latency keystroke updates.

### ADR 002: Tailwind CSS v4 CSS-First Configuration
- **Context:** Fast styling, small CSS bundle (≤ 10 KB limit), dynamic semantic tokens.
- **Decision:** Use `@tailwindcss/vite` with `@theme inline` mapping CSS variables from `shared/styles/tokens.css`.
- **Justification:** Eliminates `tailwind.config.ts`, leverages CSS variables for instant theme switching without runtime CSS-in-JS.

### ADR 003: Steiger for FSD Architecture Enforcement
- **Context:** Enforce strict Feature-Sliced Design layer hierarchy, public API boundaries, and prevent same-layer slice imports.
- **Decision:** Integrate `steiger` directly into `npm run lint` (`eslint . && steiger ./src`).
- **Justification:** Steiger is the official FSD linter, catching layer violations and unexported segment sidesteps reliably without complex AST resolver configurations.

### ADR 004: Node-based Font Subsetting (`subset-font`)
- **Context:** Self-hosted kana and UI fonts must meet ≤ 45 KB per woff2 limit without requiring a Python environment.
- **Decision:** Use `subset-font` in `scripts/subset-fonts.mjs` as a devDependency.
- **Justification:** Keeps all build/tooling within the Node/npm toolchain.

### ADR 005: Extended Katakana Row Prefix (`ext_`)
- **Context:** Avoid ID collisions between Gojūon rows and extended Katakana rows.
- **Decision:** Prefix all 5 extended katakana rows with `ext_` (`ext_fa`, `ext_va`, `ext_wi`, `ext_ti`, `ext_che`).
- **Justification:** Guarantees uniqueness across persistent row sets and clear identification.

### ADR 006: Sokuon Doubling and Standalone Fallback
- **Context:** Support both gemination (consonant doubling) and standalone `っ/ッ`.
- **Decision:** In `compile`, `っ/ッ` merges with the following consonant token, doubling its consonant (with `ch` -> `tch` in IME, `cch` in learner). If standalone, followed by vowels, `n`, `y`, or prompt end, it generates `['xtu', 'ltu', 'xtsu']`.
- **Justification:** Matches Japanese IME behavior and prevents uncompletable states.

### ADR 007: Chōonpu (ー) Dual-Tier Matching
- **Context:** Handling long vowel marks across strictness levels.
- **Decision:** In IME mode, only `-` is accepted. In learner mode, both `-` and the preceding token's final vowel repeated (e.g. `ko-hi-` and `koohii`) are accepted.
- **Justification:** Respects Japanese IME keyboard output while accommodating learner phonetic typing habits.

### ADR 008: ん/ン Contextual Lookahead
- **Context:** Distinct rules for `n` vs `nn` / `n'`.
- **Decision:** In IME mode, `nn` and `n'` are always accepted, and bare `n` is accepted only when all spellings of the next token start with a consonant other than `n` or `y`. At the end of a prompt, only `nn` / `n'` are valid in IME mode. In learner mode, `n` is accepted everywhere.
- **Justification:** Accurately replicates MS IME / Google Japanese Input romaji conversion tables.

### ADR 009: Extended Katakana and Ambiguous Romaji Tier Placement
- **Context:** Standard Japanese IMEs convert specific digraphs to standard kana, while learners expect Hepburn/Kunrei alternatives. Per specification, any ambiguous spelling must be placed in `learner`, never `ime`.
- **Decisions & Justifications:**
  - **ウォ:** In standard MS IME, `wo` outputs `を/ヲ`, whereas `who` outputs `ウォ`. Decision: `who` in `ime`, `wo` and `uxo` in `learner`.
  - **ティ:** In standard MS IME, `ti` outputs `ち`, whereas `thi` outputs `ティ`. Decision: `thi` in `ime`, `ti` and `texi` in `learner`.
  - **ディ:** In standard MS IME, `di` outputs `ぢ`, whereas `dhi` outputs `ディ`. Decision: `dhi` in `ime`, `di` and `dexi` in `learner`.
  - **トゥ:** In standard MS IME, `tu` outputs `つ`, whereas `twu` outputs `トゥ`. Decision: `twu` in `ime`, `tu` and `toxu` in `learner`.
  - **ドゥ:** In standard MS IME, `du` outputs `づ`, whereas `dwu` outputs `ドゥ`. Decision: `dwu` in `ime`, `du` and `doxu` in `learner`.
  - **テュ:** Decision: `thu` in `ime`, `texyu` in `learner`.
  - **デュ:** Decision: `dhu` in `ime`, `dexyu` in `learner`.
  - **シェ:** Decision: `she` in `ime`, `sye` and `sixe` in `learner`.
  - **ジェ:** Decision: `je` in `ime`, `zye`, `jye`, and `zixe` in `learner`.
  - **チェ:** Decision: `che` in `ime`, `tye`, `cye`, and `tixe` in `learner`.
  - **ファ, フィ, フェ, フォ:** Decision: `fa, fi, fe, fo` in `ime`; `fua, fui, fue, fuo` in `learner`.
  - **ヴァ, ヴィ, ヴ, ヴェ, ヴォ:** Decision: `va, vi, vu, ve, vo` in `ime`; `buxa, buxi, buxe, buxo` in `learner`.
  - **ぢ:** Decision: `di` in `ime`; `ji`, `zi`, `dzi` in `learner`.
  - **づ:** Decision: `du` in `ime`; `zu`, `dzu` in `learner`.
  - **を:** Decision: `wo` in `ime`; `o` in `learner`.
  - **ちゃ, ちゅ, ちょ:** Decision: `cha, chu, cho` and `tya, tyu, tyo` in `ime`; `cya, cyu, cyo` in `learner`.
  - **じゃ, じゅ, じょ:** Decision: `ja, ju, jo`, `zya, zyu, zyo`, and `jya, jyu, jyo` in `ime`; `dya, dyu, dyo` in `learner`.
