import { S, persist } from '../state';
import type { Kind, Question, Quiz } from '../types';
import { $, act, app, esc, toast } from '../dom';
import { shareUrl } from '../lib/share';
import { preview } from './quiz';
let img = '';
const val = (s: string) => $<HTMLInputElement>(s).value.trim();
const lines = (s: string) => val(s).split('\n').map((x) => x.trim()).filter(Boolean);
const AREA: Record<Kind, string> = {
  mcq: `<div class="f2">${[0, 1, 2, 3].map((i) => `<input class="mo" placeholder="Option ${'ABCD'[i]}">`).join('')}</div><select id="mc"><option value="0">Correct: A</option><option value="1">Correct: B</option><option value="2">Correct: C</option><option value="3">Correct: D</option></select>`,
  match: '<textarea id="x1" rows="4" placeholder="One pair per line:&#10;Term = Definition"></textarea>',
  fill: '<input id="x1" placeholder="Answers in order, comma separated (use | for alternatives)">',
  order: '<textarea id="x1" rows="4" placeholder="Items in the CORRECT order, one per line"></textarea>',
  text: '<input id="x1" placeholder="Key ideas, comma separated (use | for alternatives). Half must appear to score.">',
};
const KINDS: [Kind, string][] = [['mcq', 'Multiple choice'], ['match', 'Match the following'], ['fill', 'Fill in the blanks'], ['order', 'Drag to order'], ['text', 'Free text']];
const drw = () => {
  $('#dl').innerHTML = S.draft.map((q, i) => `<div class="rev row between"><span><b>${i + 1}.</b> ${esc(q.q)} <span class="mu">(${q.k ?? 'mcq'}, ${esc(q.t)}, level ${q.d})</span></span><button class="btn g sm" data-a="qrm" data-v="${i}">Remove</button></div>`).join('');
};
export function make() {
  img = '';
  app().innerHTML = `<div class="row between"><h2 style="margin:0">Create a quiz</h2><span class="mu">Tip: flip “Learner view” in the header to see what learners see.</span></div>
  <div class="card f mt-4"><div class="f2"><input id="mt" placeholder="Quiz title"><input id="mi" placeholder="Emoji icon, e.g. 🧠" maxlength="4"></div>
  <div class="f2"><select id="mcat" aria-label="Category">${['Tech', 'Science', 'Math', 'World', 'Mind', 'Language', 'Custom'].map((c) => `<option>${c}</option>`).join('')}</select><input id="mm" type="number" min="1" value="5" aria-label="Minutes"></div>
  <span class="mu">Time limit in minutes (capped by Configuration). Assign to a group after publishing:</span>
  <select id="mg" aria-label="Group"><option value="0">Don't assign yet</option>${S.groups.map((g) => `<option value="${g.id}">${esc(g.name)}</option>`).join('')}</select>
  <hr style="border:0;border-top:2px solid var(--track)"><select id="mk" aria-label="Question type">${KINDS.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>
  <textarea id="mq" rows="2" placeholder="Question (for fill in the blanks, write ___ where each blank goes)"></textarea><div id="ma" class="f">${AREA.mcq}</div>
  <div class="f2"><input id="mtp" placeholder="Topic (e.g. Algebra)"><select id="md" aria-label="Difficulty"><option value="1">Easy</option><option value="2">Medium</option><option value="3">Hard</option></select></div>
  <div class="f2"><input id="mimg" placeholder="Image URL (optional)"><input id="mfile" type="file" accept="image/*" aria-label="Upload image"></div>
  <textarea id="me" rows="2" placeholder="Explanation shown after answering"></textarea>
  <div class="row"><button class="btn g" data-a="addQ">Add question</button><button class="btn g" data-a="prev">Preview as learner</button></div>
  <div id="dl"></div><button class="btn" data-a="pub">Publish quiz</button><span id="ms" class="mu"></span></div>`;
  $<HTMLSelectElement>('#mk').onchange = (e) => { $('#ma').innerHTML = AREA[(e.target as HTMLSelectElement).value as Kind]; };
  $<HTMLInputElement>('#mfile').onchange = (e) => {
    const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return;
    if (f.size > 400_000) { toast('Image too large (max 400 KB).'); return; }
    const r = new FileReader(); r.onload = () => { img = String(r.result); toast('Image attached.'); }; r.readAsDataURL(f);
  };
  drw();
}
export function addQ() {
  const k = $<HTMLSelectElement>('#mk').value as Kind, q = val('#mq'), ms = $('#ms'), bad = (m: string) => { ms.textContent = m; };
  if (!q) return bad('Write the question first.');
  const base: Question = { q, o: [], a: 0, k, e: val('#me') || 'No explanation provided.', t: val('#mtp') || 'General', d: +val('#md') };
  const im = val('#mimg') || img; if (im) base.img = im;
  if (k === 'mcq') {
    const o = [...document.querySelectorAll<HTMLInputElement>('.mo')].map((x) => x.value.trim());
    if (o.some((x) => !x)) return bad('Fill in all four options.');
    base.o = o; base.a = +val('#mc');
  } else if (k === 'match') {
    const p = lines('#x1').map((l) => l.split('=').map((s) => s.trim())).filter((x) => x.length >= 2 && x[0] && x[1]).map((x) => [x[0], x[1]] as [string, string]);
    if (p.length < 2) return bad('Add at least two pairs, like: Term = Definition');
    base.pairs = p;
  } else if (k === 'fill') {
    const n = q.split('___').length - 1, b = val('#x1').split(',').map((s) => s.trim()).filter(Boolean);
    if (!n || b.length !== n) return bad('Put ___ in the question for each blank and list one answer per blank.');
    base.blanks = b;
  } else if (k === 'order') {
    const it = lines('#x1'); if (it.length < 3) return bad('Add at least three items.'); base.items = it;
  } else {
    const kw = val('#x1').split(',').map((s) => s.trim()).filter(Boolean); if (!kw.length) return bad('Add at least one key idea.'); base.kw = kw;
  }
  S.draft.push(base); img = '';
  document.querySelectorAll<HTMLInputElement>('#mq,#me,#mimg,#ma input,#ma textarea').forEach((x) => { x.value = ''; });
  drw(); bad('Question added.');
}
export function qrm(v = '') { S.draft.splice(Number(v), 1); drw(); }
const build = (id: number): Quiz => ({ id, title: val('#mt') || 'Untitled quiz', icon: val('#mi') || '📝', cat: $<HTMLSelectElement>('#mcat').value, time: Math.max(1, +val('#mm') || 5) * 60, qs: S.draft });
export function previewDraft() { if (!S.draft.length) { toast('Add a question first.'); return; } preview(build(-1)); }
export function pub() {
  if (!val('#mt') || S.draft.length < 2) { $('#ms').textContent = 'Add a title and at least 2 questions.'; return; }
  const z = build(Date.now()); S.quizzes.push(z);
  const g = S.groups.find((x) => x.id === +$<HTMLSelectElement>('#mg').value); g?.quizzes.push(z.id);
  S.draft = []; persist();
  navigator.clipboard?.writeText(shareUrl(z)).catch(() => undefined);
  toast('Published! Share link copied.'); act('go', 'home');
}
