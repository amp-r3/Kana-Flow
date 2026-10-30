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
  - **じゃ, じゅ, じょ:** Decision: `ja, ju, jo`, `zya, zyu, zyo`, and `jya, jyu, jyo` in `ime`; `learner: []` (`dya/dyu/dyo` removed as they represent ぢゃ/ぢゅ/ぢょ).

### ADR 010: Font Subsets and Included Weights
- **Context:** Meet strict size budgets (≤ 45 KB per font file) for both Japanese glyphs and UI typography.
- **Decision:**
  - **Noto Sans JP**: Single **Bold (700)** weight (`NotoSansJP-subset.woff2`, 16.45 KB), subsetted to the 157 kana, digraphs, and punctuation characters in `glyphs.txt`. Bold weight is chosen for maximum legibility on dark surfaces.
  - **JetBrains Mono / UI Monospace**: Single **Regular (400)** weight (`JetBrainsMono-subset.woff2`, 14.95 KB), subsetted to Basic Latin and Cyrillic glyphs.
- **Justification:** Avoids loading unused weights, keeping total font weight at 31.4 KB, well within the 160 KB total first-load budget.

### ADR 011: State Division and Storage Isolation (entities/kana vs entities/session)
- **Context:** Practice settings must persist across sessions, whereas active session keystrokes, phase, and running metrics must reset cleanly without cross-contamination.
- **Decision:**
  - Place `PracticeSettings` signal store in `entities/kana/model/store.ts` (manages row selection, script mode, content kind, strictness, weakFocus, with local storage debounce and pagehide flush).
  - Place `TestConfig`, `Phase`, keystroke events, and derived `SessionMetrics` in `entities/session/model/store.ts`.
  - Abstract storage behind `KeyValueStore` interface with `LocalStorageStore` (safe against private browsing / quota throws) and `MemoryKeyValueStore` (for tests/SSR).
- **Justification:** Follows FSD boundaries; practice configuration belongs to the kana domain entity, while test execution state belongs to session lifecycle.

### ADR 012: Pure Weight Decay and Mistake-Based Kana Mastery Model (entities/progress)
- **Context:** User kana accuracy must inform weighted random selection during `weakFocus` practice mode, decaying historical attempts over time.
- **Decision:**
  - Implement pure functions in `entities/progress/lib/weights.ts`: `computeWeakness`, `computeWeight`, `computeWeights`, `computeItemWeight`, `decayStats`, and `updateKanaStats`.
  - Exactly implement Plan v1.1 section 8 formula: `weakness = (m + 1) / (a + 2)`, `weight = 1 + 4 * weakness`. Unseen kana (`a === 0`) naturally evaluates to `weakness = 1/2 = 0.5` -> `weight = 1 + 4 * 0.5 = 3.0` so new material is introduced.
  - Weight computation is strictly mistake-based in v1; latency `t` is stored via EMA (alpha = 0.3) for future extensibility but unused for prompt weighting.
  - Item weight for words/phrases is the arithmetic mean of its tokens' kana weights (`computeItemWeight`).
  - Decay halves attempts `a` and mistakes `m` when attempts `a > 50` (`Math.floor(a / 2)`), keeping stats recent.
- **Justification:** Exact adherence to Plan v1.1 section 8 specifications; deterministic and lightweight.

### ADR 013: Trailing Extension Absorption and Desktop Input Normalization (features/type-prompt)
- **Context:** Fast typists transitioning from a word ending in single `n` (e.g. `パン`) to a word beginning with `n` (e.g. `ねこ`) or double-tapping `n` within 250ms must not suffer false-positive rejections.
- **Decision:**
  - Implement pure `shouldAbsorb(extensions, completedAt, now, key, windowMs = 250)`.
  - In `TypingController`, if `extensions.size > 0` upon completion, record `lastCompletedAt`. If the subsequent key falls within the absorption window and matches an extension, swallow it silently without recording a keystroke or advancing the buffer.
  - `handleKeyDown` in `input-adapter.ts` maps `event.code` (e.g. `KeyA` .. `KeyZ`) to Latin characters when non-Latin keyboard layouts (e.g. Russian Cyrillic `KeyF` -> `a`) are active, while ignoring IME compositions (`isComposing`) and modifier combinations (`ctrl`, `meta`, `alt`).
- **Justification:** Provides Monkeytype-grade input feel and eliminates input layout friction for international users.

### ADR 014: Deviation Audit and Alignment with Plan v1.1
- **Context:** Review and resolve all differences between intermediate prototype implementations and the authoritative `kana-flow-implementation-plan.md` (v1.1).
- **Audit & Decisions:**
  1. **`compile` Signature & Reading Hints:** Restored `compile(prompt: PromptItem, strictness: Strictness)`. Digraph and kana tables define base pronunciation; `readingHints` on `PromptItem` are applied strictly in `learner` mode at the designated `tokenIndex`. `は` accepts only `ha` across both modes by default; `こんにちは` accepts `wa` strictly via its attached readingHint (`はな` rejects `wana`).
  2. **Prompt Picker API & Filtering:** Restored `buildPool(settings, content?)` and `pickPrompt(pool, weights, rng, previousKey)`. For words and phrases, filtering is governed strictly by `script` (`hiragana` -> hiragana items, `katakana` -> katakana items, `both` -> all); selected rows are ignored for content items per section 5.5. No immediate repeat when `pool.length > 1`.
  3. **Weight Computation Formula:** Removed latency step functions; aligned with pure formula `weakness = (m + 1) / (a + 2)` and `weight = 1 + 4 * weakness`, giving unseen kana weight 3.0. Added `computeItemWeight` for word/phrase prompts.
  4. **Injectable Scheduler in TypingController:** Abstracted `setTimeout`/`setInterval` behind an injectable `Scheduler` interface (`defaultScheduler` in `shared/lib`, `FakeScheduler` in tests). The controller owns the deadline timer, 1 Hz live stats ticker, shake flag clearing (~280 ms), and automatically ends count tests upon the final prompt.
  5. **Decoupled Live Stats Counters:** Live stats display reads cheap atomic signals (`correctKeystrokes`, `mistakeCount`, `sessionStartedAt`, and controller `tickerNow`) rather than executing expensive `computeMetrics` on every keystroke. Full `metrics` is computed once, on session finish.
  6. **Side Effect Separation for Locale:** Removed DOM mutation (`document.documentElement.lang`) from `shared/i18n/locale.ts` and placed reactive effect inside `app/init.ts`, keeping `shared/` pure of UI side effects.
