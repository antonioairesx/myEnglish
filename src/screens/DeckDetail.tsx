import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { createCard, updateCard, deleteCard, deleteDeck } from '../lib/store';
import { useTTS } from '../hooks/useTTS';
import { langLabel } from '../lib/languages';
import Sheet from '../components/Sheet';
import { PlusIcon, BackIcon, TrashIcon, EditIcon, SpeakerIcon } from '../components/icons';
import type { Card } from '../lib/types';

export default function DeckDetail() {
  const { deckId = '' } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { decks, cardsOf, dueOf } = useData();
  const { speak } = useTTS();

  const deck = decks.find((d) => d.id === deckId);
  const cards = cardsOf(deckId);
  const due = dueOf(deckId).length;

  const [editing, setEditing] = useState<Card | null>(null);
  const [adding, setAdding] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  if (!deck) {
    return (
      <main className="px-5 pt-8">
        <button onClick={() => nav('/decks')} className="icon-btn" aria-label="Voltar"><BackIcon /></button>
        <p style={{ color: 'var(--txt-3)', marginTop: 20 }}>Deck não encontrado.</p>
      </main>
    );
  }

  function openAdd() {
    setEditing(null); setFront(''); setBack(''); setHint(''); setAdding(true);
  }
  function openEdit(c: Card) {
    setEditing(c); setFront(c.front); setBack(c.back); setHint(c.hint ?? ''); setAdding(true);
  }

  async function save() {
    if (!user || !front.trim() || !back.trim()) return;
    setBusy(true);
    if (editing) {
      await updateCard(user.uid, editing.id, {
        front: front.trim(), back: back.trim(), hint: hint.trim() || undefined,
      });
    } else {
      await createCard(user.uid, deckId, front.trim(), back.trim(), hint.trim() || undefined);
    }
    setBusy(false); setAdding(false);
    setFront(''); setBack(''); setHint('');
  }

  async function removeCard(id: string) {
    if (!user) return;
    await deleteCard(user.uid, id);
  }

  async function removeDeck() {
    if (!user) return;
    await deleteDeck(user.uid, deckId);
    nav('/decks');
  }

  return (
    <main className="px-5 pt-6 pb-28 animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => nav('/decks')} className="icon-btn" aria-label="Voltar"><BackIcon /></button>
        <button onClick={() => setConfirmDel(true)} className="icon-btn" aria-label="Excluir deck">
          <TrashIcon size={18} />
        </button>
      </div>

      <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
        {deck.name}
      </h1>
      <p style={{ color: 'var(--txt-3)', fontSize: 13, marginTop: 5 }}>
        {cards.length} {cards.length === 1 ? 'card' : 'cards'} · {langLabel(deck.lang)}
        {due > 0 && <> · <span style={{ color: 'var(--accent-txt)', fontWeight: 600 }}>{due} pra revisar</span></>}
      </p>

      <div className="flex gap-2.5 mt-5">
        {due > 0 && (
          <button onClick={() => nav(`/study/${deckId}`)} className="btn-primary flex-1">
            Estudar {due}
          </button>
        )}
        <button onClick={openAdd} className={due > 0 ? 'btn-ghost' : 'btn-primary flex-1'}>
          <PlusIcon size={17} /> Card
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {cards.length === 0 ? (
          <div className="card-surface" style={{ padding: '28px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 500 }}>Deck vazio</p>
            <p style={{ fontSize: 13, color: 'var(--txt-3)', marginTop: 4 }}>Adicione o primeiro card pra estudar.</p>
          </div>
        ) : (
          cards.map((c) => (
            <div key={c.id} className="card-surface flex items-center gap-3" style={{ padding: '12px 14px' }}>
              <button
                onClick={() => speak(c.front, deck.lang)}
                className="icon-btn"
                aria-label={`Ouvir ${c.front}`}
                style={{ width: 36, height: 36, flexShrink: 0, color: 'var(--accent-txt)', background: 'var(--accent-soft)' }}
              >
                <SpeakerIcon size={16} />
              </button>
              <div className="min-w-0 flex-1">
                <div style={{ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.front}
                </div>
                <div style={{ fontSize: 13, color: 'var(--txt-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.back}
                </div>
              </div>
              <button onClick={() => openEdit(c)} className="icon-btn" aria-label="Editar" style={{ width: 36, height: 36, flexShrink: 0 }}>
                <EditIcon size={16} />
              </button>
              <button onClick={() => removeCard(c.id)} className="icon-btn" aria-label="Excluir" style={{ width: 36, height: 36, flexShrink: 0 }}>
                <TrashIcon size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title={editing ? 'Editar card' : 'Novo card'}>
        <label style={labelStyle}>Frente</label>
        <input className="field" value={front} onChange={(e) => setFront(e.target.value)} placeholder="serendipity" />
        <label style={{ ...labelStyle, marginTop: 14 }}>Verso</label>
        <textarea className="field" value={back} onChange={(e) => setBack(e.target.value)} placeholder="feliz acidente · descoberta inesperada" rows={2} style={{ resize: 'none' }} />
        <label style={{ ...labelStyle, marginTop: 14 }}>Dica <span style={{ color: 'var(--txt-3)', fontWeight: 400 }}>(opcional)</span></label>
        <input className="field" value={hint} onChange={(e) => setHint(e.target.value)} placeholder="/ˌserənˈdɪpɪti/ · substantivo" />
        <button onClick={save} disabled={!front.trim() || !back.trim() || busy} className="btn-primary w-full mt-5">
          {busy ? 'Salvando…' : editing ? 'Salvar alterações' : 'Adicionar card'}
        </button>
      </Sheet>

      <Sheet open={confirmDel} onClose={() => setConfirmDel(false)} title="Excluir deck?">
        <p style={{ color: 'var(--txt-2)', fontSize: 14, lineHeight: 1.5 }}>
          Isso remove o deck "{deck.name}" e seus {cards.length} {cards.length === 1 ? 'card' : 'cards'}. Não dá pra desfazer.
        </p>
        <div className="flex gap-2.5 mt-5">
          <button onClick={() => setConfirmDel(false)} className="btn-ghost flex-1">Cancelar</button>
          <button
            onClick={removeDeck}
            className="flex-1"
            style={{ background: 'var(--again-txt)', color: 'var(--on-accent)', borderRadius: 12, fontWeight: 600, minHeight: 46 }}
          >
            Excluir
          </button>
        </div>
      </Sheet>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--txt-2)', marginBottom: 7,
};
