import type { KeyIntent } from './input-adapter';
import { handleKeyDown } from './input-adapter';

export type KeyboardBindingOptions = {
  readonly onIntent: (intent: KeyIntent) => void;
  readonly getInputElement?: () => HTMLElement | null;
  readonly isDialogOpen?: () => boolean;
  readonly target?: EventTarget;
};

export function bindKeyboard(options: KeyboardBindingOptions): () => void {
  const target = options.target ?? (typeof document !== 'undefined' ? document : null);
  if (!target) return () => {};

  const listener = (event: Event): void => {
    if (!(event instanceof KeyboardEvent)) return;

    // Never intercept with modifiers (Ctrl, Meta, Alt)
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    // Do not intercept if a modal dialog is open
    const isModalOpen = options.isDialogOpen
      ? options.isDialogOpen()
      : typeof document !== 'undefined' && Boolean(document.querySelector('dialog[open]'));

    if (isModalOpen) {
      return;
    }

    const inputElem = options.getInputElement ? options.getInputElement() : null;

    // Esc on a button/control outside dialog refocuses the input without activating reveal (Plan 6.2)
    if (event.key === 'Escape' && inputElem && event.target !== inputElem) {
      event.preventDefault();
      inputElem.focus();
      return;
    }

    const intent = handleKeyDown(event);

    // Call preventDefault ONLY for handled char/reveal intents, never with ctrl/meta/alt or ignored keys
    if (intent.kind === 'char' || intent.kind === 'reveal') {
      event.preventDefault();
      if (inputElem && event.target !== inputElem) {
        inputElem.focus();
      }
      options.onIntent(intent);
    }
  };

  target.addEventListener('keydown', listener);
  return () => {
    target.removeEventListener('keydown', listener);
  };
}
