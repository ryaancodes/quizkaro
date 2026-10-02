import type { Question } from '../types';
/** Two right answers in a row raise the level (max 3); a wrong answer lowers it (min 1). */
export function adjust(lv: number, st: number, ok: boolean) {
  if (!ok) return { lv: Math.max(1, lv - 1), st: 0 };
  return st + 1 >= 2 && lv < 3 ? { lv: lv + 1, st: 0 } : { lv, st: st + 1 };
}
/** Index of the unused question closest to the target level (ties broken randomly). */
export function pickNext(qs: Question[], used: Set<number>, lv: number) {
  const left = qs.map((_, i) => i).filter((i) => !used.has(i));
  left.sort((a, b) => Math.abs(qs[a].d - lv) - Math.abs(qs[b].d - lv) || Math.random() - 0.5);
  return left[0];
}
export const points = (d: number, ok: boolean) => (ok ? d * 10 : 0);
