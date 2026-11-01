# ADR 012: Pure Weight Decay and Mistake-Based Kana Mastery Model (entities/progress)

- **Status:** Superseded by [Metrics and statistics](../spec/metrics.md) and A8 (`erroredAttempts`-based weakness; decay after 200 attempts; mean reaction time from sum and count).
- **Context:** User kana accuracy must inform weighted random selection during `weakFocus` practice mode, decaying historical attempts over time.
- **Decision:**
  - Implement pure functions in `entities/progress/lib/weights.ts`: `computeWeakness`, `computeWeight`, `computeWeights`, `computeItemWeight`, `decayStats`, and `updateKanaStats`.
  - Exactly implement Plan v1.1 section 8 formula: `weakness = (m + 1) / (a + 2)`, `weight = 1 + 4 * weakness`. Unseen kana (`a === 0`) naturally evaluates to `weakness = 1/2 = 0.5` -> `weight = 1 + 4 * 0.5 = 3.0` so new material is introduced.
  - Weight computation is strictly mistake-based in v1; latency `t` is stored via EMA (alpha = 0.3) for future extensibility but unused for prompt weighting.
  - Item weight for words/phrases is the arithmetic mean of its tokens' kana weights (`computeItemWeight`).
  - Decay halves attempts `a` and mistakes `m` when attempts `a > 50` (`Math.floor(a / 2)`), keeping stats recent.
- **Justification:** Exact adherence to Plan v1.1 section 8 specifications; deterministic and lightweight.
