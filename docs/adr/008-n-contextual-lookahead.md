# ADR 008: ん/ン Contextual Lookahead

- **Status:** Superseded by the [MVP spec](../spec/README.md) D2, D3 and A15 (`nn` before a vowel or `y` in both modes; stream matching across prompts).
- **Context:** Distinct rules for `n` vs `nn` / `n'`.
- **Decision:** In IME mode, `nn` and `n'` are always accepted, and bare `n` is accepted only when all spellings of the next token start with a consonant other than `n` or `y`. At the end of a prompt, only `nn` / `n'` are valid in IME mode. In learner mode, `n` is accepted everywhere.
- **Justification:** Accurately replicates MS IME / Google Japanese Input romaji conversion tables.
