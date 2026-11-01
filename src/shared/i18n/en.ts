export const en = {
  // Top bar
  'app.title': 'Nekotype',
  'app.tagline': 'Hiragana & Katakana Speed Trainer',
  'app.rows': 'Kana Matrix',
  'app.reset': 'Reset Progress',

  // Config bar
  'config.script.hiragana': 'Hiragana',
  'config.script.katakana': 'Katakana',
  'config.script.both': 'Both (Mixed)',
  'config.content.single': 'Single Kana',
  'config.content.words': 'Words',
  'config.content.phrases': 'Phrases',
  'config.strictness.learner': 'Learner Mode',
  'config.strictness.ime': 'Strict IME',
  'config.weakFocus': 'Focus Weak Kana',
  'config.test.time': 'Time',
  'config.test.count': 'Count',

  // Test stage
  'stage.typePlaceholder': 'type romaji...',
  'stage.clickToFocus': 'Click to focus',
  'stage.turnImeOff': 'Please switch keyboard to English / turn Japanese IME off',
  'stage.escHint': 'Esc to reveal canonical romaji',
  'stage.tabHint': 'Tab then Enter to restart',
  'stage.revealed': 'Revealed: {answer}',
  'stage.contentLoading': 'Loading vocabulary...',
  'stage.contentLoadError': 'Failed to load content, reverted to Single Kana',

  // Results panel
  'results.title': 'Test Results',
  'results.wpm': 'WPM',
  'results.accuracy': 'Accuracy',
  'results.rawWpm': 'Raw WPM',
  'results.kanaPerMin': 'Kana/min',
  'results.time': 'Time',
  'results.completed': 'Prompts',
  'results.mistakes': 'Mistakes',
  'results.streak': 'Best Streak',
  'results.weakest': 'Weakest Kana This Run',
  'results.nextTest': 'Next Test',

  // Dialogs
  'dialog.close': 'Close',
  'dialog.selectAll': 'Select All',
  'dialog.clear': 'Clear',
  'dialog.gojuonOnly': 'Gojūon Only',
  'dialog.atLeastOneRow': 'At least one row must stay selected',
  'dialog.contentDisabled': 'Row selection is active only in Single Kana mode',
  'dialog.extendedDisabled': 'Extended katakana is unavailable in Hiragana-only mode',
  'reset.title': 'Reset Progress',
  'reset.confirm': 'Are you sure you want to erase all accuracy and time history?',
  'reset.action': 'Reset Everything',
  'reset.cancel': 'Cancel',
} as const satisfies Record<string, string>;

export type TranslationKey = keyof typeof en;
