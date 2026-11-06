# ADR 028: Empty Kana Pool Falls Back to the Basic Rows

- **Status:** Superseded by [ADR 058](058-learning-first.md) from P3: content `single` and the row selection are removed.
- **Context:** Extended rows (`ext_*`) hold katakana only. Selecting only extended rows with the katakana script and then switching to hiragana, or restoring that combination from `localStorage`, gave an empty pool. ADR 019 left this as an invariant error, so `pickPrompt` threw and the trainer crashed (spec D20).
- **Decision:**
  - `buildPool` falls back to `DEFAULT_BASIC_ROWS` for the current script when the selected rows give no kana. The saved row selection is not changed, so switching back to katakana restores it.
  - `rowsYieldKana(settings)` reports whether the selection gives any kana. While content is `single` and it returns false, the training screen shows the notice `stage.noKanaForRows`.
  - The invariant error in `pickPrompt` stays as a guard but is no longer reachable from the UI.
- **Justification:** The fallback keeps the user typing and loses nothing, and the notice explains why other kana appear. Alternatives rejected: resetting the saved rows on a script switch (loses the user's selection irreversibly); an empty state with no test (the controller would have to run without a prompt, a larger behaviour change than P0 allows).
