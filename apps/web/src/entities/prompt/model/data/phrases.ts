import type { ContentItem } from '../types';

export const phrasesData: readonly ContentItem[] = [
  // Hiragana phrases
  {
    id: 'phrase:hajimemashite',
    text: 'はじめまして',
    script: 'hiragana',
    meaning: { en: 'Nice to meet you', ru: 'Приятно познакомиться' },
  },
  {
    id: 'phrase:douzoyoroshiku',
    text: 'どうぞよろしく',
    script: 'hiragana',
    meaning: { en: 'Pleased to meet you', ru: 'Рад знакомству' },
  },
  {
    id: 'phrase:genkidesuka',
    text: 'げんきですか',
    script: 'hiragana',
    meaning: { en: 'How are you?', ru: 'Как дела?' },
  },
  {
    id: 'phrase:itadakimasu',
    text: 'いただきます',
    script: 'hiragana',
    meaning: { en: 'Bon appétit', ru: 'Приятного аппетита' },
  },
  {
    id: 'phrase:gochisousama',
    text: 'ごちそうさま',
    script: 'hiragana',
    meaning: { en: 'Thanks for the meal', ru: 'Спасибо за угощение' },
  },

  // Katakana phrases
  {
    id: 'phrase:aisuko-hi-',
    text: 'アイスコーヒー',
    script: 'katakana',
    meaning: { en: 'Iced coffee', ru: 'Кофе со льдом' },
  },
  {
    id: 'phrase:onrainge-mu',
    text: 'オンラインゲーム',
    script: 'katakana',
    meaning: { en: 'Online game', ru: 'Онлайн-игра' },
  },
  {
    id: 'phrase:furi-ma-ketto',
    text: 'フリーマーケット',
    script: 'katakana',
    meaning: { en: 'Flea market', ru: 'Блошиный рынок' },
  },
  {
    id: 'phrase:te-mapa-ku',
    text: 'テーマパーク',
    script: 'katakana',
    meaning: { en: 'Theme park', ru: 'Тематический парк' },
  },
  {
    id: 'phrase:suma-tofon',
    text: 'スマートフォン',
    script: 'katakana',
    meaning: { en: 'Smartphone', ru: 'Смартфон' },
  },

  // Hiragana everyday phrases: introductions, travel, weather, requests
  {
    id: 'phrase-gen-1',
    text: 'わたしはがくせいです',
    script: 'hiragana',
    meaning: { en: 'I am a student', ru: 'Я студент' },
    // わ(0) た(1) し(2) は(3) ... -> topic marker は is read 'wa'
    readingHints: [{ tokenIndex: 3, learner: ['wa'] }],
  },
  {
    id: 'phrase-gen-2',
    text: 'これはなんですか',
    script: 'hiragana',
    meaning: { en: 'What is this?', ru: 'Что это?' },
    // こ(0) れ(1) は(2) ... -> topic marker は is read 'wa'
    readingHints: [{ tokenIndex: 2, learner: ['wa'] }],
  },
  {
    id: 'phrase-gen-3',
    text: 'がっこうへいきます',
    script: 'hiragana',
    meaning: { en: 'I go to school', ru: 'Я иду в школу' },
    // が(0) っこ(1, merged sokuon) う(2) へ(3) ... -> direction particle へ is read 'e'
    readingHints: [{ tokenIndex: 3, learner: ['e'] }],
  },
  {
    id: 'phrase-gen-4',
    text: 'うちへかえります',
    script: 'hiragana',
    meaning: { en: 'I return home', ru: 'Я возвращаюсь домой' },
    // う(0) ち(1) へ(2) ... -> direction particle へ is read 'e'
    readingHints: [{ tokenIndex: 2, learner: ['e'] }],
  },
  {
    id: 'phrase-gen-5',
    text: 'にほんへいきたいです',
    script: 'hiragana',
    meaning: { en: 'I want to go to Japan', ru: 'Я хочу поехать в Японию' },
    // に(0) ほ(1) ん(2) へ(3) ... -> direction particle へ is read 'e'
    readingHints: [{ tokenIndex: 3, learner: ['e'] }],
  },
  {
    id: 'phrase-gen-6',
    text: 'あしたはあめです',
    script: 'hiragana',
    meaning: { en: 'It will rain tomorrow', ru: 'Завтра будет дождь' },
    // あ(0) し(1) た(2) は(3) ... -> topic marker は is read 'wa'
    readingHints: [{ tokenIndex: 3, learner: ['wa'] }],
  },
  {
    id: 'phrase-gen-7',
    text: 'きょうはいいてんきですね',
    script: 'hiragana',
    meaning: { en: "The weather is nice today, isn't it?", ru: 'Сегодня хорошая погода, правда?' },
    // きょ(0, digraph) う(1) は(2) ... -> topic marker は is read 'wa'
    readingHints: [{ tokenIndex: 2, learner: ['wa'] }],
  },
  {
    id: 'phrase-gen-8',
    text: 'すしがたべたいです',
    script: 'hiragana',
    meaning: { en: 'I want to eat sushi', ru: 'Я хочу есть суши' },
  },
  {
    id: 'phrase-gen-9',
    text: 'おちゃをください',
    script: 'hiragana',
    meaning: { en: 'Tea, please', ru: 'Чай, пожалуйста' },
  },
  {
    id: 'phrase-gen-10',
    text: 'ここにすわってください',
    script: 'hiragana',
    meaning: { en: 'Please sit here', ru: 'Пожалуйста, сядьте здесь' },
    // こ(0) こ(1) に(2) す(3) わ(4) って(5, merged sokuon) ...
  },
  {
    id: 'phrase-gen-11',
    text: 'まっすぐいってください',
    script: 'hiragana',
    meaning: { en: 'Please go straight', ru: 'Идите прямо, пожалуйста' },
    // ま(0) っす(1) ぐ(2) い(3) って(4) ...
  },
  {
    id: 'phrase-gen-12',
    text: 'ゆっくりやすんでください',
    script: 'hiragana',
    meaning: { en: 'Please take a good rest', ru: 'Пожалуйста, хорошо отдохните' },
    // ゆ(0) っく(1) り(2) ...
  },
  {
    id: 'phrase-gen-13',
    text: 'だいじょうぶですか',
    script: 'hiragana',
    meaning: { en: 'Are you okay?', ru: 'Вы в порядке?' },
    // だ(0) い(1) じょ(2, digraph) う(3) ...
  },
  {
    id: 'phrase-gen-14',
    text: 'いってきます',
    script: 'hiragana',
    meaning: { en: "I'm off / I'll be back", ru: 'Я пошёл (скоро вернусь)' },
    // い(0) って(1, merged sokuon) き(2) ...
  },

  // Katakana phrases: cafe and takeaway orders
  {
    id: 'phrase-gen-15',
    text: 'ホットコーヒー',
    script: 'katakana',
    meaning: { en: 'Hot coffee', ru: 'Горячий кофе' },
  },
  {
    id: 'phrase-gen-16',
    text: 'チーズケーキ',
    script: 'katakana',
    meaning: { en: 'Cheesecake', ru: 'Чизкейк' },
  },
  {
    id: 'phrase-gen-17',
    text: 'フライドポテト',
    script: 'katakana',
    meaning: { en: 'French fries', ru: 'Картофель фри' },
  },
  {
    id: 'phrase-gen-18',
    text: 'アイスクリーム',
    script: 'katakana',
    meaning: { en: 'Ice cream', ru: 'Мороженое' },
  },
  {
    id: 'phrase-gen-19',
    text: 'ミルクティー',
    script: 'katakana',
    meaning: { en: 'Milk tea', ru: 'Чай с молоком' },
    // ミ(0) ル(1) ク(2) ティ(3, extended digraph) ー(4)
  },
  {
    id: 'phrase-gen-20',
    text: 'ハンバーガー',
    script: 'katakana',
    meaning: { en: 'Hamburger', ru: 'Гамбургер' },
  },
];
