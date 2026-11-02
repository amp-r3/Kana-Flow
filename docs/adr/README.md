# Architecture Decision Records

Append-only log of architectural decisions, one file per decision.

- Entries are never deleted or rewritten. A decision that no longer holds gets a `**Status:**` line naming what superseded or amended it, and its row below is updated. An entry without a Status line is in force.
- The [MVP spec](../spec/README.md) defines the requirements; its [design decisions](../spec/decisions.md) table (A1…) holds the decisions made while writing the spec.
- Decisions made during implementation are added here, continuing the numbering.

## Adding a decision

1. Create `NNN-short-title.md` with the next number.
2. Use this structure:

   ```markdown
   # ADR NNN: Title

   - **Context:** the problem and the constraints.
   - **Decision:** what was decided.
   - **Justification:** why, and which alternatives were rejected.
   ```

3. Add a row to the index below. If the decision replaces an earlier one, add a Status line to the earlier file and update its row.

## Index

| ADR                                                                                  | Title                                                                                        | Status               |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | -------------------- |
| [001](001-preact-and-preact-signals.md)                                              | Preact and @preact/signals                                                                   | In force             |
| [002](002-tailwind-css-v4-css-first-configuration.md)                                | Tailwind CSS v4 CSS-First Configuration                                                      | In force             |
| [003](003-steiger-for-fsd-architecture-enforcement.md)                               | Steiger for FSD Architecture Enforcement                                                     | In force             |
| [004](004-node-based-font-subsetting-subset-font.md)                                 | Node-based Font Subsetting (`subset-font`)                                                   | In force             |
| [005](005-extended-katakana-row-prefix-ext.md)                                       | Extended Katakana Row Prefix (`ext_`)                                                        | In force             |
| [006](006-sokuon-doubling-and-standalone-fallback.md)                                | Sokuon Doubling and Standalone Fallback                                                      | Superseded           |
| [007](007-choonpu-dual-tier-matching.md)                                             | Chōonpu (ー) Dual-Tier Matching                                                              | In force             |
| [008](008-n-contextual-lookahead.md)                                                 | ん/ン Contextual Lookahead                                                                   | Superseded           |
| [009](009-extended-katakana-and-ambiguous-romaji-tier-placement.md)                  | Extended Katakana and Ambiguous Romaji Tier Placement                                        | In force             |
| [010](010-font-subsets-and-included-weights.md)                                      | Font Subsets and Included Weights                                                            | In force             |
| [011](011-state-division-and-storage-isolation-entities-kana-vs.md)                  | State Division and Storage Isolation (entities/kana vs entities/session)                     | Superseded           |
| [012](012-pure-weight-decay-and-mistake-based-kana-mastery.md)                       | Pure Weight Decay and Mistake-Based Kana Mastery Model (entities/progress)                   | Superseded           |
| [013](013-trailing-extension-absorption-and-desktop-input-normalization-features.md) | Trailing Extension Absorption and Desktop Input Normalization (features/type-prompt)         | Superseded           |
| [014](014-deviation-audit-and-alignment-with-plan-v1-1.md)                           | Deviation Audit and Alignment with Plan v1.1                                                 | Partially superseded |
| [015](015-merging-widgets-layer-into-pages-trainer-ui.md)                            | Merging Widgets Layer into `pages/trainer/ui/`                                               | In force             |
| [016](016-unified-reactive-settings-reset-watcher-setupsettingsresetwatcher.md)      | Unified Reactive Settings Reset Watcher (`setupSettingsResetWatcher`)                        | In force             |
| [017](017-comprehensive-accessibility-pass.md)                                       | Comprehensive Accessibility Pass                                                             | In force             |
| [018](018-playwright-e2e-test-suite-for-real-browser-focus.md)                       | Playwright E2E Test Suite for Real Browser Focus Redirection and Layout Physics Verification | Amended              |
| [019](019-runtime-fallback-for-vocabulary-pools-in-buildpool.md)                     | Runtime Fallback for Vocabulary Pools in `buildPool`                                         | In force             |
| [020](020-readonlysignal-export-pattern-for-store-state.md)                          | ReadonlySignal Export Pattern for Store State                                                | In force             |
| [021](021-global-keyboard-binding-decoupling-bindkeyboard.md)                        | Global Keyboard Binding Decoupling (`bindKeyboard`)                                          | Amended              |
| [022](022-key-intent-semantics-reveal-strictly-via-escape.md)                        | Key Intent Semantics: Reveal Strictly via Escape                                             | In force             |
| [023](023-local-git-hooks-complement-ci.md)                                          | Local Git Hooks Complement CI                                                                | In force             |
| [024](024-agents-md-as-the-single-agent-instruction-file.md)                         | AGENTS.md as the Single Agent Instruction File                                               | In force             |
| [025](025-rename-to-nekotype-and-new-pages-origin.md)                                | Rename to Nekotype and New Pages Origin                                                      | In force             |
| [026](026-pnpm-as-package-manager.md)                                                | pnpm as the Package Manager                                                                  | In force             |
| [027](027-pnpm-workspace-layout-for-the-monorepo.md)                                 | pnpm Workspace Layout for the Monorepo                                                       | In force             |
