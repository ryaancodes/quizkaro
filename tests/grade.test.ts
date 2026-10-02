import { describe, expect, it } from 'vitest';
import { grade, words } from '../src/lib/grade';
const base = { q: 'q', o: [], a: 0, e: 'e', t: 't', d: 1 };
describe('grading', () => {
  it('multiple choice', () => { expect(grade({ ...base, o: ['a', 'b'], a: 1 }, 1)).toBe(true); expect(grade({ ...base, o: ['a', 'b'], a: 1 }, 0)).toBe(false); });
  it('match compares every pair', () => {
    const q = { ...base, k: 'match' as const, pairs: [['A', '1'], ['B', '2']] as [string, string][] };
    expect(grade(q, ['1', '2'])).toBe(true); expect(grade(q, ['2', '1'])).toBe(false);
  });
  it('fill ignores case/space and accepts alternatives', () => {
    const q = { ...base, k: 'fill' as const, blanks: ['setState|setter'] };
    expect(grade(q, ['  SETTER '])).toBe(true); expect(grade(q, ['nope'])).toBe(false);
  });
  it('order needs the exact sequence', () => {
    const q = { ...base, k: 'order' as const, items: ['a', 'b', 'c'] };
    expect(grade(q, ['a', 'b', 'c'])).toBe(true); expect(grade(q, ['b', 'a', 'c'])).toBe(false);
  });
  it('free text needs half of the key ideas', () => {
    const q = { ...base, k: 'text' as const, kw: ['render', 'new|copy', 'state'] };
    expect(grade(q, 'Make a copy so React can re-render')).toBe(true); expect(grade(q, 'no idea')).toBe(false);
  });
  it('counts words', () => { expect(words('  one two  three ')).toBe(3); expect(words('')).toBe(0); });
});
