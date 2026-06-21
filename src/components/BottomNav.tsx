import { NavLink } from 'react-router-dom';
import { HomeIcon, LayersIcon, ChartIcon, ProfileIcon } from './icons';

const BookOpenIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const tabs = [
  { to: '/',         label: 'Hoje',     Icon: HomeIcon,    end: true  },
  { to: '/decks',    label: 'Decks',    Icon: LayersIcon,  end: false },
  { to: '/stories',  label: 'Leituras', Icon: BookOpenIcon,end: false },
  { to: '/stats',    label: 'Progresso',Icon: ChartIcon,   end: false },
  { to: '/profile',  label: 'Perfil',   Icon: ProfileIcon, end: false },
];

export default function BottomNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 inset-x-0 z-20"
      style={{
        maxWidth: 560, margin: '0 auto',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex">
        {tabs.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex-1 flex flex-col items-center gap-1 py-2.5"
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent-txt)' : 'var(--txt-3)',
              transition: 'color 0.16s var(--ease-out)',
            })}
          >
            <Icon size={22} />
            <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
