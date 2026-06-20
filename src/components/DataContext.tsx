import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { watchDecks, watchAllCards, watchLogs, watchSaved } from '../lib/store';
import { isDue } from '../lib/sm2';
import type { Card, Deck, ReviewLog, SavedPhrase } from '../lib/types';

interface DataState {
  decks: Deck[];
  cards: Card[];
  logs: ReviewLog[];
  saved: SavedPhrase[];
  loading: boolean;
  cardsOf: (deckId: string) => Card[];
  dueOf: (deckId: string) => Card[];
  dueAll: () => Card[];
  isSaved: (cardId: string) => boolean;
}

const DataContext = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [logs, setLogs] = useState<ReviewLog[]>([]);
  const [saved, setSaved] = useState<SavedPhrase[]>([]);
  const [ready, setReady] = useState({ d: false, c: false });

  useEffect(() => {
    if (!user) {
      setDecks([]); setCards([]); setLogs([]); setSaved([]);
      setReady({ d: false, c: false });
      return;
    }
    const uid = user.uid;
    const unsubD = watchDecks(uid, (d) => { setDecks(d); setReady((r) => ({ ...r, d: true })); });
    const unsubC = watchAllCards(uid, (c) => { setCards(c); setReady((r) => ({ ...r, c: true })); });
    const unsubL = watchLogs(uid, setLogs);
    const unsubS = watchSaved(uid, setSaved);
    return () => { unsubD(); unsubC(); unsubL(); unsubS(); };
  }, [user]);

  const value = useMemo<DataState>(() => {
    const savedCardIds = new Set(saved.map((s) => s.id));
    const cardsOf = (deckId: string) => cards.filter((c) => c.deckId === deckId);
    const dueOf = (deckId: string) => cardsOf(deckId).filter((c) => isDue(c));
    const dueAll = () => cards.filter((c) => isDue(c));
    const isSaved = (cardId: string) => savedCardIds.has(cardId);
    return {
      decks, cards, logs, saved,
      loading: !(ready.d && ready.c),
      cardsOf, dueOf, dueAll, isSaved,
    };
  }, [decks, cards, logs, saved, ready]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData deve ser usado dentro de DataProvider');
  return ctx;
}
