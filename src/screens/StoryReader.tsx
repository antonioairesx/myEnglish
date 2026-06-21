import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchStory } from '../lib/store';
import { BackIcon, SpeakerIcon } from '../components/icons';
import type { Story } from '../lib/types';

const GOOGLE_TTS_KEY = import.meta.env.VITE_GOOGLE_TTS_KEY as string;

const LEVEL_COLORS: Record<string, string> = {
  A1: 'var(--good-txt)', A2: 'var(--easy-txt)',
  B1: 'var(--hard-txt)', B2: 'var(--again-txt)', C1: 'var(--accent-txt)',
};

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

const SCROLL_SPEEDS = [
  { label: 'Lento',  px: 18 },
  { label: 'Normal', px: 32 },
  { label: 'Rápido', px: 52 },
  { label: 'Veloz',  px: 80 },
];

const TTS_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5];

export default function StoryReader() {
  const { storyId } = useParams();
  const nav = useNavigate();

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolling, setScrolling] = useState(false);
  const [scrollSpeedIdx, setScrollSpeedIdx] = useState(1);
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  const [showSpeedPanel, setShowSpeedPanel] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const accRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!storyId) return;
    fetchStory(storyId).then((s) => { setStory(s); setLoading(false); });
  }, [storyId]);

  const scrollStep = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const pxPerFrame = SCROLL_SPEEDS[scrollSpeedIdx].px / 60;
    accRef.current += pxPerFrame;
    if (accRef.current >= 1) {
      const toScroll = Math.floor(accRef.current);
      accRef.current -= toScroll;
      el.scrollTop += toScroll;
    }
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0);
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

  async function handleTTS() {
    if (!story) return;

    // Se está tocando, para
    if (ttsPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setTtsPlaying(false);
      return;
    }

    setTtsLoading(true);
    try {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: story.body.replace(/\n/g, ' ') },
            voice: {
              languageCode: 'en-US',
              name: 'en-US-Standard-D', // voz masculina natural
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: ttsSpeed,
            },
          }),
        }
      );

      if (!response.ok) throw new Error('TTS error');

      const data = await response.json();
      const audioContent = data.audioContent;

      // Converte base64 para blob
      const byteChars = atob(audioContent);
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArr], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setTtsPlaying(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setTtsPlaying(false); };
      await audio.play();
      setTtsPlaying(true);
    } catch (err) {
      console.error('TTS error:', err);
    } finally {
      setTtsLoading(false);
    }
  }

  // Para o áudio ao sair da tela
  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

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

      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        flexShrink: 0,
      }}>
        <button onClick={() => { if (audioRef.current) { audioRef.current.pause(); } nav('/stories'); }} className="icon-btn" aria-label="Voltar">
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

      {/* Corpo */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflowY: 'auto', padding: '28px 22px 120px', scrollbarWidth: 'none' }}
        onTouchStart={() => { if (scrolling) setScrolling(false); }}
        onWheel={() => { if (scrolling) setScrolling(false); }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {story.body.split('\n').map((line, i) =>
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
          )}
        </div>

        <div style={{ marginTop: 48, textAlign: 'center', color: 'var(--txt-3)' }}>
          <div style={{ width: 40, height: 1, background: 'var(--border)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 13 }}>Fim da leitura</p>
        </div>
      </div>

      {/* Painel de velocidade */}
      {showSpeedPanel && (
        <div className="animate-fade-up" style={{
          position: 'fixed', bottom: 90, left: 16, right: 16,
          maxWidth: 448, margin: '0 auto',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 16, zIndex: 50,
          boxShadow: 'var(--shadow)',
        }}>
          <p style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Velocidade do scroll
          </p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {SCROLL_SPEEDS.map((s, i) => (
              <button key={s.label} onClick={() => setScrollSpeedIdx(i)} style={{
                padding: '8px 4px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${scrollSpeedIdx === i ? 'var(--accent)' : 'var(--border)'}`,
                background: scrollSpeedIdx === i ? 'var(--accent)' : 'var(--surface-2)',
                color: scrollSpeedIdx === i ? 'var(--on-accent)' : 'var(--txt-2)',
              }}>
                {s.label}
              </button>
            ))}
          </div>

          <p style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Velocidade do áudio
          </p>
          <div className="flex gap-2">
            {TTS_SPEEDS.map((sp) => (
              <button key={sp} onClick={() => setTtsSpeed(sp)} style={{
                flex: 1, padding: '7px 0', borderRadius: 10, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${ttsSpeed === sp ? 'var(--accent)' : 'var(--border)'}`,
                background: ttsSpeed === sp ? 'var(--accent)' : 'var(--surface-2)',
                color: ttsSpeed === sp ? 'var(--on-accent)' : 'var(--txt-2)',
              }}>
                {sp}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controles */}
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

        {/* TTS */}
        <button
          onClick={handleTTS}
          disabled={ttsLoading}
          aria-label={ttsPlaying ? 'Parar áudio' : 'Ouvir texto'}
          style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: ttsPlaying ? 'var(--accent)' : 'var(--surface-2)',
            border: `1.5px solid ${ttsPlaying ? 'var(--accent)' : 'var(--border)'}`,
            color: ttsPlaying ? 'var(--on-accent)' : ttsLoading ? 'var(--txt-3)' : 'var(--txt-2)',
            transition: 'all 0.18s var(--ease-out)',
            opacity: ttsLoading ? 0.6 : 1,
          }}
        >
          {ttsLoading ? (
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
              </path>
            </svg>
          ) : (
            <SpeakerIcon size={19} />
          )}
        </button>

        {/* Velocidade */}
        <button
          onClick={() => setShowSpeedPanel((v) => !v)}
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
