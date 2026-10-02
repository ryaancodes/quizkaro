import type { Attempt, Quiz } from '../types';
export const xpOf = (a: Attempt[], n: string) => a.filter((x) => x.n === n).reduce((s, x) => s + x.pts, 0);
export function levelOf(xp: number) {
  const l = Math.floor(Math.sqrt(xp / 40)) + 1, lo = (l - 1) ** 2 * 40, hi = l * l * 40;
  return { l, p: (xp - lo) / (hi - lo), next: hi - xp };
}
/** Recommend the next quiz: the weakest category first, preferring quizzes not yet attempted. */
export function recommend(qs: Quiz[], at: Attempt[], name: string) {
  const mine = at.filter((a) => a.n === name), cat = new Map<string, { c: number; n: number }>();
  for (const a of mine) {
    const z = qs.find((x) => x.id === a.q); if (!z?.cat) continue;
    const e = cat.get(z.cat) ?? { c: 0, n: 0 }; e.c += a.c; e.n += a.tot; cat.set(z.cat, e);
  }
  const done = new Set(mine.map((a) => a.q)), pool = qs.filter((z) => !done.has(z.id));
  const weak = [...cat.entries()].sort((x, y) => x[1].c / x[1].n - y[1].c / y[1].n)[0]?.[0];
  const inWeak = pool.find((z) => z.cat === weak);
  const quiz = inWeak ?? pool[0] ?? qs[0];
  return { quiz, reason: inWeak ? `Your weakest area is ${weak}` : mine.length ? 'Something new to try' : 'A great place to start' };
}

/** Skills a learner can pick; each maps to the quizzes that build it. */
export const SKILLS: Record<string, number[]> = {
  'Web Development': [1, 2, 21], Programming: [2, 4, 21], 'Git & Version Control': [3], Databases: [5],
  'Networking & Security': [6], 'DevOps & Cloud': [3, 22, 23], Linux: [23], Physics: [7, 10], Chemistry: [8, 24],
  'Biology & Health': [9, 27], 'Space & Earth': [10, 11], Mathematics: [12, 13, 14, 26, 28],
  'Geography & History': [15, 16, 17], 'Inventions & Science History': [18], 'Logic & Puzzles': [19, 28], Finance: [20], Language: [25],
};
export const forSkills = (qs: Quiz[], skills: string[]) => {
  const ids = new Set(skills.flatMap((s) => SKILLS[s] ?? []));
  return qs.filter((z) => ids.has(z.id));
};
