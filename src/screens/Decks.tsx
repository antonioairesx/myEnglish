import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { createDeck } from '../lib/store';
import { LANGUAGES, langLabel } from '../lib/languages';
import Sheet from '../components/Sheet';
import { PlusIcon } from '../components/icons';

export default function Decks() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { decks, cardsOf, dueOf, loading } = useData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [lang, setLang] = useState('en-US');
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!user || !name.trim()) return;
    setBusy(true);
    const id = await createDeck(user.uid, name.trim(), lang);
    setBusy(false);
    setOpen(false);
    setName('');
    nav(`/decks/${id}`);
  }

  return (
    <main className="px-5 pt-8 pb-28 animate-fade-up">
      <header className="flex items-center justify-between mb-5">
        <h1 className="font-display" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.045em' }}>
          Decks
        </h1>
        <button onClick={() => setOpen(true)} className="btn-primary" style={{ minHeight: 44, padding: '10px 15px' }}>
          <PlusIcon size={17} /> Novo
        </button>
      </header>

      {loading ? (
        <p style={{ color: 'var(--txt-3)', fontSize: 14 }}>Carregando…</p>
      ) : decks.length === 0 ? (
        <div className="card-surface" style={{ padding: '32px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 500 }}>Nenhum deck ainda</p>
          <p style={{ fontSize: 13, color: 'var(--txt-3)', marginTop: 4 }}>
            Um deck por assunto ou idioma. Crie o primeiro.
          </p>
          <button onClick={() => setOpen(true)} className="btn-ghost" style={{ margin: '16px auto 0' }}>
            <PlusIcon size={16} /> Criar deck
          </button>
        </div>
      ) : (
        <div className="card-surface overflow-hidden">
          {decks.map((d, i) => {
            const total = cardsOf(d.id).length;
            const due = dueOf(d.id).length;
            return (
              <button
                key={d.id}
                onClick={() => nav(`/decks/${d.id}`)}
                className="w-full flex items-center justify-between text-left"
                style={{ padding: '14px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
              >
                <div className="min-w-0">
                  <div style={{ fontSize: 15, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--txt-3)', marginTop: 2 }}>
                    {total} {total === 1 ? 'card' : 'cards'} · {langLabel(d.lang)}
                  </div>
                </div>
                {due > 0 ? (
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-txt)', background: 'var(--accent-soft)', padding: '3px 9px', borderRadius: 7, flexShrink: 0 }}>
                    {due}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--txt-3)', flexShrink: 0 }}>em dia</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Novo deck">
        <label style={labelStyle}>Nome</label>
        <input
          className="field"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: English vocabulary"
          autoFocus
        />
        <label style={{ ...labelStyle, marginTop: 16 }}>Idioma (define a voz do áudio)</label>
        <select className="field" value={lang} onChange={(e) => setLang(e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
        <button onClick={handleCreate} disabled={!name.trim() || busy} className="btn-primary w-full mt-5">
          {busy ? 'Criando…' : 'Criar deck'}
        </button>
      </Sheet>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--txt-2)', marginBottom: 7,
};
