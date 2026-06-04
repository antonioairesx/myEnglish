import type { Card, Rating } from './types';

const DAY = 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;
const MIN_EASE = 1.3;

/**
 * Estado inicial de um card recém criado.
 * due no passado para entrar como "novo" já na primeira sessão.
 */
export function freshCardState(now: number = Date.now()) {
  return {
    reps: 0,
    ease: 2.5,
    interval: 0,
    due: now,
    lapses: 0,
  };
}

/**
 * Aplica o algoritmo SM-2 a um card dado o rating do usuário.
 * Retorna apenas os campos de agendamento atualizados.
 *
 * - again: erro. Reseta reps, incrementa lapses, volta em ~1 min (mesma sessão), reduz ease.
 * - hard:  acertou com dificuldade. Intervalo cresce pouco (x1.2), ease cai um pouco.
 * - good:  acerto padrão. Fluxo clássico SM-2.
 * - easy:  acerto fácil. Bônus de intervalo e ease.
 */
export function schedule(card: Card, rating: Rating, now: number = Date.now()) {
  let { reps, ease, interval, lapses } = card;

  if (rating === 'again') {
    reps = 0;
    lapses += 1;
    ease = Math.max(MIN_EASE, ease - 0.2);
    interval = 0;
    return { reps, ease, interval, lapses, due: now + 1 * MIN };
  }

  if (rating === 'hard') {
    ease = Math.max(MIN_EASE, ease - 0.15);
    interval = reps === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
    reps += 1;
    return { reps, ease, interval, lapses, due: now + interval * DAY };
  }

  if (rating === 'good') {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ease);
    reps += 1;
    return { reps, ease, interval, lapses, due: now + interval * DAY };
  }

  // easy
  ease = ease + 0.15;
  if (reps === 0) interval = 4;
  else if (reps === 1) interval = 6;
  else interval = Math.round(interval * ease * 1.3);
  reps += 1;
  return { reps, ease, interval, lapses, due: now + interval * DAY };
}

/**
 * Texto amigável da previsão do próximo intervalo, para mostrar nos botões.
 */
export function previewInterval(card: Card, rating: Rating): string {
  const next = schedule(card, rating);
  if (rating === 'again') return '1min';
  if (next.interval < 1) return '1min';
  if (next.interval === 1) return '1d';
  if (next.interval < 30) return `${next.interval}d`;
  if (next.interval < 365) return `${Math.round(next.interval / 30)}m`;
  return `${(next.interval / 365).toFixed(1)}a`;
}

export function isDue(card: Card, now: number = Date.now()): boolean {
  return card.due <= now;
}
