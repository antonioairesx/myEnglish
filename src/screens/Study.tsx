import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useTTS } from '../hooks/useTTS';
import { schedule, previewInterval } from '../lib/sm2';
import { updateCard, logReview } from '../lib/store';
import { BackIcon, SpeakerIcon, CheckIcon } from '../components/icons';
import type { Card, Rating } from '../lib/types';

const RATINGS: { key: Rating; label: string; cls: string }[] = [
  { key: 'again', label: 'outra vez', cls: 'again' },
  { key: 'hard', label: 'difícil', cls: 'hard' },
  { key: 'good', label: 'bom', cls: 'good' },
  { key: 'easy', label: 'fácil', cls: 'easy' },
];

export default function Study() {
  const { deckId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { decks, dueOf, dueAll, loading } = useData();
  const { speak, supported } = useTTS();

  const [queue, setQueue] = useState<Card[]>([]);
  const [total, setTotal] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const inited = useRef(false);

  // Idioma para o TTS: do deck específico, ou do deck do card atual.
  const current = queue[0];
  const deckOfCurrent = current ? decks.find((d) => d.id === current.deckId) : undefined;
  const lang = deckOfCurrent?.lang ?? 'en-US';

  // Inicializa a fila uma única vez (snapshot dos cards devidos).
  useEffect(() => {
    if (inited.current || loading) return;
    const initial = deckId ? dueOf(deckId) : dueAll();
    setQueue(initial);
    setTotal(initial.length);
    inited.current = true;
    if (initial.length === 0) setFinished(true);
  }, [loading, deckId, dueOf, dueAll]);

  // Fala a frente automaticamente ao trocar de card (se houver voz).
  useEffect(() => {
    if (current && supported && !flipped) {
      const t = setTimeout(() => speak(current.front, lang), 180);
      return () => clearTimeout(t);
    }
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function rate(rating: Rating) {
    if (!user || !current) return;
    const now = Date.now();
    const sched = schedule(current, rating, now);

    // Persiste (otimista: a UI avança na hora; o Firestore sincroniza depois).
    updateCard(user.uid, current.id, sched);
    logReview(user.uid, {
      cardId: current.id,
      deckId: current.deckId,
      rating,
      reviewedAt: now,
      intervalAfter: sched.interval,
    });

    setFlipped(false);
    setQueue((q) => {
      const [, ...rest] = q;
      if (rating === 'again') {
        // Volta pro fim da sessão com o estado atualizado.
        const updated = { ...current, ...sched };
        const next = [...rest, updated];
        return next;
      }
      if (rest.length === 0) setFinished(true);
      return rest;
    });
  }

  if (loading || !inited.current) {
    return <CenterMsg text="Preparando sessão…" />;
  }

  if (finished) {
    return <Done total={total} onHome={() => nav('/')} />;
  }

  if (!current) return <CenterMsg text="Nada pra revisar." />;

  const done = total - queue.length;
  const progress = total > 0 ? (done / total) * 100 : 0;

  return (
    <main className="min-h-dvh flex flex-col px-5 pt-6 pb-6">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => nav(-1)} className="icon-btn" aria-label="Sair da sessão"><BackIcon /></button>
        <div className="flex-1" style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.32s var(--ease-out)' }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--txt-3)', fontWeight: 500, minWidth: 38, textAlign: 'right' }}>
          {done}/{total}
        </span>
      </div>

      <div
        key={current.id + String(flipped)}
        className="flex-1 flex flex-col justify-center animate-flip-in"
        role="button"
        tabIndex={0}
        onClick={() => !flipped && setFlipped(true)}
        onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !flipped) { e.preventDefault(); setFlipped(true); } }}
        style={{ cursor: flipped ? 'default' : 'pointer' }}
      >
        <div className="card-surface" style={{ padding: '32px 24px', minHeight: 280, display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 'var(--shadow)' }}>
          {deckOfCurrent && (
            <span style={{ fontSize: 11, color: 'var(--txt-3)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 14 }}>
              {deckOfCurrent.name}
            </span>
          )}
          <div className="font-display" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            {current.front}
          </div>
          {current.hint && (
            <div style={{ fontSize: 13, color: 'var(--txt-3)', fontStyle: 'italic', marginTop: 8 }}>{current.hint}</div>
          )}

          {supported && (
            <button
              onClick={(e) => { e.stopPropagation(); speak(current.front, lang); }}
              className="inline-flex items-center gap-2 mt-4 self-start"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9, padding: '8px 12px', color: 'var(--txt-2)', fontSize: 12 }}
            >
              <SpeakerIcon size={15} /> ouvir
            </button>
          )}

          {flipped && (
            <div className="animate-fade-up" style={{ marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 17, color: 'var(--txt)', lineHeight: 1.5 }}>{current.back}</div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        {!flipped ? (
          <button onClick={() => setFlipped(true)} className="btn-primary w-full" style={{ minHeight: 54 }}>
            Mostrar resposta
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2 animate-fade-up">
            {RATINGS.map(({ key, label, cls }) => (
              <button
                key={key}
                onClick={() => rate(key)}
                className="flex flex-col items-center gap-1"
                style={{
                  background: `var(--${cls}-bg)`,
                  color: `var(--${cls}-txt)`,
                  border: `1px solid var(--${cls}-b)`,
                  borderRadius: 12, padding: '11px 4px', minHeight: 60,
                  fontWeight: 600, fontSize: 12,
                  transition: 'transform 0.12s var(--ease-out)',
                }}
                onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
                onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <span>{label}</span>
                <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.75 }}>{previewInterval(current, key)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function CenterMsg({ text }: { text: string }) {
  return (
    <main className="min-h-dvh flex items-center justify-center">
      <p style={{ color: 'var(--txt-3)', fontSize: 14 }}>{text}</p>
    </main>
  );
}

function Done({ total, onHome }: { total: number; onHome: () => void }) {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 text-center animate-fade-up">
      <div
        className="inline-flex items-center justify-center mb-6"
        style={{ width: 64, height: 64, borderRadius: 99, background: 'var(--good-bg)', color: 'var(--good-txt)', border: '1px solid var(--good-b)' }}
      >
        <CheckIcon size={30} />
      </div>
      <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em' }}>
        Sessão concluída
      </h1>
      <p style={{ color: 'var(--txt-2)', fontSize: 15, marginTop: 8 }}>
        {total > 0 ? `Você revisou ${total} ${total === 1 ? 'card' : 'cards'}.` : 'Nada pendente por agora.'}
      </p>
      <button onClick={onHome} className="btn-primary mt-8" style={{ minWidth: 200 }}>
        Voltar ao início
      </button>
    </main>
  );
}
