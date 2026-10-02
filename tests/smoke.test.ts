// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
const click = (sel: string) => { const el = document.querySelector<HTMLElement>(sel); if (!el) throw new Error('missing ' + sel); el.click(); };
const text = () => document.body.textContent ?? '';
beforeAll(async () => {
  Object.assign(window, { matchMedia: () => ({ matches: false }), scrollTo: () => undefined });
  document.body.innerHTML = '<header id="hd"></header><main id="app"></main>';
  await import('../src/main');
});
/** Answer whatever question type is on screen, then move on. */
function answerCurrent() {
  if (document.querySelector('.opt')) click('.opt');
  else {
    document.querySelectorAll<HTMLSelectElement>('.mi').forEach((s) => { s.selectedIndex = 1; });
    document.querySelectorAll<HTMLInputElement>('.fi').forEach((i) => { i.value = 'x'; });
    const ta = document.querySelector<HTMLTextAreaElement>('#ta'); if (ta) ta.value = 'some answer';
    click('[data-a="sub"]');
  }
  click('[data-a="next"]');
}
describe('app flow', () => {
  it('shows the login page, then the learner home with a two-row collapsed grid', () => {
    expect(text()).toContain('Sign in');
    click('[data-a="demo"][data-v="learner"]');
    expect(location.pathname).toBe('/quizzes');
    expect(text()).toContain('Namaste, Rohan');
    expect(document.querySelector('#qg')?.classList.contains('collapsed')).toBe(true);
    expect(document.querySelectorAll('#qg .qc').length).toBeGreaterThanOrEqual(28);
  });
  it('plays a mixed-type quiz through to the result screen', () => {
    click('[data-a="start"][data-v="21"]');
    for (let i = 0; i < 6; i++) answerCurrent();
    expect(text()).toContain('Answer review');
    expect(document.querySelectorAll('.rev').length).toBe(6);
    click('[data-a="rate"][data-v="4"]');
    expect(document.querySelector('#st')?.textContent).toContain('★★★★☆');
  });
  it('learner pages render: insights, live join, settings with skills', () => {
    for (const v of ['ins', 'live', 'settings']) click(`nav [data-v="${v}"]`);
    expect(location.pathname).toBe('/settings');
    click('nav [data-v="ins"]'); expect(location.pathname).toBe('/insights'); click('nav [data-v="settings"]');
    expect(text()).toContain('Your skills');
    click('[data-a="skill"]');
    expect(text()).toMatch(/quizzes match your skills/);
  });
  it('admin sees the dashboard, groups, configuration and can preview as learner', () => {
    click('[data-a="logout"]'); click('[data-a="demo"][data-v="admin"]');
    expect(location.pathname).toBe('/dashboard');
    expect(text()).toContain('Organisation dashboard');
    for (const v of ['groups', 'cfg', 'make', 'live']) click(`nav [data-v="${v}"]`);
    click('[data-a="asl"]');
    expect(document.querySelector('.ban')).not.toBeNull();
    expect(text()).toContain('shuru karein');
  });
  it('signing out returns to /login, and protected pages redirect there when signed out', () => {
    click('[data-a="logout"]');
    expect(location.pathname).toBe('/login'); expect(text()).toContain('Sign in');
    history.pushState(null, '', '/dashboard'); window.dispatchEvent(new PopStateEvent('popstate'));
    expect(location.pathname).toBe('/login'); expect(text()).toContain('Sign in');
  });
  it('a shared quiz link survives login and opens that quiz', () => {
    history.pushState(null, '', '/quiz/3'); window.dispatchEvent(new PopStateEvent('popstate'));
    click('[data-a="demo"][data-v="learner"]');
    expect(location.pathname).toBe('/quiz/3'); expect(text()).toContain('Git & GitHub');
  });
});
