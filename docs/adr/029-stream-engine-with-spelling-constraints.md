# ADR 029: Stream Engine with Spelling Constraints

- **Status:** In force.
- **Context:** Phase P1 replaces the per-prompt NFA with a stream matcher ([Input engine rules](../spec/engine.md), D2–D8, D22). The spec left several points open: where errors are recorded, where small kana live, how to report timings when paths disagree, and how the web app keeps working while the training screen still shows one prompt (until P2).
- **Decision:**
  - A spelling of a token carries the set of next-token spellings it may precede. `step()` spawns positions only into permitted spellings, so `kani` for かんい is rejected without lookahead at match time. `extend()` only changes the permitted sets of the last token, so earlier state stays valid.
  - `step()` is pure. Error data (D10, D11, confusion pairs) is held by a separate pure `createErrorLog()` exported by the same package.
  - `committedTimings()` reports a token only when all active positions agree on its keystroke range.
  - Small kana, ゐ and ゑ are `standaloneRows`, added to the engine table but not to `allKanaRows`, so row selection, the picker, learning groups and the font subset do not change.
  - During P1 the new engine is built next to the old one and the web app switches in a single pull request. `TypingController` keeps one prompt on screen but matches a window of the current and next prompt; the next prompt is shown when `view()` reaches the end of the current one and the result is recorded by `committedPrompts()`. `shouldAbsorb` is removed in the same pull request.
- **Justification:** Constraints on spellings keep `step()` free of lookahead and make the "relaxed accepts everything strict accepts" invariant a property of the data. Keeping errors out of the matcher keeps it pure and usable in a Worker. A parallel engine keeps `main` deployable after every pull request, and moving the controller to the window in P1 puts D3 and A15 in production at once instead of leaving the absorption window until P2. Alternative rejected: a one-prompt window in the controller with `shouldAbsorb` kept until P2 (contradicts D3 and leaves the API untested against a real consumer).
