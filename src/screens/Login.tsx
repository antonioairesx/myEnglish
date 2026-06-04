import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleIcon } from '../components/icons';

export default function Login() {
  const { login } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function handleLogin() {
    setBusy(true);
    setErr('');
    try {
      await login();
    } catch {
      setErr('Não foi possível entrar. Tente novamente.');
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh flex flex-col justify-between px-6 py-12 animate-fade-in">
      <div className="flex-1 flex flex-col justify-center">
        <div
          className="inline-flex items-center justify-center mb-7"
          style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--accent)', color: 'var(--on-accent)',
          }}
          aria-hidden
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 2 9 5-9 5-9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" />
          </svg>
        </div>

        <h1 className="font-display" style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
          Repetição<br />espaçada,<br />sem fricção.
        </h1>
        <p style={{ color: 'var(--txt-2)', fontSize: 16, lineHeight: 1.5, marginTop: 16, maxWidth: '34ch' }}>
          Crie seus decks, estude com áudio e deixe o algoritmo decidir o que revisar. Seus dados ficam salvos na nuvem.
        </p>
      </div>

      <div>
        {err && (
          <p style={{ color: 'var(--again-txt)', fontSize: 14, marginBottom: 12, textAlign: 'center' }}>{err}</p>
        )}
        <button onClick={handleLogin} disabled={busy} className="btn-ghost w-full" style={{ minHeight: 52 }}>
          <GoogleIcon size={18} />
          {busy ? 'Entrando…' : 'Continuar com Google'}
        </button>
        <p style={{ color: 'var(--txt-3)', fontSize: 12, textAlign: 'center', marginTop: 14 }}>
          Login rápido. Cada pessoa vê apenas os próprios decks.
        </p>
      </div>
    </main>
  );
}
