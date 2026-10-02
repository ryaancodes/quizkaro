import type { Attempt, Group, Quiz, Rating, User } from '../types';
function rng(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** name, email, skills, hours on app, skill level */
const L: [string, string, string[], number, number][] = [
  ['Rohan Shah', 'rohan@acme.com', ['Web Development', 'Git & Version Control'], 14.5, 0.82],
  ['Priya Nair', 'priya@acme.com', ['Mathematics', 'Physics'], 22.1, 0.74],
  ['Kabir Singh', 'kabir@acme.com', ['DevOps & Cloud', 'Databases'], 9.8, 0.66],
  ['Ananya Iyer', 'ananya@acme.com', ['Biology & Health', 'Chemistry'], 18.4, 0.88],
  ['Dev Patel', 'dev@acme.com', ['Programming', 'Logic & Puzzles'], 6.2, 0.55],
  ['Sara Khan', 'sara@acme.com', ['Geography & History', 'Language'], 12.7, 0.7],
  ['Vikram Rao', 'vikram@acme.com', ['Finance', 'Mathematics'], 3.9, 0.5],
  ['Meera Joshi', 'meera@acme.com', ['Space & Earth', 'Physics'], 25.3, 0.9],
];
export function demo(qs: Quiz[]) {
  const r = rng(7), now = Date.now(), DAY = 864e5;
  const users: User[] = [{ name: 'Asha Mehta', email: 'admin@acme.com', pw: 'admin123', role: 'admin', skills: [], secs: 5 * 3600, joined: now - 60 * DAY },
    ...L.map(([name, email, skills, h]): User => ({ name, email, pw: 'learner123', role: 'learner', skills, secs: Math.round(h * 3600), joined: now - 40 * DAY }))];
  const atts: Attempt[] = [], ratings: Rating[] = [];
  for (const [name, , , , p] of L) {
    const n = 5 + Math.floor(r() * 6);
    for (let i = 0; i < n; i++) {
      const z = qs[Math.floor(r() * qs.length)];
      const log = z.qs.map((q) => ({ t: q.t, ok: r() < p - (q.d - 1) * 0.12 }));
      atts.push({ q: z.id, n: name, pts: z.qs.reduce((s, q, k) => s + (log[k].ok ? q.d * 10 : 0), 0), c: log.filter((x) => x.ok).length, tot: z.qs.length, sec: Math.round(40 + r() * 100), log, ts: now - Math.floor(r() * 30 * DAY) });
      if (r() < 0.6 && !ratings.some((x) => x.q === z.id && x.n === name)) ratings.push({ q: z.id, n: name, s: 3 + Math.floor(r() * 3) });
    }
  }
  atts.sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
  const groups: Group[] = [
    { id: 1, name: 'Frontend Batch A', members: L.slice(0, 4).map((x) => x[1]), quizzes: [1, 2, 21] },
    { id: 2, name: 'Data & Cloud Team', members: L.slice(4).map((x) => x[1]), quizzes: [5, 22, 3] },
  ];
  return { users, atts, ratings, groups };
}
