export const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en-US', label: 'Inglês (EUA)' },
  { code: 'en-GB', label: 'Inglês (Reino Unido)' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'pt-PT', label: 'Português (Portugal)' },
  { code: 'es-ES', label: 'Espanhol (Espanha)' },
  { code: 'es-MX', label: 'Espanhol (México)' },
  { code: 'fr-FR', label: 'Francês' },
  { code: 'de-DE', label: 'Alemão' },
  { code: 'it-IT', label: 'Italiano' },
  { code: 'ja-JP', label: 'Japonês' },
  { code: 'ko-KR', label: 'Coreano' },
  { code: 'zh-CN', label: 'Chinês (mandarim)' },
  { code: 'ru-RU', label: 'Russo' },
];

export function langLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}
