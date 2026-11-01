> **Scope.** Describes the v1 baseline code in `src/`. Where it disagrees with the [MVP specification](../spec/README.md), the specification applies; this document is rewritten as the MVP phases land (spec item D21).

# Nekotype Architecture Documentation

Nekotype is a high-performance, keyboard-first Japanese kana speed trainer engineered around a Non-deterministic Finite Automaton (NFA) romaji engine, fine-grained Preact signals, and strict Feature-Sliced Design (FSD) architecture.

---

## 1. Architectural Layers & Import Boundaries (FSD)

The codebase strictly adheres to **Feature-Sliced Design (v2.1)** conventions and is continuously validated by `steiger` alongside TypeScript compiler checks:

```
src/
├── app/                  # Application root, initialization, global styles, providers
├── pages/                # Composed full-page views (TrainerPage)
├── features/             # User interaction workflows (type-prompt)
├── entities/             # Core domain models and business state (kana, session, progress)
└── shared/               # Reusable primitives, UI components, i18n, storage, and utility libraries
```

### Import Rules & Layer Hierarchy

1. **Unidirectional Dependency Flow:** Slices in higher layers may import slices from lower layers only (`app` → `pages` → `features` → `entities` → `shared`). Lower layers NEVER import from higher layers.
2. **No Same-Layer Cross-Slice Imports:** Slices within the same layer (e.g. `entities/kana` and `entities/session`) must never import from each other. They interact through compositional coordination in higher layers (`features/type-prompt` or `pages/trainer`).
3. **Public API Facades:** All inter-slice imports must resolve through the target slice's root `index.ts` public re-export file. Deep internal imports (e.g. `@/entities/kana/model/data/basic`) are forbidden and rejected by lint checks.
4. **Zero-Assertion TypeScript:** The entire codebase operates under maximum strictness: zero `any`, zero `as T` type assertions, zero non-null assertions (`!`), and zero `@ts-ignore` or `eslint-disable` directives.

### Widgets Layer Consolidation

Under standard FSD, the `widgets/` layer hosts multi-slice compositional blocks. The FSD linter (`steiger`) enforces `fsd/insignificant-slice`, requiring slices to have more than one consumer across the application. Because `pages/trainer` is currently the sole full-page route, all trainer-specific widgets (`TopBar`, `ConfigBar`, `TestStage`, `ResultsPanel`, `RowsDialog`, `LiveStatsStrip`, `SpeedChart`, `WeakestKanaList`) were consolidated into `src/pages/trainer/ui/` as page-internal UI components.

> [!NOTE]
> **When to Extract Widgets:** If a second full-page view is introduced (such as a historical stats dashboard, custom word list editor, or flashcard review page) that reuses these UI blocks, extract them back into `src/widgets/<widget-name>/` with their own public APIs.

---

## 2. Two-Tier Romaji Spelling Model

Typing Japanese romaji involves substantial ambiguity between formal IME keystrokes and intuitive learner romanizations. Nekotype solves this with a deterministic two-tier model:

| Level      | Name             | Description                                                                                                                                                         |
| ---------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tier 1** | **Strict IME**   | Exact keystroke sequences accepted by Microsoft IME and Google Japanese Input on Japanese keyboard layouts. Rejects invalid shortcuts (e.g. `koohii` for コーヒー). |
| **Tier 2** | **Learner Mode** | Accepts all Strict IME spellings **plus** common phonetic romanizations (Hepburn, Kunrei-shiki, Nihon-shiki, digraph variants, and vowel-lengthening alternatives). |

### Ambiguous Romaji Resolution Table

| Kana                           | Strict IME Keystrokes                          | Learner Mode Additional Keystrokes                               | Design Rationale                                                                           |
| ------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **を**                         | `wo`                                           | `o`                                                              | Standard IME requires `wo` to produce を; `o` produces お. Learners frequently expect `o`. |
| **ぢ**                         | `di`                                           | `ji`, `zi`, `dzi`                                                | In standard IME, `ji` produces じ. `di` produces ぢ.                                       |
| **づ**                         | `du`                                           | `zu`, `dzu`                                                      | In standard IME, `zu` produces ず. `du` produces づ.                                       |
| **ティ**                       | `thi`                                          | `ti`, `texi`                                                     | In standard IME, `ti` produces ち. `thi` produces digraph ティ.                            |
| **ディ**                       | `dhi`                                          | `di`, `dexi`                                                     | In standard IME, `di` produces ぢ. `dhi` produces digraph ディ.                            |
| **トゥ**                       | `twu`                                          | `tu`, `toxu`                                                     | In standard IME, `tu` produces つ. `twu` produces digraph トゥ.                            |
| **ドゥ**                       | `dwu`                                          | `du`, `doxu`                                                     | In standard IME, `du` produces づ. `dwu` produces digraph ドゥ.                            |
| **ウォ**                       | `who`                                          | `wo`, `uxo`                                                      | In standard IME, `wo` produces を. `who` produces extended digraph ウォ.                   |
| **シェ**                       | `she`                                          | `sye`, `sixe`                                                    | Standard IME input for extended Katakana シェ.                                             |
| **ジェ**                       | `je`                                           | `zye`, `jye`, `zixe`                                             | Standard IME input for extended Katakana ジェ.                                             |
| **チェ**                       | `che`                                          | `tye`, `cye`, `tixe`                                             | Standard IME input for extended Katakana チェ.                                             |
| **ファ, フィ, フェ, フォ**     | `fa, fi, fe, fo`                               | `fua, fui, fue, fuo`                                             | Standard IME shortcuts vs decomposed kana combinations.                                    |
| **ヴァ, ヴィ, ヴ, ヴェ, ヴォ** | `va, vi, vu, ve, vo`                           | `buxa, buxi, buxe, buxo`                                         | Extended Katakana voiced labiodental series.                                               |
| **じゃ, じゅ, じょ**           | `ja, ju, jo`, `zya, zyu, zyo`, `jya, jyu, jyo` | _(None; `dya/dyu/dyo` removed as they represent ぢゃ/ぢゅ/ぢょ)_ | Prevents conflation with dakuten ぢ digraphs.                                              |

### Chōonpu (ー) Dual-Tier Rules

- **Strict IME:** Accepts only `-` (hyphen/minus). Phonetic repeats like `koohii` are rejected.
- **Learner Mode:** Accepts both `-` AND the preceding token's final vowel repeated (e.g. `koohii` and `ko-hi-` are both accepted for `コーヒー`).

### Sokuon (っ / ッ) Consonant Doubling

- **Digraph Gemination:** When `っ` precedes a consonant token, `compile()` merges it into the token and doubles the initial consonant (e.g. `k` → `kk`). Special IME digraphs (like `ch` → `tch` in IME, `cch` in learner) are generated.
- **Standalone Fallback:** When `っ` occurs standalone, before vowels, before `n`/`y`, or at the prompt end, it generates `['xtu', 'ltu', 'xtsu']`.

### Syllabic ん / ン Contextual Lookahead

- **Strict IME:** `nn` and `n'` are always accepted everywhere. Bare `n` is accepted only if all spellings of the subsequent token start with a consonant other than `n` or `y`. At the prompt end, bare `n` is rejected.
- **Learner Mode:** `n` is accepted anywhere for ん.

### Reading Hints (`readingHints`)

In vocabulary words, certain particles and irregular kanji readings deviate from base kana tables. For example, the topic marker `は` in `こんにちは` is pronounced `wa`.

- `compile()` inspects `prompt.readingHints`.
- In `learner` mode, the specified token index receives the hint spelling (e.g. `wa` for `は` in `こんにちは`).
- Without a hint, `は` strictly requires `ha` in both modes (e.g. `はな` rejects `wana`).

---

## 3. NFA Romaji Engine Contract

The romaji engine (`src/entities/kana/lib/engine.ts`) is a pure, immutable Non-deterministic Finite Automaton (NFA) evaluator. It does not touch the DOM, timers, or storage.

```
       [Start]
          │
     'k'  │  (State 1)
          ▼
       [k-path]
          │
     'a'  │  (State 2, Complete Token 0)
          ▼
      [Token 1] ─── 'n' ───► [Match Complete]
```

### Public Engine API

```ts
export function compile(prompt: PromptItem, strictness: Strictness): Matcher;
export function start(matcher: Matcher): MatchState;
export function step(matcher: Matcher, state: MatchState, char: string): MatchState | null;
export function isComplete(matcher: Matcher, state: MatchState): boolean;
export function activeTokenIndex(state: MatchState): number;
export function extensions(matcher: Matcher, state: MatchState): ReadonlySet<string>;
export function canonical(matcher: Matcher): string;
export function romajiForKey(kanaKey: string): string | null;
```

- **`step(matcher, state, char)`**: Returns a new `MatchState` if `char` advances at least one active path in the NFA. If rejected, returns `null` without modifying the existing state.
- **`extensions(matcher, state)`**: When a prompt is completed, returns characters that could have continued the state (e.g. the second `n` in `pan` completed with single `n`).
- **`shouldAbsorb(extensions, completedAt, now, key, windowMs = 250)`**: A pure helper exported from `src/entities/kana/lib/absorption.ts`. If a prompt completed with trailing extensions (e.g. `パン` completed as `pan`), any matching key arriving within 250 ms is absorbed silently, preventing false-positive mistakes when transitioning to words like `ねこ` or double-tapping `n`.

---

## 4. Extension Recipes

### Recipe A: Adding a New Kana Row / Table

1. Define the row identifier in `src/entities/kana/model/types.ts`:
   ```ts
   export type CustomRowId = 'my_custom_row';
   export type RowId = BasicRowId | ... | CustomRowId;
   ```
2. Add the data table in `src/entities/kana/model/data/`:
   ```ts
   export const customRows: readonly KanaRow[] = [ ... ];
   ```
3. Re-export in `src/entities/kana/model/data/index.ts` and include in `allKanaRows`.
4. Run `npm test` to verify automatic inclusion in property tests across all strictness modes.

### Recipe B: Adding Vocabulary Words or Phrases

1. Open `src/entities/kana/model/data/words.ts` or `phrases.ts`.
2. Append a new `ContentItem`:
   ```ts
   {
     key: 'word:arigatou',
     text: 'ありがとう',
     script: 'hiragana',
     meaning: { en: 'thank you', ru: 'спасибо' },
     // Optional: readingHints: [{ tokenIndex: 0, learnerOnly: ['...'] }]
   }
   ```
3. The content loader (`loadContent`) dynamically chunks words and phrases on demand, preserving the initial JS budget.

### Recipe C: Adding a New Language Locale

1. In `src/shared/i18n/`, create `es.ts` matching `TranslationKey`:
   ```ts
   import type { TranslationKey } from './en';
   export const es = { ... } as const satisfies Record<TranslationKey, string>;
   ```
2. Add the locale code to `Locale` in `src/shared/i18n/locale.ts`.
3. Add the language toggle option in `src/pages/trainer/ui/top-bar.tsx`.

### Recipe D: Adding a Test Mode (e.g. Zen Mode, Sudden Death)

1. Expand `TestConfig` in `src/entities/session/model/types.ts`:
   ```ts
   export type TestConfig =
     | { readonly kind: 'time'; readonly seconds: number }
     | { readonly kind: 'count'; readonly prompts: number }
     | { readonly kind: 'zen' };
   ```
2. Update `TypingController` in `src/features/type-prompt/model/controller.ts` to skip deadline timers when `kind === 'zen'`.
3. Add UI segmented selector in `src/pages/trainer/ui/config-bar.tsx`.

---

## 5. Mobile & On-Screen Input Seam

Nekotype is currently optimized for desktop physical keyboards. However, the input layer was deliberately decoupled to enable future mobile or touch adapters:

```
[ Physical Keyboard Event ] ──┐
                              ▼
                        [ inputAdapter ] ──► KeyIntent { kind: 'char', char: 'k' }
                              ▲                                 │
[ On-Screen Touch Pad ] ──────┘                                 ▼
                                                    [ TypingController ]
                                                                │
                                                                ▼
                                                       [ NFA Engine.step ]
```

### Implementing a Mobile / On-Screen Touch Keyboard

1. Create a touch keyboard component in `src/features/type-prompt/ui/touch-keyboard.tsx`.
2. When the user taps a virtual key button (e.g. `'k'`, `'a'`, or `Esc`), dispatch the intent directly:
   ```ts
   controller.handleIntent({ kind: 'char', char: 'k' }, strictness);
   ```
3. No DOM `<input>` refocusing, composition hooks, or Cyrillic code translations are needed for virtual keys; the controller processes the intent directly.

---

## 6. Verification Gates & Quality Guarantees

Every commit and pull request must satisfy `npm run verify`, which runs the following automated pipeline:

1. **`npm run typecheck` (`tsc --noEmit`)**: Maximum strictness TypeScript checks. Zero `any`, zero `as T`, zero `!`.
2. **`npm run lint` (`eslint . && steiger ./src`)**: ESLint AST inspection plus Steiger FSD architectural boundaries.
3. **`npm run test` (`vitest run`)**: Full unit, integration, property, and render-isolation test suite.
4. **`npm run build` (`vite build`)**: Production client bundle build.
5. **`npm run budget` (`node scripts/check-budget.mjs`)**: Enforces hard budget limits:
   - Initial HTML gzip: ≤ 5 KB (Actual: 0.27 KB)
   - Initial JS gzip: ≤ 35 KB (Actual: 24.42 KB via Vite / 23.69 KB via gzip)
   - Initial CSS gzip: ≤ 10 KB (Actual: 4.96 KB)
   - Preloaded Fonts (woff2): ≤ 45 KB per file (Actual: 14.95 KB JetBrains Mono, 16.45 KB Noto Sans JP)
   - Total First Load: ≤ 160 KB (Actual: 60.32 KB)

---

## 7. Public Domain API Signatures & Contract Specifications

### `entities/progress`

- `updateKanaStats(prev: KanaStats | undefined, mistakes: number, ms: number): KanaStats`: Completely pure function; calculates new attempt count `a`, mistake count `m`, EMA response latency `t` ($\alpha = 0.3$), and applies `decayStats` (halving `a` and `m` when $a > 50$). Returns a fresh `KanaStats` object without mutating `prev`.
- `ProgressMap`: Defined as `ReadonlyMap<string, KanaStats>`, guaranteeing immutable consumption by weights calculators.
- `computeItemWeight(tokenKeys: readonly string[], weights: ReadonlyMap<string, number>): number`: Evaluates prompt weight for words/phrases by computing the arithmetic mean over all constituent token kana keys (unseen keys defaulting to weight 3.0 per Plan Section 8).

### `entities/session`

- `finishTest(endTimeMs?: number): SessionMetrics`: Transitions `phase.value = 'finished'`, evaluates final `SessionMetrics`, stores the result into `metrics.value`, and returns `SessionMetrics` directly.
- `metrics: Signal<SessionMetrics | null>`: Reactive signal holding `null` during `idle` and `running` phases, populated on session completion.

### `entities/kana`

- `buildPool(settings: PracticeSettings, content?: readonly ContentItem[]): readonly PromptItem[]`: Builds the prompt pool. In `words` and `phrases` content modes, if `content` is empty or no vocabulary items match the active script mode, it automatically falls back to constructing the single-kana pool matching `settings.rowIds` and `settings.script` (Plan 5.5).
- `pickPrompt(pool: readonly PromptItem[], weights: ReadonlyMap<string, number>, rng: Rng, previousKey: string | null): PromptItem`: Selects the next prompt using weighted distribution. Rejects empty pool with an invariant Error.

### End-to-End Browser Certification (`e2e/`)

- `@playwright/test` is installed as a pure `devDependency` and invoked via `npm run e2e`.
- It executes outside `npm run verify` to test browser-native focus restoration, click coordinate physics, and cross-reload local storage synchronization.
