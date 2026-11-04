# Frontend

The training screen consists of a Japanese text stream with a romaji buffer at the caret. A keystroke MUST NOT trigger a component render.

## Input source (D14, D15)

1. Input is captured by a hidden `<input>` with `autocomplete=off`, `autocorrect=off`, `autocapitalize=off`, `spellcheck=false`.
2. A `keydown` listener on `document` keeps the baseline behaviour: when focus is outside the hidden input (for example on the Restart button after Tab), outside any text field and no dialog is open, a typable key returns focus to the hidden input and is processed as input. Modifier combinations and keys inside dialogs are not intercepted.
3. A `keydown` carrying a single latin character, `-` or `'` is handled immediately and cancelled with `preventDefault`. This is the primary desktop path.
4. A `keydown` with `key` = `Unidentified` or `Process` (mobile keyboards) is skipped; characters arrive via `beforeinput` (`insertText`, `data` field), one intent per character.
5. When `beforeinput` is not cancelable (Gboard composition), an `input` fallback compares `value` with the last value seen and processes only the added characters. The field is not cleared during composition; it is cleared on `compositionend`. Character duplication on Gboard is a known risk and is part of the P2 device-matrix check.
6. A non-latin letter is rejected without counting as an error; a "Switch your keyboard layout to English" notice appears and hides after the next latin character.
7. The "Turn off the Japanese IME" notice is shown only when composition data contains kana or kanji. Composition events with latin data (Gboard on Android) do not show it.
8. The `handleIntent({kind:'char', char})` seam for an on-screen keyboard is retained.

## Text stream and romaji buffer (D13)

- **Stream:** 2–3 lines of prompts; the current line is in focus and completed lines scroll up. Prompts are separated by a gap. The engine window is extended as described in [Input engine rules](engine.md).
- **Token states:** upcoming (`untyped`), completed (`fur`), current (`eye` caret before the token), errored (`miss` with a `miss-dim` underline). Skip tokens are rendered; the caret passes over them.
- **Romaji buffer** next to the caret renders the remainder from `engine.view()` as latin; displayed tokens are already marked in the stream. It does not shift the text. Example for きて: `k` → buffer "k"; `ki` → き is marked and the buffer is empty; `kit` → buffer "t".
- **Translation** of the current word or phrase is shown on one line below the stream; controlled by `showTranslation` in settings, on by default.
- **Live indicators:** the counter (time left or prompts completed), KPM and kana accuracy, on one line above the stream.
- **While a test runs,** the navigation and the config bar are hidden and leave the tab order, so the first Tab reaches Restart. The translation line with its actions, the hint, notices and the zen "Finish" button stay available. Space for them is reserved, so the text does not move.

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
- A rejected key flashes the caret in `miss` for 120 ms through a separate layer animated with `opacity`. With `prefers-reduced-motion` the colour changes for 120 ms without a transition.
- Noto Sans JP is loaded with `<link rel="preload">` (absent in the baseline).

## Loading

After the first render, on `requestIdleCallback`, the client prefetches all lazy route chunks and the content chunks matching the current settings. This keeps the application usable when the network drops after load.

## UI architecture

From P2 the interface follows the Nekotype design system (A31, [ADR 031](../adr/031-adopt-the-nekotype-design-system.md)); no separate redesign is planned. Views stay separated from logic, so a later visual change does not touch behaviour.

- **Logic stays out of components.** Components in `ui/` read `ReadonlySignal` state and call exported actions. They MUST NOT call the engine, `Clock`, `Scheduler`, storage or `fetch`, and hold only local presentation state such as an open dialog. Everything else lives in `model/` and `lib/`.
- **One exception for the hot path:** DOM writes through refs and `useSignalEffect` stay in hooks in the slice's `lib/`, with a small interface the view binds to, so a new view reuses them and keeps the render budget.
- **Tests target behaviour.** Logic is tested at the `model/` and `lib/` level without rendering. e2e and DOM tests select by role, label or `data-testid`, never by class name or DOM structure. Replacing a view MUST NOT require changing a model test.
- **Styling** uses only the CSS-variable tokens and `shared/ui` primitives; a page defines no colours or one-off components of its own.

**Slices** (a starting point; ADR 015 still merges a slice with a single consumer into it):

| Layer      | Slices                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| `pages`    | `trainer`, `learn`, `stats`, `settings`, `about`                                                       |
| `features` | `training` (`createSession`, input source), `learn-session`, `sync`, `report-content`                  |
| `entities` | `prompt` (picker, weights, content), `stats` (local view, results, bests), `learn`, `user`, `settings` |

Slices on one layer do not import each other, so a flow crossing features, such as sign-out running a sync first, is composed in the page or in `app`.

**Screens in the MVP:**

| Route       | Basic content                                                                                                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`         | Config bar, stream, romaji buffer, live indicators, results                                                                                                                                                                                                  |
| `/learn`    | See [Learning mode](learning.md)                                                                                                                                                                                                                             |
| `/stats`    | See [Metrics and statistics](metrics.md)                                                                                                                                                                                                                     |
| `/settings` | `showTranslation`, learning strictness, "Reset progress" for guests. Account section: sign-in buttons (hidden on previews), profile, sync status (synced, pending, offline, session expired, blocked), sign-out, account deletion with a confirmation dialog |
| `/about`    | See [Content pipeline](content.md) and P7                                                                                                                                                                                                                    |

Speed-test options stay in the config bar on `/`. The navigation holds the logo, links to `/`, `/learn`, `/stats` and `/settings`, the `en`/`ru` switch and a sign-in link to `/settings`, hidden on previews; `/about` is linked from the page footer. "Reset progress" is on `/settings`, for guests only (A33). The report dialog has a `reason` select, an optional comment and the Turnstile widget.

## Interface

- All strings, including `aria-label` values, row names and chart titles, come from the i18n dictionaries.
- The layout is responsive: every feature works on a phone; the primary layout target is desktop.
- One dark theme; colours remain CSS-variable tokens so that themes can be added without structural changes.
