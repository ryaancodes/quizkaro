import { S } from '../state';
import { app, dl, esc, tb } from '../dom';
import { topicStats } from '../lib/stats';
export function ins() {
  const m = S.atts.filter((a) => a.n === S.name);
  const arr = Object.entries(topicStats(m.flatMap((a) => a.log))).map(([t, v]) => ({ t, p: v.c / v.n })).sort((a, b) => a.p - b.p);
  app().innerHTML = `<div class="row between"><h2 style="margin:0">Weak-topic report${S.name ? ' for ' + esc(S.name) : ''}</h2><div class="row">${dl(S.name)}</div></div>` + (arr.length
    ? `<div class="card"><p class="mu">Across ${m.length} attempt${m.length > 1 ? 's' : ''}, lowest accuracy first.</p><div class="mt-3">${arr.map((a) => tb(a.t, a.p)).join('')}</div>
    <div class="exp"><b>Focus next on ${esc(arr[0].t)}.</b> ${arr[0].p < 0.6 ? 'You miss most questions here – revisit the explanations, then retry.' : 'Your weakest topic is still above 60% – nice.'}</div></div>`
    : `<div class="card"><p>No data yet. Take a quiz${S.name ? '' : ' (enter your name on the Quizzes page)'} and your weak topics will show up here.</p><button class="btn mt-3" data-a="go" data-v="home">Browse quizzes</button></div>`);
}
