import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchStory } from '../lib/store';
import { useTTS } from '../hooks/useTTS';
import { BackIcon, SpeakerIcon } from '../components/icons';
import type { Story } from '../lib/types';

const LEVEL_COLORS: Record<string, string> = {
  A1: 'var(--good-txt)', A2: 'var(--easy-txt)',
  B1: 'var(--hard-txt)', B2: 'var(--again-txt)', C1: 'var(--accent-txt)',
};

/* Ícones SVG inline */
const PlayIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.14.64l11-7.25a.75.75 0 0 0 0-1.28l-11-7.25A.75.75 0 0 0 6 4.75Z" />
  </svg>
);

const PauseIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.75 5a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h2.5a.75.75 0 0 0 .75-.75V5.75A.75.75 0 0 0 9.25 5h-2.5ZM14.75 5a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h2.5a.75.75 0 0 0 .75-.75V5.75a.75.75 0 0 0-.75-.75h-2.5Z" />
  </svg>
);

const SpeedIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 1 0 10 10" />
    <path d="M12 6v6l4 2" />
    <path d="M20 2v4M22 4h-4" />
  </svg>
);

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SCROLL_SPEEDS = [
  { label: 'Lento',   px: 18 },
  { label: 'Normal',  px: 32 },
  { label: 'Rápido',  px: 52 },
  { label: 'Veloz',   px: 80 },
];

export default function StoryReader() {
  const { storyId } = useParams();
  const nav = useNavigate();
  const { speak, stop, speaking, supported } = useTTS();

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolling, setScrolling] = useState(false);
  const [scrollSpeedIdx, setScrollSpeedIdx] = useState(1); // Normal
  const [ttsRate, setTtsRate] = useState(0.95);
  const [showSpeedPanel, setShowSpeedPanel] = useState(false);
  const [progress, setProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const accRef = useRef(0); // acumulador sub-pixel

  useEffect(() => {
    if (!storyId) return;
    fetchStory(storyId).then((s) => { setStory(s); setLoading(false); });
  }, [storyId]);

  // Scroll automático via requestAnimationFrame
  const scrollStep = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const pxPerFrame = SCROLL_SPEEDS[scrollSpeedIdx].px / 60; // px por frame (60fps)
    accRef.current += pxPerFrame;
    if (accRef.current >= 1) {
      const toScroll = Math.floor(accRef.current);
      accRef.current -= toScroll;
      el.scrollTop += toScroll;
    }
    // Progresso
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0);
    // Para ao chegar no fim
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) {
      setScrolling(false);
      return;
    }
    rafRef.current = requestAnimationFrame(scrollStep);
  }, [scrollSpeedIdx]);

  useEffect(() => {
    if (scrolling) {
      rafRef.current = requestAnimationFrame(scrollStep);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [scrolling, scrollStep]);

  function toggleScroll() {
    setScrolling((s) => !s);
    setShowSpeedPanel(false);
  }

  function handleTTS() {
    if (!story) return;
    if (speaking) { stop(); return; }
    speak(story.body, 'en-US', ttsRate);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100svh' }}>
        <span style={{ color: 'var(--txt-3)', fontSize: 14 }}>Carregando…</span>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex flex-col items-center justify-center px-6 text-center" style={{ minHeight: '100svh' }}>
        <p style={{ color: 'var(--txt-3)', fontSize: 15 }}>História não encontrada.</p>
        <button onClick={() => nav('/stories')} className="btn-primary mt-4">Voltar</button>
      </div>
    );
  }

  const currentScrollSpeed = SCROLL_SPEEDS[scrollSpeedIdx];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100svh', background: 'var(--bg)' }}>

      {/* Header fixo */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        flexShrink: 0,
      }}>
        <button onClick={() => { stop(); nav('/stories'); }} className="icon-btn" aria-label="Voltar">
          <BackIcon />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-display" style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {story.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 1 }}>
            <span style={{ color: LEVEL_COLORS[story.level], fontWeight: 700 }}>{story.level}</span>
            {' · '}{story.durationMin} min
          </div>
        </div>
      </header>

      {/* Barra de progresso */}
      <div style={{ height: 3, background: 'var(--border)', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${progress * 100}%`, background: 'var(--accent)', transition: 'width 0.1s linear' }} />
      </div>

      {/* Corpo do texto */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '28px 22px 120px',
          scrollbarWidth: 'none',
          // Toca no scroll manual para pausar auto-scroll
        }}
        onTouchStart={() => { if (scrolling) setScrolling(false); }}
        onWheel={() => { if (scrolling) setScrolling(false); }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {story.body.split('\n').map((line, i) => (
            line.trim() === '' ? (
              <div key={i} style={{ height: 8 }} />
            ) : (
              <p key={i} style={{
                fontSize: 20,
                lineHeight: 1.7,
                color: 'var(--txt)',
                fontFamily: 'Georgia, "Times New Roman", serif',
                letterSpacing: '0.01em',
                margin: 0,
              }}>
                {line}
              </p>
            )
          ))}
        </div>

        {/* Fim do texto */}
        <div style={{ marginTop: 48, textAlign: 'center', color: 'var(--txt-3)' }}>
          <div style={{ width: 40, height: 1, background: 'var(--border)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 13 }}>Fim da leitura</p>
        </div>
      </div>

      {/* Painel de velocidade */}
      {showSpeedPanel && (
        <div
          className="animate-fade-up"
          style={{
            position: 'absolute', bottom: 100, left: 16, right: 16,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 16, zIndex: 50,
            boxShadow: 'var(--shadow)',
          }}
        >
          <p style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Velocidade do scroll
          </p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {SCROLL_SPEEDS.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setScrollSpeedIdx(i)}
                style={{
                  padding: '8px 4px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${scrollSpeedIdx === i ? 'var(--accent)' : 'var(--border)'}`,
                  background: scrollSpeedIdx === i ? 'var(--accent)' : 'var(--surface-2)',
                  color: scrollSpeedIdx === i ? 'var(--on-accent)' : 'var(--txt-2)',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <p style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Velocidade do áudio
          </p>
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {SPEEDS.map((sp) => (
              <button
                key={sp}
                onClick={() => setTtsRate(sp)}
                style={{
                  flexShrink: 0, padding: '7px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${ttsRate === sp ? 'var(--accent)' : 'var(--border)'}`,
                  background: ttsRate === sp ? 'var(--accent)' : 'var(--surface-2)',
                  color: ttsRate === sp ? 'var(--on-accent)' : 'var(--txt-2)',
                }}
              >
                {sp}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Barra de controles fixa na base */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        maxWidth: 480, margin: '0 auto',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        display: 'flex', alignItems: 'center', gap: 10,
        zIndex: 40,
      }}>

        {/* Play/Pause scroll */}
        <button
          onClick={toggleScroll}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 0', borderRadius: 12,
            background: scrolling ? 'var(--accent)' : 'var(--surface-2)',
            border: `1.5px solid ${scrolling ? 'var(--accent)' : 'var(--border)'}`,
            color: scrolling ? 'var(--on-accent)' : 'var(--txt-2)',
            fontSize: 13, fontWeight: 600,
            transition: 'all 0.18s var(--ease-out)',
          }}
        >
          {scrolling ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
          {scrolling ? `Pausar · ${currentScrollSpeed.label}` : 'Auto-scroll'}
        </button>

        {/* Áudio TTS */}
        {supported && (
          <button
            onClick={handleTTS}
            aria-label={speaking ? 'Parar áudio' : 'Ouvir texto'}
            style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: speaking ? 'var(--accent)' : 'var(--surface-2)',
              border: `1.5px solid ${speaking ? 'var(--accent)' : 'var(--border)'}`,
              color: speaking ? 'var(--on-accent)' : 'var(--txt-2)',
              transition: 'all 0.18s var(--ease-out)',
            }}
          >
            <SpeakerIcon size={19} />
          </button>
        )}

        {/* Velocidade */}
        <button
          onClick={() => setShowSpeedPanel((v) => !v)}
          aria-label="Ajustar velocidade"
          style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: showSpeedPanel ? 'var(--accent-soft)' : 'var(--surface-2)',
            border: `1.5px solid ${showSpeedPanel ? 'var(--accent)' : 'var(--border)'}`,
            color: showSpeedPanel ? 'var(--accent-txt)' : 'var(--txt-2)',
            transition: 'all 0.18s var(--ease-out)',
          }}
        >
          <SpeedIcon size={19} />
        </button>
      </div>
    </div>
  );
}
