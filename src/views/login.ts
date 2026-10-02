import { S, persist } from '../state';
import { $, act, app, toast } from '../dom';
import type { User } from '../types';
import { HINDI, TAGLINE } from '../brand';
let mode: 'in' | 'up' = 'in';
const MANDALA = `<svg class="mandala" viewBox="0 0 200 200" aria-hidden="true"><g transform="translate(100 100)">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<ellipse rx="14" ry="40" cy="-54" transform="rotate(${a})" fill="${a % 90 ? '#0e7c7b' : '#e4492b'}" stroke="#1d1a2f" stroke-width="3"/>`).join('')}<circle r="46" fill="#f5a400" stroke="#1d1a2f" stroke-width="4"/><text y="24" text-anchor="middle" font-size="68" font-weight="800" font-family="Bricolage Grotesque,sans-serif" fill="#1d1a2f">?</text></g></svg>`;
export function login() {
  document.querySelector('.ban')?.remove();
  app().innerHTML = `<div class="auth"><section class="pitch"><p class="eyebrow"><span class="hi">${HINDI}</span> · ${TAGLINE}</p><h1>Learn smarter.<br><span class="hl">Quiz together.</span></h1>
  <p class="lead">${S.quizzes.length} quizzes, five question types, live group games and reports that show exactly where to improve.</p>
  ${MANDALA}
  <p class="mu mt-4">Adaptive difficulty · Live group quizzes · Skill-based picks · PDF, CSV &amp; Excel reports</p></section>
  <section class="card authcard"><div class="tabs"><button data-t="in" class="${mode === 'in' ? 'on' : ''}">Sign in</button><button data-t="up" class="${mode === 'up' ? 'on' : ''}">Create account</button></div>
  <div class="f">${mode === 'up' ? '<input id="an" placeholder="Full name" autocomplete="name">' : ''}<input id="ae" type="email" placeholder="Email" autocomplete="email"><input id="ap" type="password" placeholder="Password" autocomplete="current-password">
  ${mode === 'up' ? '<select id="ar" aria-label="Account type"><option value="learner">I\'m a learner</option><option value="admin">I\'m an organisation admin</option></select>' : ''}
  <button class="btn" data-a="auth">${mode === 'in' ? 'Sign in →' : 'Create account →'}</button></div>
  <div class="demo"><p class="mu">Try a demo account</p><div class="row"><button class="btn g" data-a="demo" data-v="learner">Demo learner</button><button class="btn g" data-a="demo" data-v="admin">Demo admin</button></div>
  <p class="mu mt-3">admin@acme.com / admin123 · rohan@acme.com / learner123</p></div></section></div>`;
  document.querySelectorAll<HTMLElement>('.tabs button').forEach((b) => { b.onclick = () => { mode = b.dataset.t as 'in' | 'up'; login(); }; });
  document.querySelectorAll('.auth input').forEach((i) => i.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') auth(); }));
}
function enter(u: User) { S.me = u; S.asLearner = false; persist(); act('enter'); }
export function auth() {
  const email = $<HTMLInputElement>('#ae').value.trim().toLowerCase(), pw = $<HTMLInputElement>('#ap').value;
  if (mode === 'in') {
    const u = S.users.find((x) => x.email === email && x.pw === pw);
    if (!u) { toast('Wrong email or password.'); return; }
    enter(u); return;
  }
  const name = $<HTMLInputElement>('#an').value.trim();
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || pw.length < 6) { toast('Enter a name, a valid email and a password of 6+ characters.'); return; }
  if (S.users.some((x) => x.email === email)) { toast('That email already has an account.'); return; }
  const u: User = { name, email, pw, role: $<HTMLSelectElement>('#ar').value as User['role'], skills: [], secs: 0, joined: Date.now() };
  S.users.push(u); enter(u);
}
export function demoLogin(role = '') {
  const u = S.users.find((x) => x.email === (role === 'admin' ? 'admin@acme.com' : 'rohan@acme.com'));
  if (u) enter(u);
}
