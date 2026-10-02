import { describe, expect, it } from 'vitest';
import { seed } from '../src/data/seed';
import { SKILLS, levelOf } from '../src/lib/smart';
import { kind } from '../src/lib/grade';
describe('catalog', () => {
  const qz = seed();
  it('ships 28+ quizzes with unique ids', () => {
    expect(qz.length).toBeGreaterThanOrEqual(28); expect(new Set(qz.map((z) => z.id)).size).toBe(qz.length);
  });
  it('every quiz has all three difficulty levels and valid questions of every type', () => {
    const kinds = new Set<string>();
    for (const z of qz) {
      expect(new Set(z.qs.map((q) => q.d))).toEqual(new Set([1, 2, 3]));
      for (const q of z.qs) {
        kinds.add(kind(q)); expect(q.e.length).toBeGreaterThan(3);
        if (kind(q) === 'mcq') { expect(q.o).toHaveLength(4); expect(q.a).toBeLessThan(4); }
        if (kind(q) === 'match') expect(q.pairs?.length).toBeGreaterThanOrEqual(2);
        if (kind(q) === 'fill') expect(q.blanks?.length).toBe(q.q.split('___').length - 1);
        if (kind(q) === 'order') expect(q.items?.length).toBeGreaterThanOrEqual(3);
        if (kind(q) === 'text') expect(q.kw?.length).toBeGreaterThan(0);
      }
    }
    expect([...kinds].sort()).toEqual(['fill', 'match', 'mcq', 'order', 'text']);
  });
  it('skills only point at existing quizzes', () => {
    const ids = new Set(qz.map((z) => z.id));
    Object.values(SKILLS).flat().forEach((id) => expect(ids.has(id)).toBe(true));
  });
});
describe('levels', () => {
  it('starts at level 1 and climbs with XP', () => { expect(levelOf(0).l).toBe(1); expect(levelOf(200).l).toBeGreaterThan(2); });
});
