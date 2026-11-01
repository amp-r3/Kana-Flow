# ADR 016: Unified Reactive Settings Reset Watcher (`setupSettingsResetWatcher`)

- **Context:** Multiple independent settings controls across `ConfigBar` and `RowsDialog` required resetting an in-progress session back to `idle` with a freshly picked prompt whenever script mode, content type, strictness, selected rows, weak focus, or test config changed.
- **Decision:** Replaced per-control callback prop drilling (`onSettingChange`, `onRowChange`) with a single reactive Preact `effect()` in `features/type-prompt/model/settings-watcher.ts` (`setupSettingsResetWatcher`). It subscribes to all six configuration signals and atomically triggers session reset and prompt replenishment.
- **Justification:** Eliminates prop drilling, guarantees complete state synchronization regardless of which UI surface initiates a setting mutation, and enables isolated store-level testing.
