# ADR 006: Sokuon Doubling and Standalone Fallback

- **Status:** Superseded by the [MVP spec](../spec/README.md) D5 and D22 (per-spelling doubling; `xtu`/`ltu`/`xtsu`/`ltsu` prefix before any kana).
- **Context:** Support both gemination (consonant doubling) and standalone `っ/ッ`.
- **Decision:** In `compile`, `っ/ッ` merges with the following consonant token, doubling its consonant (with `ch` -> `tch` in IME, `cch` in learner). If standalone, followed by vowels, `n`, `y`, or prompt end, it generates `['xtu', 'ltu', 'xtsu']`.
- **Justification:** Matches Japanese IME behavior and prevents uncompletable states.
