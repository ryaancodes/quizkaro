import { S } from '../state';
import type { Question, Quiz } from '../types';
import { $, app, esc, toast } from '../dom';
import { kind } from '../lib/grade';
import { BRAND } from '../brand';
type Board = { name: string; pts: number }[];
interface Host { room: string; quiz: Quiz; qs: Question[]; i: number; players: Map<string, { pts: number; a?: number }>; ends: number; phase: 'lobby' | 'q' | 'rev' | 'end'; secs: number; timer: number }
interface Msg { t: string; room: string; [k: string]: unknown }
interface Guest { room: string; name: string; phase: 'wait' | 'q' | 'rev' | 'end'; q?: Msg; choice?: number; rev?: Msg; players: number; timer: number; board: Board }
const ch = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('quizly-live');
let H: Host | null = null, G: Guest | null = null, liveGroup = 0;
export const liveFor = (gid: number) => { liveGroup = gid; };
const post = (m: Msg) => ch?.postMessage(m);
const opts = (o: string[], a = -1, pick = -1) => o.map((t, k) => `<div class="opt live ${k === a ? 'ok' : k === pick ? 'bad' : ''}"><b>${'ABCD'[k]}</b><span>${esc(t)}</span></div>`).join('');
const boardHtml = (b: Board) => `<table><tr><th>#</th><th>Player</th><th>Points</th></tr>${b.slice(0, 8).map((x, i) => `<tr><td>${['🥇', '🥈', '🥉'][i] ?? i + 1}</td><td>${esc(x.name)}</td><td>${x.pts}</td></tr>`).join('')}</table>`;
const board = (h: Host): Board => [...h.players.entries()].map(([name, p]) => ({ name, pts: p.pts })).sort((a, b) => b.pts - a.pts);
if (ch) ch.onmessage = (e: MessageEvent<Msg>) => {
  const m = e.data;
  if (H && m.room === H.room) hostMsg(H, m);
  if (G && m.room === G.room) guestMsg(G, m);
};
/* ---------- host ---------- */
export function live() { if (S.me?.role === 'admin' && !S.asLearner) { if (H) hostRender(); else setup(); } else guestRender(); }
function setup() {
  const elig = S.quizzes.filter((z) => z.qs.filter((q) => kind(q) === 'mcq').length >= 3), g = S.groups.find((x) => x.id === liveGroup);
  app().innerHTML = `<h2 style="margin-top:0">Start a live group quiz</h2><div class="card f"><p class="mu">Everyone in the room sees the same question at the same time. Multiple-choice questions only.</p>
  <select id="lq" aria-label="Quiz">${elig.map((z) => `<option value="${z.id}" ${z.id === g?.quizzes[0] ? 'selected' : ''}>${z.icon ?? ''} ${esc(z.title)}</option>`).join('')}</select>
  <select id="lg" aria-label="Group">${S.groups.map((x) => `<option value="${x.id}" ${x.id === liveGroup ? 'selected' : ''}>For group: ${esc(x.name)}</option>`).join('')}<option value="0">Open room (anyone with the code)</option></select>
  <button class="btn" data-a="lhost">Create room →</button><p class="mu">Demo: open ${BRAND} in a second browser tab, sign in as a learner and choose “Join live”.</p></div>`;
}
export function hostStart() {
  const quiz = S.quizzes.find((z) => z.id === Number($<HTMLSelectElement>('#lq').value));
  if (!quiz) return;
  const qs = quiz.qs.filter((q) => kind(q) === 'mcq').sort((a, b) => a.d - b.d).slice(0, S.cfg.maxQ);
  H = { room: Math.random().toString(36).slice(2, 6).toUpperCase(), quiz, qs, i: -1, players: new Map(), ends: 0, phase: 'lobby', secs: S.cfg.liveSecs, timer: 0 };
  hostRender();
}
const qMsg = (h: Host): Msg => ({ t: 'q', room: h.room, i: h.i, n: h.qs.length, q: h.qs[h.i].q, o: h.qs[h.i].o, img: h.qs[h.i].img, ends: h.ends, secs: h.secs });
function hostMsg(h: Host, m: Msg) {
  if (m.t === 'join') {
    const n = String(m.name); if (!h.players.has(n)) h.players.set(n, { pts: 0 });
    post({ t: 'lobby', room: h.room, count: h.players.size }); if (h.phase === 'q') post(qMsg(h)); hostRender();
  } else if (m.t === 'ans' && h.phase === 'q' && m.i === h.i) {
    const p = h.players.get(String(m.name));
    if (p && p.a === undefined) {
      p.a = Number(m.c);
      if (p.a === h.qs[h.i].a) p.pts += 100 + Math.round(Math.max(0, (h.ends - Date.now()) / (h.secs * 1000)) * 50);
      if ([...h.players.values()].every((x) => x.a !== undefined)) reveal(h); else hostRender();
    }
  }
}
export function hostNext() {
  const h = H; if (!h) return;
  h.i++; clearInterval(h.timer);
  if (h.i >= h.qs.length) { h.phase = 'end'; post({ t: 'end', room: h.room, board: board(h) }); hostRender(); return; }
  h.phase = 'q'; h.secs = S.cfg.liveSecs; h.ends = Date.now() + h.secs * 1000; h.players.forEach((p) => { p.a = undefined; });
  post(qMsg(h));
  h.timer = window.setInterval(() => { if (Date.now() >= h.ends) reveal(h); else hostRender(true); }, 500);
  hostRender();
}
function reveal(h: Host) {
  if (h.phase !== 'q') return;
  clearInterval(h.timer); h.phase = 'rev';
  post({ t: 'rev', room: h.room, i: h.i, a: h.qs[h.i].a, e: h.qs[h.i].e, board: board(h) }); hostRender();
}
export function hostClose() { if (H) clearInterval(H.timer); H = null; setup(); }
function hostRender(light = false) {
  const h = H; if (!h) return;
  if (light) { const el = document.querySelector('#hc'); if (el) el.textContent = Math.max(0, Math.ceil((h.ends - Date.now()) / 1000)) + 's'; return; }
  const q = h.qs[h.i], head = `<div class="row between"><span class="pill">${h.quiz.icon ?? ''} ${esc(h.quiz.title)}</span><span class="pill">Room <b>${h.room}</b> · ${h.players.size} players</span></div>`;
  let inner = '';
  if (h.phase === 'lobby') inner = `<p class="mu mt-4">Learners: open ${BRAND} → Join live → enter this code</p><div class="code">${h.room}</div><div class="chips wrap" style="justify-content:center">${[...h.players.keys()].map((n) => `<span class="pill">${esc(n)}</span>`).join('') || '<span class="mu">Waiting for players…</span>'}</div>
    <div class="row mt-4" style="justify-content:center"><button class="btn" data-a="lnext">Start game ▶</button><button class="btn g" data-a="lclose">Cancel</button></div>`;
  else if (h.phase === 'q') inner = `<div class="row between mt-4"><span class="mu">Question ${h.i + 1} of ${h.qs.length} · ${[...h.players.values()].filter((p) => p.a !== undefined).length}/${h.players.size} answered</span><span class="pill" id="hc">${h.secs}s</span></div>
    ${q.img ? `<img class="qimg" src="${esc(q.img)}" alt="">` : ''}<h2 class="q">${esc(q.q)}</h2>${opts(q.o)}<div class="row mt-4"><button class="btn g" data-a="lreveal">Reveal now</button></div>`;
  else if (h.phase === 'rev') inner = `<h2 class="q mt-4">${esc(q.q)}</h2>${opts(q.o, q.a)}<div class="exp">${esc(q.e)}</div><h3 class="mt-4">Leaderboard</h3>${boardHtml(board(h))}
    <div class="row mt-4"><button class="btn" data-a="lnext">${h.i + 1 >= h.qs.length ? 'Finish 🏁' : 'Next question →'}</button></div>`;
  else inner = `<h2 class="mt-4">Final leaderboard</h2>${boardHtml(board(h))}<div class="row mt-4"><button class="btn" data-a="lclose">Close room</button></div>`;
  app().innerHTML = `<div class="qwrap card">${head}${inner}</div>`;
}
export function hostReveal() { if (H) reveal(H); }
/* ---------- player ---------- */
export function joinRoom() {
  const room = $<HTMLInputElement>('#jc').value.trim().toUpperCase();
  if (!room || !S.me) { toast('Enter the room code.'); return; }
  if (!ch) { toast('Live quizzes need a browser with BroadcastChannel support.'); return; }
  G = { room, name: S.name, phase: 'wait', players: 0, timer: 0, board: [] };
  post({ t: 'join', room, name: S.name }); guestRender();
}
function guestMsg(g: Guest, m: Msg) {
  if (m.t === 'lobby') g.players = Number(m.count);
  else if (m.t === 'q') { g.phase = 'q'; g.q = m; g.choice = undefined; clearInterval(g.timer); g.timer = window.setInterval(() => { const el = document.querySelector('#gc'); if (el) el.textContent = Math.max(0, Math.ceil((Number(m.ends) - Date.now()) / 1000)) + 's'; }, 400); }
  else if (m.t === 'rev') { g.phase = 'rev'; g.rev = m; g.board = m.board as Board; clearInterval(g.timer); }
  else if (m.t === 'end') { g.phase = 'end'; g.board = m.board as Board; clearInterval(g.timer); }
  guestRender();
}
export function liveAnswer(v = '') {
  const g = G; if (!g || g.phase !== 'q' || g.choice !== undefined || !g.q) return;
  g.choice = Number(v); post({ t: 'ans', room: g.room, name: g.name, i: g.q.i, c: g.choice }); guestRender();
}
export function leaveRoom() { if (G) clearInterval(G.timer); G = null; guestRender(); }
function guestRender() {
  const g = G;
  if (!g) { app().innerHTML = `<div class="qwrap card center"><h2 style="margin-top:0">Join a live quiz</h2><p class="mu">Ask your host for the 4-letter room code.</p><input id="jc" class="code-in" maxlength="4" placeholder="ABCD" aria-label="Room code"><button class="btn mt-4" data-a="ljoin">Join →</button></div>`; return; }
  const me = g.board.findIndex((b) => b.name === g.name);
  let inner = '';
  if (g.phase === 'wait') inner = `<div class="code">${g.room}</div><p class="mu">You're in! Waiting for the host to start… (${g.players} players so far)</p>`;
  else if (g.phase === 'q' && g.q) {
    const o = g.q.o as string[];
    inner = `<div class="row between"><span class="mu">Question ${Number(g.q.i) + 1} of ${g.q.n}</span><span class="pill" id="gc">${g.q.secs}s</span></div>${g.q.img ? `<img class="qimg" src="${esc(String(g.q.img))}" alt="">` : ''}<h2 class="q">${esc(String(g.q.q))}</h2>
    ${g.choice === undefined ? o.map((t, k) => `<button class="opt" data-a="lans" data-v="${k}"><b>${'ABCD'[k]}</b><span>${esc(t)}</span></button>`).join('') : opts(o, -1, g.choice) + '<p class="mu mt-4">Answer locked in. Waiting for everyone…</p>'}`;
  } else if (g.phase === 'rev' && g.q && g.rev) {
    const ok = g.choice === g.rev.a;
    inner = `<h2>${ok ? '✓ Correct!' : g.choice === undefined ? 'Too slow' : '✗ Not quite'}</h2>${opts(g.q.o as string[], Number(g.rev.a), g.choice ?? -1)}<div class="exp">${esc(String(g.rev.e))}</div><p class="mt-4"><b>You're #${me + 1}</b> with ${g.board[me]?.pts ?? 0} points</p>${boardHtml(g.board)}<p class="mu">Next question coming up…</p>`;
  } else inner = `<h2>Game over</h2><p>You finished <b>#${me + 1}</b> with ${g.board[me]?.pts ?? 0} points.</p>${boardHtml(g.board)}<button class="btn mt-4" data-a="lleave">Leave room</button>`;
  app().innerHTML = `<div class="qwrap card"><div class="row between"><span class="pill">Room ${g.room}</span><button class="btn g sm" data-a="lleave">Leave</button></div><div class="mt-4">${inner}</div></div>`;
}
