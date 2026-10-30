import { describe, it, expect } from 'vitest';
import { handleKeyDown } from './input-adapter';
import type { KeyDownEventLike } from './input-adapter';

function makeKeyEvent(init: {
  key: string;
  code?: string;
  isComposing?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}): KeyDownEventLike {
  return {
    key: init.key,
    code: init.code ?? '',
    isComposing: init.isComposing ?? false,
    ctrlKey: init.ctrlKey ?? false,
    metaKey: init.metaKey ?? false,
    altKey: init.altKey ?? false,
  };
}

describe('input-adapter: desktop keydown mapping', () => {
  it('maps direct Latin letters, dash, and apostrophe to lower-case char', () => {
    expect(handleKeyDown(makeKeyEvent({ key: 'A', code: 'KeyA' }))).toEqual({
      kind: 'char',
      char: 'a',
    });
    expect(handleKeyDown(makeKeyEvent({ key: 'z', code: 'KeyZ' }))).toEqual({
      kind: 'char',
      char: 'z',
    });
    expect(handleKeyDown(makeKeyEvent({ key: '-', code: 'Minus' }))).toEqual({
      kind: 'char',
      char: '-',
    });
    expect(handleKeyDown(makeKeyEvent({ key: "'", code: 'Quote' }))).toEqual({
      kind: 'char',
      char: "'",
    });
  });

  it('falls back to event.code for Cyrillic and other non-Latin layouts', () => {
    // Russian layout: 'ф' corresponds to 'KeyA'
    expect(handleKeyDown(makeKeyEvent({ key: 'ф', code: 'KeyA' }))).toEqual({
      kind: 'char',
      char: 'a',
    });
    // Russian layout: 'к' corresponds to 'KeyR'
    expect(handleKeyDown(makeKeyEvent({ key: 'к', code: 'KeyR' }))).toEqual({
      kind: 'char',
      char: 'r',
    });
    // Unidentified key on some browsers
    expect(handleKeyDown(makeKeyEvent({ key: 'Unidentified', code: 'KeyK' }))).toEqual({
      kind: 'char',
      char: 'k',
    });
  });

  it('handles Escape as reveal intent', () => {
    expect(handleKeyDown(makeKeyEvent({ key: 'Escape', code: 'Escape' }))).toEqual({
      kind: 'reveal',
    });
  });

  it('ignores modifier combinations', () => {
    expect(handleKeyDown(makeKeyEvent({ key: 'a', code: 'KeyA', ctrlKey: true }))).toEqual({
      kind: 'ignore',
    });
    expect(handleKeyDown(makeKeyEvent({ key: 'a', code: 'KeyA', metaKey: true }))).toEqual({
      kind: 'ignore',
    });
    expect(handleKeyDown(makeKeyEvent({ key: 'a', code: 'KeyA', altKey: true }))).toEqual({
      kind: 'ignore',
    });
  });

  it('ignores keys when isComposing is active', () => {
    expect(handleKeyDown(makeKeyEvent({ key: 'a', code: 'KeyA', isComposing: true }))).toEqual({
      kind: 'ignore',
    });
  });

  it('ignores non-typable keys like Enter, Space, Backspace, Tab, arrows', () => {
    expect(handleKeyDown(makeKeyEvent({ key: 'Enter', code: 'Enter' }))).toEqual({
      kind: 'ignore',
    });
    expect(handleKeyDown(makeKeyEvent({ key: ' ', code: 'Space' }))).toEqual({
      kind: 'ignore',
    });
    expect(handleKeyDown(makeKeyEvent({ key: 'Backspace', code: 'Backspace' }))).toEqual({
      kind: 'ignore',
    });
    expect(handleKeyDown(makeKeyEvent({ key: 'Tab', code: 'Tab' }))).toEqual({
      kind: 'ignore',
    });
    expect(handleKeyDown(makeKeyEvent({ key: 'ArrowLeft', code: 'ArrowLeft' }))).toEqual({
      kind: 'ignore',
    });
  });
});
