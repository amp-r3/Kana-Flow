# Implementation phases

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
