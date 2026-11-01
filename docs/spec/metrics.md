# Metrics and statistics

The primary metric is kana per minute (KPM); accuracy is measured per kana. The keystroke-based WPM (keystrokes / 5) is removed (D12). Attempts, errors and reaction times are fed by speed mode only; learning mode contributes mixups only.

## Definitions

| Metric                 | Formula                                                                                                                                                                                                                                                                      | Shown in                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Token                  | Every non-skip token counts as 1: kana, merged っX, standalone っ, ー, small kana                                                                                                                                                                                            | —                            |
| Test time              | From the first keystroke to the end of the test                                                                                                                                                                                                                              | Results                      |
| KPM                    | Committed tokens / minutes. A token is committed when it is completed in every active NFA position. Committed tokens of an unfinished prompt are included                                                                                                                    | Live strip, results, history |
| IPM (items per minute) | Completed prompts / minutes. Words and phrases only                                                                                                                                                                                                                          | Results, history             |
| Kana accuracy          | Tokens without errors / completed tokens                                                                                                                                                                                                                                     | Live strip, results, history |
| Keystroke accuracy     | Accepted / all keystrokes. Secondary                                                                                                                                                                                                                                         | Results                      |
| Best streak            | Longest run of prompts with no errors and no hints                                                                                                                                                                                                                           | Results                      |
| Kana reaction time     | From the last accepted keystroke before firstKey to lastKey of the token on the surviving NFA path (committedTimings). A ん resolved by the next prompt's first key is therefore not inflated. The first token of a test has no preceding accepted keystroke and is excluded | Kana statistics              |
| Per-second chart       | Cumulative KPM per second. Held in memory until the results screen closes                                                                                                                                                                                                    | Results                      |

## Test end

| Config | Ends when                                 | Saved to history                    | Counts as finished                  | Personal best |
| ------ | ----------------------------------------- | ----------------------------------- | ----------------------------------- | ------------- |
| Time   | The timer expires                         | Yes                                 | Yes                                 | Yes           |
| Count  | The last prompt is committed              | Yes                                 | Yes                                 | Yes           |
| Zen    | "Finish" button or Ctrl/Cmd+Enter         | If at least one prompt is completed | If at least one prompt is completed | No            |
| Any    | Restart or navigation away before the end | No                                  | No                                  | No            |

## Data model

```ts
type Mode = 'speed' | 'learn';

type KanaStat = {
  attempts: number; // completed tokens of this kana (speed mode)
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
  string /* content|script|strictness|config */,
  { kpm: number; resultId: string }
>;
```

- **Decay:** when a kana's `attempts` exceeds 200, all its counters are halved. The same function runs on the client and on the server (see [Storage and sync](storage-sync.md)).
- **Weakness:** `weakness = (erroredAttempts + 1) / (attempts + 2)`; weight `1 + 4 × weakness`, bounded to 1–5.
- **Word or phrase weight** — mean of its kana weights via `computeItemWeight` (D20).
- **Personal best** — maximum KPM per combination of content, script, strictness and test config, for a finished test with kana accuracy ≥ 80%. `PersonalBests` is authoritative: computed locally for a guest, recomputed by the server for a signed-in user. `celebratedPersonalBest` only records what was shown at completion.
- **Learning mode** updates `LearnState`, `KanaStat.mixups` and the `learn` counters only; it does not change attempts, errors or reaction times.
- The raw keystroke log MUST NOT be persisted.

## Screens

- **Results:** KPM (large), kana accuracy, IPM for words and phrases, per-second chart, keystroke accuracy, mistakes, best streak, time, the five weakest kana of the test with mean reaction time and spellings from `spellingsFor`. On a personal best: badge and confetti.
- **Statistics (`/stats`):** paginated test history; KPM-per-test chart; heatmap over the hiragana and katakana charts with an "errors / reaction time" toggle; top 10 confusions; started and finished counters per mode; personal bests from `PersonalBests`.
