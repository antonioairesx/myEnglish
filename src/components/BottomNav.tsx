import { NavLink } from 'react-router-dom';
import { HomeIcon, LayersIcon, ChartIcon } from './icons';

const tabs = [
  { to: '/', label: 'Hoje', Icon: HomeIcon, end: true },
  { to: '/decks', label: 'Decks', Icon: LayersIcon, end: false },
  { to: '/stats', label: 'Progresso', Icon: ChartIcon, end: false },
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
            <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
