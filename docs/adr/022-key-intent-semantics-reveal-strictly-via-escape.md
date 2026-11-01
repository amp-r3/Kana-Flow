# ADR 022: Key Intent Semantics: Reveal Strictly via Escape

- **Context:** Clarify behavior of non-character keys (`Escape`, `Space`, `Enter`, `Backspace`) during prompt typing.
- **Decision:** Strictly adhere to Plan Section 6.2:
  1. Only `Escape` pressed while focused on the active input sink triggers answer reveal (`kind: 'reveal'`), displaying canonical romaji, marking the prompt as assisted (`isAssisted = true`), and penalizing with 1 mistake.
  2. `Space`, `Enter`, and `Backspace` yield `{ kind: 'ignore' }`. They are filtered out by `bindKeyboard`, emit no intent, do not alter `typedBuffer`, count zero mistakes, and induce zero state changes.
  3. Standard browser hotkeys and navigation (`Ctrl+R`, `F5`, `Tab`, `Ctrl+L`) are preserved with `defaultPrevented === false`.
- **Justification:** Conforms directly to Plan 6.2, preventing accidental reveal activations or false-positive mistakes from stray Space/Enter keystrokes.
