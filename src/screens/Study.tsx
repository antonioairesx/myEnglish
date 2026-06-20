import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useTTS } from '../hooks/useTTS';
import { schedule, previewInterval } from '../lib/sm2';
import { updateCard, logReview, savePhrase, unsavePhrase } from '../lib/store';
import { BackIcon, SpeakerIcon, CheckIcon, BookmarkIcon } from '../components/icons';
import type { Card, Rating } from '../lib/types';

const RATINGS: { key: Rating; label: string; cls: string }[] = [
  { key: 'again', label: 'outra vez', cls: 'again' },
  { key: 'hard',  label: 'difícil',   cls: 'hard'  },
  { key: 'good',  label: 'bom',       cls: 'good'  },
  { key: 'easy',  label: 'fácil',     cls: 'easy'  },
];

/* ─── Gerador de quiz ─── */
interface QuizQuestion {
  front: string;
  correct: string;
  options: string[]; // 4 opções embaralhadas
  lang: string;
}

function buildQuiz(studied: Card[], allCards: Card[], count = 3): QuizQuestion[] {
  if (studied.length < 2) return [];
  const pool = studied.slice(0, Math.min(studied.length, 12));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(count, shuffled.length));

  // distractors: outros cards que não são o picked
  const distractorPool = allCards.filter((c) => !picked.find((p) => p.id === c.id));

  return picked.map((card) => {
    const wrong = [...distractorPool]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => c.back);
    // fallback se não tiver distractors suficientes
    while (wrong.length < 3) wrong.push('—');
    const options = [...wrong, card.back].sort(() => Math.random() - 0.5);
    return { front: card.front, correct: card.back, options, lang: 'en-US' };
  });
}

/* ─── Tela principal ─── */
type Phase = 'study' | 'quiz' | 'done';

export default function Study() {
  const { deckId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { decks, cards: allCards, dueOf, dueAll, loading, saved } = useData();
  const { speak, speaking, supported } = useTTS();

  const [phase, setPhase] = useState<Phase>('study');
  const [queue, setQueue] = useState<Card[]>([]);
  const [total, setTotal] = useState(0);
  const [studiedCards, setStudiedCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const inited = useRef(false);
  const cardStartRef = useRef<number>(Date.now());

  const current = queue[0];
  const deckOfCurrent = current ? decks.find((d) => d.id === current.deckId) : undefined;
  const lang = deckOfCurrent?.lang ?? 'en-US';

  const currentSaved = current
    ? saved.find((s) => s.front === current.front && s.deckId === current.deckId)
    : undefined;

  useEffect(() => {
    if (inited.current || loading) return;
    const initial = deckId ? dueOf(deckId) : dueAll();
    setQueue(initial);
    setTotal(initial.length);
    inited.current = true;
    if (initial.length === 0) setPhase('done');
  }, [loading, deckId, dueOf, dueAll]);

  useEffect(() => {
    if (current && supported && phase === 'study' && !flipped) {
      cardStartRef.current = Date.now();
      const t = setTimeout(() => speak(current.front, lang), 180);
      return () => clearTimeout(t);
    }
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function rate(rating: Rating) {
    if (!user || !current) return;
    const now = Date.now();
    const durationMs = now - cardStartRef.current;
    const sched = schedule(current, rating, now);
    updateCard(user.uid, current.id, sched);
    logReview(user.uid, { cardId: current.id, deckId: current.deckId, rating, reviewedAt: now, intervalAfter: sched.interval, durationMs });
    setFlipped(false);
    setQueue((q) => {
      const [head, ...rest] = q;
      const nextStudied = [...studiedCards];
      if (!nextStudied.find((c) => c.id === head.id)) nextStudied.push(head);
      setStudiedCards(nextStudied);
      if (rating === 'again') return [...rest, { ...head, ...sched }];
      if (rest.length === 0) {
        const q = buildQuiz(nextStudied, allCards);
        if (q.length > 0) { setQuiz(q); setPhase('quiz'); }
        else setPhase('done');
      }
      return rest;
    });
  }

  async function toggleSave() {
    if (!user || !current || !deckOfCurrent) return;
    setSavingId(current.id);
    try {
      if (currentSaved) await unsavePhrase(user.uid, currentSaved.id);
      else await savePhrase(user.uid, { front: current.front, back: current.back, hint: current.hint, deckId: current.deckId, deckName: deckOfCurrent.name, lang: deckOfCurrent.lang, savedAt: Date.now() });
    } finally { setSavingId(null); }
  }

  if (loading || !inited.current) return <CenterMsg text="Preparando sessão…" />;

  if (phase === 'quiz') {
    const q = quiz[quizIdx];
    const isLast = quizIdx === quiz.length - 1;

    function handlePick(option: string) {
      if (picked) return;
      setPicked(option);
      if (option === q.correct) setQuizScore((s) => s + 1);
    }

    function handleNext() {
      setPicked(null);
      if (isLast) setPhase('done');
      else setQuizIdx((i) => i + 1);
    }

    return (
      <main className="flex flex-col px-5 pt-6 pb-8" style={{ minHeight: '100svh' }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setPhase('done'); }} className="icon-btn" aria-label="Pular quiz"><BackIcon /></button>
          <div className="flex-1" style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((quizIdx) / quiz.length) * 100}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.32s var(--ease-out)' }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--txt-3)', fontWeight: 500, minWidth: 38, textAlign: 'right' }}>
            {quizIdx + 1}/{quiz.length}
          </span>
        </div>

        {/* Pergunta */}
        <div className="card-surface mb-5" style={{ padding: '24px 20px' }}>
          <p style={{ fontSize: 12, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Qual é a tradução?
          </p>
          <div className="font-display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 14 }}>
            {q.front}
          </div>
          {supported && (
            <button
              onClick={() => speak(q.front, q.lang)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: speaking ? 'var(--accent)' : 'var(--surface-2)',
                border: '1px solid var(--border)', borderRadius: 8,
                padding: '6px 12px', fontSize: 12,
                color: speaking ? '#fff' : 'var(--txt-2)',
                transition: 'background 0.18s, color 0.18s',
              }}
            >
              <SpeakerIcon size={14} />
              {speaking ? 'ouvindo…' : 'ouvir'}
            </button>
          )}
        </div>

        {/* Opções */}
        <div className="flex flex-col gap-3 flex-1">
          {q.options.map((opt, i) => {
            const isCorrect = opt === q.correct;
            const isWrong = picked === opt && !isCorrect;
            const revealed = !!picked;
            let bg = 'var(--surface-2)';
            let border = 'var(--border)';
            let color = 'var(--txt)';
            if (revealed && isCorrect) { bg = 'var(--good-bg)'; border = 'var(--good-b)'; color = 'var(--good-txt)'; }
            if (isWrong) { bg = 'var(--again-bg)'; border = 'var(--again-b)'; color = 'var(--again-txt)'; }

            return (
              <button
                key={i}
                onClick={() => handlePick(opt)}
                disabled={!!picked}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', borderRadius: 12,
                  border: `1.5px solid ${border}`,
                  background: bg, color,
                  fontSize: 15, fontWeight: 500, textAlign: 'left',
                  transition: 'all 0.18s',
                  cursor: picked ? 'default' : 'pointer',
                }}
              >
                <span style={{ flex: 1 }}>{opt}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 10 }}>
                  {supported && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); speak(opt, 'pt-BR'); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); speak(opt, 'pt-BR'); } }}
                      style={{ display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6, color: 'inherit', opacity: 0.7 }}
                      aria-label="ouvir opção"
                    >
                      <SpeakerIcon size={15} />
                    </span>
                  )}
                  {revealed && isCorrect && <CheckIcon size={17} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Botão avançar */}
        {picked && (
          <button
            onClick={handleNext}
            className="btn-primary w-full mt-5 animate-fade-up"
            style={{ minHeight: 52 }}
          >
            {isLast ? 'Ver resultado' : 'Próxima pergunta'}
          </button>
        )}
      </main>
    );
  }

  if (phase === 'done') {
    return (
      <Done
        total={total}
        quizTotal={quiz.length}
        quizScore={quizScore}
        onHome={() => nav('/')}
      />
    );
  }

  // phase === 'study'
  const done = total - queue.length;
  const progress = total > 0 ? (done / total) * 100 : 0;
  const isSaving = savingId === current?.id;

  return (
    <main className="flex flex-col px-5 pt-6 pb-6" style={{ minHeight: '100svh' }}>
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

          <div className="flex items-center gap-2 mt-4">
            {supported && (
              <button
                onClick={(e) => { e.stopPropagation(); speak(current.front, lang); }}
                className="inline-flex items-center gap-2"
                style={{
                  background: speaking ? 'var(--accent)' : 'var(--surface-2)',
                  border: '1px solid var(--border)', borderRadius: 9, padding: '8px 12px',
                  color: speaking ? '#fff' : 'var(--txt-2)', fontSize: 12,
                  transition: 'background 0.18s, color 0.18s',
                }}
              >
                <SpeakerIcon size={15} />
                {speaking ? 'ouvindo…' : 'ouvir'}
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); toggleSave(); }}
              disabled={isSaving}
              aria-label={currentSaved ? 'Remover dos salvos' : 'Salvar frase'}
              style={{
                background: currentSaved ? 'color-mix(in srgb, var(--accent) 12%, var(--surface))' : 'var(--surface-2)',
                border: `1px solid ${currentSaved ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 9, padding: '8px 12px',
                color: currentSaved ? 'var(--accent-txt)' : 'var(--txt-2)',
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, transition: 'all 0.18s',
                opacity: isSaving ? 0.5 : 1,
              }}
            >
              <BookmarkIcon size={15} filled={!!currentSaved} />
              {currentSaved ? 'salvo' : 'salvar'}
            </button>
          </div>

          {flipped && (
            <div className="animate-fade-up" style={{ marginTop: 22, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 17, color: 'var(--txt)', lineHeight: 1.5 }}>{current.back}</div>
              {supported && (
                <button
                  onClick={(e) => { e.stopPropagation(); speak(current.back, 'pt-BR'); }}
                  className="inline-flex items-center gap-2 mt-3"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9, padding: '6px 10px', color: 'var(--txt-3)', fontSize: 11 }}
                >
                  <SpeakerIcon size={13} /> ouvir tradução
                </button>
              )}
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
                  background: `var(--${cls}-bg)`, color: `var(--${cls}-txt)`,
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
    <main className="flex items-center justify-center" style={{ minHeight: '100svh' }}>
      <p style={{ color: 'var(--txt-3)', fontSize: 14 }}>{text}</p>
    </main>
  );
}

function Done({ total, quizTotal, quizScore, onHome }: { total: number; quizTotal: number; quizScore: number; onHome: () => void }) {
  const pct = quizTotal > 0 ? Math.round((quizScore / quizTotal) * 100) : null;

  return (
    <main className="flex flex-col items-center justify-center px-6 text-center animate-fade-up" style={{ minHeight: '100svh' }}>
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

      {pct !== null && (
        <div
          className="card-surface mt-6"
          style={{ padding: '20px 28px', width: '100%', maxWidth: 280 }}
        >
          <p style={{ fontSize: 12, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Quiz
          </p>
          <div className="font-display" style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1 }}>
            {quizScore}/{quizTotal}
          </div>
          <div
            style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden', marginTop: 12 }}
          >
            <div
              style={{
                height: '100%', borderRadius: 99,
                width: `${pct}%`,
                background: pct >= 70 ? 'var(--good-bg)' : pct >= 40 ? 'var(--hard-bg)' : 'var(--again-bg)',
                transition: 'width 0.6s var(--ease-out)',
              }}
            />
          </div>
          <p style={{ fontSize: 13, color: 'var(--txt-3)', marginTop: 8 }}>
            {pct >= 70 ? 'Ótimo desempenho!' : pct >= 40 ? 'Continue praticando.' : 'Revise mais esses cards.'}
          </p>
        </div>
      )}

      <button onClick={onHome} className="btn-primary mt-6" style={{ minWidth: 200 }}>
        Voltar ao início
      </button>
    </main>
  );
}
