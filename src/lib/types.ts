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
  reps: number;
  ease: number;
  interval: number;
  due: number;
  lapses: number;
  createdAt: number;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  deckId: string;
  rating: Rating;
  reviewedAt: number;
  intervalAfter: number;
  durationMs?: number; // duração aproximada da revisão individual
}

export interface SavedPhrase {
  id: string;
  front: string;
  back: string;
  hint?: string;
  deckId: string;
  deckName: string;
  lang: string;
  savedAt: number;
}
