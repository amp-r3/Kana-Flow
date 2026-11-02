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

A group id is the baseline `RowId` and a group's kana are that row's entries. The `vowels` group of each track is unlocked from the start. っ, ー, small kana, ゐ and ゑ belong to no group: they appear in speed mode only.

## Lesson for a new group

"Continue lesson" starts a lesson for the first unlocked group, in table order, that has a kana in box 0 or not yet introduced. The action is hidden when no such group exists. The kana of that group in box 0 or not yet introduced are the lesson's new kana; K is their number.

1. **Introduction.** One task per kana not yet introduced. The kana and its romaji (`canonicalFor`) are shown large; the user types the romaji once with a ghost hint. Errors here are not recorded. This task creates the `LearnEntry`.
2. **Recognition** (reverse direction). One task per new kana, shuffled. Romaji is shown; the user picks the kana from 4 numbered options, by click or keys 1–4. A wrong choice is recorded in `KanaStat.mixups`.
3. **Recall.** One task per new kana, shuffled. The kana is shown; the user types the romaji without a hint. Esc shows a hint and counts as an error.
4. **Mixed review.** Fills the lesson up to 20 tasks, at least 2. Each task is recognition or recall with equal probability, and the same kana is never asked twice in a row when another is available. Half of the tasks use the new kana. The other half use kana of earlier groups in the track, picked by weight: box 1 = 4, box 2 = 3, box 3 = 2, box 4 and 5 = 1. With no earlier groups, every task uses the new kana.

A wrong answer in stage 2 or 3 repeats that task once at the end of the stage. Tasks use `Rng`, so a lesson is reproducible in tests. The summary screen shows kana moved to box 1, accuracy and confused kana.

A lesson is not resumable: its answer tally lives in memory and is lost when it is left. Kana already moved to box 1 stay there. A kana still in box 0 at the end of a lesson is taken up by the next lesson.

## Reviews

"Review (N)" starts a session of recall tasks, one per due kana of the selected track, oldest `dueAt` first, at most 20 per session. N is the total number due. Recall tests the skill the product trains, and a recognition choice is too easy to promote a kana.

## Recognition options

Three distractors are picked in this order, skipping duplicates and any kana that fails the rule below:

1. at most one from the user's `mixups` for this kana, highest count first;
2. at most one from the visually-similar kana table in `packages/engine` (curated pairs such as さ/ち, ぬ/め, わ/ね/れ, シ/ツ, ソ/ン);
3. from the same group;
4. from the rest of the track, introduced kana first, then in table order.

A distractor MUST be of the same script and MUST NOT share any accepted spelling with the correct answer in the current strictness (for example じ/ぢ, ず/づ, お/を in relaxed mode). Spellings come from `spellingsFor`. Option positions are shuffled with `Rng`.

## Boxes

| Box | Review interval | Entry condition                                                                         |
| --- | --------------- | --------------------------------------------------------------------------------------- |
| 0   | within lessons  | new kana, until the box 1 entry condition is met                                        |
| 1   | 1 day           | two correct answers in one lesson, at least one of them recall; or an error in a review |
| 2   | 3 days          | correct answer in a review from box 1                                                   |
| 3   | 7 days          | correct answer in a review from box 2                                                   |
| 4   | 14 days         | correct answer in a review from box 3; the kana counts as mastered                      |
| 5   | 30 days         | correct answer in a review from box 4                                                   |

- A **review** is a task in a review session. Only reviews move a kana from box 1 upward or send it back to box 1.
- Answers in a lesson's mixed review for kana already in box 1 or higher record `mixups` but do not change their box, even if the kana is due.
- A correct answer is an error-free recall, with no rejected key and no Esc, or a correct recognition choice.
- **Due date:** `dueAt` is the start of the local calendar day that lies the box's interval after today, so a daily review does not slip by the time of day. A late review has no penalty. A new or box 0 entry has `dueAt` = 0.
- A correct review from box 5 keeps the kana in box 5.
- **Unlocking:** the next group unlocks when every kana of the current group is in box 1 or higher, so several groups can be learned in one day.
- Thresholds and intervals are code constants.

## `/learn` screen

- Kana chart of the selected track, cells coloured by box.
- "Continue lesson" and "Review (N)" actions. Both a lesson and a review session count in the `learn` counters.
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
