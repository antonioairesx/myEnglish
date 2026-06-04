export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface Deck {
  id: string;
  name: string;
  lang: string;        // BCP-47, ex: 'en-US' (define a voz do TTS)
  createdAt: number;
}

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  hint?: string;       // fonética, classe gramatical, etc
  // Estado SM-2
  reps: number;        // repetições bem sucedidas seguidas
  ease: number;        // easiness factor (>= 1.3)
  interval: number;    // dias até a próxima revisão
  due: number;         // timestamp da próxima revisão
  lapses: number;      // quantas vezes esqueceu
  createdAt: number;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  deckId: string;
  rating: Rating;
  reviewedAt: number;
  intervalAfter: number;
}
