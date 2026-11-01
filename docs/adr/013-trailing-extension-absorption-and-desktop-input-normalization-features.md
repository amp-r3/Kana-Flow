# ADR 013: Trailing Extension Absorption and Desktop Input Normalization (features/type-prompt)

- **Status:** Superseded by the [MVP spec](../spec/README.md) D3, A11 (absorption removed) and D14, D15, A1 (hybrid input; non-latin input rejected with a notice).
- **Context:** Fast typists transitioning from a word ending in single `n` (e.g. `パン`) to a word beginning with `n` (e.g. `ねこ`) or double-tapping `n` within 250ms must not suffer false-positive rejections.
- **Decision:**
  - Implement pure `shouldAbsorb(extensions, completedAt, now, key, windowMs = 250)`.
  - In `TypingController`, if `extensions.size > 0` upon completion, record `lastCompletedAt`. If the subsequent key falls within the absorption window and matches an extension, swallow it silently without recording a keystroke or advancing the buffer.
  - `handleKeyDown` in `input-adapter.ts` maps `event.code` (e.g. `KeyA` .. `KeyZ`) to Latin characters when non-Latin keyboard layouts (e.g. Russian Cyrillic `KeyF` -> `a`) are active, while ignoring IME compositions (`isComposing`) and modifier combinations (`ctrl`, `meta`, `alt`).
- **Justification:** Provides Monkeytype-grade input feel and eliminates input layout friction for international users.
