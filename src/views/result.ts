import { S, persist, type Run } from '../state';
import { app, esc, lvl, tb, lbTable, toast } from '../dom';
import { remoteBoard } from '../lib/api';
import { leaderboard, topicStats } from '../lib/stats';
import { levelOf, recommend, xpOf } from '../lib/smart';
let lastQ = 0;
export function rate(v: number) {
  S.ratings = S.ratings.filter((x) => !(x.q === lastQ && x.n === S.name)); S.ratings.push({ q: lastQ, n: S.name, s: v }); persist();
  document.querySelectorAll<HTMLElement>('#st button').forEach((b, i) => { b.textContent = i < v ? '★' : '☆'; });
  toast('Thanks for rating!');
}
export function showResult(r: Run, auto: boolean, c: number, pts: number, sec: number) {
  lastQ = r.qz.id;
  const pc = Math.round((c / r.tot) * 100), C = 2 * Math.PI * 70, tp = topicStats(r.log), real = !r.preview && r.qz.id > 0;
  const xp = xpOf(S.atts, S.name), L = levelOf(xp), up = real && L.l > levelOf(xp - pts).l, rec = recommend(S.quizzes, S.atts, S.name);
  const pass = pc >= S.cfg.pass;
  app().innerHTML = `<div class="card">${auto ? '<p class="pill mb-3">Time ran out – auto-submitted</p>' : ''}${r.preview ? '<p class="pill mb-3">Preview only – nothing was saved</p>' : ''}
  <div class="two"><svg viewBox="0 0 180 180" width="180" role="img" aria-label="Score ${pc} percent"><circle cx="90" cy="90" r="70" fill="none" stroke="var(--track)" stroke-width="18"/>
  <circle cx="90" cy="90" r="70" fill="none" stroke="${pass ? 'var(--ok)' : 'var(--bad)'}" stroke-width="18" stroke-linecap="round" stroke-dasharray="${(C * pc) / 100} ${C}" transform="rotate(-90 90 90)"/>
  <text x="90" y="94" text-anchor="middle" font-size="40" font-weight="800" fill="var(--tx)" font-family="Bricolage Grotesque,sans-serif">${pc}%</text><text x="90" y="118" text-anchor="middle" font-size="13" fill="var(--mu)">${c}/${r.tot} correct</text></svg>
  <div><h2 style="margin:0">${pass ? '✓ Passed' : 'Not passed yet'} <span class="mu">(pass mark ${S.cfg.pass}%)</span></h2><p class="mu">+${pts} XP · ${sec}s · reached difficulty ${lvl(r.lv)}</p>
  ${real ? `<p class="mt-3"><b>Level ${L.l}</b>${up ? ' · Level up!' : ''} <span class="mu">· ${L.next} XP to next</span></p><div class="bar"><i style="width:${L.p * 100}%"></i></div>` : ''}
  <div class="mt-3">${Object.entries(tp).map(([t, v]) => tb(t, v.c / v.n)).join('')}</div></div></div>
  <div class="row mt-4">${r.preview ? '<button class="btn" data-a="go" data-v="make">← Back to editor</button>' : `<button class="btn" data-a="start" data-v="${r.qz.id}" ${r.qz.id ? '' : 'hidden'}>Try again</button>`}${S.missed.length ? '<button class="btn g" data-a="retry">Retry my mistakes ↻</button>' : ''}<button class="btn g" data-a="go" data-v="home">All quizzes</button></div></div>
  ${real ? `<div class="card mt-4 row between"><b>How was this quiz?</b><div class="stars" id="st">${[1, 2, 3, 4, 5].map((n) => `<button data-a="rate" data-v="${n}" aria-label="${n} stars">☆</button>`).join('')}</div></div>
  <div class="card spot mt-4" style="--c:var(--ac)"><div><span class="mu">Up next · ${esc(rec.reason)}</span><h3>${rec.quiz.icon ?? ''} ${esc(rec.quiz.title)}</h3></div><button class="btn" data-a="start" data-v="${rec.quiz.id}">Start</button></div>` : ''}
  ${real && S.cfg.showLb ? `<h2>Leaderboard</h2><div class="card" id="lb">${lbTable(leaderboard(S.atts, r.qz.id))}</div>` : ''}
  <h2>Answer review</h2><div class="card">${r.log.map((x) => `<div class="rev"><b>${x.ok ? '✓' : '✗'} ${esc(x.q)}</b><p class="mu">Your answer: ${esc(x.pa)}${x.ok ? '' : ` · Correct: <b style="color:var(--ok)">${esc(x.ca)}</b>`}</p><p>${esc(x.e)}</p></div>`).join('')}</div>`;
  if (real && S.cfg.showLb) remoteBoard(r.qz.id).then((rows) => { const el = document.querySelector('#lb'); if (rows && el) el.innerHTML = lbTable(rows); });
}
