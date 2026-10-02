import { S } from '../state';
import type { Quiz } from '../types';
const enc = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const dec = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
/** Built-in quizzes share by id (/quiz/12); custom quizzes embed their content (/q/...) so the link works on any device. */
export const shareUrl = (z: Quiz) => location.origin + (z.id > 1e6 ? '/q/' + enc(JSON.stringify(z)) : '/quiz/' + z.id);
/** The quiz a shared link points at, if the current path is one. */
export function sharedQuiz(): Quiz | null {
  const p = location.pathname, id = p.match(/^\/quiz\/(\d+)\/?$/);
  if (id) return S.quizzes.find((z) => z.id === +id[1]) ?? null;
  const e = p.match(/^\/q\/([\w-]+)\/?$/);
  if (e) {
    try {
      const z = JSON.parse(dec(e[1])) as Quiz;
      if (!S.quizzes.some((x) => x.id === z.id)) S.quizzes.push(z);
      return z;
    } catch { return null; }
  }
  return null;
}
