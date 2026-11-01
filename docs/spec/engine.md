# Input engine rules

The engine remains an NFA simulation over tokens, now applied to a stream of prompts rather than a single prompt. It receives the kana table as a parameter, supports small kana and skip tokens, and exposes the state needed for live conversion and for the learning mode. The accepted-input table is normative: every row MUST be covered by a golden test.

## `@kana-flow/engine` API

```ts
export function createEngine(table: KanaTable): Engine;

interface Engine {
  compile(prompts: readonly PromptItem[], strictness: Strictness): Matcher; // window of the stream
  extend(m: Matcher, prompts: readonly PromptItem[]): Matcher; // append prompts; existing state stays valid
  compact(m: Matcher, s: MatchState): { m: Matcher; s: MatchState }; // drop committed prompts, rebase indices
  start(m: Matcher): MatchState;
  step(m: Matcher, s: MatchState, ch: string): MatchState | null; // null = key rejected
  isComplete(m: Matcher, s: MatchState): boolean; // end of the stream reached
  committedPrompts(m: Matcher, s: MatchState): number; // prompts committed in every active position
  committedTimings(m: Matcher, s: MatchState): readonly TokenTiming[]; // per committed token, surviving path
  extensions(m: Matcher, s: MatchState): ReadonlySet<string>;
  view(m: Matcher, s: MatchState): EngineView; // live conversion
  errorTarget(m: Matcher, s: MatchState): number; // token index for error attribution
  canonical(m: Matcher, promptIndex: number): string; // hint text (Esc)
  spellingsFor(key: KanaKey, strictness: Strictness): readonly string[]; // results screen, learning mode
  canonicalFor(key: KanaKey): string;
}

interface EngineView {
  committedTokens: number; // tokens completed by the display position
  pendingLatin: string; // typed latin beyond those tokens
  activeToken: number; // token highlighted in the stream
}

interface TokenTiming {
  tokenIndex: number;
  firstKey: number; // index of the first keystroke consumed by the token
  lastKey: number; // index of the last keystroke consumed by the token
}
```

**Spelling constraints.** A spelling of a token MAY carry the set of next-token spellings it may precede: a single `n` for ん only before qualifying spellings, a doubled consonant for っ only before the spelling it doubles. `step()` spawns positions into the next token only for permitted spellings. This replaces the baseline token model `{ spellings[] }` and changes the baseline `start`/`step`.

- **Display position.** `view()` uses the active position with the shortest `pendingLatin`; on a tie, the position whose spellings come first in table order. Example, relaxed こんな: `kon` → こん; `konn` → こん; `konna` → こんな.
- **Window.** The stream is compiled with at least one full prompt beyond the active prompt. `extend()` MUST be called before the active token enters the last prompt of the window, so that the context of every non-final ん is known before it is typed. compact() is called after every 20 committed prompts, so a zen session does not grow the matcher without bound. It reports the number of dropped tokens; the stream UI rebases its token references, errored flags and activeToken by that offset within the render of the prompt completion that triggered it, so the ≤ 1 render budget holds.
- **Imports.** The package MUST NOT import DOM APIs, signals, storage or application aliases. The kana table and the visually-similar kana table ship in the same package as data.
- **Case.** Upper-case letters are lowercased before `step`; Caps Lock has no effect on matching.

## Tokens

- **Kana** — longest match against the table (きゃ wins over き).
- **っ followed by a kana** — spellings are built per spelling of the next kana (D22): every next spelling that starts with a latin consonant other than `n` and `y` is accepted with its first letter doubled (for ch-spellings: `cch`, `tch`, `tt` as in the table below); in addition, `xtu`, `ltu`, `xtsu` or `ltsu` followed by any next spelling is accepted. If no next spelling qualifies for doubling, only the prefixed forms remain.
- **っ elsewhere** — at the end of a prompt, before ー or before a skip token: `xtu`, `ltu`, `xtsu`, `ltsu`.
- **ん** — `nn` and `n'` are always accepted. A single `n` is accepted, per spelling of the next token, when that spelling starts with a latin consonant other than `n` and `y`, and at the end of the stream or before a skip token. Relaxed mode also accepts a single `n` before a spelling that starts with `n`, and at a prompt boundary before any spelling of the next prompt (A15).
- **ー** — rules in the table below.
- **Small kana** — ぁぃぅぇぉゃゅょゎヵヶ as standalone tokens (D7).
- **Skip token** — 、。，．！？・「」『』（）…〜 and half-width and full-width spaces. Rendered in the stream, requires no input; the cursor passes over it automatically; excluded from metrics.

**Invariant:** relaxed mode accepts every input that strict mode accepts, for every prompt. This is a property test. Example: ほんを — strict accepts `honwo`, `honnwo`, `hon'wo`; relaxed accepts those plus `honno` and `hon'o`.

## Prompt boundaries

- ん at the end of a prompt takes its context from the first token of the next prompt, using the same rules as inside a prompt. In relaxed mode a single n is additionally accepted at a boundary before any next spelling (A15).
- ん before a skip token and ん at the end of the stream behave as "ん at the end": a single `n` completes it.
- っ never merges across a prompt boundary or a skip token.
- NFA positions MAY cross a prompt boundary. A prompt counts as completed when `committedPrompts()` includes it; its completion time is the time of the keystroke that committed it.

## Accepted input

| Case                                | Example     | Relaxed                                     | Strict IME                               |
| ----------------------------------- | ----------- | ------------------------------------------- | ---------------------------------------- |
| し ち つ ふ じ                      | —           | shi/si, chi/ti, tsu/tu, fu/hu, ji/zi        | same                                     |
| を                                  | —           | wo, o                                       | wo                                       |
| ぢ / づ                             | —           | di, ji, zi, dzi / du, zu, dzu               | di / du                                  |
| ん at the end of the stream         | ほん        | hon, honn, hon'                             | same                                     |
| ん before a consonant               | かんた      | kanta, kannta, kan'ta                       | same                                     |
| ん before n                         | こんな      | konna, konnna, kon'na                       | konnna, kon'na                           |
| ん before a vowel                   | かんい      | kanni, kan'i                                | same                                     |
| ん before y                         | ほんや      | honnya, hon'ya                              | same                                     |
| ん across a boundary                | ほん → ねこ | honneko, honnneko                           | honnneko                                 |
| ん before a skip token              | ほん。      | hon, honn                                   | same                                     |
| Merged っ                           | きって      | kitte, kixtute, kiltute, kixtsute, kiltsute | same                                     |
| っ before ch                        | まっちゃ    | maccha, matcha, mattya, maxtucha            | same                                     |
| Standalone っ                       | あっ        | axtu, altu, axtsu, altsu                    | same                                     |
| っ before ー                        | ッー        | xtu-, ltu-, xtsu-, ltsu-                    | same                                     |
| Yōon                                | きゃ, しゃ  | kya; sha, sya                               | same                                     |
| ちゃ / じゃ                         | —           | cha, tya, cya / ja, zya, jya                | cha, tya / ja, zya, jya                  |
| Small kana                          | ぁ, ゃ      | xa, la; xya, lya                            | same                                     |
| Extended katakana                   | ファ, ティ  | both columns of "Extended katakana"         | Strict IME column of "Extended katakana" |
| ー                                  | コーヒー    | ko-hi-, koohii                              | ko-hi-                                   |
| ー at the start of a prompt         | —           | -                                           | -                                        |
| Particles は / へ                   | こんにちは  | konnichiwa, konnichiha                      | konnnichiha                              |
| Skip token                          | 、          | no input                                    | same                                     |
| ん before を                        | ほんを      | honwo, honnwo, hon'wo, honno, hon'o         | honwo, honnwo, hon'wo                    |
| ん before a vowel across a boundary | ほん → あめ | honame, honname, hon'ame (A15)              | honname, hon'ame                         |

Particle readings come from `readingHints` produced by the content pipeline and apply in relaxed mode only, as in the baseline. Every kana not listed above has exactly one spelling, identical in both modes: its Hepburn spelling (か ka, が ga, ぱ pa, きゃ kya, ぎょ gyo).

## Extended katakana

| Kana                          | Strict IME                   | Relaxed also accepts                             |
| ----------------------------- | ---------------------------- | ------------------------------------------------ |
| ファ フィ フェ フォ           | fa, fi, fe, fo               | fua/huxa, fui/huxi, fue/huxe, fuo/huxo           |
| ヴァ ヴィ ヴ ヴェ ヴォ        | va, vi, vu, ve, vo           | buxa, buxi, —, buxe, buxo                        |
| ウィ ウェ ウォ                | wi, we, who                  | whi/uxi, whe/uxe, wo/uxo                         |
| ティ トゥ ディ ドゥ テュ デュ | thi, twu, dhi, dwu, thu, dhu | ti/texi, tu/toxu, di/dexi, du/doxu, texyu, dexyu |
| シェ ジェ チェ                | she, je, che                 | sye/sixe; zye/jye/zixe; tye/cye/tixe             |

Other extended combinations (ツァ, クァ, イェ, スィ, フュ and similar) are not in the table; content containing them is excluded at build time.

## Errors

- A rejected key does not enter the buffer, the state is unchanged, and a 280 ms shake is played.
- The error is recorded on token `errorTarget()` (D10): `mistakes += 1`, `errored = true`, and the pair "expected kana → typed character" is stored for the confusion matrix.
- Non-latin characters, Space, Enter and Backspace are `ignore`, not errors (D15).
- Esc (hint) keeps the baseline behaviour: shows `canonical` for the active prompt, counts one error, and the prompt must still be typed in full.
- `shouldAbsorb` is removed; surplus `n` keys are resolved by stream matching (D3).
