import { S, persist } from '../state';
import { app, dl, esc } from '../dom';
import { SKILLS, forSkills } from '../lib/smart';
export function settings() {
  const u = S.me; if (!u) return;
  const mine = S.groups.filter((g) => g.members.includes(u.email));
  app().innerHTML = `<h2 style="margin-top:0">Settings</h2><div class="card"><h3>${esc(u.name)}</h3><p class="mu">${esc(u.email)} · ${u.role === 'admin' ? 'Admin' : 'Learner'} · Groups: ${mine.map((g) => esc(g.name)).join(', ') || 'none yet'}</p></div>
  <h2>Your skills</h2><div class="card"><p class="mu">Pick what you want to get better at. Your home page then shows matching quizzes.</p>
  <div class="chips wrap">${Object.keys(SKILLS).map((s) => `<button class="chip ${u.skills.includes(s) ? 'on' : ''}" data-a="skill" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div>
  <p class="mu mt-3">${forSkills(S.quizzes, u.skills).length} quizzes match your skills.</p></div>
  <h2>Your report</h2><div class="card row between"><span>Download your progress, hours on the app and topic accuracy.</span><div class="row">${dl(u.name)}</div></div>`;
}
export function toggleSkill(v = '') {
  const u = S.me; if (!u) return;
  u.skills = u.skills.includes(v) ? u.skills.filter((s) => s !== v) : [...u.skills, v]; persist(); settings();
}
