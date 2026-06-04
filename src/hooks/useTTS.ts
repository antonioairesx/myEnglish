import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * TTS nativo do browser (Web Speech API). Zero dependência, funciona offline
 * com as vozes instaladas no sistema. A voz é escolhida pelo idioma do deck.
 */
export function useTTS() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [supported]);

  const pickVoice = useCallback(
    (lang: string) => {
      if (!voices.length) return undefined;
      const exact = voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase());
      if (exact) return exact;
      const base = lang.split('-')[0].toLowerCase();
      return voices.find((v) => v.lang.toLowerCase().startsWith(base));
    },
    [voices],
  );

  const speak = useCallback(
    (text: string, lang: string, rate = 0.95) => {
      if (!supported || !text.trim()) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = rate;
      const v = pickVoice(lang);
      if (v) u.voice = v;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      utterRef.current = u;
      window.speechSynthesis.speak(u);
    },
    [supported, pickVoice],
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const hasVoiceFor = useCallback((lang: string) => !!pickVoice(lang), [pickVoice]);

  return { speak, stop, speaking, supported, voices, hasVoiceFor };
}
