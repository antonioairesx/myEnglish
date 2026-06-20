import type { ReviewLog } from './types';

const DAY = 24 * 60 * 60 * 1000;

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Dias consecutivos (terminando hoje ou ontem) com ao menos uma revisão. */
export function computeStreak(logs: ReviewLog[]): number {
  if (!logs.length) return 0;
  const days = new Set(logs.map((l) => dayKey(l.reviewedAt)));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(dayKey(cursor.getTime()))) cursor.setTime(cursor.getTime() - DAY);
  while (days.has(dayKey(cursor.getTime()))) {
    streak += 1;
    cursor.setTime(cursor.getTime() - DAY);
  }
  return streak;
}

/** % de acertos (não-again) na janela de dias informada. */
export function retention(logs: ReviewLog[], windowDays = 30): number {
  const since = Date.now() - windowDays * DAY;
  const recent = logs.filter((l) => l.reviewedAt >= since);
  if (!recent.length) return 0;
  const correct = recent.filter((l) => l.rating !== 'again').length;
  return Math.round((correct / recent.length) * 100);
}

export function reviewsToday(logs: ReviewLog[]): number {
  const today = dayKey(Date.now());
  return logs.filter((l) => dayKey(l.reviewedAt) === today).length;
}

export function reviewsLast7Days(logs: ReviewLog[]): { label: string; count: number }[] {
  const out: { label: string; count: number }[] = [];
  const names = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY);
    const key = dayKey(d.getTime());
    const count = logs.filter((l) => dayKey(l.reviewedAt) === key).length;
    out.push({ label: names[d.getDay()], count });
  }
  return out;
}

/** Total de dias únicos com ao menos uma revisão. */
export function totalStudyDays(logs: ReviewLog[]): number {
  return new Set(logs.map((l) => dayKey(l.reviewedAt))).size;
}

/** Total de minutos estudados (soma durationMs; fallback 9s por card sem duração). */
export function totalMinutesStudied(logs: ReviewLog[]): number {
  let ms = 0;
  for (const l of logs) {
    ms += l.durationMs ?? 9_000;
  }
  return Math.round(ms / 60_000);
}

/** Estimativa grosseira de tempo, ~9s por card. */
export function estimateMinutes(dueCount: number): number {
  return Math.max(1, Math.round((dueCount * 9) / 60));
}
