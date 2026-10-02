import './style.css';
import { S, persist } from './state';
import { $, act, actions, toast } from './dom';
import { home } from './views/home';
import { ans, begin, nextQ, retry, start, sub } from './views/quiz';
import { rate } from './views/result';
import { ins } from './views/insights';
import { addQ, make, previewDraft, pub, qrm } from './views/make';
import { cfg, creset, csave, dash, gassign, gcreate, gdel, glive, groups, grm, wipe } from './views/admin';
import { hostClose, hostNext, hostReveal, hostStart, joinRoom, leaveRoom, live, liveAnswer } from './views/live';
import { settings, toggleSkill } from './views/settings';
import { auth, demoLogin, login } from './views/login';
import { BRAND, BRAND_PARTS, HINDI } from './brand';
import { exportReport } from './lib/report';
import { sharedQuiz, shareUrl } from './lib/share';
const TL: [string, string][] = [['home', 'Quizzes'], ['ins', 'My insights'], ['live', 'Join live'], ['settings', 'Settings']];
const TA: [string, string][] = [['dash', 'Dashboard'], ['home', 'Quizzes'], ['make', 'Create'], ['groups', 'Groups'], ['live', 'Go live'], ['cfg', 'Configuration']];
const ADMIN_ONLY = new Set(['dash', 'make', 'groups', 'cfg']);
const views: Record<string, () => void> = { home, ins, make, dash, groups, cfg, settings, live };
let cur = 'home';
const isAdmin = () => S.me?.role === 'admin' && !S.asLearner;
function header() {
  const u = S.me;
  $('#hd').innerHTML = `<div class="logo">${BRAND_PARTS[0]}<span>${BRAND_PARTS[1]}.</span><small class="hi">${HINDI}</small></div>` + (u
    ? `<nav>${(isAdmin() ? TA : TL).map(([v, l]) => `<button data-a="go" data-v="${v}" class="${v === cur ? 'on' : ''}">${l}</button>`).join('')}</nav>
    ${u.role === 'admin' ? `<button class="sw ${S.asLearner ? 'on' : ''}" data-a="asl" role="switch" aria-checked="${S.asLearner}"><i></i><span>Learner view</span></button>` : ''}
    <button class="ib" data-a="theme" aria-label="Toggle theme">🌓</button><button class="ib" data-a="logout" title="Sign out">⎋ ${u.name.split(' ')[0].replace(/[<>&"]/g, '')}</button>`
    : '<button class="ib" data-a="theme" aria-label="Toggle theme">🌓</button>');
  document.querySelector('.ban')?.remove();
  if (u && S.asLearner) $('#hd').insertAdjacentHTML('afterend', '<div class="ban">Previewing as a learner — this is what your learners see. <button data-a="asl">Exit preview</button></div>');
}
/** Each page has its own address, e.g. /dashboard, /quizzes, /insights. */
const PATH: Record<string, string> = { dash: '/dashboard', home: '/quizzes', make: '/create', groups: '/groups', live: '/live', cfg: '/configuration', ins: '/insights', settings: '/settings' };
const TITLE: Record<string, string> = { dash: 'Dashboard', home: 'Quizzes', make: 'Create a quiz', groups: 'Groups', live: 'Live quiz', cfg: 'Configuration', ins: 'My insights', settings: 'Settings' };
const VIEW_OF: Record<string, string> = Object.fromEntries(Object.entries(PATH).map(([k, v]) => [v, k]));
let next = ''; // page the visitor asked for before signing in (e.g. a shared quiz link)
const setUrl = (url: string, replace = false) => { if (location.pathname !== url) history[replace ? 'replaceState' : 'pushState'](null, '', url); };
function show(v: string) {
  clearInterval(S.tick); S.run = null;
  cur = !isAdmin() && ADMIN_ONLY.has(v) ? 'home' : v;
  document.title = `${TITLE[cur]} · ${BRAND}`; header(); (views[cur] ?? home)(); window.scrollTo(0, 0);
  return cur;
}
actions.go = (v = 'home') => setUrl(PATH[show(v)]);
function route() {
  const p = decodeURI(location.pathname).replace(/\/+$/, '') || '/';
  if (!S.me) {
    if (p !== '/login' && p !== '/') next = location.pathname + location.search;
    setUrl('/login', true); document.title = `Sign in · ${BRAND}`; header(); login(); return;
  }
  const z = sharedQuiz();
  if (z) { cur = 'home'; header(); begin(z); return; }
  const v = VIEW_OF[p];
  if (v) { show(v); return; }
  setUrl(PATH[show(isAdmin() ? 'dash' : 'home')], true);
}
actions.enter = () => { if (next) history.replaceState(null, '', next); next = ''; route(); };
actions.asl = () => { S.asLearner = !S.asLearner; act('go', S.asLearner ? 'home' : 'dash'); };
actions.logout = () => { S.me = null; S.asLearner = false; persist(); setUrl('/login', true); next = ''; route(); };
actions.theme = () => setT(document.documentElement.dataset.t === 'dark' ? 'light' : 'dark');
actions.auth = auth; actions.demo = demoLogin;
actions.start = (v) => start(Number(v)); actions.ans = (v) => ans(Number(v)); actions.sub = sub; actions.next = nextQ; actions.retry = retry; actions.rate = (v) => rate(Number(v));
actions.addQ = addQ; actions.pub = pub; actions.qrm = qrm; actions.prev = previewDraft;
actions.gcreate = gcreate; actions.gassign = gassign; actions.grm = grm; actions.gdel = gdel; actions.glive = glive;
actions.csave = csave; actions.creset = creset; actions.wipe = wipe; actions.skill = toggleSkill;
actions.lhost = hostStart; actions.lnext = hostNext; actions.lreveal = hostReveal; actions.lclose = hostClose;
actions.ljoin = joinRoom; actions.lans = liveAnswer; actions.lleave = leaveRoom;
actions.dl = (v = '') => {
  const i = v.indexOf(':');
  exportReport(v.slice(0, i) as 'pdf' | 'csv' | 'xlsx', v.slice(i + 1)).catch(() => toast('Could not create the report.'));
};
actions.share = (v) => {
  const z = S.quizzes.find((x) => x.id === Number(v)); if (!z) return;
  const url = shareUrl(z);
  if (navigator.share) navigator.share({ title: z.title, url }).catch(() => undefined);
  else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast('Link copied — send it to anyone!'), () => toast(url));
  else toast(url);
};
const setT = (t: string) => { document.documentElement.dataset.t = t; try { localStorage.setItem('qz_t', t); } catch { /* ignore */ } };
setT(localStorage.getItem('qz_t') ?? (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'));
document.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-a]');
  if (b) { if (b.tagName === 'A') e.preventDefault(); actions[b.dataset.a!]?.(b.dataset.v); }
});
document.addEventListener('keydown', (e) => {
  if (!S.run || (e.target as HTMLElement).matches('input,textarea,select')) return;
  const k = e.key.toLowerCase(), i = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'abcd'.indexOf(k);
  if (k.length === 1 && i >= 0) document.querySelectorAll<HTMLButtonElement>('.opt')[i]?.click();
  else if (k === 'enter') document.querySelector<HTMLButtonElement>('[data-a="next"]')?.click();
});
setInterval(() => { if (S.me && !document.hidden) { S.me.secs += 30; persist(); } }, 30000); // time-on-app for reports
window.addEventListener('popstate', route);
route();

