# Learning mode

The learning mode (`/learn`) introduces kana in groups and reinforces them with a Leitner system. It uses the same engine and input field as speed mode, with a separate session instance and no timer. A new group unlocks as soon as every kana of the previous group is in box 1 or higher; spaced reviews then run on a daily schedule.

## Groups

Hiragana and katakana are independent tracks; progress in one does not unlock the other.

| Order | Groups                                                                       |
| ----- | ---------------------------------------------------------------------------- |
| 1–10  | One group per gojūon row: vowels, k, s, t, n, h, m, y, r, wa + ん            |
| 11–15 | One group per dakuten/handakuten row: g, z, d, b, p                          |
| 16–26 | One group per yōon row: ky, sh, ch, ny, hy, my, ry, gy, j, by, py            |
| 27–31 | Katakana only: one group per extended-katakana row (see "Extended katakana") |

## Lesson for a new group

1. **Introduction.** The kana and its romaji are shown large; the user types the romaji once with a ghost hint.
2. **Recognition** (reverse direction). Romaji is shown; the user picks the kana from 4 numbered options, by click or keys 1–4. A wrong choice is recorded in `KanaStat.mixups`.
3. **Recall.** The kana is shown; the user types the romaji without a hint. Esc shows a hint and counts as an error.
4. **Mixed review.** The new group is mixed with kana from earlier groups for practice; kana in lower boxes appear more often.

A lesson contains about 20 tasks. The summary screen shows kana moved to box 1, accuracy and confused kana.

## Recognition options

- Distractors come from the same group, from the visually-similar kana table in `packages/engine` (curated pairs such as さ/ち, ぬ/め, わ/ね/れ, シ/ツ, ソ/ン), and from the user's `mixups`.
- A distractor MUST NOT share any accepted spelling with the correct answer in the current strictness (for example じ/ぢ, ず/づ, お/を in relaxed mode). Spellings come from `spellingsFor`.

## Boxes

| Box | Review interval | Entry condition                                                                         |
| --- | --------------- | --------------------------------------------------------------------------------------- |
| 0   | within lessons  | new kana, until the box 1 entry condition is met                                        |
| 1   | 1 day           | two correct answers in one lesson, at least one of them recall; or an error in a review |
| 2   | 3 days          | correct answer in a review from box 1                                                   |
| 3   | 7 days          | correct answer in a review from box 2                                                   |
| 4   | 14 days         | correct answer in a review from box 3; the kana counts as mastered                      |
| 5   | 30 days         | correct answer in a review from box 4                                                   |

- A **review** is a task for a kana whose `dueAt` has passed. Only reviews move a kana from box 1 upward or send it back to box 1.
- Answers in a lesson's mixed review for kana already in box 1 or higher record `mixups` but do not change their box.
- A correct answer is an error-free recall or a correct recognition choice.
- **Unlocking:** the next group unlocks when every kana of the current group is in box 1 or higher, so several groups can be learned in one day.
- Thresholds and intervals are code constants.

## `/learn` screen

- Kana chart of the selected track, cells coloured by box.
- "Continue lesson" and "Review (N)" actions, where N is the number of kana due.
- Relaxed strictness by default (`settings.learn.strictness`).

## Data

```ts
type LearnEntry = {
  box: 0 | 1 | 2 | 3 | 4 | 5;
  dueAt: number;
  introducedAt: number;
  updatedAt: number;
};
type LearnState = {
  entries: Record<KanaKey, LearnEntry>;
  unlockedGroups: Record<Script, string[]>;
};
```
