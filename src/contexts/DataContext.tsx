import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { watchDecks, watchAllCards, watchLogs } from '../lib/store';
import { isDue } from '../lib/sm2';
import type { Card, Deck, ReviewLog } from '../lib/types';

interface DataState {
  decks: Deck[];
  cards: Card[];
  logs: ReviewLog[];
  loading: boolean;
  cardsOf: (deckId: string) => Card[];
  dueOf: (deckId: string) => Card[];
  dueAll: () => Card[];
}

const DataContext = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [logs, setLogs] = useState<ReviewLog[]>([]);
  const [ready, setReady] = useState({ d: false, c: false });

  useEffect(() => {
    if (!user) {
      setDecks([]); setCards([]); setLogs([]);
      setReady({ d: false, c: false });
      return;
    }
    const uid = user.uid;
    const unsubD = watchDecks(uid, (d) => { setDecks(d); setReady((r) => ({ ...r, d: true })); });
    const unsubC = watchAllCards(uid, (c) => { setCards(c); setReady((r) => ({ ...r, c: true })); });
    const unsubL = watchLogs(uid, setLogs);
    return () => { unsubD(); unsubC(); unsubL(); };
  }, [user]);

  const value = useMemo<DataState>(() => {
    const cardsOf = (deckId: string) => cards.filter((c) => c.deckId === deckId);
    const dueOf = (deckId: string) => cardsOf(deckId).filter((c) => isDue(c));
    const dueAll = () => cards.filter((c) => isDue(c));
    return {
      decks, cards, logs,
      loading: !(ready.d && ready.c),
      cardsOf, dueOf, dueAll,
    };
  }, [decks, cards, logs, ready]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData deve ser usado dentro de DataProvider');
  return ctx;
}
