import { useEffect, type ReactNode } from 'react';

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

  return (
    <>
      <div
        onClick={onClose}
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
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          zIndex: 31,
          background: 'var(--surface)',
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          borderTop: '1px solid var(--border)',
          padding: '8px 20px 40px',
          maxHeight: '85dvh',
          overflowY: 'auto',
          height: 'fit-content',
        }}
        className="animate-fade-up"
      >
        <div style={{
          width: 36, height: 4, borderRadius: 99,
          background: 'var(--border-2)', margin: '6px auto 16px',
        }} />
        <h2 className="font-display" style={{
          fontSize: 20, fontWeight: 700,
          letterSpacing: '-0.03em', marginBottom: 16,
        }}>
          {title}
        </h2>
        {children}
      </div>
    </>
  );
}
