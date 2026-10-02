import { load, save } from './lib/storage';
import { seed } from './data/seed';
import { demo } from './data/demo';
import type { Answered, Attempt, Config, Group, Question, Quiz, Rating, User } from './types';
export interface Run { qz: Quiz; used: Set<number>; lv: number; st: number; n: number; tot: number; log: Answered[]; end: number; t0: number; cur: Question | null; locked: boolean; preview: boolean; time: number }
export const CFG0: Config = { minutes: 30, perQ: 25, maxQ: 8, maxWords: 60, shuffle: true, showExp: 'instant', pass: 60, adaptive: true, retries: 0, liveSecs: 20, showLb: true };
const builtin = seed();
// One-time reset into the demo dataset (accounts, groups, attempts, ratings).
if (load<number>('qz_v', 0) !== 4) {
  ['qz_a', 'qz_q', 'qz_n', 'qz_u', 'qz_g', 'qz_r', 'qz_c', 'qz_s'].forEach((k) => localStorage.removeItem(k));
  const d = demo(builtin);
  save('qz_v', 4); save('qz_u', d.users); save('qz_g', d.groups); save('qz_a', d.atts); save('qz_r', d.ratings);
}
export const S = {
  quizzes: [...builtin, ...load<Quiz[]>('qz_q', []).filter((z) => z.id > 1e6)],
  atts: load<Attempt[]>('qz_a', []), users: load<User[]>('qz_u', []), groups: load<Group[]>('qz_g', []),
  ratings: load<Rating[]>('qz_r', []), cfg: { ...CFG0, ...load<Partial<Config>>('qz_c', {}) } as Config,
  me: null as User | null, asLearner: false, run: null as Run | null, tick: 0,
  draft: [] as Question[], missed: [] as Question[],
  get name() { return this.me?.name ?? ''; },
};
// The sign-in lasts for this browser tab only, so opening the site fresh always shows the login page.
const sess = () => { try { return sessionStorage.getItem('qz_s'); } catch { return null; } };
S.me = S.users.find((u) => u.email === sess()) ?? null;
export const persist = () => {
  save('qz_q', S.quizzes.filter((z) => z.id > 1e6)); save('qz_a', S.atts); save('qz_u', S.users);
  save('qz_g', S.groups); save('qz_r', S.ratings); save('qz_c', S.cfg);
  try { sessionStorage.setItem('qz_s', S.me?.email ?? ''); } catch { /* private mode */ }
};
