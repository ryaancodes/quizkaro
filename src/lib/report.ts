import { S } from '../state';
import { BRAND } from '../brand';
import { levelOf, xpOf } from './smart';
import { topicStats } from './stats';
type Row = (string | number)[];
export interface Rep { title: string; sub: string; file: string; kpis: [string, string][]; charts: { title: string; data: [string, number][] }[]; notes: string[]; sheets: { name: string; rows: Row[] }[] }
const dt = (ts?: number) => (ts ? new Date(ts).toLocaleDateString() : '—');
const stamp = () => new Date().toLocaleString();
const titleOf = (id: number) => S.quizzes.find((z) => z.id === id)?.title ?? (id === 0 ? 'Mistake review' : 'Quiz ' + id);
const pct = (c: number, t: number) => (t ? Math.round((c / t) * 100) : 0);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const topicRows = (logs: { t: string; ok: boolean }[]) =>
  Object.entries(topicStats(logs)).map(([k, v]) => [k, pct(v.c, v.n), v.n] as [string, number, number]).sort((a, b) => a[1] - b[1]);

export function personReport(name: string): Rep {
  const u = S.users.find((x) => x.name === name), mine = S.atts.filter((a) => a.n === name);
  const secs = u?.secs ?? mine.reduce((s, a) => s + a.sec, 0), xp = xpOf(S.atts, name), L = levelOf(xp);
  const c = mine.reduce((s, a) => s + a.c, 0), t = mine.reduce((s, a) => s + a.tot, 0);
  const byQuiz = [...new Set(mine.map((a) => a.q))].map((id) => {
    const m = mine.filter((a) => a.q === id);
    return { title: titleOf(id), n: m.length, best: Math.max(...m.map((a) => pct(a.c, a.tot))), avg: pct(m.reduce((s, a) => s + a.c, 0), m.reduce((s, a) => s + a.tot, 0)) };
  });
  const topics = topicRows(mine.flatMap((a) => a.log));
  const notes = topics.length ? [`Strongest topic: ${topics[topics.length - 1][0]} (${topics[topics.length - 1][1]}%).`, `Focus next on: ${topics[0][0]} (${topics[0][1]}%).`] : ['No quiz data yet.'];
  return {
    title: 'Learner report', sub: `${name}${u ? ' · ' + u.email : ''}`, file: 'report-' + slug(name), notes,
    kpis: [['Time on app', (secs / 3600).toFixed(1) + ' h'], ['Quizzes completed', String(mine.length)], ['Accuracy', pct(c, t) + '%'], ['Level / XP', `${L.l} / ${xp}`]],
    charts: [{ title: 'Best score per quiz (%)', data: byQuiz.slice(0, 8).map((b) => [b.title, b.best]) }, { title: 'Topic accuracy, weakest first (%)', data: topics.slice(0, 8).map((x) => [x[0], x[1]]) }],
    sheets: [
      { name: 'Summary', rows: [['Learner', name], ['Email', u?.email ?? ''], ['Hours on app', +(secs / 3600).toFixed(2)], ['Quizzes completed', mine.length], ['Accuracy %', pct(c, t)], ['XP', xp], ['Level', L.l]] },
      { name: 'By quiz', rows: [['Quiz', 'Attempts', 'Best %', 'Average %'], ...byQuiz.map((b) => [b.title, b.n, b.best, b.avg])] },
      { name: 'Topics', rows: [['Topic', 'Accuracy %', 'Questions'], ...topics] },
      { name: 'Attempts', rows: [['Date', 'Quiz', 'Correct', 'Total', 'XP', 'Seconds'], ...mine.map((a) => [dt(a.ts), titleOf(a.q), a.c, a.tot, a.pts, a.sec])] },
    ],
  };
}
export function orgReport(): Rep {
  const ls = S.users.filter((u) => u.role === 'learner');
  const rows = ls.map((u) => {
    const m = S.atts.filter((a) => a.n === u.name);
    return { u, n: m.length, acc: pct(m.reduce((s, a) => s + a.c, 0), m.reduce((s, a) => s + a.tot, 0)), xp: xpOf(S.atts, u.name), h: u.secs / 3600, last: Math.max(0, ...m.map((a) => a.ts ?? 0)) };
  });
  const all = S.atts.filter((a) => ls.some((u) => u.name === a.n));
  const cat = new Map<string, number>();
  for (const a of all) { const k = S.quizzes.find((z) => z.id === a.q)?.cat ?? 'Other'; cat.set(k, (cat.get(k) ?? 0) + 1); }
  const topics = topicRows(all.flatMap((a) => a.log)), hrs = rows.reduce((s, r) => s + r.h, 0);
  const c = all.reduce((s, a) => s + a.c, 0), t = all.reduce((s, a) => s + a.tot, 0);
  const top = [...rows].sort((a, b) => b.xp - a.xp)[0];
  return {
    title: 'Organisation report', sub: `${ls.length} learners · ${S.groups.length} groups`, file: 'report-organisation',
    notes: topics.length && top ? [`Org-wide weakest topic: ${topics[0][0]} (${topics[0][1]}%).`, `Top performer: ${top.u.name} (${top.xp} XP).`] : [],
    kpis: [['Total hours on app', hrs.toFixed(1) + ' h'], ['Quizzes completed', String(all.length)], ['Avg accuracy', pct(c, t) + '%'], ['Active learners', String(rows.filter((r) => r.n).length)]],
    charts: [{ title: 'Quizzes completed per learner', data: rows.map((r) => [r.u.name, r.n]) }, { title: 'Quizzes completed by category', data: [...cat.entries()] }],
    sheets: [
      { name: 'Summary', rows: [['Learners', ls.length], ['Groups', S.groups.length], ['Total hours', +hrs.toFixed(2)], ['Quizzes completed', all.length], ['Accuracy %', pct(c, t)]] },
      { name: 'Learners', rows: [['Name', 'Email', 'Attempts', 'Accuracy %', 'XP', 'Hours', 'Last active'], ...rows.map((r) => [r.u.name, r.u.email, r.n, r.acc, r.xp, +r.h.toFixed(1), dt(r.last)])] },
      { name: 'Weak topics', rows: [['Topic', 'Accuracy %', 'Questions'], ...topics] },
      { name: 'Attempts', rows: [['Date', 'Learner', 'Quiz', 'Correct', 'Total', 'XP'], ...all.map((a) => [dt(a.ts), a.n, titleOf(a.q), a.c, a.tot, a.pts])] },
    ],
  };
}
function saveBlob(blob: Blob, name: string) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
/** scope: "org" for the organisation, otherwise a learner's name. */
export async function exportReport(kind: 'pdf' | 'csv' | 'xlsx', scope: string) {
  const rep = scope === 'org' ? orgReport() : personReport(scope), base = `${BRAND.toLowerCase().replace(/\s+/g, '-')}-${rep.file}-${new Date().toISOString().slice(0, 10)}`;
  if (kind === 'csv') {
    const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const out: Row[] = [[rep.title], [rep.sub], ['Generated', stamp()], []];
    rep.sheets.forEach((s) => out.push([s.name], ...s.rows, []));
    saveBlob(new Blob(['\ufeff' + out.map((r) => r.map(q).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }), base + '.csv');
  } else if (kind === 'xlsx') {
    const X = await import('xlsx'), wb = X.utils.book_new();
    rep.sheets.forEach((s) => X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([[rep.title, rep.sub, 'Generated ' + stamp()], [], ...s.rows]), s.name));
    X.writeFile(wb, base + '.xlsx');
  } else await pdf(rep, base + '.pdf');
}
async function pdf(rep: Rep, file: string) {
  const { jsPDF } = await import('jspdf'), d = new jsPDF({ unit: 'pt', format: 'a4' }), W = 595, M = 40;
  d.setFillColor(91, 67, 255); d.rect(0, 0, W, 90, 'F'); d.setTextColor(255, 255, 255);
  d.setFontSize(24); d.text(BRAND, M, 40); d.setFontSize(13); d.text(rep.title, M, 62); d.setFontSize(10); d.text(rep.sub, M, 78);
  d.text('Downloaded: ' + stamp(), W - M, 40, { align: 'right' });
  let y = 114; const bw = (W - 2 * M - 30) / 4;
  rep.kpis.forEach((k, i) => {
    const x = M + i * (bw + 10); d.setDrawColor(23, 20, 42); d.setLineWidth(1.5); d.roundedRect(x, y, bw, 54, 8, 8);
    d.setFontSize(9); d.setTextColor(110, 106, 128); d.text(k[0], x + 10, y + 18); d.setFontSize(16); d.setTextColor(23, 20, 42); d.text(k[1], x + 10, y + 42);
  });
  y += 86;
  for (const c of rep.charts) {
    if (y > 640) { d.addPage(); y = 50; }
    d.setFontSize(12); d.setTextColor(23, 20, 42); d.text(c.title, M, y); y += 14;
    const max = Math.max(1, ...c.data.map((v) => v[1])), bx = M + 140, bmax = W - M - bx - 40;
    if (!c.data.length) { d.setFontSize(9); d.text('No data yet', M, y + 10); y += 24; }
    for (const [label, v] of c.data) {
      d.setFontSize(9); d.setTextColor(60, 58, 90); d.text(label.slice(0, 24), M, y + 9);
      d.setFillColor(91, 67, 255); d.roundedRect(bx, y, Math.max(2, (v / max) * bmax), 11, 3, 3, 'F'); d.text(String(v), bx + (v / max) * bmax + 6, y + 9); y += 17;
    }
    y += 14;
  }
  d.setFontSize(12); d.setTextColor(23, 20, 42); d.text('Insights', M, y); y += 14; d.setFontSize(10);
  rep.notes.forEach((n) => { d.text('• ' + n, M, y); y += 14; });
  const t = rep.sheets[rep.sheets.length - 1]; y += 12;
  if (y > 680) { d.addPage(); y = 50; }
  d.setFontSize(12); d.text(t.name === 'Attempts' ? 'Recent attempts' : t.name, M, y); y += 14; d.setFontSize(9);
  const cw = (W - 2 * M) / t.rows[0].length;
  [t.rows[0], ...t.rows.slice(1).slice(-12).reverse()].forEach((r, i) => {
    if (y > 800) { d.addPage(); y = 50; }
    d.setTextColor(i ? 40 : 91, i ? 40 : 67, i ? 60 : 255); r.forEach((v, k) => d.text(String(v).slice(0, 18), M + k * cw, y)); y += 14;
  });
  d.setFontSize(8); d.setTextColor(140, 140, 160); d.text('Generated by ' + BRAND + ' · ' + stamp(), M, 825);
  d.save(file);
}
