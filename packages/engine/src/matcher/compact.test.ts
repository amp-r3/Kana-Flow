import { describe, expect, it } from 'vitest';
import { createErrorLog } from './error-log';
import { engine, feed, prompts, Rng } from './test-util';
import type { StreamMatcher, StreamState } from './types';

describe('compact', () => {
  it('drops nothing while no prompt is committed', () => {
    const m = engine.compile(prompts('あか', 'い'), 'ime');
    const s = feed(m, 'ak').state;
    expect(s).not.toBeNull();
    if (s === null) return;
    const r = engine.compact(m, s);
    expect(r.droppedTokens).toBe(0);
    expect(r.m).toBe(m);
    expect(r.s).toBe(s);
  });

  it('drops committed prompts, rebases tokens and keeps typing valid', () => {
    const m = engine.compile(prompts('あい', 'うえ', 'おか'), 'ime');
    const s = feed(m, 'aiu').state;
    if (s === null) throw new Error('rejected');
    const r = engine.compact(m, s);
    expect(r.droppedTokens).toBe(2);
    expect(r.m.tokens.map((t) => [t.glyph, t.promptIndex])).toEqual([
      ['う', 0],
      ['え', 0],
      ['お', 1],
      ['か', 1],
    ]);
    expect(r.m.promptStarts).toEqual([0, 2]);
    expect(r.s.keys).toBe(3);
    const rest = feed(r.m, 'e').state;
    expect(rest).toBeNull(); // feed restarts from the start; the compacted state continues instead
    const next = engine.step(r.m, r.s, 'e');
    expect(next && engine.committedPrompts(r.m, next)).toBe(1);
  });

  it('rebases the timings of the tokens that stay and never the keystroke indices', () => {
    const m = engine.compile(prompts('あい', 'うえ'), 'ime');
    const s = feed(m, 'aiue').state;
    if (s === null) throw new Error('rejected');
    const before = engine.committedTimings(m, s);
    const r = engine.compact(m, engine.step(m, feed(m, 'aiu').state ?? s, 'e') ?? s);
    expect(r.droppedTokens).toBe(4);
    expect(before.map((t) => t.lastKey)).toEqual([0, 1, 2, 3]);
    expect(r.s.keys).toBe(4);
  });

  it('keeps the position of a ん that is still being decided', () => {
    const m = engine.compile(prompts('あ', 'ほん', 'ねこ'), 'learner');
    const s = feed(m, 'ahon').state;
    if (s === null) throw new Error('rejected');
    const r = engine.compact(m, s);
    expect(r.droppedTokens).toBe(1);
    const n = engine.step(r.m, r.s, 'n');
    expect(n && engine.committedPrompts(r.m, n)).toBe(1);
  });

  it('waits for the key that settles the timing of a ん before dropping its prompt', () => {
    const m = engine.compile(prompts('ほん', 'ねこ'), 'learner');
    const s = feed(m, 'honn').state;
    if (s === null) throw new Error('rejected');
    // Both readings have passed ほん, but they disagree on the keys of ん.
    expect(engine.committedPrompts(m, s)).toBe(1);
    expect(engine.compact(m, s).droppedTokens).toBe(0);
    const settled = engine.step(m, s, 'e');
    if (settled === null) throw new Error('rejected');
    expect(engine.compact(m, settled).droppedTokens).toBe(2);
  });

  it('turns completed positions of dropped tokens into a start position', () => {
    const m = engine.compile(prompts('あ', 'い', 'う'), 'ime');
    const s = feed(m, 'ai').state;
    if (s === null) throw new Error('rejected');
    const r = engine.compact(m, s);
    expect(r.droppedTokens).toBe(2);
    expect(r.s.positions).toHaveLength(1);
    expect(r.s.positions[0]?.token).toBe(-1);
    expect(engine.step(r.m, r.s, 'u')).not.toBeNull();
    expect(engine.step(r.m, r.s, 'i')).toBeNull();
  });

  it('drops everything when the whole stream is committed', () => {
    const m = engine.compile(prompts('あ', 'い'), 'ime');
    const s = feed(m, 'ai').state;
    if (s === null) throw new Error('rejected');
    const r = engine.compact(m, s);
    expect(r.droppedTokens).toBe(2);
    expect(r.m.tokens).toEqual([]);
    expect(engine.isComplete(r.m, r.s)).toBe(true);
    const grown = engine.extend(r.m, prompts('う'));
    expect(engine.step(grown, r.s, 'u')).not.toBeNull();
  });

  it('declines when a completed bare n would lose its constraint (hand-made state)', () => {
    const m = engine.compile(prompts('ほん', 'かば'), 'ime');
    const s: StreamState = {
      positions: [
        {
          token: 1,
          spelling: 2,
          offset: 1,
          firstKey: 2,
          lastKey: 2,
          path: { token: 0, firstKey: 0, lastKey: 1, prev: null },
        },
      ],
      keys: 3,
    };
    expect(engine.committedPrompts(m, s)).toBe(1);
    expect(engine.compact(m, s).droppedTokens).toBe(0);
  });

  it('merges several completed positions into one start position (hand-made state)', () => {
    const m = engine.compile(prompts('あ', 'い'), 'ime');
    const done = {
      token: 1,
      spelling: 0,
      offset: 1,
      firstKey: 1,
      lastKey: 1,
      path: { token: 0, firstKey: 0, lastKey: 0, prev: null },
    };
    const s: StreamState = { positions: [done, { ...done, spelling: 1 }], keys: 2 };
    const r = engine.compact(m, s);
    expect(r.droppedTokens).toBe(2);
    expect(r.s.positions).toHaveLength(1);
  });

  it('keeps promptIndex consistent so that extend works after compact', () => {
    const m = engine.compile(prompts('あ', 'ほん'), 'ime');
    const s = feed(m, 'a').state;
    if (s === null) throw new Error('rejected');
    const r = engine.compact(m, s);
    const grown = engine.extend(r.m, prompts('かば'));
    expect(grown.tokens.map((t) => t.promptIndex)).toEqual([0, 0, 1, 1]);
    // ほん followed by か: a bare n is allowed in strict mode before a consonant.
    const typed = engine.step(grown, r.s, 'h');
    expect(typed).not.toBeNull();
  });
});

// A zen session: prompts arrive as they are needed, committed prompts are dropped every 20.
describe('a 1,000-prompt zen stream', () => {
  const rng = new Rng(1000);
  const POOL = [
    'ねこ',
    'こんな',
    'ほん',
    'きって',
    'コーヒー',
    'ファイル',
    'あ、い',
    'ぱんだ',
    'かんい',
    'ちゃっと',
  ];
  const texts = Array.from({ length: 1000 }, () => rng.pick(POOL));

  function canonicalOf(text: string, mode: 'learner' | 'ime'): string {
    return engine.canonical(engine.compile(prompts(text), mode), 0);
  }

  for (const mode of ['learner', 'ime'] as const) {
    it(`keeps indices valid and the matcher small (${mode})`, () => {
      let m: StreamMatcher = engine.compile(prompts(texts[0] ?? '', texts[1] ?? ''), mode);
      let s = engine.start(m);
      let added = 2;
      let droppedPrompts = 0;
      let droppedTokens = 0;
      let maxTokens = 0;
      let maxPositions = 0;
      const log = createErrorLog();
      const timed = new Set<number>();
      let lastKey = -1;
      let typed = 0;

      for (let i = 0; i < texts.length; i++) {
        // The window keeps at least one full prompt beyond the active one.
        while (added < Math.min(texts.length, i - droppedPrompts + 3 + droppedPrompts)) {
          m = engine.extend(m, prompts(texts[added] ?? ''));
          added += 1;
        }
        for (const ch of canonicalOf(texts[i] ?? '', mode)) {
          const next = engine.step(m, s, ch);
          if (next === null) throw new Error(`prompt ${i}: ${ch} rejected`);
          s = next;
          typed += 1;
          maxPositions = Math.max(maxPositions, s.positions.length);
        }
        // Read the timings first, then compact, as the session does.
        for (const t of engine.committedTimings(m, s)) {
          const absolute = t.tokenIndex + droppedTokens;
          if (timed.has(absolute)) continue;
          timed.add(absolute);
          expect(t.lastKey).toBeGreaterThan(lastKey);
          expect(t.firstKey).toBeLessThanOrEqual(t.lastKey);
          lastKey = t.lastKey;
        }
        if (engine.committedPrompts(m, s) >= 20 || i === texts.length - 1) {
          const before = m.promptStarts.length;
          const r = engine.compact(m, s);
          m = r.m;
          s = r.s;
          droppedPrompts += before - m.promptStarts.length;
          droppedTokens += r.droppedTokens;
          log.rebase(r.droppedTokens);
        }
        maxTokens = Math.max(maxTokens, m.tokens.length);
      }

      expect(s.keys).toBe(typed);
      expect(droppedPrompts + engine.committedPrompts(m, s)).toBe(1000);
      expect(engine.isComplete(m, s)).toBe(true);
      expect(maxTokens).toBeLessThan(200);
      expect(maxPositions).toBeLessThan(40);
      // Every token that needs input was timed exactly once, in order.
      const expected = texts.reduce(
        (sum, text) =>
          sum + engine.compile(prompts(text), mode).tokens.filter((t) => t.kind !== 'skip').length,
        0,
      );
      expect(timed.size).toBe(expected);
    });
  }
});
