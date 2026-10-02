import { S, persist, type Run } from '../state';
import type { Question, Quiz } from '../types';
import { $, app, esc, lvl, shuf, toast } from '../dom';
import { adjust, pickNext, points } from '../lib/adaptive';
import { answerText, correctText, grade, kind, words } from '../lib/grade';
import { pushAttempt } from '../lib/api';
import { showResult } from './result';
const TYPE = { mcq: 'Multiple choice', match: 'Match the following', fill: 'Fill in the blanks', order: 'Drag to order', text: 'Free text' };
export const start = (id: number) => { const qz = S.quizzes.find((z) => z.id === id); if (qz) begin(qz); };
export function retry() {
  if (S.missed.length) begin({ id: 0, title: 'Mistake review', icon: '🔁', cat: 'Review', time: 150, qs: S.missed });
}
export const preview = (qz: Quiz) => begin(qz, true);
export function begin(qz: Quiz, prev = false) {
  const c = S.cfg;
  if (!S.me) return;
  if (!prev && qz.id > 0 && c.retries > 0 && S.atts.filter((a) => a.n === S.name && a.q === qz.id).length >= c.retries) {
    toast(`Attempt limit reached (${c.retries}) for this quiz.`); return;
  }
  const tot = Math.min(qz.qs.length, c.maxQ), time = Math.min(qz.id > 1e6 ? qz.time : c.perQ * tot, c.minutes * 60);
  const r: Run = { qz, used: new Set(), lv: c.adaptive ? 1 : 2, st: 0, n: 0, tot, log: [], end: Date.now() + time * 1000, t0: Date.now(), cur: null, locked: false, preview: prev, time };
  const url = prev ? '/preview' : qz.id > 0 ? '/quiz/' + qz.id : '/practice';
  if (location.pathname !== url) history.pushState(null, '', url);
  S.run = r; clearInterval(S.tick);
  S.tick = window.setInterval(() => {
    const l = r.end - Date.now(), bar = document.querySelector<HTMLElement>('#tm'), tt = document.querySelector('#tt');
    if (bar && tt) {
      (bar.firstElementChild as HTMLElement).style.width = Math.max(0, (l / (r.time * 1000)) * 100) + '%';
      bar.classList.toggle('low', l < 15000); tt.textContent = Math.ceil(Math.max(0, l) / 1000) + 's';
    }
    if (l <= 0) finish(true);
  }, 250);
  nextQ();
}
function shufQ(q: Question): Question {
  if (kind(q) !== 'mcq' || !S.cfg.shuffle) return q;
  const idx = shuf(q.o.map((_, i) => i));
  return { ...q, o: idx.map((i) => q.o[i]), a: idx.indexOf(q.a) };
}
const qhtml = (q: Question) => kind(q) === 'fill'
  ? q.q.split('___').map((s, i, a) => esc(s) + (i < a.length - 1 ? `<input class="fi" aria-label="Blank ${i + 1}" autocomplete="off">` : '')).join('')
  : esc(q.q);
function body(q: Question) {
  const sub = '<button class="btn mt-4" data-a="sub">Submit answer</button>';
  switch (kind(q)) {
    case 'match': {
      const rights = shuf((q.pairs ?? []).map((p) => p[1]));
      return (q.pairs ?? []).map((p) => `<div class="mrow"><b>${esc(p[0])}</b><select class="mi"><option value="">Choose…</option>${rights.map((r) => `<option>${esc(r)}</option>`).join('')}</select></div>`).join('') + sub;
    }
    case 'fill': return sub;
    case 'order':
      return `<p class="mu">Drag the items into the right order (or use the arrows).</p><ul class="ord" id="ord">${shuf(q.items ?? []).map((it) => `<li draggable="true" data-v="${esc(it)}"><span class="grip">⠿</span><span class="grow">${esc(it)}</span><button class="mv" data-d="-1" aria-label="Move up">↑</button><button class="mv" data-d="1" aria-label="Move down">↓</button></li>`).join('')}</ul>` + sub;
    case 'text': return `<textarea id="ta" rows="4" placeholder="Write your answer…"></textarea><div class="mu" id="wc">0 / ${S.cfg.maxWords} words</div>` + sub;
    default: return q.o.map((o, k) => `<button class="opt" data-a="ans" data-v="${k}"><b>${'ABCD'[k]}</b><span>${esc(o)}</span></button>`).join('');
  }
}
function wire() {
  const ul = document.querySelector<HTMLElement>('#ord');
  if (ul) {
    let drag: HTMLElement | null = null;
    ul.addEventListener('dragstart', (e) => { drag = (e.target as HTMLElement).closest('li'); drag?.classList.add('drag'); });
    ul.addEventListener('dragend', () => { drag?.classList.remove('drag'); drag = null; });
    ul.addEventListener('dragover', (e) => {
      e.preventDefault(); if (!drag) return;
      const after = [...ul.querySelectorAll<HTMLElement>('li:not(.drag)')].find((li) => e.clientY < li.getBoundingClientRect().top + li.offsetHeight / 2);
      ul.insertBefore(drag, after ?? null);
    });
    ul.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('.mv'), li = b?.closest('li');
      if (!b || !li) return;
      if (Number(b.dataset.d) < 0) { if (li.previousElementSibling) ul.insertBefore(li, li.previousElementSibling); }
      else if (li.nextElementSibling) ul.insertBefore(li.nextElementSibling, li);
    });
  }
  const ta = document.querySelector<HTMLTextAreaElement>('#ta');
  if (ta) {
    ta.oninput = () => {
      const n = words(ta.value), wc = $('#wc');
      wc.textContent = `${n} / ${S.cfg.maxWords} words`; wc.classList.toggle('over', n > S.cfg.maxWords);
      $<HTMLButtonElement>('[data-a="sub"]').disabled = n > S.cfg.maxWords;
    };
  }
}
export function nextQ() {
  const r = S.run; if (!r) return;
  if (r.n >= r.tot) return finish(false);
  const i = pickNext(r.qz.qs, r.used, r.lv); r.used.add(i);
  const q = shufQ(r.qz.qs[i]); r.cur = q; r.n++; r.locked = false;
  const seg = Array.from({ length: r.tot }, (_, k) => `<i class="${k < r.log.length ? (r.log[k].ok ? 'y' : 'n') : k === r.n - 1 ? 'cur' : ''}"></i>`).join('');
  app().innerHTML = `<div class="qwrap"><div class="row between"><span class="pill">${r.qz.icon ?? ''} ${esc(r.qz.title)}${r.preview ? ' · preview' : ''}</span><span class="pill" id="tt">…</span></div>
  <div class="seg mt-4">${seg}</div><div class="time" id="tm"><i style="width:100%"></i></div>
  <div class="card qcard"><div class="row between"><span class="mu">Question ${r.n} of ${r.tot} · ${esc(q.t)} · ${TYPE[kind(q)]}</span><span class="row">${lvl(q.d)}<span class="mu">${r.st >= 1 && S.cfg.adaptive ? '↑ one more = harder' : ''}</span></span></div>
  ${q.img ? `<img class="qimg" src="${esc(q.img)}" alt="Question illustration">` : ''}<h2 class="q">${qhtml(q)}</h2>${body(q)}<div id="fb"></div></div>
  <p class="mu center">Tip: press <kbd>1</kbd>–<kbd>4</kbd> to answer, <kbd>Enter</kbd> for next.</p></div>`;
  wire();
}
function collect(q: Question): unknown {
  switch (kind(q)) {
    case 'match': { const v = [...document.querySelectorAll<HTMLSelectElement>('.mi')].map((s) => s.value); return v.every(Boolean) ? v : undefined; }
    case 'fill': { const v = [...document.querySelectorAll<HTMLInputElement>('.fi')].map((s) => s.value.trim()); return v.every(Boolean) ? v : undefined; }
    case 'order': return [...document.querySelectorAll<HTMLElement>('#ord li')].map((li) => li.dataset.v);
    case 'text': { const v = $<HTMLTextAreaElement>('#ta').value.trim(); return v && words(v) <= S.cfg.maxWords ? v : undefined; }
    default: return undefined;
  }
}
export function sub() {
  const q = S.run?.cur; if (!q) return;
  const v = collect(q);
  if (v === undefined) { toast('Please complete your answer first.'); return; }
  settle(v);
}
export const ans = (k: number) => settle(k);
function settle(resp: unknown) {
  const r = S.run, q = r?.cur; if (!r || !q || r.locked) return;
  r.locked = true;
  const ok = grade(q, resp), before = r.lv, k = kind(q);
  document.querySelectorAll<HTMLButtonElement>('.qcard .opt,.qcard input,.qcard select,.qcard textarea,.qcard .mv,.qcard [data-a="sub"]').forEach((el) => { el.disabled = true; });
  if (k === 'mcq') document.querySelectorAll<HTMLButtonElement>('.opt').forEach((b, i) => { if (i === q.a) b.classList.add('ok'); else if (i === resp) b.classList.add('bad'); });
  document.querySelectorAll('.seg i')[r.n - 1].className = ok ? 'y' : 'n';
  r.log.push({ ...q, ok, pa: answerText(q, resp), ca: correctText(q) });
  if (S.cfg.adaptive) { const x = adjust(r.lv, r.st, ok); r.lv = x.lv; r.st = x.st; }
  const note = r.lv > before ? '<br><span class="mu">Difficulty up ↑</span>' : r.lv < before ? '<br><span class="mu">Easing the next one.</span>' : '';
  $('#fb').innerHTML = `<div class="exp"><b>${ok ? '✓ Correct!' : '✗ Not quite.'}</b>${!ok && k !== 'mcq' ? ` Correct answer: <b>${esc(correctText(q))}</b>.` : ''} ${S.cfg.showExp === 'instant' ? esc(q.e) : ''}${note}</div>
  <button class="btn mt-4" data-a="next">${r.n >= r.tot ? 'See results' : 'Next question →'}</button>`;
}
export function finish(auto: boolean) {
  const r = S.run; if (!r) return;
  clearInterval(S.tick);
  const c = r.log.filter((x) => x.ok).length, pts = r.log.reduce((s, x) => s + points(x.d, x.ok), 0), sec = Math.min(r.time, Math.round((Date.now() - r.t0) / 1000));
  S.missed = r.log.filter((x) => !x.ok).map((x) => r.qz.qs.find((z) => z.q === x.q)).filter((x): x is Question => !!x);
  if (!r.preview) {
    const att = { q: r.qz.id, n: S.name, pts, c, tot: r.tot, sec, log: r.log.map((x) => ({ t: x.t, ok: x.ok })), ts: Date.now() };
    S.atts.push(att); persist(); if (r.qz.id > 0) pushAttempt(att);
  }
  history.replaceState(null, '', '/results');
  showResult(r, auto, c, pts, sec); S.run = null; window.scrollTo(0, 0);
}
