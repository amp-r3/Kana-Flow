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
];
