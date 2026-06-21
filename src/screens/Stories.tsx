import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStories } from '../lib/store';
import type { Story, StoryLevel } from '../lib/types';

const LEVELS: { key: StoryLevel | 'all'; label: string; desc: string }[] = [
  { key: 'all', label: 'Todos',  desc: ''                    },
  { key: 'A1',  label: 'A1',    desc: 'Iniciante'           },
  { key: 'A2',  label: 'A2',    desc: 'Básico'              },
  { key: 'B1',  label: 'B1',    desc: 'Intermediário'       },
  { key: 'B2',  label: 'B2',    desc: 'Intermediário alto'  },
  { key: 'C1',  label: 'C1',    desc: 'Avançado'            },
];

const LEVEL_COLORS: Record<string, string> = {
  A1: 'var(--good-txt)',
  A2: 'var(--easy-txt)',
  B1: 'var(--hard-txt)',
  B2: 'var(--again-txt)',
  C1: 'var(--accent-txt)',
};

export default function Stories() {
  const nav = useNavigate();
  const [level, setLevel] = useState<StoryLevel | 'all'>('all');
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setStories([]);
    setLastDoc(null);
    setHasMore(true);
    load(true);
  }, [level]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load(fresh = false) {
    if (fresh) setLoading(true); else setLoadingMore(true);
    try {
      const { stories: next, lastDoc: ld } = await fetchStories(level, 20, fresh ? undefined : lastDoc);
      setStories((prev) => fresh ? next : [...prev, ...next]);
      setLastDoc(ld);
      setHasMore(next.length === 20);
    } finally {
      if (fresh) setLoading(false); else setLoadingMore(false);
    }
  }

  return (
    <main className="px-5 pt-8 pb-28 animate-fade-up">
      <h1 className="font-display" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.045em', marginBottom: 5 }}>
        Leituras
      </h1>
      <p style={{ color: 'var(--txt-3)', fontSize: 13, marginBottom: 20 }}>
        Textos nativos com scroll automático e áudio
      </p>

      {/* Filtro de nível */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
        {LEVELS.map(({ key, label, desc }) => {
          const active = level === key;
          return (
            <button
              key={key}
              onClick={() => setLevel(key)}
              style={{
                flexShrink: 0,
                padding: '6px 14px', borderRadius: 99,
                border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                background: active ? 'var(--accent)' : 'var(--surface-2)',
                color: active ? 'var(--on-accent)' : 'var(--txt-2)',
                fontSize: 13, fontWeight: 600,
                transition: 'all 0.16s var(--ease-out)',
              }}
            >
              {label}{desc ? ` · ${desc}` : ''}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-surface" style={{ height: 96, borderRadius: 14, opacity: 0.4 + i * 0.1 }} />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--txt-3)' }}>
          <p style={{ fontSize: 15, fontWeight: 500 }}>Nenhuma história neste nível ainda</p>
          <p style={{ fontSize: 13, marginTop: 6 }}>Volte em breve.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() => nav(`/stories/${story.id}`)}
              className="card-surface w-full"
              style={{ padding: '16px 18px', textAlign: 'left', cursor: 'pointer' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-display" style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 6 }}>
                    {story.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--txt-3)' }}>
                    {story.durationMin} min de leitura
                  </div>
                </div>
                <span style={{
                  flexShrink: 0,
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                  color: LEVEL_COLORS[story.level] ?? 'var(--txt-3)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 6, padding: '3px 8px',
                }}>
                  {story.level}
                </span>
              </div>
            </button>
          ))}

          {hasMore && (
            <button
              onClick={() => load(false)}
              disabled={loadingMore}
              style={{
                marginTop: 4, padding: '12px 0', borderRadius: 12,
                border: '1px solid var(--border)', background: 'var(--surface-2)',
                color: 'var(--txt-3)', fontSize: 13, fontWeight: 500,
                opacity: loadingMore ? 0.5 : 1,
              }}
            >
              {loadingMore ? 'Carregando…' : 'Ver mais'}
            </button>
          )}
        </div>
      )}
    </main>
  );
}
