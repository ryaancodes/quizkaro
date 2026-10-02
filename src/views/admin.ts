import { S, persist, CFG0 } from '../state';
import type { Config, Group } from '../types';
import { $, act, app, dl, esc, toast } from '../dom';
import { avg } from './home';
import { xpOf } from '../lib/smart';
import { liveFor } from './live';
const bar = (k: string, v: number, max: number) => `<div class="tb"><span>${esc(k)}</span><div class="bar"><i style="width:${(v / Math.max(1, max)) * 100}%"></i></div><span>${v}</span></div>`;
export function dash() {
  const ls = S.users.filter((u) => u.role === 'learner');
  const rows = ls.map((u) => {
    const m = S.atts.filter((a) => a.n === u.name), t = m.reduce((s, a) => s + a.tot, 0);
    return { u, n: m.length, acc: t ? Math.round((m.reduce((s, a) => s + a.c, 0) / t) * 100) : 0, xp: xpOf(S.atts, u.name), h: u.secs / 3600, last: Math.max(0, ...m.map((a) => a.ts ?? 0)) };
  });
  const all = S.atts.filter((a) => ls.some((u) => u.name === a.n)), tot = all.reduce((s, a) => s + a.tot, 0);
  const cat = new Map<string, number>();
  for (const a of all) { const k = S.quizzes.find((z) => z.id === a.q)?.cat ?? 'Other'; cat.set(k, (cat.get(k) ?? 0) + 1); }
  const rated = S.quizzes.map((z) => ({ z, r: avg(z.id) })).filter((x) => x.r).sort((a, b) => (b.r?.v ?? 0) - (a.r?.v ?? 0)).slice(0, 5);
  const cmax = Math.max(1, ...cat.values());
  app().innerHTML = `<div class="row between"><h2 style="margin:0">Organisation dashboard</h2><div class="row"><span class="mu">Download org report</span>${dl('org')}</div></div>
  <section class="stats mt-4"><div class="tile"><span class="mu">Learners</span><b>${ls.length}</b></div><div class="tile"><span class="mu">Quizzes completed</span><b>${all.length}</b></div>
  <div class="tile"><span class="mu">Avg accuracy</span><b>${tot ? Math.round((all.reduce((s, a) => s + a.c, 0) / tot) * 100) : 0}%</b></div><div class="tile"><span class="mu">Hours on app</span><b>${rows.reduce((s, r) => s + r.h, 0).toFixed(0)}</b></div></section>
  <h2>Learners</h2><div class="card scroll"><table><tr><th>Name</th><th>Attempts</th><th>Accuracy</th><th>XP</th><th>Hours</th><th>Last active</th><th>Report</th></tr>
  ${rows.map((r) => `<tr><td><b>${esc(r.u.name)}</b><br><span class="mu">${esc(r.u.email)}</span></td><td>${r.n}</td><td>${r.acc}%</td><td>${r.xp}</td><td>${r.h.toFixed(1)}</td><td>${r.last ? new Date(r.last).toLocaleDateString() : '—'}</td><td><div class="row">${dl(r.u.name)}</div></td></tr>`).join('')}</table></div>
  <div class="two2"><div><h2>Activity by category</h2><div class="card">${[...cat.entries()].map(([k, v]) => bar(k, v, cmax)).join('') || '<p class="mu">No activity yet.</p>'}</div></div>
  <div><h2>Top-rated quizzes</h2><div class="card">${rated.map((x) => `<div class="row between rev"><span>${x.z.icon ?? ''} ${esc(x.z.title)}</span><b>★ ${(x.r?.v ?? 0).toFixed(1)} <span class="mu">(${x.r?.n})</span></b></div>`).join('') || '<p class="mu">No ratings yet.</p>'}</div></div></div>`;
}
const nameOf = (e: string) => S.users.find((u) => u.email === e)?.name ?? e;
const gcard = (g: Group) => `<div class="card mt-4"><div class="row between"><h3>${esc(g.name)} <span class="mu">· ${g.members.length} learners</span></h3><div class="row"><button class="btn sm" data-a="glive" data-v="${g.id}">▶ Go live</button><button class="btn g sm" data-a="gdel" data-v="${g.id}">Delete</button></div></div>
  <div class="chips wrap">${g.members.map((m) => `<span class="pill">${esc(nameOf(m))}</span>`).join('')}</div><p class="mu mt-3">Assigned quizzes</p>
  <div class="chips wrap">${g.quizzes.map((id) => { const z = S.quizzes.find((x) => x.id === id); return z ? `<span class="pill">${z.icon ?? ''} ${esc(z.title)} <button class="x" data-a="grm" data-v="${g.id}:${id}" aria-label="Remove">✕</button></span>` : ''; }).join('') || '<span class="mu">None yet</span>'}</div>
  <div class="row mt-3"><select id="as${g.id}" class="grow">${S.quizzes.map((z) => `<option value="${z.id}">${esc(z.title)}</option>`).join('')}</select><button class="btn g sm" data-a="gassign" data-v="${g.id}">Assign quiz</button></div></div>`;
export function groups() {
  const ls = S.users.filter((u) => u.role === 'learner');
  app().innerHTML = `<h2 style="margin-top:0">Groups &amp; assignments</h2><div class="card f"><h3>Create a group</h3><input id="gn" placeholder="Group name, e.g. Sales Batch 3">
  <span class="mu">Add existing learners</span><div class="pickbox">${ls.map((u) => `<label><input type="checkbox" class="gm" value="${esc(u.email)}"> ${esc(u.name)}</label>`).join('')}</div>
  <span class="mu">…or import new learners (one per line: name, email — they get the password welcome123)</span><textarea id="gi" rows="3" placeholder="Jane Doe, jane@company.com"></textarea>
  <span class="mu">Assign quizzes</span><div class="pickbox">${S.quizzes.map((z) => `<label><input type="checkbox" class="gq" value="${z.id}"> ${z.icon ?? ''} ${esc(z.title)}</label>`).join('')}</div>
  <button class="btn" data-a="gcreate">Create group</button></div>${S.groups.map(gcard).join('')}`;
}
export function gcreate() {
  const name = $<HTMLInputElement>('#gn').value.trim();
  if (!name) { toast('Give the group a name.'); return; }
  const members = [...document.querySelectorAll<HTMLInputElement>('.gm:checked')].map((x) => x.value);
  for (const line of $<HTMLTextAreaElement>('#gi').value.split('\n')) {
    const [n, e] = line.split(/[,\t]/).map((s) => s.trim());
    if (!n || !e || !/^\S+@\S+\.\S+$/.test(e)) continue;
    const em = e.toLowerCase();
    if (!S.users.some((u) => u.email === em)) S.users.push({ name: n, email: em, pw: 'welcome123', role: 'learner', skills: [], secs: 0, joined: Date.now() });
    if (!members.includes(em)) members.push(em);
  }
  const quizzes = [...document.querySelectorAll<HTMLInputElement>('.gq:checked')].map((x) => Number(x.value));
  S.groups.push({ id: Date.now(), name, members, quizzes }); persist(); toast(`Group created with ${members.length} learners.`); groups();
}
export function gassign(v = '') {
  const g = S.groups.find((x) => x.id === Number(v)), id = Number($<HTMLSelectElement>('#as' + v).value);
  if (g && !g.quizzes.includes(id)) { g.quizzes.push(id); persist(); toast('Quiz assigned to ' + g.name); groups(); }
}
export function grm(v = '') {
  const [gid, qid] = v.split(':').map(Number), g = S.groups.find((x) => x.id === gid);
  if (g) { g.quizzes = g.quizzes.filter((x) => x !== qid); persist(); groups(); }
}
export function gdel(v = '') { if (confirm('Delete this group?')) { S.groups = S.groups.filter((g) => g.id !== Number(v)); persist(); groups(); } }
export function glive(v = '') { liveFor(Number(v)); act('go', 'live'); }
const FIELDS: [keyof Config, string, 'n' | 'b' | 's'][] = [
  ['minutes', 'Max quiz duration (minutes)', 'n'], ['perQ', 'Seconds per question', 'n'], ['maxQ', 'Max questions per attempt', 'n'],
  ['maxWords', 'Max words in free-text answers', 'n'], ['pass', 'Pass mark (%)', 'n'], ['retries', 'Attempts allowed per quiz (0 = unlimited)', 'n'],
  ['liveSecs', 'Live quiz: seconds per question', 'n'], ['shuffle', 'Shuffle answer options', 'b'], ['adaptive', 'Adaptive difficulty', 'b'],
  ['showLb', 'Show leaderboards', 'b'], ['showExp', 'Show explanations', 's'],
];
export function cfg() {
  app().innerHTML = `<h2 style="margin-top:0">Configuration</h2><div class="card f"><p class="mu">These rules apply to every quiz your learners take.</p>
  ${FIELDS.map(([k, label, t]) => t === 'n' ? `<label class="cf"><span>${label}</span><input id="c_${k}" type="number" min="0" value="${S.cfg[k]}"></label>`
    : t === 'b' ? `<label class="cf"><span>${label}</span><input id="c_${k}" type="checkbox" ${S.cfg[k] ? 'checked' : ''}></label>`
    : `<label class="cf"><span>${label}</span><select id="c_${k}"><option value="instant" ${S.cfg.showExp === 'instant' ? 'selected' : ''}>After every question</option><option value="end" ${S.cfg.showExp === 'end' ? 'selected' : ''}>Only in the final review</option></select></label>`).join('')}
  <div class="row"><button class="btn" data-a="csave">Save settings</button><button class="btn g" data-a="creset">Reset to defaults</button></div></div>
  <p class="mu mt-4">Demo data: <a href="#" data-a="wipe" style="color:var(--pk)">reset all accounts, groups and scores</a></p>`;
}
export function csave() {
  const next: Record<string, unknown> = {};
  for (const [k, , t] of FIELDS) {
    const el = $<HTMLInputElement>('#c_' + k);
    next[k] = t === 'n' ? Math.max(k === 'retries' ? 0 : 1, Number(el.value) || Number(CFG0[k])) : t === 'b' ? el.checked : el.value;
  }
  S.cfg = { ...S.cfg, ...next } as Config; persist(); toast('Settings saved.');
}
export function creset() { S.cfg = { ...CFG0 }; persist(); cfg(); toast('Defaults restored.'); }
export function wipe() { if (confirm('Reset everything to the demo data?')) { localStorage.removeItem('qz_v'); location.reload(); } }
