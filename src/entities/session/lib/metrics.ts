import type { KeystrokeEvent, PromptResult, SessionMetrics } from '../model/types';

export function computeMetrics(
  keystrokes: readonly KeystrokeEvent[],
  promptResults: readonly PromptResult[],
  endTimeMs?: number,
): SessionMetrics {
  let correct = 0;
  let rejected = 0;

  for (const k of keystrokes) {
    if (k.accepted) {
      correct += 1;
    } else {
      rejected += 1;
    }
  }

  // 1 mistake per reveal / assisted prompt (Section 6.2 & 7.2)
  let assistedMistakes = 0;
  for (const p of promptResults) {
    if (p.assisted) {
      assistedMistakes += 1;
    }
  }

  const mistakes = rejected + assistedMistakes;

  const firstKeystroke = keystrokes[0];
  const lastKeystroke = keystrokes[keystrokes.length - 1];

  let endTimestamp = endTimeMs;
  if (endTimestamp === undefined) {
    if (promptResults.length > 0) {
      const lastPrompt = promptResults[promptResults.length - 1];
      endTimestamp = lastPrompt ? lastPrompt.endedAt : lastKeystroke?.at;
    } else {
      endTimestamp = lastKeystroke?.at;
    }
  }

  const startTimestamp = firstKeystroke?.at;
  const elapsedMs =
    startTimestamp !== undefined && endTimestamp !== undefined && endTimestamp > startTimestamp
      ? endTimestamp - startTimestamp
      : 0;

  const totalKeys = correct + mistakes;
  const accuracy = totalKeys > 0 ? correct / totalKeys : 1.0;

  let wpm = 0;
  let rawWpm = 0;
  let kanaPerMin = 0;

  if (elapsedMs > 0) {
    const minutes = elapsedMs / 60000;
    wpm = Math.round((correct / 5 / minutes) * 10) / 10;
    rawWpm = Math.round((totalKeys / 5 / minutes) * 10) / 10;

    let completedTokens = 0;
    for (const p of promptResults) {
      completedTokens += p.tokenOutcomes.length;
    }
    kanaPerMin = Math.round((completedTokens / minutes) * 10) / 10;
  }

  // Best streak: longest run of prompts completed with zero mistakes and not assisted
  let currentStreak = 0;
  let bestStreak = 0;
  for (const p of promptResults) {
    if (p.mistakes === 0 && !p.assisted) {
      currentStreak += 1;
      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  }

  // WPM series per second
  const wpmSeries: number[] = [];
  if (elapsedMs > 0 && startTimestamp !== undefined) {
    const durationSeconds = Math.max(1, Math.floor(elapsedMs / 1000));
    for (let sec = 1; sec <= durationSeconds; sec++) {
      const cutoff = startTimestamp + sec * 1000;
      let cumCorrect = 0;
      for (const k of keystrokes) {
        if (k.at <= cutoff && k.accepted) {
          cumCorrect += 1;
        }
      }
      const minuteFraction = sec / 60;
      const secWpm = Math.round((cumCorrect / 5 / minuteFraction) * 10) / 10;
      wpmSeries.push(secWpm);
    }
  }

  return {
    elapsedMs,
    correct,
    mistakes,
    wpm,
    rawWpm,
    accuracy,
    kanaPerMin,
    bestStreak,
    promptsCompleted: promptResults.length,
    wpmSeries,
  };
}
