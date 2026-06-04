import { useData } from '../contexts/DataContext';
import { computeStreak, retention, reviewsToday, reviewsLast7Days } from '../lib/stats';

export default function Stats() {
  const { logs, cards, decks } = useData();

  const streak = computeStreak(logs);
  const ret = retention(logs);
  const today = reviewsToday(logs);
  const week = reviewsLast7Days(logs);
  const maxWeek = Math.max(1, ...week.map((w) => w.count));
  const learned = cards.filter((c) => c.reps > 0).length;

  return (
    <main className="px-5 pt-8 pb-28 animate-fade-up">
      <h1 className="font-display" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.045em', marginBottom: 5 }}>
        Progresso
      </h1>
      <p style={{ color: 'var(--txt-3)', fontSize: 13, marginBottom: 20 }}>
        {logs.length} {logs.length === 1 ? 'revisão' : 'revisões'} no total
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        <Stat n={String(streak)} unit={streak === 1 ? 'dia' : 'dias'} label="sequência" />
        <Stat n={String(today)} unit="" label="revisões hoje" />
        <Stat n={logs.length ? `${ret}%` : '—'} unit="" label="retenção 30d" />
        <Stat n={`${learned}/${cards.length}`} unit="" label="cards estudados" />
      </div>

      <section className="card-surface mt-4" style={{ padding: '18px 18px 14px' }}>
        <h2 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--txt-3)', marginBottom: 18 }}>
          Últimos 7 dias
        </h2>
        <div className="flex items-end justify-between gap-2" style={{ height: 110 }}>
          {week.map((w, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2" style={{ height: '100%' }}>
              <div className="flex-1 flex items-end w-full justify-center">
                <div
                  style={{
                    width: '70%',
                    height: `${(w.count / maxWeek) * 100}%`,
                    minHeight: w.count > 0 ? 6 : 3,
                    background: w.count > 0 ? 'var(--accent)' : 'var(--surface-2)',
                    borderRadius: 6,
                    transition: 'height 0.4s var(--ease-out)',
                  }}
                  title={`${w.count} revisões`}
                />
              </div>
              <span style={{ fontSize: 11, color: 'var(--txt-3)' }}>{w.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--txt-3)', marginBottom: 8 }}>
          Por deck
        </h2>
        {decks.length === 0 ? (
          <p style={{ color: 'var(--txt-3)', fontSize: 14 }}>Sem decks ainda.</p>
        ) : (
          <div className="card-surface overflow-hidden">
            {decks.map((d, i) => {
              const total = cards.filter((c) => c.deckId === d.id).length;
              const studied = cards.filter((c) => c.deckId === d.id && c.reps > 0).length;
              const pct = total ? Math.round((studied / total) * 100) : 0;
              return (
                <div key={d.id} style={{ padding: '13px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--txt-3)', flexShrink: 0, marginLeft: 10 }}>{studied}/{total}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ n, unit, label }: { n: string; unit: string; label: string }) {
  return (
    <div className="card-surface" style={{ padding: '14px 15px' }}>
      <div className="font-display" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>
        {n}{unit && <span style={{ fontSize: 14, color: 'var(--txt-3)', fontWeight: 600 }}> {unit}</span>}
      </div>
      <div style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 5 }}>{label}</div>
    </div>
  );
}
