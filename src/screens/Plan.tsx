import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { computeStreak, retention, estimateMinutes } from '../lib/stats';
import { LogoutIcon } from '../components/icons';

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default function Plan() {
  const nav = useNavigate();
  const { logout } = useAuth();
  const { decks, logs, dueAll, dueOf, loading } = useData();

  const now = new Date();
  const due = dueAll();
  const streak = computeStreak(logs);
  const ret = retention(logs);
  const activeDecks = decks.filter((d) => dueOf(d.id).length > 0);

  return (
    <main className="px-5 pt-8 pb-28 animate-fade-up">
      <header className="flex items-start justify-between mb-1">
        <div>
          <h1 className="font-display" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1 }}>
            Hoje
          </h1>
          <p style={{ color: 'var(--txt-3)', fontSize: 13, marginTop: 5 }}>
            {WEEKDAYS[now.getDay()]}, {now.getDate()} de {MONTHS[now.getMonth()]}
            {' · '}
            {due.length === 0 ? 'tudo em dia' : `${due.length} ${due.length === 1 ? 'pendente' : 'pendentes'}`}
          </p>
        </div>
        <button onClick={logout} className="icon-btn" aria-label="Sair">
          <LogoutIcon size={18} />
        </button>
      </header>

      {streak > 0 && (
        <div
          className="inline-flex items-center gap-2 mt-4"
          style={{ background: 'var(--accent-soft)', borderRadius: 9, padding: '6px 11px' }}
        >
          <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--accent)' }} />
          <span style={{ color: 'var(--accent-txt)', fontSize: 13, fontWeight: 600 }}>
            {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 mt-5">
        <Stat n={String(due.length)} label="pra revisar" />
        <Stat n={due.length ? `~${estimateMinutes(due.length)}min` : '0min'} label="estimado" />
        <Stat n={logs.length ? `${ret}%` : '—'} label="retenção 30d" />
        <Stat n={String(activeDecks.length)} label="decks ativos" />
      </div>

      <section className="mt-6">
        <h2 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--txt-3)', marginBottom: 8 }}>
          O que revisar
        </h2>

        {loading ? (
          <Skeleton />
        ) : due.length === 0 ? (
          <Empty hasDecks={decks.length > 0} onCreate={() => nav('/decks')} />
        ) : (
          <div className="card-surface overflow-hidden">
            {activeDecks.map((d, i) => {
              const count = dueOf(d.id).length;
              return (
                <button
                  key={d.id}
                  onClick={() => nav(`/study/${d.id}`)}
                  className="w-full flex items-center justify-between text-left"
                  style={{
                    padding: '14px 16px',
                    borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--accent)', flexShrink: 0 }} />
                    <span style={{ fontSize: 15, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.name}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-txt)', background: 'var(--accent-soft)', padding: '3px 9px', borderRadius: 7 }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {due.length > 0 && (
        <button onClick={() => nav('/study')} className="btn-primary w-full mt-5" style={{ minHeight: 54 }}>
          Iniciar sessão · {due.length} {due.length === 1 ? 'card' : 'cards'}
        </button>
      )}
    </main>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="card-surface" style={{ padding: '13px 14px' }}>
      <div className="font-display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Empty({ hasDecks, onCreate }: { hasDecks: boolean; onCreate: () => void }) {
  return (
    <div className="card-surface" style={{ padding: '28px 20px', textAlign: 'center' }}>
      <p style={{ fontSize: 15, fontWeight: 500 }}>
        {hasDecks ? 'Nada pra revisar agora.' : 'Você ainda não tem decks.'}
      </p>
      <p style={{ fontSize: 13, color: 'var(--txt-3)', marginTop: 4 }}>
        {hasDecks ? 'Volte mais tarde ou estude adiantado pelos decks.' : 'Crie o primeiro pra começar a estudar.'}
      </p>
      {!hasDecks && (
        <button onClick={onCreate} className="btn-ghost mt-4" style={{ margin: '16px auto 0' }}>
          Criar deck
        </button>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="card-surface" style={{ padding: 16 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between" style={{ padding: '8px 0' }}>
          <div style={{ height: 14, width: '50%', background: 'var(--surface-2)', borderRadius: 6 }} />
          <div style={{ height: 20, width: 28, background: 'var(--surface-2)', borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );
}
