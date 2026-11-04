# Metrics and statistics

The primary metric is kana per minute (KPM); accuracy is measured per kana. The keystroke-based WPM (keystrokes / 5) is removed (D12). Attempts, errors and reaction times are fed by speed mode only; learning mode contributes mixups only.

## Definitions

| Metric                 | Formula                                                                                                                                                                                                                                                                      | Shown in                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Token                  | Every non-skip token counts as 1: kana, merged っX, standalone っ, ー, small kana                                                                                                                                                                                            | —                            |
| Test time              | From the first keystroke to the end of the test                                                                                                                                                                                                                              | Results                      |
| KPM                    | Committed tokens / minutes. A token is committed when it is completed in every active NFA position. Committed tokens of an unfinished prompt are included                                                                                                                    | Live strip, results, history |
| IPM (items per minute) | Completed prompts / minutes. Words and phrases only                                                                                                                                                                                                                          | Results, history             |
| Kana accuracy          | Committed tokens without errors / committed tokens                                                                                                                                                                                                                           | Live strip, results, history |
| Keystroke accuracy     | Accepted / all keystrokes. Secondary                                                                                                                                                                                                                                         | Results                      |
| Best streak            | Longest run of prompts with no errors and no hints                                                                                                                                                                                                                           | Results                      |
| Kana reaction time     | From the last accepted keystroke before firstKey to lastKey of the token on the surviving NFA path (committedTimings). A ん resolved by the next prompt's first key is therefore not inflated. The first token of a test has no preceding accepted keystroke and is excluded | Kana statistics              |
| Per-second chart       | Cumulative KPM per second. Held in memory until the results screen closes                                                                                                                                                                                                    | Results                      |

## Test end

| Config        | Ends when                                                                        | `endReason` | Saved and counted as finished | Personal best |
| ------------- | -------------------------------------------------------------------------------- | ----------- | ----------------------------- | ------------- |
| Time          | The timer expires                                                                | `complete`  | Yes                           | Yes           |
| Count         | The end of the stream is reached (`isComplete`), so a single `n` ends a final ん | `complete`  | Yes                           | Yes           |
| Zen           | "Finish" button or Ctrl/Cmd+Enter                                                | `manual`    | Under the conditions below    | No            |
| Time or count | 5 seconds without input                                                          | `idle`      | Under the conditions below    | No            |
| Any           | The tab becomes hidden during a running test                                     | `hidden`    | Under the conditions below    | No            |
| Any           | Restart (Tab, Enter) or in-app navigation                                        | —           | No                            | No            |

**Conditions.** A test ended by `manual`, `idle` or `hidden` is saved only if at least one prompt is completed and `durationMs` is greater than 0. Otherwise it is discarded like a restart, and the application returns to a new test without a results screen.

**Idle end (D24).**

- The idle time is the code constant `IDLE_END_MS` = 5000. Zen is exempt. The check starts at the first keystroke, so a test that has not started never ends.
- Any key handled by the input source resets it, including rejected and ignored keys and Esc. A modifier pressed alone does not.
- `endedAt` is the time of the last keystroke, so the idle wait does not lower KPM. The same applies to `hidden`.
- The results screen states that the test ended because of no input.
- A keystroke only stores `lastKeyAt`. A single `Scheduler` timer re-arms itself for the remaining time when it fires, so the hot path creates no timers and triggers no renders.

**Hidden tab.** A hidden tab cannot receive input and the browser may discard the page, so the test ends at once and is written immediately. Closing the tab follows the same path on a best-effort basis.

**What a test writes (D23).** During a test all statistics stay in session memory. When the test is saved, its result and its statistics are written in one IndexedDB transaction: every committed token, including those of an unfinished prompt, with its errors, reaction times and confusions. When it is discarded, all of this is dropped and only the `started` counter is written. `weakFocus` therefore uses the statistics as they stood when the test began.

## Data model

```ts
type Mode = 'speed' | 'learn';

type KanaStat = {
  attempts: number; // committed tokens of this kana in saved tests (speed mode)
  erroredAttempts: number; // of which errored = true
  wrongKeys: number; // wrong keystrokes
  timeSumMs: number; // sum and count for mean reaction time
  timeCount: number;
  confusions: Record<string, number>; // typed character instead of expected → count
  mixups: Record<KanaKey, number>; // learning recognition: kana chosen instead of this one → count
};

type TestResult = {
  id: string; // UUID v7, generated on the client
  mode: 'speed';
  content: 'kana' | 'words' | 'phrases';
  script: 'hiragana' | 'katakana' | 'both';
  strictness: 'learner' | 'ime'; // code identifier kept; UI label "Relaxed"
  config: { kind: 'time'; seconds: number } | { kind: 'count'; prompts: number } | { kind: 'zen' };
  rowIds: string[] | null; // selected rows for content 'kana'; null for words and phrases
  endReason: 'complete' | 'manual' | 'idle' | 'hidden';
  startedAt: number;
  endedAt: number;
  durationMs: number;
  tokens: number;
  erroredTokens: number;
  items: number;
  keystrokes: number;
  rejectedKeystrokes: number;
  assisted: number;
  kpm: number;
  ipm: number | null;
  kanaAccuracy: number;
  keyAccuracy: number;
  bestStreak: number;
  celebratedPersonalBest: boolean; // a personal best was shown on this device at completion
  contentVersion: string;
  appVersion: string;
};

// started: speed test on first keystroke, lesson on first task; finished: per "Test end", lesson completed
type Counters = { started: Record<Mode, number>; finished: Record<Mode, number> };

type PersonalBests = Record<
  string /* personalBestKey(), see below */,
  { kpm: number; resultId: string }
>;
```

- **Decay:** when a kana's `attempts` exceeds 200, all its counters, including every entry of `confusions` and `mixups`, are halved and rounded down; map entries that reach 0 are removed. The same function runs on the client and on the server (see [Storage and sync](storage-sync.md)).
- **Statistic keys:** a merged っX is recorded under the `KanaKey` of the following kana, as in the baseline. A standalone っ and ー have no `KanaKey`: they count in `tokens` and `erroredTokens` but not in `KanaStat`.
- **Weakness:** `weakness = (erroredAttempts + 1) / (attempts + 2)`; weight `1 + 4 × weakness`, bounded to 1–5.
- **Word or phrase weight** — mean of its kana weights via `computeItemWeight` (D20).
- **Personal best** — maximum KPM per `personalBestKey`, for a test with `endReason` = `complete` and kana accuracy ≥ 80%. The eligibility rule and the key function live in `shared/runtime`, so the client and the server apply the same rule.
- **`personalBestKey`** — `content|script|strictness|config|rows`. `config` is `time:60` or `count:25`. `rows` applies to content `kana` only: the selected row ids that yield at least one kana for the script, sorted alphabetically and joined by commas; it is `-` for words and phrases. Example: `kana|hiragana|learner|time:60|k,s,vowels`. `weakFocus` is not part of the key: it only makes a test harder.
- **Personal best storage** is described in [Storage and sync](storage-sync.md). `celebratedPersonalBest` only records what was shown at completion.
- **Learning mode** updates `LearnState`, `KanaStat.mixups` and the `learn` counters only; it does not change attempts, errors or reaction times.
- The raw keystroke log MUST NOT be persisted.

## Screens

- **Results:** KPM (large), kana accuracy, IPM for words and phrases, per-second chart, keystroke accuracy, mistakes, best streak, time, the five weakest kana of the test with mean reaction time and spellings from `spellingsFor`. Mistakes are `rejectedKeystrokes` + `assisted`. On a personal best: badge and the `content` cat.
- **Statistics (`/stats`):** paginated test history (see "History" in [Storage and sync](storage-sync.md)); KPM-per-test chart; heatmap over the hiragana and katakana charts with an "errors / reaction time" toggle; top 10 confusions; started and finished counters per mode; personal bests from `PersonalBests`.
