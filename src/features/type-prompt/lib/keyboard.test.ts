// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { bindKeyboard } from './keyboard';

describe('features/type-prompt: bindKeyboard', () => {
  it('does not prevent default for Ctrl+R, F5, Tab, and Ctrl+L', () => {
    const onIntent = vi.fn();
    const target = new EventTarget();
    bindKeyboard({ onIntent, target });

    // Ctrl+R
    const ctrlR = new KeyboardEvent('keydown', { key: 'r', code: 'KeyR', ctrlKey: true, cancelable: true });
    target.dispatchEvent(ctrlR);
    expect(ctrlR.defaultPrevented).toBe(false);
    expect(onIntent).not.toHaveBeenCalled();

    // F5
    const f5 = new KeyboardEvent('keydown', { key: 'F5', code: 'F5', cancelable: true });
    target.dispatchEvent(f5);
    expect(f5.defaultPrevented).toBe(false);
    expect(onIntent).not.toHaveBeenCalled();

    // Tab
    const tab = new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', cancelable: true });
    target.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(false);
    expect(onIntent).not.toHaveBeenCalled();

    // Ctrl+L
    const ctrlL = new KeyboardEvent('keydown', { key: 'l', code: 'KeyL', ctrlKey: true, cancelable: true });
    target.dispatchEvent(ctrlL);
    expect(ctrlL.defaultPrevented).toBe(false);
    expect(onIntent).not.toHaveBeenCalled();
  });

  it('prevents default and dispatches intent for valid typing characters', () => {
    const onIntent = vi.fn();
    const target = new EventTarget();
    bindKeyboard({ onIntent, target });

    const keyA = new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', cancelable: true });
    target.dispatchEvent(keyA);
    expect(keyA.defaultPrevented).toBe(true);
    expect(onIntent).toHaveBeenCalledWith({ kind: 'char', char: 'a' });
  });

  it('Space/Enter/Backspace -> ignore, no mistake counted, no state change', () => {
    const onIntent = vi.fn();
    const input = document.createElement('input');
    document.body.appendChild(input);

    bindKeyboard({ onIntent, getInputElement: () => input, target: input });

    // Space
    const space = new KeyboardEvent('keydown', { key: ' ', code: 'Space', cancelable: true });
    input.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(false);
    expect(onIntent).not.toHaveBeenCalled();

    // Enter
    const enter = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', cancelable: true });
    input.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(false);
    expect(onIntent).not.toHaveBeenCalled();

    // Backspace
    const backspace = new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', cancelable: true });
    input.dispatchEvent(backspace);
    expect(backspace.defaultPrevented).toBe(false);
    expect(onIntent).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('prevents default and dispatches reveal for Escape when inside input', () => {
    const onIntent = vi.fn();
    const input = document.createElement('input');
    document.body.appendChild(input);

    bindKeyboard({ onIntent, getInputElement: () => input, target: input });

    const esc = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', cancelable: true });
    input.dispatchEvent(esc);
    expect(esc.defaultPrevented).toBe(true);
    expect(onIntent).toHaveBeenCalledWith({ kind: 'reveal' });

    document.body.removeChild(input);
  });

  it('ignores all keys when modal dialog is open', () => {
    const onIntent = vi.fn();
    const target = new EventTarget();
    bindKeyboard({ onIntent, target, isDialogOpen: () => true });

    const keyA = new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', cancelable: true });
    target.dispatchEvent(keyA);
    expect(keyA.defaultPrevented).toBe(false);
    expect(onIntent).not.toHaveBeenCalled();
  });

  it('removes listener on unsubscribe', () => {
    const onIntent = vi.fn();
    const target = new EventTarget();
    const unbind = bindKeyboard({ onIntent, target });

    unbind();

    const keyA = new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', cancelable: true });
    target.dispatchEvent(keyA);
    expect(keyA.defaultPrevented).toBe(false);
    expect(onIntent).not.toHaveBeenCalled();
  });
});
