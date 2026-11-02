> **Scope.** Describes the v1 baseline code as it stands after the P1 engine cutover: the application in `apps/web/src/` and the two packages it uses, `packages/engine` and `packages/shared`. Where it disagrees with the [MVP specification](../spec/README.md), the specification applies; this document is rewritten as the MVP phases land (spec item D21).

# Nekotype Architecture Documentation

Nekotype is a high-performance, keyboard-first Japanese kana speed trainer engineered around a Non-deterministic Finite Automaton (NFA) romaji engine, fine-grained Preact signals, and strict Feature-Sliced Design (FSD) architecture.

---

## 1. Repository Layout, Layers & Import Boundaries

### Workspace (ADR 027)

```
apps/web/          @nekotype/web: the Preact SPA, Feature-Sliced Design (below)
packages/engine/   @nekotype/engine: NFA romaji engine and kana tables; imports nothing
packages/shared/   @nekotype/shared: /types (Clock, Rng, Scheduler, Valid* types), /runtime (type guards)
```

Packages are consumed as TypeScript source (no build step). Each package has its own `tsconfig.json`, ESLint config, scripts and tests; the root holds Prettier, `tsconfig.base.json`, `eslint.base.js` (`createBaseConfig`) and scripts that run `pnpm -r`. Enforced by lint:

- `packages/engine/src` may use only relative imports and no browser globals (`window`, `document`, `localStorage`, …), so it runs in the browser and in a Worker.
- `apps/web` must not import `@nekotype/shared/schemas`, `@nekotype/content` or `@nekotype/api`; `shared/runtime` must not import schemas or valibot. These targets do not exist yet; the rules are in place for P3 onwards.

### Application layers (FSD)

`apps/web` strictly adheres to **Feature-Sliced Design (v2.1)** conventions and is continuously validated by `steiger` alongside TypeScript compiler checks:

```
apps/web/src/
├── app/                  # Application root, initialization, global styles, providers
├── pages/                # Composed full-page views (TrainerPage)
├── features/             # User interaction workflows (type-prompt)
├── entities/             # Core domain models and business state (kana, session, progress)
└── shared/               # Reusable primitives, UI components, i18n, storage, and utility libraries
```

### Import Rules & Layer Hierarchy

1. **Unidirectional Dependency Flow:** Slices in higher layers may import slices from lower layers only (`app` → `pages` → `features` → `entities` → `shared`). Lower layers NEVER import from higher layers.
2. **No Same-Layer Cross-Slice Imports:** Slices within the same layer (e.g. `entities/kana` and `entities/session`) must never import from each other. They interact through compositional coordination in higher layers (`features/type-prompt` or `pages/trainer`).
3. **Public API Facades:** All inter-slice imports must resolve through the target slice's root `index.ts` public re-export file. Deep internal imports (e.g. `@/entities/kana/lib/picker`) are forbidden and rejected by lint checks.
4. **Zero-Assertion TypeScript:** The entire codebase operates under maximum strictness: zero `any`, zero `as T` type assertions, zero non-null assertions (`!`), and zero `@ts-ignore` or `eslint-disable` directives.

### Widgets Layer Consolidation

Under standard FSD, the `widgets/` layer hosts multi-slice compositional blocks. The FSD linter (`steiger`) enforces `fsd/insignificant-slice`, requiring slices to have more than one consumer across the application. Because `pages/trainer` is currently the sole full-page route, all trainer-specific widgets (`TopBar`, `ConfigBar`, `TestStage`, `ResultsPanel`, `RowsDialog`, `LiveStatsStrip`, `SpeedChart`, `WeakestKanaList`) were consolidated into `apps/web/src/pages/trainer/ui/` as page-internal UI components.

> [!NOTE]
> **When to Extract Widgets:** If a second full-page view is introduced (such as a historical stats dashboard, custom word list editor, or flashcard review page) that reuses these UI blocks, extract them back into `apps/web/src/widgets/<widget-name>/` with their own public APIs.

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
- **Learner Mode:** Accepts `-` and the final vowel of the nearest kana token to the left, looking through other `ー` (`koohii` and `ko-hi-` for `コーヒー`). After ん, a standalone っ, a skip token or at the start of a prompt only `-` is accepted.

### Sokuon (っ / ッ) Consonant Doubling

- **Merged っ:** `っ` followed by a kana becomes one token with the following kana's key. Every spelling that starts with a consonant other than `n` or `y` is doubled (`ch` gives `tch` and `cch`), and the `xtu`/`ltu`/`xtsu`/`ltsu` prefix is accepted before any spelling (spec D5, D22).
- **Standalone っ:** At the end of a prompt, before `ん`, `ー`, another `っ` or a skip token, `っ` is its own token with the four prefix spellings. It never merges across a prompt boundary.

### Syllabic ん / ン Contextual Lookahead (spec D2, D3, A15)

- `nn` and `n'` are always accepted. A bare `n` is stored as a spelling that may only precede certain spellings of the next token: those starting with a consonant other than `n` or `y`, and in learner mode also those starting with `n`.
- The next token is looked up across prompt boundaries. At a boundary, learner mode accepts a bare `n` before any spelling of the next prompt. At the end of the stream and before a skip token a bare `n` is always accepted.

### Skip tokens (spec D8)

Punctuation and spaces (`SKIP_CHARACTERS`) are tokens that need no input; the matcher passes over them and statistics ignore them.

### Reading Hints (`readingHints`)

In vocabulary words, certain particles and irregular kanji readings deviate from base kana tables. For example, the topic marker `は` in `こんにちは` is pronounced `wa`.

- `compile()` inspects `prompt.readingHints`.
- In `learner` mode, the specified token index receives the hint spelling (e.g. `wa` for `は` in `こんにちは`).
- Without a hint, `は` strictly requires `ha` in both modes (e.g. `はな` rejects `wana`).

---

## 3. NFA Romaji Engine Contract

The romaji engine (`packages/engine/src/matcher/`) is a pure, immutable Non-deterministic Finite Automaton (NFA) evaluator over a **stream of prompts** (spec [Input engine rules](../spec/engine.md)). It does not touch the DOM, timers, or storage, and holds no module-level state: it is created from a kana table. `apps/web/src/entities/kana/lib/engine.ts` binds it to the app's table (`createEngine(engineTable)`) and re-exports the functions, so the rest of the app imports them from `@/entities/kana`.

A position is `(token, spelling, offset)` plus the keystroke indices of the path that led to it. A token whose spelling is typed in full is _done_ and waits for the first key of the next token; the spelling's `next` set limits which spellings of that token may follow (this is how a bare `n` is tied to its context). Positions of several readings live side by side, so `hon` in relaxed mode keeps both the bare `n` and the first half of `nn`.

### Public Engine API

```ts
export function createEngine(table: EngineTable): Engine;

type Engine = {
  compile(prompts: readonly PromptItem[], strictness: Strictness): Matcher;
  extend(matcher: Matcher, prompts: readonly PromptItem[]): Matcher; // old states stay valid
  start(matcher: Matcher): MatchState;
  step(matcher: Matcher, state: MatchState, char: string): MatchState | null; // null = rejected
  isComplete(matcher: Matcher, state: MatchState): boolean; // end of the stream reached
  committedPrompts(matcher: Matcher, state: MatchState): number;
  committedTimings(matcher: Matcher, state: MatchState): readonly TokenTiming[];
  settledPrompts(matcher: Matcher, state: MatchState): number; // committed, timings agreed
  extensions(matcher: Matcher, state: MatchState): ReadonlySet<string>;
  view(matcher: Matcher, state: MatchState): EngineView; // live conversion
  errorTarget(matcher: Matcher, state: MatchState): number;
  compact(matcher, state): { m: Matcher; s: MatchState; droppedTokens: number };
  canonical(matcher: Matcher, promptIndex: number): string;
  spellingsFor(key: KanaKey, strictness: Strictness): readonly string[];
  canonicalFor(key: KanaKey): string;
};
```

`createErrorLog()` is a separate pure helper for per-token mistakes and "expected kana → typed character" pairs. `Engine` members are function-typed properties, so they can be destructured. The spec's [API section](../spec/engine.md) is normative; this list only names what the app uses.

- **`step(matcher, state, char)`**: Returns a new `MatchState` if `char` advances at least one position. If rejected, returns `null` without modifying the existing state. The state counts accepted keystrokes only.
- **`committedPrompts`**: Prompts finished in every active position. A prompt ending in ん is not committed until the next key settles whether the ん was a bare `n` or `nn`.
- **`view` and `errorTarget`**: `view` gives the display position for the input field; `errorTarget` charges a rejected key or a hint to the earliest token any position is typing, but never before the prompt on display (D10, A34).
- **`compact`**: Drops the prompts counted by `settledPrompts` and rebases indices; the controller calls it after every 20 committed prompts.
- `shouldAbsorb` and the 250 ms absorption window are gone (spec D3): a surplus `n` is resolved by matching the stream.

### `TypingController` (`features/type-prompt`)

The controller keeps a window of the displayed prompt and two more in the matcher (`extend` as the test goes, no more than a count test needs). The next prompt is shown as soon as `view()` reaches its first token; a prompt's result (`recordPromptResult`, `recordTokenOutcomes`) is recorded when `settledPrompts()` includes it, with `endedAt` the time of the keystroke that committed it. Token times come from `committedTimings` and the times of accepted keystrokes; the first token of a test has no preceding keystroke and reports `ms` 0, which `updateKanaStats` treats as no measurement. A rejected key and Esc are charged to `errorTarget()`. `handleIntent(intent)` takes no strictness: it is fixed by `loadPrompt`, and a settings change resets the session.

---

## 4. Extension Recipes

### Recipe A: Adding a New Kana Row / Table

1. Define the row identifier in `packages/engine/src/types.ts`:
   ```ts
   export type CustomRowId = 'my_custom_row';
   export type RowId = BasicRowId | ... | CustomRowId;
   ```
2. Add the data table in `packages/engine/src/data/`:
   ```ts
   export const customRows: readonly KanaRow[] = [ ... ];
   ```
3. Re-export it in `packages/engine/src/data/index.ts`, include it in `allKanaRows`, and export a new group from `packages/engine/src/index.ts` and `apps/web/src/entities/kana/model/data/index.ts` if the app needs it.
4. Run `pnpm --filter @nekotype/web run fonts` so `glyphs.txt` and the font subset include the new glyphs (a test fails while `glyphs.txt` is out of sync).
5. Run `pnpm test`: the row-count and `RowId` tests in `packages/engine/src/data.test.ts` need updating, and the property tests cover the new entries in both strictness modes.

### Recipe B: Adding Vocabulary Words or Phrases

> These files are test fixtures from P4 on: content is generated by the content pipeline, not edited by hand (spec D19).

1. Open `apps/web/src/entities/kana/model/data/words.ts` or `phrases.ts`.
2. Append a new `ContentItem`:
   ```ts
   {
     id: 'word:arigatou',
     text: 'ありがとう',
     script: 'hiragana',
     meaning: { en: 'thank you', ru: 'спасибо' },
     // Optional: readingHints: [{ tokenIndex: 0, learner: ['...'] }]
   }
   ```
3. Run `pnpm --filter @nekotype/web run fonts` to refresh `glyphs.txt` (a test checks it is in sync).
4. The content loader (`loadContent`) dynamically chunks words and phrases on demand, preserving the initial JS budget; `check-budget.mjs` limits a content chunk to 40 KB gzip.

### Recipe C: Adding a New Language Locale

1. In `apps/web/src/shared/i18n/`, create `es.ts` with the same keys as `en.ts` (`ru.ts` shows the form; a test checks key parity).
2. Add the locale code to `Locale` and to the checks in `initLocale` in `apps/web/src/shared/i18n/locale.ts`.
3. Pick the dictionary for it in `apps/web/src/shared/i18n/translate.ts` (today `t()` chooses between `ru` and `en`).
4. Add the language toggle option in `apps/web/src/pages/trainer/ui/top-bar.tsx`.

### Recipe D: Adding a Test Mode (e.g. Zen Mode, Sudden Death)

1. Expand `TestConfig` in `apps/web/src/entities/session/model/types.ts`:
   ```ts
   export type TestConfig =
     | { readonly kind: 'time'; readonly seconds: number }
     | { readonly kind: 'count'; readonly prompts: number }
     | { readonly kind: 'zen' };
   ```
2. Update `ValidTestConfig` in `packages/shared/src/types.ts` and `isTestConfig` in `packages/shared/src/runtime.ts`; stored settings are validated with them, so an unlisted mode is discarded on load.
3. Update `TypingController` in `apps/web/src/features/type-prompt/model/controller.ts` to skip deadline timers when `kind === 'zen'`.
4. Add UI segmented selector in `apps/web/src/pages/trainer/ui/config-bar.tsx`.

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

1. Create a touch keyboard component in `apps/web/src/features/type-prompt/ui/touch-keyboard.tsx`.
2. When the user taps a virtual key button (e.g. `'k'`, `'a'`, or `Esc`), dispatch the intent directly:
   ```ts
   controller.handleIntent({ kind: 'char', char: 'k' });
   ```
3. No DOM `<input>` refocusing, composition hooks, or Cyrillic code translations are needed for virtual keys; the controller processes the intent directly.

---

## 6. Verification Gates & Quality Guarantees

Every commit and pull request must satisfy `pnpm run verify`, which CI also runs. The root script runs each step in every package that defines it (`pnpm -r --if-present`):

1. **`pnpm run typecheck` (`tsc --noEmit`)**: Maximum strictness TypeScript checks. Zero `any`, zero `as T`, zero `!`.
2. **`pnpm run lint`**: ESLint AST inspection in every package; in `apps/web` also Steiger FSD architectural boundaries and the import restrictions of section 1.
3. **`pnpm run format:check` (`prettier --check .`)**: Formatting of the whole repository.
4. **`pnpm run test` (`vitest run`)**: Unit, integration, property and render-isolation tests. `packages/engine` runs with a v8 coverage threshold of 95% for statements, branches, functions and lines (the spec target; the package measures 100%).
5. **`pnpm run build` (`vite build`)**: Production client bundle into `apps/web/dist`, with the Vite manifest.
6. **`pnpm run budget` (`node scripts/check-budget.mjs`)**: Reads the manifest and enforces hard budget limits (gzip unless stated; brotli is reported next to it). Figures from the P0 build:
   - Initial HTML: ≤ 5 KB (actual 0.27 KB)
   - Initial JS, the entry and its static imports: ≤ 35 KB (actual 26.77 KB)
   - Initial CSS: ≤ 10 KB (actual 4.94 KB)
   - Fonts (woff2, read from `dist`): ≤ 45 KB per file (actual 14.95 KB JetBrains Mono, 16.45 KB Noto Sans JP)
   - Total first load: ≤ 160 KB (actual 63.39 KB)
   - Lazy route chunk: ≤ 25 KB; content chunk (`words`/`phrases` modules): ≤ 40 KB (actual 1.60 KB and 2.05 KB; there are no route chunks yet)
7. **`pnpm run e2e` (`playwright test`)**: Chromium against the Vite dev server (section 7).

Git hooks run the same checks earlier (`pre-commit`: staged formatting, typecheck, lint, unit tests; `pre-push`: `verify`).

---

## 7. Public Domain API Signatures & Contract Specifications

### `entities/progress`

- `updateKanaStats(prev: KanaStats | undefined, mistakes: number, ms: number): KanaStats`: Completely pure function; calculates new attempt count `a`, mistake count `m`, EMA response latency `t` ($\alpha = 0.3$; `ms` 0 is no measurement and keeps `t`), and applies `decayStats` (halving `a` and `m` when $a > 50$). Returns a fresh `KanaStats` object without mutating `prev`.
- `ProgressMap`: Defined as `ReadonlyMap<string, KanaStats>`, guaranteeing immutable consumption by weights calculators.
- `computeItemWeight(tokenKeys: readonly string[], weights: ReadonlyMap<string, number>): number`: Evaluates prompt weight for words/phrases by computing the arithmetic mean over all constituent token kana keys (unseen keys defaulting to weight 3.0, per section 8 of the [archived v1 plan](../archive/v1-implementation-plan.md)). Since D20 it is used: `createPromptWeights()` in `features/type-prompt` maps each word or phrase to the `KanaKey`s of its tokens and weighs it by their mean; a single kana weighs what it did before.

### `entities/session`

- `finishTest(endTimeMs?: number): SessionMetrics`: Transitions `phase.value = 'finished'`, evaluates final `SessionMetrics`, stores the result into `metrics.value`, and returns `SessionMetrics` directly.
- `metrics: Signal<SessionMetrics | null>`: Reactive signal holding `null` during `idle` and `running` phases, populated on session completion.

### `entities/kana`

- `buildPool(settings: PracticeSettings, content?: readonly ContentItem[]): readonly PromptItem[]`: Builds the prompt pool. In `words` and `phrases` content modes, if `content` is empty or no vocabulary items match the active script mode, it falls back to constructing the single-kana pool matching `settings.rowIds` and `settings.script` (ADR 019). If the selected rows give no kana for the script (extended rows with hiragana), it falls back to the basic rows (D20, ADR 028).
- `rowsYieldKana(settings): boolean`: Whether the selected rows give at least one kana for the script; the trainer shows a notice when it is false.
- `pickPrompt(pool: readonly PromptItem[], weights: ReadonlyMap<string, number>, rng: Rng, previousKey: string | null): PromptItem`: Selects the next prompt using weighted distribution. Throws an invariant Error on an empty pool, which `buildPool` no longer produces.

### End-to-End Browser Certification (`e2e/`)

- `@playwright/test` is a `devDependency` of `apps/web`, invoked via `pnpm run e2e` and run as the last step of `pnpm run verify`, locally and in CI (Chromium only; CI installs and caches the browser).
- The tests in `apps/web/e2e/` cover browser-native focus restoration, click coordinate physics, cross-reload local storage synchronization and the results panel animation.
