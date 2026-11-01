# Frontend

The training screen consists of a Japanese text stream and a separate input field with live conversion. A keystroke MUST NOT trigger a component render.

## Input source (D14, D15)

1. Input is captured by a hidden `<input>` with `autocomplete=off`, `autocorrect=off`, `autocapitalize=off`, `spellcheck=false`.
2. A `keydown` listener on `document` keeps the baseline behaviour: when focus is outside the hidden input (for example on the Restart button after Tab), outside any text field and no dialog is open, a typable key returns focus to the hidden input and is processed as input. Modifier combinations and keys inside dialogs are not intercepted.
3. A `keydown` carrying a single latin character, `-` or `'` is handled immediately and cancelled with `preventDefault`. This is the primary desktop path.
4. A `keydown` with `key` = `Unidentified` or `Process` (mobile keyboards) is skipped; characters arrive via `beforeinput` (`insertText`, `data` field), one intent per character.
5. When `beforeinput` is not cancelable (Gboard composition), an `input` fallback compares `value` with the last value seen and processes only the added characters. The field is not cleared during composition; it is cleared on `compositionend`. Character duplication on Gboard is a known risk and is part of the P2 device-matrix check.
6. A non-latin letter is rejected without counting as an error; a "Switch your keyboard layout to English" notice appears and hides after the next latin character.
7. The "Turn off the Japanese IME" notice is shown only when composition data contains kana or kanji. Composition events with latin data (Gboard on Android) do not show it.
8. The `handleIntent({kind:'char', char})` seam for an on-screen keyboard is retained.

## Text stream and input field (D13)

- **Stream:** 2–3 lines of prompts; the current line is in focus and completed lines scroll up. Prompts are separated by a gap. The engine window is extended as described in [Input engine rules](engine.md).
- **Token states:** completed (dimmed), current (accent underline), errored (red tint), upcoming (default). Skip tokens are rendered; the cursor passes over them.
- **Input field** below the stream renders the current prompt from `engine.view()`: committed tokens as kana, the remainder as latin, then the caret. Example: `k` → "k", `ki` → "き", `kit` → "きt".
- **Translation** of the current word or phrase is shown on one line below the stream; controlled by `showTranslation` in settings, on by default.

## Keyboard

| Key                         | Action                                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tab, then Enter             | Restart: Tab moves focus to the Restart button, Enter activates it (baseline behaviour). Tab is never intercepted, so keyboard navigation is unaffected |
| Esc                         | Hint for the active prompt                                                                                                                              |
| Ctrl/Cmd+Enter              | Finish a zen test                                                                                                                                       |
| Enter on the results screen | Next test                                                                                                                                               |
| 1–4                         | Choose an option in learning-mode recognition                                                                                                           |

## Hot path (D16)

- Signals are passed into JSX as text nodes or written to the DOM via `useSignalEffect` and refs. Token state classes are toggled via `classList` on refs, without re-rendering.
- Keystrokes are tracked with counters; the keystroke array is no longer copied.
- A keystroke that does not complete a prompt: **0** component renders. A keystroke that completes a prompt: at most **1** render (the stream line component). Verified by a test using `options.diffed`, following `render-isolation.test.tsx`.
- Animations use `transform` and `opacity` only; `prefers-reduced-motion` disables them, as in the baseline.
- Confetti is a canvas module loaded lazily on a personal best, at most 2 KB gzip.
- Noto Sans JP is loaded with `<link rel="preload">` (absent in the baseline).

## Loading

After the first render, on `requestIdleCallback`, the client prefetches all lazy route chunks and the content chunks matching the current settings. This keeps the application usable when the network drops after load.

## Interface

- All strings, including `aria-label` values, row names and chart titles, come from the i18n dictionaries.
- The layout is responsive: every feature works on a phone; the primary layout target is desktop.
- One dark theme; colours remain CSS-variable tokens so that themes can be added without structural changes.
