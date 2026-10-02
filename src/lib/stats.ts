import type { Attempt } from '../types';
export const leaderboard = (a: Attempt[], id: number) =>
  a.filter((x) => x.q === id).sort((x, y) => y.pts - x.pts || x.sec - y.sec).slice(0, 5);
export function topicStats(logs: { t: string; ok: boolean }[]) {
  const m: Record<string, { c: number; n: number }> = {};
  for (const x of logs) { const e = (m[x.t] ??= { c: 0, n: 0 }); e.n++; if (x.ok) e.c++; }
  return m;
}
