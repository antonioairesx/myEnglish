import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export default function Sheet({
  open, onClose, title, children,
}: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        onClick={onClose}
        className="animate-fade-in"
        style={{
          position: 'fixed', inset: 0, zIndex: 30,
          background: 'oklch(20% 0.02 250 / 0.6)',
        }}
      />
      <div
        role="dialog"
        aria-label={title}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          marginInline: 'auto',
          width: '100%',
          maxWidth: 480,
          zIndex: 31,
          background: 'var(--surface)',
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          borderTop: '1px solid var(--border)',
          padding: '8px 20px 0',
          maxHeight: 'calc(90dvh - env(safe-area-inset-top))',
          overflowY: 'auto',
          height: 'fit-content',
          paddingBottom: 'calc(40px + env(safe-area-inset-bottom))',
          animation: 'sheet-up 0.32s var(--ease-out) both',
        }}
      >
        <div style={{
          width: 36, height: 4, borderRadius: 99,
          background: 'var(--border-2)', margin: '6px auto 16px',
        }} />
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16, gap: 12,
        }}>
          <h2 className="font-display" style={{
            fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em',
          }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="icon-btn"
            style={{ flexShrink: 0, marginRight: -6 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </>,
    document.body
  );
}
