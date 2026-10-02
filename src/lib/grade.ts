import type { Question } from '../types';
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
const alts = (s: string) => s.split('|').map(norm);
export const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
export const kind = (q: Question) => q.k ?? 'mcq';
const arr = (r: unknown) => (Array.isArray(r) ? (r as string[]) : []);
/** Grade any question type. Fill blanks accept alternatives split by "|"; free text needs at least half of the key ideas. */
export function grade(q: Question, r: unknown): boolean {
  const a = arr(r);
  switch (kind(q)) {
    case 'match': return !!q.pairs && q.pairs.every((p, i) => a[i] === p[1]);
    case 'fill': return !!q.blanks && q.blanks.every((b, i) => alts(b).includes(norm(a[i] ?? '')));
    case 'order': return !!q.items && q.items.every((it, i) => a[i] === it);
    case 'text': { const t = norm(String(r ?? '')), k = q.kw ?? []; return k.length > 0 && k.filter((w) => alts(w).some((x) => t.includes(x))).length >= Math.ceil(k.length / 2); }
    default: return r === q.a;
  }
}
export function answerText(q: Question, r: unknown) {
  const a = arr(r);
  switch (kind(q)) {
    case 'match': return (q.pairs ?? []).map((p, i) => `${p[0]} → ${a[i] || '—'}`).join('; ');
    case 'fill': return a.join(', ');
    case 'order': return a.join(' → ');
    case 'text': return String(r ?? '');
    default: return q.o[r as number] ?? '';
  }
}
export function correctText(q: Question) {
  switch (kind(q)) {
    case 'match': return (q.pairs ?? []).map((p) => `${p[0]} → ${p[1]}`).join('; ');
    case 'fill': return (q.blanks ?? []).map((b) => b.split('|')[0]).join(', ');
    case 'order': return (q.items ?? []).join(' → ');
    case 'text': return 'Key ideas: ' + (q.kw ?? []).map((w) => w.split('|')[0]).join(', ');
    default: return q.o[q.a];
  }
}
