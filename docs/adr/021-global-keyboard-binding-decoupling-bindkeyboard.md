# ADR 021: Global Keyboard Binding Decoupling (`bindKeyboard`)

- **Status:** Amended by the [MVP spec](../spec/README.md) D14: input moves to a hidden input with `beforeinput`; the `document` keydown listener stays only for keys pressed while focus is outside the hidden input ([Input source](../spec/frontend.md#input-source-d14-d15), step 2).
- **Context:** `TestStage` previously contained an inline `document.addEventListener('keydown', ...)` with mixed responsibilities (focus checking, dialog isolation, modifier key checks, and intent dispatch).
- **Decision:** Extracted global keyboard coordination into `features/type-prompt/lib/keyboard.ts` as `bindKeyboard({ onIntent, getInputElement })`. `bindKeyboard` centralizes:
  1. Skipping event handling if a `<dialog open>` modal is present.
  2. Escape key on external controls refocusing the input sink without triggering reveal.
  3. Character keystroke capture refocusing the input sink and triggering intent dispatch.
  4. Explicitly calling `preventDefault()` ONLY on handled character and reveal intents, never when `ctrlKey`, `metaKey`, or `altKey` modifiers are pressed.
     Unit tests in `keyboard.test.ts` verify standard browser shortcuts (`Ctrl+R`, `F5`, `Tab`, `Ctrl+L`) are not intercepted or prevented.
- **Justification:** Keeps UI components thin, ensures standard browser navigation and hotkeys work cleanly, and isolates keyboard handling into testable feature logic.
