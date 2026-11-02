import { describe, expect, it } from 'vitest';
import { createErrorLog } from './error-log';

describe('createErrorLog', () => {
  it('counts mistakes per token and sets the errored flag (D11)', () => {
    const log = createErrorLog();
    expect(log.errored(2)).toBe(false);
    log.record(2, 'hiragana:か', 'x');
    log.record(2, 'hiragana:か', 'x');
    expect(log.mistakes(2)).toBe(2);
    expect(log.errored(2)).toBe(true);
    expect(log.mistakes(3)).toBe(0);
  });

  it('stores expected → typed pairs', () => {
    const log = createErrorLog();
    log.record(0, 'hiragana:か', 'x');
    log.record(1, 'hiragana:か', 'x');
    log.record(1, 'hiragana:か', 'j');
    log.record(2, 'hiragana:き', 'j');
    const c = log.confusions();
    expect(c.get('hiragana:か')?.get('x')).toBe(2);
    expect(c.get('hiragana:か')?.get('j')).toBe(1);
    expect(c.get('hiragana:き')?.get('j')).toBe(1);
  });

  it('stores no pair for a token without a kana key, but still counts the mistake', () => {
    const log = createErrorLog();
    log.record(0, null, 'x');
    expect(log.mistakes(0)).toBe(1);
    expect(log.confusions().size).toBe(0);
  });

  it('moves token indices down on rebase and forgets the dropped ones', () => {
    const log = createErrorLog();
    log.record(1, 'hiragana:か', 'x');
    log.record(5, 'hiragana:き', 'x');
    log.rebase(3);
    expect(log.mistakes(1)).toBe(0);
    expect(log.mistakes(2)).toBe(1);
    expect(log.errored(5)).toBe(false);
    expect(log.confusions().get('hiragana:か')?.get('x')).toBe(1);
  });
});
