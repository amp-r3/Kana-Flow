# Kana Flow — MVP Specification

Nov 1, 2026 · @Амир

## Document scope

This document specifies the Kana Flow MVP: required behaviour, data models, interfaces, performance budgets and acceptance criteria. "Baseline" refers to the repository state at commit 0f4927d.

- **Location in the repository:** `docs/MVP_SPEC.md`.
- **Precedence:** where this document conflicts with `README.md`, `ARCHITECTURE.md` or `kana-flow-implementation-plan.md`, this document applies.
- **Requirement keywords:** MUST, MUST NOT and MAY are used as defined in RFC 2119.
- **Unresolved items** are listed under "Design decisions and open items". No requirement depends on them unless stated.

## Product scope

Kana Flow is a web trainer for fast and accurate romaji input of Japanese kana text, modelled on Monkeytype. The MVP consists of the speed-typing core, a kana learning mode, accounts with cross-device sync, and dictionary-sourced words and phrases.

**Target users:** people who already read kana and want to type faster. The learning mode covers kana only.

**Constraints:**

- Infrastructure cost is zero: only free tiers are used (Cloudflare Pages with Pages Functions, D1 Free).
- No monetization in the MVP.
- Every feature except sign-in and sync works without an account. After the application has loaded, losing the network connection interrupts no feature except sign-in and sync. Reloading the page without a network requires the offline PWA, which is post-MVP.
- The budgets in "Budgets and quality" are enforced in CI.
- Every word and phrase reading passes the verification rules in "Content pipeline".

### In scope

| Area | Included |
| --- | --- |
| Speed mode | Hiragana, katakana, both; content: kana, words, phrases; tests by time (15/30/60/120 s), by count (10/25/50/100 prompts), zen |
| Learning mode | Kana only: introduction by group, recognition (romaji → choose kana), recall (typing), mixed review, mastery tracking |
| Input | Japanese text stream plus a separate input field with live conversion; two strictness modes; keyboard-layout and IME warnings |
| Statistics | Per-kana statistics, test history, personal bests, kana-chart heatmap, charts, started/finished test counters |
| Accounts | Guest mode; sign-in with Google and GitHub; guest data merged on sign-in; sync of settings, results and progress |
| Content | JLPT N5–N4 words from JMdict, short phrases from Tatoeba; displayed in kana only; English translations |
| Interface | English and Russian UI, confetti on a personal best, animations, keyboard shortcuts, dark theme |
| Other | "Report a problem" action for words and phrases; source attribution page |

### Out of scope

Russian translations of words and phrases, kanji in any form (including furigana), custom word sets, audio, offline PWA, light and additional themes, leaderboards, content admin panel, vocabulary SRS, grammar, Hepburn-only mode. These items are listed in "Post-MVP backlog".

## Changes from the baseline

The NFA approach (`start`/`step`/`isComplete`), the kana table format, the prompt picker, the type guards and the Cloudflare CI pipeline are retained. The token model and start/step are extended with per-spelling constraints between adjacent tokens (see "Input engine rules"). Each row below is a point where the baseline differs from the MVP and the required change.

| # | Baseline | MVP requirement |
| --- | --- | --- |
| D1 | Two strictness tiers `learner` / `ime` | Retained. UI labels: "Relaxed" (default) and "Strict IME". Strict accepts a subset of standard Japanese IME input and never accepts input that an IME would convert to a different kana |
| D2 | Relaxed mode accepts a single `n` for ん everywhere: `kani` = かんい, `honya` = ほんや | Before a vowel or `y`, ん MUST require `nn` or `n'` in both modes. Before `n`, relaxed accepts `konna`; strict requires `konnna` |
| D3 | A single `n` at the end of a prompt is handled per prompt, with a 250 ms `shouldAbsorb` window for a surplus key | Prompts are matched as one stream: ん at the end of a prompt takes its context from the next prompt (see "Prompt boundaries"). A single `n` completes ん at the end of the stream and before a skip token in both modes, and at a prompt boundary in relaxed mode (A15). `shouldAbsorb` is removed |
| D4 | Strict mode rejects `cchi` for っち | Strict accepts `cchi`, `tchi` and `tti`; the same applies to っちゃ/っちゅ/っちょ |
| D5 | `ltu`/`xtu`/`xtsu` work only for a standalone っ | `xtu`, `ltu`, `xtsu`, `ltsu` are accepted in both modes before any kana: `kiltute`, `kixtsute` for きって |
| D6 | Decomposed yōon `kilya`/`kixya` is not supported | Not in the MVP: yōon is typed as `kya` |
| D7 | Standalone small kana (ぁ…ょ, ゎ, ヵ, ヶ) and ゐ/ゑ throw an exception | MUST be supported as standalone tokens with `x`/`l` spellings (`xa`/`la`, `xya`/`lya`, `xwa`/`lwa`, `xka`/`lka`, `xke`/`lke`); ゐ = `wyi`, ゑ = `wye` |
| D8 | Punctuation and spaces throw an exception | Skip tokens (see "Input engine rules"). Content with an unknown character is excluded at build time (see "Content pipeline") |
| D9 | No Hepburn-only option | Not in the MVP (see "Design decisions and open items") |
| D10 | Errors are attributed to `max(tokenIndex)` | Errors are attributed to the minimum `tokenIndex` among active positions |
| D11 | A token only counts wrong keystrokes | An `errored` flag is added per token; the keystroke counter is retained |
| D12 | WPM = keystrokes / 5; accuracy by keystrokes | Replaced by the metrics in "Metrics and statistics" |
| D13 | One prompt on screen, latin mirror | Text stream plus input field with live conversion |
| D14 | Input via `keydown` only | Hybrid input source (see "Frontend") |
| D15 | Cyrillic input is mapped silently by `event.code` | A non-latin character is rejected without counting as an error; a "switch keyboard layout to English" notice is shown |
| D16 | `TestStage` and `LiveStatsStrip` re-render on every keystroke | Zero component renders per keystroke (see "Frontend") |
| D17 | Stores are module-level singletons | Sessions are created by a `createSession()` factory so speed and learning sessions do not share state |
| D18 | localStorage with a synchronous `KeyValueStore` | IndexedDB with an asynchronous store; migration of `kanaflow:*:v1` keys |
| D19 | 70 words and 30 phrases defined by hand | Replaced by the content pipeline; current data is kept as test fixtures |
| D20 | Defects: empty pool throws; `computeItemWeight` is unused; `animate-fadeIn` is undefined | Fixed in P0. These are the only behaviour changes in P0 |
| D21 | README and ARCHITECTURE.md contradict the code; Prettier, e2e and coverage are not in CI | Fixed in P0 |
| D22 | っ merges when the next spelling does not start with a vowel, `n` or `y`, so っー yields `--` | っ merges per spelling of the next token: a spelling starting with a latin consonant other than `n` and `y` is doubled, and the xtu/ltu/xtsu/ltsu prefix is accepted before any spelling (see "Tokens") |

## Input engine rules

The engine remains an NFA simulation over tokens, now applied to a stream of prompts rather than a single prompt. It receives the kana table as a parameter, supports small kana and skip tokens, and exposes the state needed for live conversion and for the learning mode. The accepted-input table is normative: every row MUST be covered by a golden test.

### `@kana-flow/engine` API

```ts
export function createEngine(table: KanaTable): Engine;

interface Engine {
  compile(prompts: readonly PromptItem[], strictness: Strictness): Matcher; // window of the stream
  extend(m: Matcher, prompts: readonly PromptItem[]): Matcher;              // append prompts; existing state stays valid
  compact(m: Matcher, s: MatchState): { m: Matcher; s: MatchState };       // drop committed prompts, rebase indices
  start(m: Matcher): MatchState;
  step(m: Matcher, s: MatchState, ch: string): MatchState | null; // null = key rejected
  isComplete(m: Matcher, s: MatchState): boolean;     // end of the stream reached
  committedPrompts(m: Matcher, s: MatchState): number; // prompts committed in every active position
  committedTimings(m: Matcher, s: MatchState): readonly TokenTiming[]; // per committed token, surviving path
  extensions(m: Matcher, s: MatchState): ReadonlySet<string>;
  view(m: Matcher, s: MatchState): EngineView;          // live conversion
  errorTarget(m: Matcher, s: MatchState): number;       // token index for error attribution
  canonical(m: Matcher, promptIndex: number): string;   // hint text (Esc)
  spellingsFor(key: KanaKey, strictness: Strictness): readonly string[]; // results screen, learning mode
  canonicalFor(key: KanaKey): string;
}

interface EngineView {
  committedTokens: number; // tokens completed by the display position
  pendingLatin: string;    // typed latin beyond those tokens
  activeToken: number;     // token highlighted in the stream
}

interface TokenTiming {
  tokenIndex: number;
  firstKey: number; // index of the first keystroke consumed by the token
  lastKey: number;  // index of the last keystroke consumed by the token
}
```

**Spelling constraints.** A spelling of a token MAY carry the set of next-token spellings it may precede: a single `n` for ん only before qualifying spellings, a doubled consonant for っ only before the spelling it doubles. `step()` spawns positions into the next token only for permitted spellings. This replaces the baseline token model `{ spellings[] }` and changes the baseline `start`/`step`.

- **Display position.** `view()` uses the active position with the shortest `pendingLatin`; on a tie, the position whose spellings come first in table order. Example, relaxed こんな: `kon` → こん; `konn` → こん; `konna` → こんな.
- **Window.** The stream is compiled with at least one full prompt beyond the active prompt. `extend()` MUST be called before the active token enters the last prompt of the window, so that the context of every non-final ん is known before it is typed. compact() is called after every 20 committed prompts, so a zen session does not grow the matcher without bound. It reports the number of dropped tokens; the stream UI rebases its token references, errored flags and activeToken by that offset within the render of the prompt completion that triggered it, so the ≤ 1 render budget holds.
- **Imports.** The package MUST NOT import DOM APIs, signals, storage or application aliases. The kana table and the visually-similar kana table ship in the same package as data.
- **Case.** Upper-case letters are lowercased before `step`; Caps Lock has no effect on matching.

### Tokens

- **Kana** — longest match against the table (きゃ wins over き).
- **っ followed by a kana** — spellings are built per spelling of the next kana (D22): every next spelling that starts with a latin consonant other than `n` and `y` is accepted with its first letter doubled (for ch-spellings: `cch`, `tch`, `tt` as in the table below); in addition, `xtu`, `ltu`, `xtsu` or `ltsu` followed by any next spelling is accepted. If no next spelling qualifies for doubling, only the prefixed forms remain.
- **っ elsewhere** — at the end of a prompt, before ー or before a skip token: `xtu`, `ltu`, `xtsu`, `ltsu`.
- **ん** — `nn` and `n'` are always accepted. A single `n` is accepted, per spelling of the next token, when that spelling starts with a latin consonant other than `n` and `y`, and at the end of the stream or before a skip token. Relaxed mode also accepts a single `n` before a spelling that starts with `n`, and at a prompt boundary before any spelling of the next prompt (A15).
- **ー** — rules in the table below.
- **Small kana** — ぁぃぅぇぉゃゅょゎヵヶ as standalone tokens (D7).
- **Skip token** — 、。，．！？・「」『』（）…〜 and half-width and full-width spaces. Rendered in the stream, requires no input; the cursor passes over it automatically; excluded from metrics.

**Invariant:** relaxed mode accepts every input that strict mode accepts, for every prompt. This is a property test. Example: ほんを — strict accepts `honwo`, `honnwo`, `hon'wo`; relaxed accepts those plus `honno` and `hon'o`.

### Prompt boundaries

- ん at the end of a prompt takes its context from the first token of the next prompt, using the same rules as inside a prompt. In relaxed mode a single n is additionally accepted at a boundary before any next spelling (A15).
- ん before a skip token and ん at the end of the stream behave as "ん at the end": a single `n` completes it.
- っ never merges across a prompt boundary or a skip token.
- NFA positions MAY cross a prompt boundary. A prompt counts as completed when `committedPrompts()` includes it; its completion time is the time of the keystroke that committed it.

### Accepted input

| Case | Example | Relaxed | Strict IME |
| --- | --- | --- | --- |
| し ち つ ふ じ | — | shi/si, chi/ti, tsu/tu, fu/hu, ji/zi | same |
| を | — | wo, o | wo |
| ぢ / づ | — | di, ji, zi, dzi / du, zu, dzu | di / du |
| ん at the end of the stream | ほん | hon, honn, hon' | same |
| ん before a consonant | かんた | kanta, kannta, kan'ta | same |
| ん before n | こんな | konna, konnna, kon'na | konnna, kon'na |
| ん before a vowel | かんい | kanni, kan'i | same |
| ん before y | ほんや | honnya, hon'ya | same |
| ん across a boundary | ほん → ねこ | honneko, honnneko | honnneko |
| ん before a skip token | ほん。 | hon, honn | same |
| Merged っ | きって | kitte, kixtute, kiltute, kixtsute, kiltsute | same |
| っ before ch | まっちゃ | maccha, matcha, mattya, maxtucha | same |
| Standalone っ | あっ | axtu, altu, axtsu, altsu | same |
| っ before ー | ッー | xtu-, ltu-, xtsu-, ltsu- | same |
| Yōon | きゃ, しゃ | kya; sha, sya | same |
| ちゃ / じゃ | — | cha, tya, cya / ja, zya, jya | cha, tya / ja, zya, jya |
| Small kana | ぁ, ゃ | xa, la; xya, lya | same |
| Extended katakana | ファ, ティ | both columns of "Extended katakana" | Strict IME column of "Extended katakana" |
| ー | コーヒー | ko-hi-, koohii | ko-hi- |
| ー at the start of a prompt | — | - | - |
| Particles は / へ | こんにちは | konnichiwa, konnichiha | konnnichiha |
| Skip token | 、 | no input | same |
| ん before を | ほんを | honwo, honnwo, hon'wo, honno, hon'o | honwo, honnwo, hon'wo |
| ん before a vowel across a boundary | ほん → あめ | honame, honname, hon'ame (A15) | honname, hon'ame |

Particle readings come from `readingHints` produced by the content pipeline and apply in relaxed mode only, as in the baseline. Every kana not listed above has exactly one spelling, identical in both modes: its Hepburn spelling (か ka, が ga, ぱ pa, きゃ kya, ぎょ gyo).

### Extended katakana

| Kana | Strict IME | Relaxed also accepts |
| --- | --- | --- |
| ファ フィ フェ フォ | fa, fi, fe, fo | fua/huxa, fui/huxi, fue/huxe, fuo/huxo |
| ヴァ ヴィ ヴ ヴェ ヴォ | va, vi, vu, ve, vo | buxa, buxi, —, buxe, buxo |
| ウィ ウェ ウォ | wi, we, who | whi/uxi, whe/uxe, wo/uxo |
| ティ トゥ ディ ドゥ テュ デュ | thi, twu, dhi, dwu, thu, dhu | ti/texi, tu/toxu, di/dexi, du/doxu, texyu, dexyu |
| シェ ジェ チェ | she, je, che | sye/sixe; zye/jye/zixe; tye/cye/tixe |

Other extended combinations (ツァ, クァ, イェ, スィ, フュ and similar) are not in the table; content containing them is excluded at build time.

### Errors

- A rejected key does not enter the buffer, the state is unchanged, and a 280 ms shake is played.
- The error is recorded on token `errorTarget()` (D10): `mistakes += 1`, `errored = true`, and the pair "expected kana → typed character" is stored for the confusion matrix.
- Non-latin characters, Space, Enter and Backspace are `ignore`, not errors (D15).
- Esc (hint) keeps the baseline behaviour: shows `canonical` for the active prompt, counts one error, and the prompt must still be typed in full.
- `shouldAbsorb` is removed; surplus `n` keys are resolved by stream matching (D3).

## Metrics and statistics

The primary metric is kana per minute (KPM); accuracy is measured per kana. The keystroke-based WPM (keystrokes / 5) is removed (D12). Attempts, errors and reaction times are fed by speed mode only; learning mode contributes mixups only.

### Definitions

| Metric | Formula | Shown in |
| --- | --- | --- |
| Token | Every non-skip token counts as 1: kana, merged っX, standalone っ, ー, small kana | — |
| Test time | From the first keystroke to the end of the test | Results |
| KPM | Committed tokens / minutes. A token is committed when it is completed in every active NFA position. Committed tokens of an unfinished prompt are included | Live strip, results, history |
| IPM (items per minute) | Completed prompts / minutes. Words and phrases only | Results, history |
| Kana accuracy | Tokens without errors / completed tokens | Live strip, results, history |
| Keystroke accuracy | Accepted / all keystrokes. Secondary | Results |
| Best streak | Longest run of prompts with no errors and no hints | Results |
| Kana reaction time | From the last accepted keystroke before firstKey to lastKey of the token on the surviving NFA path (committedTimings). A ん resolved by the next prompt's first key is therefore not inflated. The first token of a test has no preceding accepted keystroke and is excluded | Kana statistics |
| Per-second chart | Cumulative KPM per second. Held in memory until the results screen closes | Results |

### Test end

| Config | Ends when | Saved to history | Counts as finished | Personal best |
| --- | --- | --- | --- | --- |
| Time | The timer expires | Yes | Yes | Yes |
| Count | The last prompt is committed | Yes | Yes | Yes |
| Zen | "Finish" button or Ctrl/Cmd+Enter | If at least one prompt is completed | If at least one prompt is completed | No |
| Any | Restart or navigation away before the end | No | No | No |

### Data model

```ts
type Mode = 'speed' | 'learn';

type KanaStat = {
  attempts: number;        // completed tokens of this kana (speed mode)
  erroredAttempts: number; // of which errored = true
  wrongKeys: number;       // wrong keystrokes
  timeSumMs: number;       // sum and count for mean reaction time
  timeCount: number;
  confusions: Record<string, number>; // typed character instead of expected → count
  mixups: Record<KanaKey, number>;    // learning recognition: kana chosen instead of this one → count
};

type TestResult = {
  id: string;              // UUID v7, generated on the client
  mode: 'speed';
  content: 'kana' | 'words' | 'phrases';
  script: 'hiragana' | 'katakana' | 'both';
  strictness: 'learner' | 'ime'; // code identifier kept; UI label "Relaxed"
  config: { kind: 'time'; seconds: number } | { kind: 'count'; prompts: number } | { kind: 'zen' };
  startedAt: number; endedAt: number; durationMs: number;
  tokens: number; erroredTokens: number; items: number;
  keystrokes: number; rejectedKeystrokes: number; assisted: number;
  kpm: number; ipm: number | null; kanaAccuracy: number; keyAccuracy: number; bestStreak: number;
  celebratedPersonalBest: boolean; // a personal best was shown on this device at completion
  contentVersion: string; appVersion: string;
};

// started: speed test on first keystroke, lesson on first task; finished: per "Test end", lesson completed
type Counters = { started: Record<Mode, number>; finished: Record<Mode, number> };

type PersonalBests = Record<string /* content|script|strictness|config */, { kpm: number; resultId: string }>;
```

- **Decay:** when a kana's `attempts` exceeds 200, all its counters are halved. The same function runs on the client and on the server (see "Storage and sync").
- **Weakness:** `weakness = (erroredAttempts + 1) / (attempts + 2)`; weight `1 + 4 × weakness`, bounded to 1–5.
- **Word or phrase weight** — mean of its kana weights via `computeItemWeight` (D20).
- **Personal best** — maximum KPM per combination of content, script, strictness and test config, for a finished test with kana accuracy ≥ 80%. `PersonalBests` is authoritative: computed locally for a guest, recomputed by the server for a signed-in user. `celebratedPersonalBest` only records what was shown at completion.
- **Learning mode** updates `LearnState`, `KanaStat.mixups` and the `learn` counters only; it does not change attempts, errors or reaction times.
- The raw keystroke log MUST NOT be persisted.

### Screens

- **Results:** KPM (large), kana accuracy, IPM for words and phrases, per-second chart, keystroke accuracy, mistakes, best streak, time, the five weakest kana of the test with mean reaction time and spellings from `spellingsFor`. On a personal best: badge and confetti.
- **Statistics (`/stats`):** paginated test history; KPM-per-test chart; heatmap over the hiragana and katakana charts with an "errors / reaction time" toggle; top 10 confusions; started and finished counters per mode; personal bests from `PersonalBests`.

## Architecture

The repository is a pnpm monorepo with two applications and three packages. The frontend keeps Feature-Sliced Design with the baseline boundary linters.

```
kana-flow/
├── apps/
│   ├── web/        Preact + Vite + Tailwind v4, FSD: app → pages → features → entities → shared
│   └── api/        Hono app (OAuth, sync, reports), mounted by Pages Functions
├── functions/
│   └── api/[[route]].ts   Pages Functions entry point; imports apps/api
├── packages/
│   ├── engine/     input engine, kana tables, visually-similar kana table; zero dependencies
│   ├── content/    dictionary build scripts → JSON chunks; not part of the runtime
│   └── shared/     entry points: /types, /runtime (decay, constants), /schemas (valibot, server only)
├── docs/           MVP_SPEC.md, DECISIONS.md
├── pnpm-workspace.yaml
└── .github/workflows/
```

&#91;embedded content: MVP architecture · browser and Cloudflare\]

The engine and all user data live in the browser. Pages Functions handle sign-in, sync and content reports only; content is built ahead of time and served as static assets.

### Dependency rules

| Package | May import | Must not import |
| --- | --- | --- |
| `engine` | nothing | DOM, signals, storage, any package |
| `shared/types` | types from `engine` | runtime code |
| `shared/runtime` | `shared/types` | `shared/schemas`, valibot, application code |
| `shared/schemas` | `shared/types`, valibot | application code |
| `content` | `engine` (compile check for every item), `shared/types`, `shared/runtime` | `apps/*` |
| `apps/web` | `engine`, `shared/types`, `shared/runtime` | `shared/schemas`, `content`, `apps/api` |
| `apps/api` | `shared/*`; `engine` from v2 for server-side result validation | `apps/web` |

The `apps/web` restriction on `shared/schemas` is enforced by an ESLint import rule, so valibot never reaches the client bundle.

The prompt picker and weight functions are not part of the engine: they live in `apps/web` (`entities/prompt`) and take `Rng` from `shared`.

### Key technical decisions

- **Deployment stays on the existing Cloudflare Pages project and the `kana-flow.pages.dev` origin.** localStorage is bound to the origin, so keeping it is what allows the D18 migration to find baseline user data. The API runs as Pages Functions: `functions/api/[[route]].ts` mounts the Hono app with a D1 binding. Single origin: no CORS; session cookie `HttpOnly; Secure; SameSite=Lax`.
- **Routing of requests.** `_routes.json` includes only `/api/*`, so static requests never invoke Functions. `_redirects` rewrites each known SPA route (`/learn`, `/stats`, `/settings`, `/about`) to `/index.html` with status 200. Any other unknown path, including a missing `/assets/*` file, returns the baseline `404.html` with status 404.
- **Router:** a dependency-free client router on the History API. All routes except `/` are lazy-loaded.
- **Training sessions:** `createSession(deps)` factory instead of global stores (D17). `Clock`, `Scheduler`, `Rng` and storage are injected, keeping tests deterministic.
- **Validation:** valibot schemas in `shared` are used by the server only. The client imports shared/types and shared/runtime only, so schemas and valibot are not bundled.
- **TypeScript and ESLint strictness**: TypeScript strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, noImplicitReturns, noFallthroughCasesInSwitch, noImplicitOverride, verbatimModuleSyntax; ESLint strictTypeChecked with no any, no type assertions, no non-null assertions, no inline disable comments, and FSD boundary rules; configuration moves to a root base config inherited by each package.
- **Versions:** Node ≥ 24, pnpm ≥ 10. Baseline versions of Preact, Vite, Tailwind, TypeScript and Vitest are retained.

## Frontend

The training screen consists of a Japanese text stream and a separate input field with live conversion. A keystroke MUST NOT trigger a component render.

### Input source (D14, D15)

1. Input is captured by a hidden `<input>` with `autocomplete=off`, `autocorrect=off`, `autocapitalize=off`, `spellcheck=false`.
2. A `keydown` listener on `document` keeps the baseline behaviour: when focus is outside the hidden input (for example on the Restart button after Tab), outside any text field and no dialog is open, a typable key returns focus to the hidden input and is processed as input. Modifier combinations and keys inside dialogs are not intercepted.
3. A `keydown` carrying a single latin character, `-` or `'` is handled immediately and cancelled with `preventDefault`. This is the primary desktop path.
4. A `keydown` with `key` = `Unidentified` or `Process` (mobile keyboards) is skipped; characters arrive via `beforeinput` (`insertText`, `data` field), one intent per character.
5. When `beforeinput` is not cancelable (Gboard composition), an `input` fallback compares `value` with the last value seen and processes only the added characters. The field is not cleared during composition; it is cleared on `compositionend`. Character duplication on Gboard is a known risk and is part of the P2 device-matrix check.
6. A non-latin letter is rejected without counting as an error; a "Switch your keyboard layout to English" notice appears and hides after the next latin character.
7. The "Turn off the Japanese IME" notice is shown only when composition data contains kana or kanji. Composition events with latin data (Gboard on Android) do not show it.
8. The `handleIntent({kind:'char', char})` seam for an on-screen keyboard is retained.

### Text stream and input field (D13)

- **Stream:** 2–3 lines of prompts; the current line is in focus and completed lines scroll up. Prompts are separated by a gap. The engine window is extended as described in "Input engine rules".
- **Token states:** completed (dimmed), current (accent underline), errored (red tint), upcoming (default). Skip tokens are rendered; the cursor passes over them.
- **Input field** below the stream renders the current prompt from `engine.view()`: committed tokens as kana, the remainder as latin, then the caret. Example: `k` → "k", `ki` → "き", `kit` → "きt".
- **Translation** of the current word or phrase is shown on one line below the stream; controlled by `showTranslation` in settings, on by default.

### Keyboard

| Key | Action |
| --- | --- |
| Tab, then Enter | Restart: Tab moves focus to the Restart button, Enter activates it (baseline behaviour). Tab is never intercepted, so keyboard navigation is unaffected |
| Esc | Hint for the active prompt |
| Ctrl/Cmd+Enter | Finish a zen test |
| Enter on the results screen | Next test |
| 1–4 | Choose an option in learning-mode recognition |

### Hot path (D16)

- Signals are passed into JSX as text nodes or written to the DOM via `useSignalEffect` and refs. Token state classes are toggled via `classList` on refs, without re-rendering.
- Keystrokes are tracked with counters; the keystroke array is no longer copied.
- A keystroke that does not complete a prompt: **0** component renders. A keystroke that completes a prompt: at most **1** render (the stream line component). Verified by a test using `options.diffed`, following `render-isolation.test.tsx`.
- Animations use `transform` and `opacity` only; `prefers-reduced-motion` disables them, as in the baseline.
- Confetti is a canvas module loaded lazily on a personal best, at most 2 KB gzip.
- Noto Sans JP is loaded with `<link rel="preload">` (absent in the baseline).

### Loading

After the first render, on `requestIdleCallback`, the client prefetches all lazy route chunks and the content chunks matching the current settings. This keeps the application usable when the network drops after load.

### Interface

- All strings, including `aria-label` values, row names and chart titles, come from the i18n dictionaries.
- The layout is responsive: every feature works on a phone; the primary layout target is desktop.
- One dark theme; colours remain CSS-variable tokens so that themes can be added without structural changes.

## Learning mode

The learning mode (`/learn`) introduces kana in groups and reinforces them with a Leitner system. It uses the same engine and input field as speed mode, with a separate session instance and no timer. A new group unlocks as soon as every kana of the previous group is in box 1 or higher; spaced reviews then run on a daily schedule.

### Groups

Hiragana and katakana are independent tracks; progress in one does not unlock the other.

| Order | Groups |
| --- | --- |
| 1–10 | One group per gojūon row: vowels, k, s, t, n, h, m, y, r, wa + ん |
| 11–15 | One group per dakuten/handakuten row: g, z, d, b, p |
| 16–26 | One group per yōon row: ky, sh, ch, ny, hy, my, ry, gy, j, by, py |
| 27–31 | Katakana only: one group per extended-katakana row (see "Extended katakana") |

### Lesson for a new group

1. **Introduction.** The kana and its romaji are shown large; the user types the romaji once with a ghost hint.
2. **Recognition** (reverse direction). Romaji is shown; the user picks the kana from 4 numbered options, by click or keys 1–4. A wrong choice is recorded in `KanaStat.mixups`.
3. **Recall.** The kana is shown; the user types the romaji without a hint. Esc shows a hint and counts as an error.
4. **Mixed review.** The new group is mixed with kana from earlier groups for practice; kana in lower boxes appear more often.

A lesson contains about 20 tasks. The summary screen shows kana moved to box 1, accuracy and confused kana.

### Recognition options

- Distractors come from the same group, from the visually-similar kana table in `packages/engine` (curated pairs such as さ/ち, ぬ/め, わ/ね/れ, シ/ツ, ソ/ン), and from the user's `mixups`.
- A distractor MUST NOT share any accepted spelling with the correct answer in the current strictness (for example じ/ぢ, ず/づ, お/を in relaxed mode). Spellings come from `spellingsFor`.

### Boxes

| Box | Review interval | Entry condition |
| --- | --- | --- |
| 0 | within lessons | new kana, until the box 1 entry condition is met |
| 1 | 1 day | two correct answers in one lesson, at least one of them recall; or an error in a review |
| 2 | 3 days | correct answer in a review from box 1 |
| 3 | 7 days | correct answer in a review from box 2 |
| 4 | 14 days | correct answer in a review from box 3; the kana counts as mastered |
| 5 | 30 days | correct answer in a review from box 4 |

- A **review** is a task for a kana whose `dueAt` has passed. Only reviews move a kana from box 1 upward or send it back to box 1.
- Answers in a lesson's mixed review for kana already in box 1 or higher record `mixups` but do not change their box.
- A correct answer is an error-free recall or a correct recognition choice.
- **Unlocking:** the next group unlocks when every kana of the current group is in box 1 or higher, so several groups can be learned in one day.
- Thresholds and intervals are code constants.

### `/learn` screen

- Kana chart of the selected track, cells coloured by box.
- "Continue lesson" and "Review (N)" actions, where N is the number of kana due.
- Relaxed strictness by default (`settings.learn.strictness`).

### Data

```ts
type LearnEntry = { box: 0 | 1 | 2 | 3 | 4 | 5; dueAt: number; introducedAt: number; updatedAt: number };
type LearnState = { entries: Record<KanaKey, LearnEntry>; unlockedGroups: Record<Script, string[]> };
```

## Content pipeline

Words and phrases are generated by `packages/content` from open dictionaries. The output is versioned JSON chunks, committed to the repository and loaded lazily. Hand-written lists are removed (D19).

### Sources

| Source | Used for | Licence |
| --- | --- | --- |
| [JMdict](https://www.edrdg.org/edrdg/license.html), original multilingual XML (`JMdict.gz`) | Words: kana reading, priority tags (`ke_pri`/`re_pri`, including `nfXX`), English glosses, Russian glosses where present | CC BY-SA 4.0, EDRDG attribution |
| [Tatoeba](https://tatoeba.org/en/downloads) "Detailed Sentences" (with author username), links, transcriptions | Phrases, their readings and per-sentence authors | [CC BY 2.0 FR](https://tatoeba.org/en/terms_of_use); the author of each sentence MUST be credited |
| [Jonathan Waller's JLPT lists](http://www.tanos.co.uk/jlpt/) via [stephenmk/yomitan-jlpt-vocab](https://github.com/stephenmk/yomitan-jlpt-vocab), which maps every word to a JMdict entry id | Word selection by level (N5, N4) | Waller's lists: CC BY; mapping repository: CC BY-SA 4.0 |

The original XML is used instead of the [jmdict-simplified](https://github.com/scriptin/jmdict-simplified) JSON build because that build reduces priority information to a single `common` flag and drops the individual tags and `nfXX` ranks needed for the fallback selection.

JLPT has not published official vocabulary lists since 2010; Waller's lists are the community standard (used by Jisho.org) and are treated as an approximation of each level. The mapping repository is pinned by commit in `sources.json`, like the other sources.

JMdict has fewer Russian glosses than English. The pipeline stores `ru` where present and outputs a coverage report for the selected set; that report, not an external figure, is the basis for O3. The MVP displays English only.

### Words

1. Download the pinned version; version and checksum are recorded in `packages/content/sources.json`. The XML is parsed with a streaming parser that resolves JMdict entities.
2. Select N5–N4 entries by the JMdict entry ids from the pinned JLPT mapping. Fallback, used only if the mapping source becomes unavailable: entries whose kana reading carries `news1`, `ichi1`, `spec1`, `spec2` or `gai1`. Order: entries with `nfXX` by ascending rank first; then the remaining entries ordered by the number of priority tags (descending) and then by entry sequence number. The result is capped at 2,000 items.
3. Take the first non-search-only kana reading and the first 1–3 English senses.
4. Script is derived from the reading: hiragana-only or katakana-only; mixed readings are excluded.
5. **Homonyms:** entries with the same reading and script merge into one item; its translation lists the first sense of up to 3 entries, ordered by priority. The item id is derived from script and reading.

### Phrases

1. Take Japanese sentences that have an English translation. Each phrase item stores the Tatoeba sentence id and author username of the Japanese sentence, of the English translation and of the transcription used; a sentence without an author username is excluded.
2. Readings: transcriptions added by contributors take priority — in the export they carry a username; Tatoeba [marks machine-generated transcriptions as unreliable](https://tatoeba.org/fin/wall/messages_of_user/tommy_san).
3. A machine-generated transcription is accepted only if it matches the reading produced by kuromoji.js with the IPADIC dictionary; otherwise the sentence is excluded. The comparison uses the token `reading` field (reading form, は = ハ), never `pronunciation` (は = ワ).
4. は/へ tagged by kuromoji as particles (助詞) receive `readingHints` `wa`/`e`.
5. Maximum length: 15 kana after conversion to reading. Sentences with a negative rating are excluded when ratings are available in the export.
6. Script: hiragana-only, katakana-only, or `mixed`. Mixed phrases are offered only when the script setting is "both".
7. Target size: 300–500 verified phrases.

### Build checks

- Every item MUST compile with the engine in both strictness modes. An item that fails (for example, an unknown character) is excluded and listed in `packages/content/build-report.json`.
- **Exclusion threshold:** counted per source, after the selection filters above, and over compile failures only. The build fails if compile failures exceed 5% of the selected items of any source.
- The glyph set updates `glyphs.txt` and the font subset; the font budget is in "Budgets and quality".
- The manifest carries `contentVersion`, which is written into every `TestResult`.
- Chunks are split by type and script; each chunk is at most 40 KB gzip.

### Attribution and reporting

- The `/about` page lists the sources and their licences: JMdict (EDRDG, CC BY-SA 4.0), Tatoeba (CC BY 2.0 FR), Jonathan Waller's JLPT lists (CC BY) and the JLPT mapping repository (CC BY-SA 4.0). Code is MIT; generated data is under the source licences.
- **Per-phrase credit (Tatoeba).** The Tatoeba terms require the author of each sentence to be credited. On the training screen, the translation line of the current phrase carries a "Source" link to `https://tatoeba.org/sentences/{id}`; the `/about` page includes a generated list of all phrases with sentence id, author usernames (sentence, translation, transcription) and a link. The list is a lazy content chunk under the content chunk budget.
- The content build fails if any phrase lacks author data required for credit.
- A "Report a problem" action on the current word or phrase is available to guests and signed-in users. The action is available only while online: the dialog obtains a Turnstile token at submission, because tokens are single-use and expire after about 300 seconds, and sends the report directly to `POST /api/reports` independently of sync (see "Backend").

## Storage and sync

All data is written to IndexedDB on the device first. Changes accumulate in a single compacted delta; the server receives them as numbered batches and returns a merged snapshot. Results recorded while offline are counted at the next sync.

### Local storage (D18)

Database `kanaflow`, schema version 1. The IndexedDB wrapper is promise-based, dependency-free, about 1 KB.

| Store | Key | Contents |
| --- | --- | --- |
| `settings` | `current` | `Settings` |
| `results` | `id` (indexes `endedAt`, `synced`) | `TestResult`; `synced` marks results acknowledged by the server |
| `snapshot` | `current` | last server snapshot: kana statistics, counters, learning state, personal bests |
| `delta` | `current` | one accumulator of changes since the last batch: kana statistic increments, counter increments, changed learning entries, changed settings |
| `outbox` | `seq` | at most one batch awaiting acknowledgement |
| `meta` | key | `deviceId`, `userId`, `lastSeq`, `schemaVersion` |

- **Local view** = `decay(snapshot + delta)`. Snapshot and delta are never stored in the same record.
- **Compaction:** every change is merged into the single `delta` record; nothing is appended per event. Results live only in `results` and are referenced by id when a batch is built.
- **Client-side decay:** when a kana's `attempts` in `delta` exceeds 200, the decay function from `shared` halves its counters in `delta`. This bounds guest data, which never reaches the server. The server applies the same function after adding a delta.
- **Migration:** on first launch, `kanaflow:settings:v1` and `kanaflow:progress:v1` move into IndexedDB as the initial `settings` and `delta`, and the old keys are deleted. Field mapping: `a` → `attempts`; `m` (wrong keystrokes) → `wrongKeys`; `erroredAttempts` = `min(a, m)`; `timeCount` = `min(a, 10)`, `timeSumMs` = `t × timeCount` (the baseline `t` is an EMA). `kanaflow:locale` stays in localStorage because the language is needed synchronously before the first render.
- **Hot path:** no IndexedDB writes during a test. Writes happen at the end of a test or lesson and on `visibilitychange: hidden`.

### Settings

```ts
type Settings = {
  speed: {
    script: 'hiragana' | 'katakana' | 'both';
    content: 'kana' | 'words' | 'phrases';
    strictness: Strictness;
    rowIds: string[];
    weakFocus: boolean;
    test: { kind: 'time'; seconds: number } | { kind: 'count'; prompts: number } | { kind: 'zen' };
    showTranslation: boolean;
  };
  learn: { strictness: Strictness; track: 'hiragana' | 'katakana' };
  updatedAt: number;
};
```

The UI locale is device-local (`kanaflow:locale`) and is not synced.

### Merge rules

| Data | Rule |
| --- | --- |
| Settings | Last-write-wins on `updatedAt` for the whole document, except on the first batch of a new sign-in: if the account already has settings, the account settings win and the guest settings are discarded |
| Test results | Append-only; idempotent by `id` |
| Kana statistics and counters | Server adds the delta, then applies decay |
| Learning entries | Last-write-wins on `updatedAt` per kana |
| Unlocked groups | Union |
| Personal bests | Recomputed by the server from inserted results |
| Content reports | Sent separately via `POST /api/reports` |

### Batches

1. A new random `deviceId` is generated on every sign-in and stored in `meta` with `lastSeq` = 0. The server therefore never sees a reused `deviceId` with a reset `seq`, including after sign-out and sign-in to the same account.
2. Sync runs under the Web Lock `kanaflow-sync`, so only one tab of a device syncs at a time; all tabs share `deviceId`, `delta` and `outbox`.
3. If `outbox` holds an unacknowledged batch, it is resent unchanged. Otherwise a new batch is built with `seq = lastSeq + 1` from `delta` and up to 200 unsynced results, within 256 KB; it is written to `outbox` and `delta` is cleared in the same transaction.
4. The server keeps the last applied `seq` per `deviceId` and returns it in every sync response. `seq` ≤ last: not applied, the current snapshot is returned. `seq` = last + 1: applied atomically, snapshot returned. `seq` > last + 1: `409` with the server's last `seq`; the client keeps its batch and resends it as last + 1.
5. On acknowledgement the client stores the snapshot, sets `lastSeq`, marks the included results `synced` and clears `outbox`. If unsynced results remain, the next batch is sent 5 seconds later (the server's per-user interval), until none remain.
6. Entries in `user_stats.device_seq` not updated for 90 days are removed on the next write of that row.

### Sync triggers

- On application start, on network reconnect, and 10 seconds after a test or lesson ends.
- On `visibilitychange: hidden`, via `fetch` with `keepalive`. Browsers limit keepalive request bodies to 64 KB, so the body MUST be at most 60 KB. The handler requests the Web Lock `kanaflow-sync` with `ifAvailable`; if the lock is held by a running sync, nothing is sent. With the lock: if `outbox` holds a batch, that batch is resent unchanged when it fits in 60 KB, otherwise nothing is sent; if `outbox` is empty, a new batch is built by step 3 from `delta` only, with no results, and sent only if it fits in 60 KB. The response is processed by step 5 if the page is still alive; otherwise the batch stays in `outbox` and the next regular trigger resends it.
- At most one request per 10 seconds per device, except for catch-up batches (step 5 above), which are spaced 5 seconds apart.
- On a failed request (network error, `5xx`, D1 limit) or `429`, data stays in `outbox` and `delta`. After `429` the client waits for `Retry-After`; otherwise the next trigger retries.

### Guest, sign-in and sign-out

- A guest accumulates changes in `delta` from the first launch. On first sign-in, `delta` goes in the first batch and the guest's results follow in as many batches as needed (step 5). The server merges everything into the account by the rules above. Data from another device is combined, not overwritten.
- **Sign-out** first runs a sync. If unsent data remains (`outbox` or `delta` not empty, or unsynced results), a confirmation dialog states that this data will be lost. After sign-out all user stores on the device are cleared, including `deviceId`, and the application returns to guest mode.

## Backend

The backend is a Hono application running as Cloudflare Pages Functions on the existing Pages project, with a D1 database; sign-in is Google and GitHub only, via the Arctic library. One finished test costs 4–5 written D1 rows.

### Free-tier limits that constrain the design

| Limit | Value | Design response |
| --- | --- | --- |
| [CPU per Functions request](https://developers.cloudflare.com/workers/platform/limits) | 10 ms | OAuth only, no password hashing; small JSON documents |
| Functions requests | 100,000 per day, shared with Workers Free | `_routes.json` limits Functions to `/api/*`; batched sync at most once per 10 s per device |
| [D1 reads / writes](https://developers.cloudflare.com/d1/platform/limits) | 5 million / 100,000 rows per day | Statistics stored as one JSON document per user |
| D1 database size | 500 MB | Sufficient for the MVP |
| [D1 over-limit behaviour](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/) | Queries fail until midnight UTC | The client keeps data in `outbox` and `delta` and retries later; the application keeps working locally |

**Row budget per finished test:** result row 1 + automatic primary-key index entry 1 (a `TEXT PRIMARY KEY` creates one) + `results_user_time` index entry 1 + `user_stats` 1 + `user_settings` 0–1 = 4–5 rows. The authoritative figure is `meta.rows_written` returned by D1; the acceptance limit is 6. At 6 rows the daily write limit allows about 16,000 tests.

### D1 schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY, email TEXT, display_name TEXT, avatar_url TEXT, created_at INTEGER NOT NULL
);
CREATE TABLE oauth_accounts (
  provider TEXT NOT NULL, provider_user_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (provider, provider_user_id)
);
CREATE TABLE sessions (
  id_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  json TEXT NOT NULL, updated_at INTEGER NOT NULL
);
-- statistics, counters, learning, personal bests and last applied seq per device in one row
CREATE TABLE user_stats (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  kana_stats TEXT NOT NULL, counters TEXT NOT NULL, learn TEXT NOT NULL,
  personal_bests TEXT NOT NULL, device_seq TEXT NOT NULL, last_sync_at INTEGER NOT NULL
);
CREATE TABLE results (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ended_at INTEGER NOT NULL, content TEXT NOT NULL, script TEXT NOT NULL, strictness TEXT NOT NULL,
  config TEXT NOT NULL, kpm REAL NOT NULL, kana_accuracy REAL NOT NULL, json TEXT NOT NULL
);
CREATE INDEX results_user_time ON results(user_id, ended_at DESC);
CREATE TABLE content_reports (
  id TEXT PRIMARY KEY, user_id TEXT, item_id TEXT NOT NULL, content_version TEXT NOT NULL,
  reason TEXT, created_at INTEGER NOT NULL
);
```

`user_stats.device_seq` maps `deviceId` → last applied `seq` (see "Batches" in "Storage and sync").

### API

| Method and path | Purpose |
| --- | --- |
| `GET /api/auth/:provider` | Start OAuth (`google` with PKCE, `github`): state cookie and redirect |
| `GET /api/auth/:provider/callback` | Verify state, fetch profile, create or find user, set session, redirect to `/` |
| `POST /api/auth/logout` | Delete session and cookie |
| `GET /api/me` | Profile or 401 |
| `DELETE /api/me` | Delete the account and all its data; set `content_reports.user_id` to NULL for its reports |
| `POST /api/sync` | Body: `deviceId`, `seq`, batch. Response: snapshot of settings, statistics, counters, learning, personal bests, and the last applied seq for this deviceId |
| `GET /api/sync` | Snapshot and the last applied seq for the deviceId query parameter, used after a `409` |
| `GET /api/results?before=&limit=` | Paginated test history (at most 50 per request) |
| `POST /api/reports` | Content reports from guests and signed-in users; requires a valid Cloudflare Turnstile token; one report and at most 8 KB per request |

### Authentication and security

- **Session:** a random 32-byte token in cookie `kf_session` (`HttpOnly; Secure; SameSite=Lax; Path=/`); D1 stores only its SHA-256 hash. Lifetime 30 days, renewed when less than 15 days remain.
- **CSRF:** `SameSite=Lax` plus an `Origin` header check on every POST and DELETE.
- **Accounts from different providers** are linked by verified email (Google `email_verified`, GitHub primary verified address). Without a verified email a separate account is created.
- **Sync request limits:** body at most 256 KB, at most 200 results per batch, at most one request per 5 s per user (checked against `last_sync_at`, no extra writes). Input is validated with valibot schemas from `shared`.
- **Report abuse:** per-request caps above, plus a Cloudflare Turnstile token verified server-side on every request to `/api/reports`. WAF rate-limiting rules are not used: they require an own DNS zone, and \*.pages.dev is not one. The Turnstile script loads only when the report dialog opens, outside the initial budget.
- Client-submitted results are accepted without server-side verification in the MVP; there are no leaderboards.
- OAuth secrets are stored as Pages project secrets; schema changes are applied via `wrangler d1 migrations`.
- **Local development:** `wrangler pages dev` with a local D1; Vite proxies `/api` to it.

* **Environments:** production binds the production D1. Pages preview deployments bind a separate preview D1 and hide sign-in. OAuth clients:
  - Google: one OAuth client with two registered redirect URIs, for `kana-flow.pages.dev` and for `localhost`. Google does not accept wildcard redirect URIs, so preview subdomains cannot sign in.
  - GitHub: two OAuth Apps, because an OAuth App has one callback URL: one for `kana-flow.pages.dev` (production secrets) and one for `localhost` (development secrets in `.dev.vars`).
  - Turnstile uses separate site keys per environment.

## Budgets and quality

The baseline budgets are retained and extended with latency and lazy-chunk budgets. Every budget in the table is checked by `verify`, and exceeding any of them fails CI.

### Budgets

| Item | Budget | Baseline | Checked by |
| --- | --- | --- | --- |
| HTML | ≤ 5 KB | 0.27 KB | `check-budget.mjs` |
| Initial JS (gzip) | ≤ 35 KB | 24.0 KB | `check-budget.mjs` |
| Initial CSS (gzip) | ≤ 10 KB | 5.0 KB | `check-budget.mjs` |
| Noto Sans JP (kana only) | ≤ 45 KB | 16.4 KB | `check-budget.mjs` |
| JetBrains Mono | ≤ 45 KB | 14.9 KB | `check-budget.mjs` |
| Total first load | ≤ 160 KB | 60.6 KB | `check-budget.mjs` |
| Lazy route chunk (gzip) | ≤ 25 KB | — | `check-budget.mjs` |
| Content chunk (gzip) | ≤ 40 KB | — | `check-budget.mjs` |
| Keystroke work (handler + style + layout), p95 at 4× CPU throttling | ≤ 8 ms | not measured | Playwright latency test |
| Keystroke → next frame, p95 at 4× CPU throttling | ≤ 2 frames (33 ms at 60 Hz) | not measured | Playwright latency test |
| Component renders per keystroke | 0; ≤ 1 on prompt completion | 5 | Vitest render test |
| Lighthouse Performance, mobile profile | ≥ 95, median of 3 runs | not measured | `@lhci/cli` on the production build served by vite preview in CI |

Sign-in and sync do not count toward the initial budget: the sync client and account screens are lazy-loaded.

**`check-budget.mjs` changes**: check HTML; read fonts from `dist` instead of `src`; detect lazy chunks from the Vite manifest instead of a filename substring; report brotli alongside gzip.

### Latency measurement

The Event Timing API is not used: by default it reports only events longer than 16 ms and rounds durations to 8 ms. A test build exposes a probe that records two values per keystroke:

1. **Work:** `performance.now()` on handler entry, and again after all state updates followed by a forced style and layout read (`getBoundingClientRect()` on the input field). The difference is the time the application spends on the keystroke and does not include waiting for a frame.
2. **Next frame:** the time from handler entry to a `MessageChannel` task posted from the next `requestAnimationFrame` callback. It includes the wait for the next frame, which alone ranges from 0 to one frame interval, hence the 2-frame budget.

The Playwright test enables 4× CPU throttling via the Chrome DevTools Protocol and types 200 keystrokes in a timed test. It runs 3 times; the median of the three p95 values is compared with each budget. The probe is excluded from the production build.

### Tests

- **`packages/engine`:** line and branch coverage ≥ 95% (`@vitest/coverage-v8`); the golden table from "Input engine rules"; the baseline property tests; stream tests for prompt boundaries.
- **`apps/web`:** unit tests for logic; render-isolation tests for the hot path; Playwright e2e for: full time, count and zen tests; live conversion; layout and IME notices; a learning lesson; results and personal best; the statistics page; guest → sign-in (mocked OAuth); offline → sync; two tabs syncing concurrently.
- **`apps/api`:** tests on a local D1: OAuth callback (mocked), `seq` handling (≤ last, = last + 1, > last + 1), merge rules, request limits, anonymous reports.
- **Device matrix:** Android Chrome with Gboard and iOS Safari, manual pass required for P2 and P7.

### CI

`verify` = typecheck + ESLint + Steiger + `prettier --check` + unit tests with coverage thresholds + build + `check-budget.mjs` + e2e including the latency test (Chromium, and WebKit in mobile emulation) + Lighthouse CI. Prettier and e2e are not part of the baseline CI (D21). New architectural decisions are recorded as ADR entries in `docs/DECISIONS.md`.

## Implementation phases

The MVP is delivered in eight sequential phases. At the end of every phase `verify` passes and production on `kana-flow.pages.dev` is deployable.

1. **P0 — Monorepo and hygiene.**
   - pnpm workspaces; the baseline `src/` moves to `apps/web`; the engine and kana tables move to `packages/engine` with the table passed via `createEngine`; guards and the `Clock`/`Scheduler`/`Rng` types move to `packages/shared`.
   - Fix the D20 defects, bring documentation and CI in line with D21, update the budget script.
   - **Acceptance:** all baseline tests pass (106 unit, 8 e2e); behaviour is unchanged except for the D20 fixes, each covered by a new test; `packages/engine` has no imports; deployment to Pages succeeds.
2. **P1 — Engine.**
   - Stream matching with prompt boundaries, `extend()`, rules D2–D8 and D22, attribution D10, flag D11, `view()` with the display-position rule, `errorTarget()`, `committedPrompts()`, `spellingsFor()`, `canonicalFor()`, recording of "expected kana → typed character" pairs, removal of `shouldAbsorb`.
   - **Acceptance:** every row of the accepted-input table is a golden test; boundary tests cover ん → n, ん → vowel, ん → skip token, っ at a boundary; `packages/engine` coverage ≥ 95%; property tests pass, including the invariant that relaxed accepts every input strict accepts; compact() keeps indices valid over a 1,000-prompt zen stream; all baseline words and phrases compile.
3. **P2 — Input and training screen.**
   - Hybrid input source, layout and IME notices, text stream, live-conversion input field, render-free hot path, `createSession`, keyboard table, zen finish, idle prefetch, font preload, all strings moved to i18n, dependency-free router with route stubs and `_redirects` entries.
   - **Acceptance:** render test shows 0 renders per keystroke and ≤ 1 on prompt completion; keystroke work p95 ≤ 8 ms and keystroke → next frame p95 ≤ 2 frames; e2e (b) from the baseline passes (typing with focus on a button); IME notice not shown for latin composition; device-matrix pass for input on Android (Gboard) and iOS.
4. **P3 — Metrics, storage, statistics.**
   - New metrics and `TestResult`, test-end rules, personal bests, counters, `KanaStat`, word weights via `computeItemWeight`, IndexedDB with `snapshot`/`delta`/`outbox` stores, client-side decay, migration, new results screen, `/stats` page, confetti.
   - **Acceptance:** migration test on baseline localStorage fixtures, including the `t` mapping; metrics verified on fixed event sequences; personal-best rule covered by tests; `delta` stays one record after 1,000 simulated tests; lazy chunks within budget.
5. **P4 — Content.**
   - Pipeline, N5–N4 words from the pinned JLPT mapping with homonym merging, 300–500 verified phrases with per-sentence author data, build report, Russian coverage report, `/about` page with source licences and the generated phrase credit list, "Source" link on the training screen.
   - **Acceptance:** build is reproducible from pinned sources; exclusions ≤ 5% per source; an audit of 50 randomly sampled phrases finds at most one reading error; every phrase has a Tatoeba id and author usernames and appears in the credit list; chunks ≤ 40 KB; font within budget.
6. **P5 — Learning mode.**
   - `/learn`, groups, lessons, recognition with distractor rules and the visually-similar table, recall, mixed review, boxes, due reviews.
   - **Acceptance:** e2e of a full lesson; unit tests for box transitions, review-only promotion above box 1 and group unlocking; no distractor shares a spelling with the answer; a learning session does not change speed-mode statistics other than `mixups`.
7. **P6 — Backend and sync.**
   - Pages Functions with Hono, `_routes.json`, D1 migrations, Google and GitHub OAuth, sessions, `/api/sync` with `seq` handling and merge rules, Web Lock, guest merge, sign-out flow, account deletion, report action with Turnstile, `/api/reports`.
   - **Acceptance:** API tests on a local D1; e2e "offline → online"; a resent batch creates no duplicates; a delayed old batch is not applied; two-tab and two-device merge tests; a guest with 1,000 results signs in and all results arrive over several batches; sign-out and sign-in to the same account loses no data; one finished test writes at most 6 D1 rows, measured by meta.rows\_written; request CPU within the limit per `wrangler pages deployment tail`.
8. **P7 — Polish and release.**
   - Accessibility pass, device-matrix pass, Lighthouse ≥ 95, updated README and ARCHITECTURE, ADR entries, a stored-data description on `/about`, release tag.

## Post-MVP backlog

| Version | Item | Condition or dependency |
| --- | --- | --- |
| v1.1 | Russian translations of words and phrases | Coverage report from P4 (open item O3) |
| v1.1 | Kanji with furigana as a display option | Font loaded in `unicode-range` chunks to stay within the font budget |
| v1.1 | Custom word sets | Import of a kana word list |
| v1.1 | Hepburn-only mode (D9) | Implemented as a filter on relaxed mode |
| v1.2 | Offline PWA, themes, audio (TTS) | Audio depends on voice quality across platforms |
| v1.2 | Decomposed yōon `kilya`/`kixya` (D6) | — |
| v2 | Vocabulary SRS (FSRS), kanji mode | — |
| v2 | Leaderboards | Server-side result verification with the engine running in Pages Functions |
| v2 | Content admin panel | Moderation of content reports |
| v3 | Grammar | — |

## Design decisions and open items

### Decisions

| # | Decision | Alternative considered | Rationale |
| --- | --- | --- | --- |
| A1 | Non-latin input is rejected with a notice (D15) | Silent mapping by `event.code` plus a hint | `event.code` is unavailable on mobile keyboards; one behaviour on all platforms |
| A2 | Hepburn-only mode is deferred (D9) | Implement as a filter in the MVP | Conflicts with strict IME mode (を is `o` in Hepburn, `wo` in IME) |
| A3 | A personal best requires kana accuracy ≥ 80% | No threshold, as in Monkeytype | Prevents personal bests from random key mashing |
| A4 | Google and GitHub accounts are linked by verified email | Separate accounts with manual linking | Keeps one user's data in one account |
| A5 | Sign-out clears data on the device after a sync attempt and a confirmation if data is unsent | Keep it as guest data | Protects data on shared computers |
| A6 | The API runs as Pages Functions on the existing Pages project; the origin `kana-flow.pages.dev` is unchanged | A Worker with static assets on a new origin | localStorage is bound to the origin: a new origin would make baseline user data unreachable for the D18 migration |
| A7 | Hiragana progress does not unlock katakana | One shared track | Recognition of each script is a separate skill |
| A8 | Kana statistics decay after 200 attempts | Threshold 50, as in the baseline | 50 resets frequent kana too quickly |
| A9 | Translation below the stream is on by default | Off by default | Supports vocabulary exposure; `showTranslation` disables it |
| A10 | Learning mode is part of the MVP (P5) | Defer to v1.1 | First candidate for deferral if MVP scope is reduced: MVP users already read kana |
| A11 | Prompts are matched as one stream across boundaries (D3) | Per-prompt matching with a 250 ms absorption window | Absorption swallows the first `n` of a following prompt and produces false errors in a stream |
| A12 | A group unlocks when all its kana reach box 1; only due reviews promote higher | Unlock at box 2 | Unlock at box 2 delays every group by at least one day (12–26 days per script) |
| A13 | Sync batches carry a per-device `seq` and run under a Web Lock | Last `batchId` equality check | Equality does not reject a delayed older batch, and two tabs share one `deviceId` |
| A14 | Offline support is limited to network loss after load, with idle prefetch | Service worker in the MVP | The offline PWA is post-MVP; `index.html` is served with `must-revalidate` |
| A15 | In relaxed mode a single n completes ん at a prompt boundary before any next spelling (ほん → あめ = honame); strict mode requires nn before a vowel, as in IME | Require nn at a boundary in both modes, as inside a prompt (D2) | The visible gap between prompts reads as a word boundary, and typing honname there causes avoidable errors; relaxed remains a superset of strict, so the invariant holds |
| A16 | Content reports are protected by Cloudflare Turnstile | WAF rate limiting; per-IP limits in D1 | WAF rules need an own DNS zone, which \*.pages.dev is not; D1 counters spend the write budget |
| A17 | A new deviceId is generated on every sign-in | Store a batch id next to seq on the server and reject mismatches | Removes the seq-reset case with no extra server state |
| A18 | Words are built from the original JMdict XML | jmdict-simplified JSON | jmdict-simplified keeps only a common flag; the fallback selection needs the priority tags and nfXX ranks |
| A19 | Tatoeba phrases are credited per sentence (source link on the training screen, full list on `/about`) | Use only the CC0 subset of Tatoeba, which needs no credit | The Tatoeba terms require the author of each CC BY sentence to be cited; the CC0 subset is much smaller and may not yield 300–500 verified phrases |
| A20 | JLPT levels come from Jonathan Waller's lists via the pinned stephenmk/yomitan-jlpt-vocab mapping | OpenJLPT dataset; JMdict priority tags only | The mapping provides JMdict entry ids directly under a licence compatible with JMdict; identical OpenJLPT copies exist under several owners, so its provenance is less clear; priority tags do not reflect JLPT levels |

### Resolved items

Checked against primary sources on Nov 1, 2026.

- **O1 — Tatoeba licence.** All Tatoeba exports, including transcriptions, are released under CC BY 2.0 FR; part of the sentences is also available under CC0 1.0. Reuse requires citing the author of each sentence and distributing it with its licence. Resolved by per-phrase credit (A19).
- **O2 — JLPT list.** Jonathan Waller's lists (CC BY) through the stephenmk/yomitan-jlpt-vocab mapping (CC BY-SA 4.0) (A20). The JMdict priority-tag selection remains only as a fallback.
- **O4 — Cloudflare free tier.** Confirmed: 100,000 requests per day and 10 ms CPU per request; Pages Functions share the daily quota with Workers, and static asset requests are free and unlimited; D1 allows 5 million rows read and 100,000 rows written per day, and an index write counts as an additional written row; after a limit is exceeded, D1 queries fail until midnight UTC; 500 MB per database, 5 GB per account, at most 2 MB per row. The 2 MB row limit applies to `user_stats`, which holds all statistics of a user as JSON. Limits are rechecked before P6, since they can change.

### Open items

- **O3.** Define the Russian gloss coverage threshold for enabling Russian translations in v1.1, based on the P4 coverage report.
