import { S } from '../state';
import type { Quiz } from '../types';
import { $, app, esc, ICO, lbTable, stars } from '../dom';
import { remoteBoard } from '../lib/api';
import { leaderboard } from '../lib/stats';
import { forSkills, levelOf, recommend, xpOf } from '../lib/smart';
// Four colours only: peacock, mehndi green, marigold, vermilion.
const COL: Record<string, string> = { Tech: '#1fa9a0', Science: '#8db255', Math: '#f5b301', World: '#f0634a', Mind: '#f5b301', Language: '#1fa9a0', Custom: '#cfc6b0' };
let cat = 'All', term = '', all = false;
const col = (z: Quiz) => COL[z.cat ?? 'Custom'] ?? '#c9c2b4';
export function avg(id: number) {
  const r = S.ratings.filter((x) => x.q === id);
  return r.length ? { v: r.reduce((s, x) => s + x.s, 0) / r.length, n: r.length } : null;
}
export function card(z: Quiz, tag = '') {
  const best = S.atts.filter((a) => a.n === S.name && a.q === z.id).reduce((m, a) => Math.max(m, a.pts), -1), rt = avg(z.id);
  return `<article class="qc" style="--c:${col(z)}"><button class="ico" data-a="share" data-v="${z.id}" title="Copy share link" aria-label="Share ${esc(z.title)}">${ICO.link}</button>
  <div class="ic">${z.icon ?? '📝'}</div><span class="pill">${esc(tag || z.cat || 'Custom')}</span><h3>${esc(z.title)}</h3>
  <p class="mu">${z.qs.length} questions</p><p class="mu rate">${rt ? `<span title="${rt.v.toFixed(1)} average">${stars(rt.v)}</span> ${rt.v.toFixed(1)} (${rt.n})` : 'Not rated yet'}</p>
  <p class="mu">${best >= 0 ? '★ Your best: ' + best + ' XP' : 'Not attempted yet'}</p><button class="btn" data-a="start" data-v="${z.id}">Start</button></article>`;
}
export function home() {
  const mine = S.atts.filter((a) => a.n === S.name), xp = xpOf(S.atts, S.name), L = levelOf(xp), rec = recommend(S.quizzes, S.atts, S.name);
  const tot = mine.reduce((s, a) => s + a.tot, 0), acc = tot ? Math.round((mine.reduce((s, a) => s + a.c, 0) / tot) * 100) : 0;
  const cats = ['All', ...new Set(S.quizzes.map((z) => z.cat ?? 'Custom'))], skills = S.me?.skills ?? [];
  const done = new Set(mine.map((a) => a.q)), mineG = S.groups.filter((g) => g.members.includes(S.me?.email ?? ''));
  const assigned = mineG.flatMap((g) => g.quizzes.map((id) => [S.quizzes.find((z) => z.id === id), g.name] as const)).filter((x): x is readonly [Quiz, string] => !!x[0]).slice(0, 4);
  const pick = forSkills(S.quizzes, skills).sort((a, b) => Number(done.has(a.id)) - Number(done.has(b.id))).slice(0, 4);
  app().innerHTML = `<section class="hero"><p class="eyebrow">${S.quizzes.length} quizzes · 5 question types · adaptive · timed</p>
  <h1>Namaste, ${esc(S.name.split(' ')[0])}.<br>Chalo, shuru karein?</h1></section>
  <section class="stats"><div class="tile"><span class="mu">Level</span><b>${L.l}</b><div class="bar"><i style="width:${L.p * 100}%"></i></div></div>
  <div class="tile"><span class="mu">Total XP</span><b>${xp}</b></div><div class="tile"><span class="mu">Accuracy</span><b>${acc}%</b></div><div class="tile"><span class="mu">Attempts</span><b>${mine.length}</b></div></section>
  <section class="card spot" style="--c:${col(rec.quiz)}"><div><span class="eyebrow">Up next · ${esc(rec.reason)}</span><h3>${rec.quiz.icon ?? ''} ${esc(rec.quiz.title)}</h3></div><button class="btn" data-a="start" data-v="${rec.quiz.id}">Start →</button></section>
  ${assigned.length ? `<h2>Assigned to you</h2><div class="grid">${assigned.map(([z, g]) => card(z, g)).join('')}</div>` : ''}
  <h2>Picked for your skills</h2>${pick.length ? `<div class="grid">${pick.map((z) => card(z)).join('')}</div>` : `<div class="card row between"><span>Tell us your skills and we'll pick quizzes for you.</span><button class="btn g" data-a="go" data-v="settings">Add skills</button></div>`}
  <div class="row between mt-4"><h2 style="margin:0">All quizzes</h2><input id="sq" class="search" placeholder="Search quizzes…" value="${esc(term)}" aria-label="Search"></div>
  <div class="chips">${cats.map((c) => `<button class="chip ${c === cat ? 'on' : ''}" data-c="${c}">${c}</button>`).join('')}</div>
  <div class="grid collapsed" id="qg"></div><div class="center"><button class="btn g" id="seeall"></button></div>
  <h2>Hall of fame</h2><div class="card"><select id="ls" aria-label="Quiz">${S.quizzes.map((z) => `<option value="${z.id}">${esc(z.title)}</option>`).join('')}</select><div id="lt"></div></div>`;
  const grid = () => {
    const list = S.quizzes.filter((z) => (cat === 'All' || (z.cat ?? 'Custom') === cat) && z.title.toLowerCase().includes(term.toLowerCase()));
    $('#qg').innerHTML = list.map((z) => card(z)).join('') || '<p class="mu">No quizzes match.</p>';
    $('#qg').classList.toggle('collapsed', !all); $('#seeall').textContent = all ? 'Show less ↑' : `See all ${list.length} quizzes ↓`;
  };
  document.querySelectorAll<HTMLElement>('.chip').forEach((b) => { b.onclick = () => { cat = b.dataset.c!; document.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b)); grid(); }; });
  $<HTMLInputElement>('#sq').oninput = (e) => { term = (e.target as HTMLInputElement).value; grid(); };
  $('#seeall').onclick = () => { all = !all; grid(); };
  const sel = $<HTMLSelectElement>('#ls'), lt = () => { const id = +sel.value; $('#lt').innerHTML = lbTable(leaderboard(S.atts, id)); remoteBoard(id).then((r) => { if (r && +sel.value === id) $('#lt').innerHTML = lbTable(r); }); };
  sel.onchange = lt; grid(); lt();
}
