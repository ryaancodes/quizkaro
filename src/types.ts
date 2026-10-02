export type Kind = 'mcq' | 'match' | 'fill' | 'order' | 'text';
export interface Question {
  q: string; o: string[]; a: number; e: string; t: string; d: number;
  k?: Kind; img?: string; pairs?: [string, string][]; items?: string[]; blanks?: string[]; kw?: string[];
}
export interface Quiz { id: number; title: string; time: number; qs: Question[]; icon?: string; cat?: string }
export interface Answered extends Question { ok: boolean; pa: string; ca: string }
export interface Attempt { q: number; n: string; pts: number; c: number; tot: number; sec: number; log: { t: string; ok: boolean }[]; ts?: number }
export interface User { name: string; email: string; pw: string; role: 'admin' | 'learner'; skills: string[]; secs: number; joined: number }
export interface Group { id: number; name: string; members: string[]; quizzes: number[] }
export interface Rating { q: number; n: string; s: number }
export interface Config {
  minutes: number; perQ: number; maxQ: number; maxWords: number; shuffle: boolean; showExp: 'instant' | 'end';
  pass: number; adaptive: boolean; retries: number; liveSecs: number; showLb: boolean;
}
