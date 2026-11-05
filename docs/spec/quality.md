# Budgets and quality

The baseline budgets are retained and extended with latency and lazy-chunk budgets. Every budget in the table is checked by `verify`, and exceeding any of them fails CI.

## Budgets

| Item                                                                | Budget                      | Baseline     | Checked by                                                       |
| ------------------------------------------------------------------- | --------------------------- | ------------ | ---------------------------------------------------------------- |
| HTML                                                                | ≤ 5 KB                      | 0.27 KB      | `check-budget.mjs`                                               |
| Initial JS (gzip)                                                   | ≤ 35 KB                     | 24.0 KB      | `check-budget.mjs`                                               |
| Initial CSS (gzip)                                                  | ≤ 10 KB                     | 5.0 KB       | `check-budget.mjs`                                               |
| Noto Sans JP (kana only)                                            | ≤ 45 KB                     | 16.4 KB      | `check-budget.mjs`                                               |
| JetBrains Mono                                                      | ≤ 45 KB                     | 14.9 KB      | `check-budget.mjs`                                               |
| Golos Text                                                          | ≤ 45 KB                     | —            | `check-budget.mjs`                                               |
| Total first load                                                    | ≤ 160 KB                    | 60.6 KB      | `check-budget.mjs`                                               |
| Lazy route chunk (gzip)                                             | ≤ 25 KB                     | —            | `check-budget.mjs`                                               |
| Content chunk (gzip)                                                | ≤ 40 KB                     | —            | `check-budget.mjs`                                               |
| Keystroke work (handler + style + layout), p95 at 4× CPU throttling | ≤ 8 ms                      | 2.3 ms       | Playwright latency test                                          |
| Keystroke → next frame, p95 at 4× CPU throttling                    | ≤ 2 frames (33 ms at 60 Hz) | 25 ms        | Playwright latency test                                          |
| Component renders per keystroke                                     | 0; ≤ 1 on prompt completion | 0; 1         | Vitest render test                                               |
| Lighthouse Performance, mobile profile                              | ≥ 95, median of 3 runs      | not measured | `@lhci/cli` on the production build served by vite preview in CI |

Sign-in and sync do not count toward the initial budget: the sync client and account screens are lazy-loaded.

**`check-budget.mjs` changes**: check HTML; read fonts from `dist` instead of `src`; detect lazy chunks from the Vite manifest instead of a filename substring; report brotli alongside gzip.

## Latency measurement

The Event Timing API is not used: by default it reports only events longer than 16 ms and rounds durations to 8 ms. A test build exposes a probe that records two values per keystroke:

1. **Work:** `performance.now()` on handler entry, and again after all state updates followed by a forced style and layout read (`getBoundingClientRect()` on the romaji buffer). The difference is the time the application spends on the keystroke and does not include waiting for a frame.
2. **Next frame:** the time from handler entry to a `MessageChannel` task posted from the next `requestAnimationFrame` callback. It includes the wait for the next frame, which alone ranges from 0 to one frame interval, hence the 2-frame budget.

The Playwright test enables 4× CPU throttling via the Chrome DevTools Protocol and types 200 keystrokes in a timed test. It runs 3 times; the median of the three p95 values is compared with each budget. The probe is excluded from the production build.

## Tests

- **`packages/engine`:** line and branch coverage ≥ 95% (`@vitest/coverage-v8`); the golden table from [Input engine rules](engine.md); the baseline property tests; stream tests for prompt boundaries.
- **`apps/web`:** unit tests for logic; render-isolation tests for the hot path; Playwright e2e for: full time, count and zen tests; idle end and a hidden tab; a restart leaving statistics unchanged; live conversion; layout and IME notices; a learning lesson; results and personal best; the statistics page; guest → sign-in (mocked OAuth); offline → sync; two tabs syncing concurrently.
- **`apps/api`:** tests on a local D1: OAuth callback (mocked), `seq` handling (≤ last, = last + 1, > last + 1), merge rules, a lost `version` update retried without double counting, the error table, request limits, anonymous reports.
- **Device matrix:** Android Chrome with Gboard and iOS Safari, manual pass required for P2 and P7.

## CI

`verify` = typecheck + ESLint + Steiger + `prettier --check` + unit tests with coverage thresholds + build + `check-budget.mjs` + e2e including the latency test (Chromium, and WebKit in mobile emulation) + Lighthouse CI. Prettier, e2e and coverage were not part of the baseline CI (D21); they are added in P0, with the engine coverage threshold set to the measured level in P0 and to the 95% target in P1. Until P2 the e2e run is Chromium-only without the latency test; WebKit and the latency test arrive in P2, Lighthouse CI in P7. After a deploy to Cloudflare Pages, CI runs a smoke test against the new deployment (`apps/web/scripts/smoke-deploy.mjs`): every route answers 200 with the application, a missing asset and an unknown path answer 404, and the bundle loads. New architectural decisions are recorded as ADRs in [`docs/adr/`](../adr/README.md).
