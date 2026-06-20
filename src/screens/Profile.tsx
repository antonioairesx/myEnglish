import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { computeStreak, totalStudyDays, totalMinutesStudied, retention } from '../lib/stats';
import { ProfileIcon, FlameIcon, CalendarIcon, ClockIcon, ChartIcon, BookmarkIcon, LogoutIcon } from '../components/icons';

export default function Profile() {
  const { logs, saved, cards } = useData();
  const { user, logout } = useAuth();

  const streak     = computeStreak(logs);
  const studyDays  = totalStudyDays(logs);
  const totalMins  = totalMinutesStudied(logs);
  const hours      = Math.floor(totalMins / 60);
  const mins       = totalMins % 60;
  const ret        = retention(logs);
  const learned    = cards.filter((c) => c.reps > 0).length;

  const timeLabel = hours > 0
    ? `${hours}h ${mins}min`
    : `${totalMins}min`;

  return (
    <main className="px-5 pt-8 pb-28 animate-fade-up">

      {/* Avatar + nome */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="flex items-center justify-center mb-3"
          style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--surface-2)',
            border: '2px solid var(--border)',
            color: 'var(--txt-3)',
          }}
        >
          {user?.photoURL
            ? <img src={user.photoURL} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
            : <ProfileIcon size={34} />
          }
        </div>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>
          {user?.displayName ?? 'Estudante'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--txt-3)', marginTop: 2 }}>{user?.email}</p>
      </div>

      {/* Stats em grade */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <StatCard
          Icon={FlameIcon}
          value={String(streak)}
          unit={streak === 1 ? 'dia' : 'dias'}
          label="sequência atual"
          accent
        />
        <StatCard
          Icon={CalendarIcon}
          value={String(studyDays)}
          unit={studyDays === 1 ? 'dia' : 'dias'}
          label="dias estudados"
        />
        <StatCard
          Icon={ClockIcon}
          value={timeLabel}
          unit=""
          label="tempo total"
        />
        <StatCard
          Icon={ChartIcon}
          value={ret ? `${ret}%` : '—'}
          unit=""
          label="retenção 30d"
        />
      </div>

      {/* Cards aprendidos */}
      <div
        className="card-surface mb-4"
        style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <span style={{ fontSize: 14, color: 'var(--txt-2)' }}>Cards aprendidos</span>
        <span className="font-display" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em' }}>
          {learned}
          <span style={{ fontSize: 13, color: 'var(--txt-3)', fontWeight: 500 }}> / {cards.length}</span>
        </span>
      </div>

      {/* Frases salvas */}
      <div
        className="card-surface mb-8"
        style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div className="flex items-center gap-2.5" style={{ color: 'var(--txt-2)' }}>
          <BookmarkIcon size={17} />
          <span style={{ fontSize: 14 }}>Frases salvas</span>
        </div>
        <span className="font-display" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em' }}>
          {saved.length}
        </span>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2"
        style={{
          padding: '13px 0',
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'var(--surface-2)',
          color: 'var(--txt-3)',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <LogoutIcon size={17} />
        Sair da conta
      </button>
    </main>
  );
}

function StatCard({
  Icon, value, unit, label, accent = false,
}: {
  Icon: React.FC<{ size?: number; className?: string }>;
  value: string;
  unit: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className="card-surface"
      style={{
        padding: '16px 15px',
        ...(accent ? { borderColor: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 8%, var(--surface))' } : {}),
      }}
    >
      <div
        className="flex items-center gap-1.5 mb-2"
        style={{ color: accent ? 'var(--accent-txt)' : 'var(--txt-3)' }}
      >
        <Icon size={15} />
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <div className="font-display" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: 14, color: 'var(--txt-3)', fontWeight: 600 }}> {unit}</span>}
      </div>
    </div>
  );
}
