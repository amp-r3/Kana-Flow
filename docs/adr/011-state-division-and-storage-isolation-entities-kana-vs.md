# ADR 011: State Division and Storage Isolation (entities/kana vs entities/session)

- **Status:** Superseded by the [MVP spec](../spec/README.md) D17 and D18 (`createSession()` factory; IndexedDB instead of localStorage).
- **Context:** Practice settings must persist across sessions, whereas active session keystrokes, phase, and running metrics must reset cleanly without cross-contamination.
- **Decision:**
  - Place `PracticeSettings` signal store in `entities/kana/model/store.ts` (manages row selection, script mode, content kind, strictness, weakFocus, with local storage debounce and pagehide flush).
  - Place `TestConfig`, `Phase`, keystroke events, and derived `SessionMetrics` in `entities/session/model/store.ts`.
  - Abstract storage behind `KeyValueStore` interface with `LocalStorageStore` (safe against private browsing / quota throws) and `MemoryKeyValueStore` (for tests/SSR).
- **Justification:** Follows FSD boundaries; practice configuration belongs to the kana domain entity, while test execution state belongs to session lifecycle.
