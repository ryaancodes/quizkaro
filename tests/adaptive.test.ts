import { describe, expect, it } from 'vitest';
import { adjust, pickNext, points } from '../src/lib/adaptive';
import { leaderboard, topicStats } from '../src/lib/stats';
const qs = [1, 2, 3].map((d) => ({ q: 'q' + d, o: [], a: 0, e: '', t: 'T', d }));
describe('adaptive difficulty', () => {
  it('raises level after two correct answers in a row', () => {
    const a = adjust(1, 0, true), b = adjust(a.lv, a.st, true);
    expect(a.lv).toBe(1); expect(b.lv).toBe(2);
  });
  it('lowers level on a wrong answer but never below 1', () => {
    expect(adjust(2, 1, false)).toEqual({ lv: 1, st: 0 }); expect(adjust(1, 0, false).lv).toBe(1);
  });
  it('picks the unused question closest to the level', () => {
    expect(pickNext(qs, new Set(), 3)).toBe(2); expect(pickNext(qs, new Set([2]), 3)).toBe(1);
  });
  it('weights points by difficulty', () => { expect(points(3, true)).toBe(30); expect(points(3, false)).toBe(0); });
});
describe('stats', () => {
  it('counts topic accuracy', () => {
    expect(topicStats([{ t: 'A', ok: true }, { t: 'A', ok: false }])).toEqual({ A: { c: 1, n: 2 } });
  });
  it('ranks by points, then faster time', () => {
    const at = (n: string, pts: number, sec: number) => ({ q: 1, n, pts, c: 0, tot: 1, sec, log: [] });
    expect(leaderboard([at('a', 10, 5), at('b', 20, 9), at('c', 20, 4)], 1).map((x) => x.n)).toEqual(['c', 'b', 'a']);
  });
});
