import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useTTS } from '../hooks/useTTS';
import { unsavePhrase } from '../lib/store';
import { BookmarkIcon, SpeakerIcon, TrashIcon } from '../components/icons';
import type { SavedPhrase } from '../lib/types';

export default function Saved() {
  const { saved } = useData();
  const { user } = useAuth();
  const { speak, speaking } = useTTS();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  async function handleRemove(phrase: SavedPhrase) {
    if (!user) return;
    setRemovingId(phrase.id);
    try {
      await unsavePhrase(user.uid, phrase.id);
    } finally {
      setRemovingId(null);
    }
  }

  function handleSpeak(phrase: SavedPhrase, text: string, lang: string) {
    setSpeakingId(phrase.id + lang);
    speak(text, lang);
    setTimeout(() => setSpeakingId(null), 3000);
  }

  return (
    <main className="px-5 pt-8 pb-28 animate-fade-up">
      <h1
        className="font-display"
        style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.045em', marginBottom: 5 }}
      >
        Salvas
      </h1>
      <p style={{ color: 'var(--txt-3)', fontSize: 13, marginBottom: 20 }}>
        {saved.length} {saved.length === 1 ? 'frase salva' : 'frases salvas'}
      </p>

      {saved.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center"
          style={{ paddingTop: 80, color: 'var(--txt-3)', textAlign: 'center' }}
        >
          <BookmarkIcon size={36} />
          <p style={{ marginTop: 14, fontSize: 15, fontWeight: 500 }}>Nenhuma frase salva ainda</p>
          <p style={{ fontSize: 13, marginTop: 6, maxWidth: 240 }}>
            Durante os flashcards, toque em "salvar" para guardar frases aqui.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {saved.map((phrase) => {
            const isRemoving = removingId === phrase.id;
            const isSpeakingFront = speakingId === phrase.id + phrase.lang && speaking;
            const isSpeakingBack = speakingId === phrase.id + 'pt-BR' && speaking;

            return (
              <div
                key={phrase.id}
                className="card-surface"
                style={{
                  padding: '18px 18px 14px',
                  opacity: isRemoving ? 0.4 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {/* Deck label */}
                <span style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {phrase.deckName}
                </span>

                {/* Front */}
                <div style={{ marginTop: 8, marginBottom: 4 }}>
                  <div
                    className="font-display"
                    style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2 }}
                  >
                    {phrase.front}
                  </div>
                  {phrase.hint && (
                    <div style={{ fontSize: 12, color: 'var(--txt-3)', fontStyle: 'italic', marginTop: 2 }}>
                      {phrase.hint}
                    </div>
                  )}
                </div>

                {/* Back */}
                <div
                  style={{
                    fontSize: 15, color: 'var(--txt-2)', lineHeight: 1.5,
                    paddingTop: 10, marginTop: 6,
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  {phrase.back}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleSpeak(phrase, phrase.front, phrase.lang)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: isSpeakingFront ? 'var(--accent)' : 'var(--surface-2)',
                      border: '1px solid var(--border)', borderRadius: 8,
                      padding: '6px 10px', fontSize: 12,
                      color: isSpeakingFront ? '#fff' : 'var(--txt-2)',
                      transition: 'background 0.18s, color 0.18s',
                    }}
                  >
                    <SpeakerIcon size={13} />
                    {isSpeakingFront ? 'ouvindo…' : phrase.lang.startsWith('en') ? 'EN' : phrase.lang.slice(0, 2).toUpperCase()}
                  </button>

                  <button
                    onClick={() => handleSpeak(phrase, phrase.back, 'pt-BR')}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: isSpeakingBack ? 'var(--accent)' : 'var(--surface-2)',
                      border: '1px solid var(--border)', borderRadius: 8,
                      padding: '6px 10px', fontSize: 12,
                      color: isSpeakingBack ? '#fff' : 'var(--txt-2)',
                      transition: 'background 0.18s, color 0.18s',
                    }}
                  >
                    <SpeakerIcon size={13} />
                    {isSpeakingBack ? 'ouvindo…' : 'PT'}
                  </button>

                  <button
                    onClick={() => handleRemove(phrase)}
                    disabled={isRemoving}
                    aria-label="Remover frase salva"
                    style={{
                      marginLeft: 'auto',
                      display: 'inline-flex', alignItems: 'center',
                      background: 'transparent', border: 'none',
                      color: 'var(--txt-3)', padding: 6,
                      cursor: isRemoving ? 'default' : 'pointer',
                      borderRadius: 8,
                    }}
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
