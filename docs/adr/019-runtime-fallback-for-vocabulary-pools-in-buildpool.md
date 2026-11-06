# ADR 019: Runtime Fallback for Vocabulary Pools in `buildPool`

- **Status:** Amended by [ADR 028](028-empty-pool-falls-back-to-basic-rows.md): the empty single-kana pool no longer reaches `pickPrompt`. Superseded by [ADR 058](058-learning-first.md) from P3: content `single` is removed, so there is no kana pool to fall back to.

- **Context:** Plan 5.5 requires: "If a pool is empty at runtime anyway, fall back to the single-kana pool."
- **Decision:**
  - In `buildPool(settings, content?)`, when `content === 'words' || content === 'phrases'`, if `content` is empty (`length === 0`) or if script filtering yields zero items (e.g. asking for Katakana phrases when none match), the function automatically falls back to building the single-kana pool according to `settings.rowIds` and `settings.script`.
  - If the resulting single-kana pool is also empty (which only happens if `rowIds` is empty), `pickPrompt` throws a clear invariant error (`Cannot pick prompt from empty pool`).
- **Justification:** Conforms directly to Plan 5.5 and prevents app crashing if vocabulary chunks are pending or fail to load.
