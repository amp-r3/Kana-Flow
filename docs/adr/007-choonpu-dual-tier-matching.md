# ADR 007: Chōonpu (ー) Dual-Tier Matching

- **Context:** Handling long vowel marks across strictness levels.
- **Decision:** In IME mode, only `-` is accepted. In learner mode, both `-` and the preceding token's final vowel repeated (e.g. `ko-hi-` and `koohii`) are accepted.
- **Justification:** Respects Japanese IME keyboard output while accommodating learner phonetic typing habits.
