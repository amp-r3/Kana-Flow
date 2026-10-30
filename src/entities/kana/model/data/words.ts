import type { ContentItem } from '../types';

export const wordsData: readonly ContentItem[] = [
  // Katakana standard loanwords
  {
    id: 'word:ko-hi-',
    text: 'コーヒー',
    script: 'katakana',
    meaning: { en: 'Coffee', ru: 'Кофе' },
  },
  {
    id: 'word:pasokon',
    text: 'パソコン',
    script: 'katakana',
    meaning: { en: 'Personal computer', ru: 'Компьютер' },
  },
  {
    id: 'word:aisu',
    text: 'アイス',
    script: 'katakana',
    meaning: { en: 'Ice cream', ru: 'Мороженое' },
  },
  {
    id: 'word:hoteru',
    text: 'ホテル',
    script: 'katakana',
    meaning: { en: 'Hotel', ru: 'Отель' },
  },
  {
    id: 'word:takushi-',
    text: 'タクシー',
    script: 'katakana',
    meaning: { en: 'Taxi', ru: 'Такси' },
  },
  {
    id: 'word:pan',
    text: 'パン',
    script: 'katakana',
    meaning: { en: 'Bread', ru: 'Хлеб' },
  },
  {
    id: 'word:kamera',
    text: 'カメラ',
    script: 'katakana',
    meaning: { en: 'Camera', ru: 'Камера' },
  },
  {
    id: 'word:terebi',
    text: 'テレビ',
    script: 'katakana',
    meaning: { en: 'Television', ru: 'Телевизор' },
  },
  {
    id: 'word:basu',
    text: 'バス',
    script: 'katakana',
    meaning: { en: 'Bus', ru: 'Автобус' },
  },
  {
    id: 'word:sumaho',
    text: 'スマホ',
    script: 'katakana',
    meaning: { en: 'Smartphone', ru: 'Смартфон' },
  },
  {
    id: 'word:tesuto',
    text: 'テスト',
    script: 'katakana',
    meaning: { en: 'Test / Exam', ru: 'Тест' },
  },
  {
    id: 'word:ke-ki',
    text: 'ケーキ',
    script: 'katakana',
    meaning: { en: 'Cake', ru: 'Торт' },
  },
  {
    id: 'word:no-to',
    text: 'ノート',
    script: 'katakana',
    meaning: { en: 'Notebook', ru: 'Тетрадь' },
  },
  {
    id: 'word:pen',
    text: 'ペン',
    script: 'katakana',
    meaning: { en: 'Pen', ru: 'Ручка' },
  },
  {
    id: 'word:toire',
    text: 'トイレ',
    script: 'katakana',
    meaning: { en: 'Restroom', ru: 'Туалет' },
  },

  // Katakana extended loanwords
  {
    id: 'word:pa-thi-',
    text: 'パーティー',
    script: 'katakana',
    meaning: { en: 'Party', ru: 'Вечеринка' },
  },
  {
    id: 'word:fairu',
    text: 'ファイル',
    script: 'katakana',
    meaning: { en: 'File', ru: 'Файл' },
  },
  {
    id: 'word:fo-ku',
    text: 'フォーク',
    script: 'katakana',
    meaning: { en: 'Fork', ru: 'Вилка' },
  },
  {
    id: 'word:vaiorin',
    text: 'ヴァイオリン',
    script: 'katakana',
    meaning: { en: 'Violin', ru: 'Скрипка' },
  },
  {
    id: 'word:windou',
    text: 'ウィンドウ',
    script: 'katakana',
    meaning: { en: 'Window', ru: 'Окно' },
  },
  {
    id: 'word:disuku',
    text: 'ディスク',
    script: 'katakana',
    meaning: { en: 'Disk', ru: 'Диск' },
  },
  {
    id: 'word:chekku',
    text: 'チェック',
    script: 'katakana',
    meaning: { en: 'Check', ru: 'Проверка' },
  },
  {
    id: 'word:thisshu',
    text: 'ティッシュ',
    script: 'katakana',
    meaning: { en: 'Tissue', ru: 'Салфетка' },
  },
  {
    id: 'word:kafe',
    text: 'カフェ',
    script: 'katakana',
    meaning: { en: 'Cafe', ru: 'Кафе' },
  },
  {
    id: 'word:shefu',
    text: 'シェフ',
    script: 'katakana',
    meaning: { en: 'Chef', ru: 'Шеф-повар' },
  },

  // Hiragana words
  {
    id: 'word:arigatou',
    text: 'ありがとう',
    script: 'hiragana',
    meaning: { en: 'Thank you', ru: 'Спасибо' },
  },
  {
    id: 'word:konnichiha',
    text: 'こんにちは',
    script: 'hiragana',
    meaning: { en: 'Hello / Good afternoon', ru: 'Здравствуйте' },
    // こんにちは token indices: こ(0), ん(1), に(2), ち(3), は(4) -> learner は accepts 'wa'
    readingHints: [{ tokenIndex: 4, learner: ['wa'] }],
  },
  {
    id: 'word:sayounara',
    text: 'さようなら',
    script: 'hiragana',
    meaning: { en: 'Goodbye', ru: 'До свидания' },
  },
  {
    id: 'word:neko',
    text: 'ねこ',
    script: 'hiragana',
    meaning: { en: 'Cat', ru: 'Кот' },
  },
  {
    id: 'word:inu',
    text: 'いぬ',
    script: 'hiragana',
    meaning: { en: 'Dog', ru: 'Собака' },
  },
  {
    id: 'word:mizu',
    text: 'みず',
    script: 'hiragana',
    meaning: { en: 'Water', ru: 'Вода' },
  },
  {
    id: 'word:ocha',
    text: 'おちゃ',
    script: 'hiragana',
    meaning: { en: 'Green tea', ru: 'Зеленый чай' },
  },
  {
    id: 'word:sakura',
    text: 'さくら',
    script: 'hiragana',
    meaning: { en: 'Cherry blossom', ru: 'Сакура' },
  },
  {
    id: 'word:tomodachi',
    text: 'ともだち',
    script: 'hiragana',
    meaning: { en: 'Friend', ru: 'Друг' },
  },
  {
    id: 'word:chotto',
    text: 'ちょっと',
    script: 'hiragana',
    meaning: { en: 'A little / Wait', ru: 'Немного' },
  },
  {
    id: 'word:ohayou',
    text: 'おはよう',
    script: 'hiragana',
    meaning: { en: 'Good morning', ru: 'Доброе утро' },
  },
  {
    id: 'word:sumimasen',
    text: 'すみません',
    script: 'hiragana',
    meaning: { en: 'Excuse me', ru: 'Извините' },
  },
  {
    id: 'word:kawaii',
    text: 'かわいい',
    script: 'hiragana',
    meaning: { en: 'Cute', ru: 'Милый' },
  },
  {
    id: 'word:sushi',
    text: 'すし',
    script: 'hiragana',
    meaning: { en: 'Sushi', ru: 'Суши' },
  },
  {
    id: 'word:tenki',
    text: 'てんき',
    script: 'hiragana',
    meaning: { en: 'Weather', ru: 'Погода' },
  },
];
