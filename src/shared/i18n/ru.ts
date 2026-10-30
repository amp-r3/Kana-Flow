import type { TranslationKey } from './en';

export const ru = {
  // Top bar
  'app.title': 'Kana Flow',
  'app.tagline': 'Тренажер скорости Хираганы и Катаканы',
  'app.rows': 'Таблица кана',
  'app.reset': 'Сбросить прогресс',

  // Config bar
  'config.script.hiragana': 'Хирагана',
  'config.script.katakana': 'Катакана',
  'config.script.both': 'Обе (Смешанный)',
  'config.content.single': 'Символы',
  'config.content.words': 'Слова',
  'config.content.phrases': 'Фразы',
  'config.strictness.learner': 'Режим обучения',
  'config.strictness.ime': 'Строгий IME',
  'config.weakFocus': 'Фокус на слабых',

  // Test stage
  'stage.typePlaceholder': 'введите ромадзи...',
  'stage.clickToFocus': 'Нажмите для фокусировки',
  'stage.turnImeOff': 'Пожалуйста, переключите раскладку на английский / отключите японский IME',
  'stage.escHint': 'Esc чтобы показать правильный ответ',
  'stage.tabHint': 'Tab затем Enter для перезапуска',
  'stage.revealed': 'Ответ: {answer}',

  // Results panel
  'results.title': 'Результаты теста',
  'results.wpm': 'WPM',
  'results.accuracy': 'Точность',
  'results.rawWpm': 'Общий WPM',
  'results.kanaPerMin': 'Кана/мин',
  'results.time': 'Время',
  'results.completed': 'Завершено',
  'results.mistakes': 'Ошибки',
  'results.streak': 'Лучшая серия',
  'results.weakest': 'Слабые кана за этот тест',
  'results.nextTest': 'Следующий тест',

  // Dialogs
  'dialog.close': 'Закрыть',
  'dialog.selectAll': 'Выбрать все',
  'dialog.clear': 'Сбросить выбор',
  'dialog.gojuonOnly': 'Только Годзюон',
  'dialog.atLeastOneRow': 'Хотя бы один ряд должен быть выбран',
  'dialog.contentDisabled': 'Выбор рядов доступен только в режиме одиночных кана',
  'reset.title': 'Сброс прогресса',
  'reset.confirm': 'Вы уверены, что хотите удалить всю статистику точности и времени?',
  'reset.action': 'Стереть все',
  'reset.cancel': 'Отмена',
} as const satisfies Record<TranslationKey, string>;
