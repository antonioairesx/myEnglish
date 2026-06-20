import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  writeBatch,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Card, Deck, ReviewLog, SavedPhrase } from './types';
import { freshCardState } from './sm2';

/** Estrutura multi-user: users/{uid}/decks, users/{uid}/cards, users/{uid}/logs, users/{uid}/saved */
const decksCol = (uid: string) => collection(db, 'users', uid, 'decks');
const cardsCol = (uid: string) => collection(db, 'users', uid, 'cards');
const logsCol  = (uid: string) => collection(db, 'users', uid, 'logs');
const savedCol = (uid: string) => collection(db, 'users', uid, 'saved');

/* ---------- Decks ---------- */

export function watchDecks(uid: string, cb: (decks: Deck[]) => void): Unsubscribe {
  return onSnapshot(decksCol(uid), (snap) => {
    const decks = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Deck);
    decks.sort((a, b) => a.createdAt - b.createdAt);
    cb(decks);
  });
}

export async function createDeck(uid: string, name: string, lang: string): Promise<string> {
  const ref = await addDoc(decksCol(uid), { name, lang, createdAt: Date.now() });
  return ref.id;
}

export async function updateDeck(uid: string, id: string, patch: Partial<Deck>) {
  await updateDoc(doc(db, 'users', uid, 'decks', id), patch);
}

export async function deleteDeck(uid: string, deckId: string) {
  const cardsSnap = await getDocs(query(cardsCol(uid), where('deckId', '==', deckId)));
  const batch = writeBatch(db);
  cardsSnap.docs.forEach((c) => batch.delete(c.ref));
  batch.delete(doc(db, 'users', uid, 'decks', deckId));
  await batch.commit();
}

/* ---------- Cards ---------- */

export function watchCards(uid: string, deckId: string, cb: (cards: Card[]) => void): Unsubscribe {
  return onSnapshot(query(cardsCol(uid), where('deckId', '==', deckId)), (snap) => {
    const cards = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Card);
    cards.sort((a, b) => a.createdAt - b.createdAt);
    cb(cards);
  });
}

export function watchAllCards(uid: string, cb: (cards: Card[]) => void): Unsubscribe {
  return onSnapshot(cardsCol(uid), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Card));
  });
}

export async function createCard(
  uid: string,
  deckId: string,
  front: string,
  back: string,
  hint?: string,
) {
  const now = Date.now();
  const data: Omit<Card, 'id'> = {
    deckId,
    front,
    back,
    ...(hint ? { hint } : {}),
    ...freshCardState(now),
    createdAt: now,
  };
  await addDoc(cardsCol(uid), data);
}

export async function updateCard(uid: string, id: string, patch: Partial<Card>) {
  await updateDoc(doc(db, 'users', uid, 'cards', id), patch);
}

export async function deleteCard(uid: string, id: string) {
  await deleteDoc(doc(db, 'users', uid, 'cards', id));
}

/* ---------- Logs de revisão ---------- */

export async function logReview(uid: string, log: Omit<ReviewLog, 'id'>) {
  await setDoc(doc(logsCol(uid)), log);
}

export function watchLogs(uid: string, cb: (logs: ReviewLog[]) => void): Unsubscribe {
  return onSnapshot(logsCol(uid), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReviewLog));
  });
}

/* ---------- Frases salvas ---------- */

export async function savePhrase(uid: string, phrase: Omit<SavedPhrase, 'id'>) {
  await addDoc(savedCol(uid), phrase);
}

export async function unsavePhrase(uid: string, id: string) {
  await deleteDoc(doc(db, 'users', uid, 'saved', id));
}

export function watchSaved(uid: string, cb: (saved: SavedPhrase[]) => void): Unsubscribe {
  return onSnapshot(savedCol(uid), (snap) => {
    const saved = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SavedPhrase);
    saved.sort((a, b) => b.savedAt - a.savedAt);
    cb(saved);
  });
}
