export type KeyIntent =
  | { readonly kind: 'char'; readonly char: string }
  | { readonly kind: 'reveal' }
  | { readonly kind: 'ignore' };

const CODE_TO_CHAR: Record<string, string> = {
  KeyA: 'a',
  KeyB: 'b',
  KeyC: 'c',
  KeyD: 'd',
  KeyE: 'e',
  KeyF: 'f',
  KeyG: 'g',
  KeyH: 'h',
  KeyI: 'i',
  KeyJ: 'j',
  KeyK: 'k',
  KeyL: 'l',
  KeyM: 'm',
  KeyN: 'n',
  KeyO: 'o',
  KeyP: 'p',
  KeyQ: 'q',
  KeyR: 'r',
  KeyS: 's',
  KeyT: 't',
  KeyU: 'u',
  KeyV: 'v',
  KeyW: 'w',
  KeyX: 'x',
  KeyY: 'y',
  KeyZ: 'z',
  Minus: '-',
  Quote: "'",
};

export type KeyDownEventLike = Pick<
  KeyboardEvent,
  'key' | 'code' | 'isComposing' | 'ctrlKey' | 'metaKey' | 'altKey'
>;

export function handleKeyDown(event: KeyDownEventLike): KeyIntent {
  // Ignore modifier combinations or IME composition
  if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) {
    return { kind: 'ignore' };
  }

  // Esc key reveals answer
  if (event.key === 'Escape') {
    return { kind: 'reveal' };
  }

  // Check event.key first: Latin letter, dash, or apostrophe
  const key = event.key;
  if (key.length === 1) {
    const lower = key.toLowerCase();
    if ((lower >= 'a' && lower <= 'z') || lower === '-' || lower === "'") {
      return { kind: 'char', char: lower };
    }
  }

  // Fallback to event.code for non-Latin layouts (e.g. Cyrillic)
  const mapped = CODE_TO_CHAR[event.code];
  if (mapped) {
    return { kind: 'char', char: mapped };
  }

  return { kind: 'ignore' };
}
