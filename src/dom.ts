import type { Attempt } from './types';
const M: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
export const app = () => $('#app');
export const esc = (s: unknown) => String(s).replace(/[&<>"]/g, (c) => M[c]);
export const lvl = (n: number) => `<span class="lvl">${[1, 2, 3].map((i) => `<b class="${i <= n ? 'on' : ''}"></b>`).join('')}</span>`;
export const medal = (i: number) => ['🥇', '🥈', '🥉'][i] ?? String(i + 1);
export const tb = (t: string, p: number) => {
  const col = p < 0.5 ? 'var(--bad)' : p < 0.8 ? '#f5a524' : 'var(--ok)';
  return `<div class="tb"><span>${esc(t)}</span><div class="bar"><i style="width:${p * 100}%;background:${col}"></i></div><span>${Math.round(p * 100)}%</span></div>`;
};
export const lbTable = (rows: Attempt[]) => rows.length
  ? `<table><tr><th>#</th><th>Name</th><th>Points</th><th>Time</th></tr>${rows.map((a, i) => `<tr><td>${medal(i)}</td><td>${esc(a.n)}</td><td>${a.pts}</td><td>${a.sec}s</td></tr>`).join('')}</table>`
  : '<p class="mu mt-3">No scores yet.</p>';
export const actions: Record<string, (v?: string) => void> = {};
export const act = (n: string, v?: string) => actions[n]?.(v);
export const shuf = <T>(a: T[]) => a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
export function toast(msg: string) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.append(t);
  setTimeout(() => t.remove(), 2600);
}
export const stars = (n: number) => '★★★★★'.slice(0, Math.round(n)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(n));
/** Small PDF / CSV / Excel download buttons. scope = "org" or a learner's name. */
export const dl = (scope: string) => (['pdf', 'csv', 'xlsx'] as const).map((k) => `<button class="btn g sm" data-a="dl" data-v="${k}:${esc(scope)}">${k === 'xlsx' ? 'Excel' : k.toUpperCase()}</button>`).join('');
export const ICO = {
  link: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
};
