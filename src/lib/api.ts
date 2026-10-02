import type { Attempt } from '../types';
const opts = () => ({ signal: AbortSignal.timeout(2500) });
let pending: Promise<unknown> = Promise.resolve();
/** Fire-and-forget: send the attempt to the API when one is available (Docker Compose stack). */
export function pushAttempt(a: Attempt) {
  pending = fetch('/api/attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quiz: a.q, name: a.n, pts: a.pts, correct: a.c, total: a.tot, seconds: a.sec }), ...opts() }).catch(() => undefined);
}
/** Shared leaderboard, or null when there is no API (e.g. on Netlify). */
export async function remoteBoard(id: number): Promise<Attempt[] | null> {
  await pending;
  try {
    const r = await fetch('/api/leaderboard/' + id, opts());
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return null;
    return ((await r.json()) as Attempt[]).map((x) => ({ ...x, log: [] }));
  } catch { return null; }
}
