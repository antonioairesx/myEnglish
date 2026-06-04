import { useEffect, type ReactNode } from 'react';

export default function Sheet({
  open, onClose, title, children,
}: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center animate-fade-in"
      style={{ background: 'oklch(20% 0.02 250 / 0.45)' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full animate-fade-up"
        style={{
          maxWidth: 560, background: 'var(--surface)',
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          borderTop: '1px solid var(--border)',
          padding: '8px 20px calc(20px + env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--border-2)', margin: '6px auto 14px' }} />
        <h2 className="font-display" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 16 }}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
