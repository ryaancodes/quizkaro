# QuizKaro

Adaptive quiz app: teachers build quizzes, students take timed attempts and get instant scores, explanations, a leaderboard and a weak-topic report. Vite + TypeScript + Tailwind, no backend (data lives in the browser's localStorage).

## Run
```bash
npm install
npm run dev      # local dev server
npm test         # unit tests (vitest)
npm run build    # type-check + production build to dist/
```

## Deploy on Netlify
Push to GitHub, then *Add new site → Import from Git*. `netlify.toml` already sets `npm run build` and publish dir `dist`. Every push to the main branch redeploys automatically.

## Features
Timer with auto-submit, one question per screen, difficulty that adapts to streaks, colour feedback, explanations, score chart, leaderboard, weak-topic report, dark/light mode, mobile layout.

See `docs/ARCHITECTURE.md` for how the code is organised.

## DevOps coverage (Expt 1–8)
Full table and demo steps: [`docs/EXPERIMENTS.md`](docs/EXPERIMENTS.md). Agile plan: [`docs/AGILE.md`](docs/AGILE.md). Full stack locally: `docker compose up --build`.

## Accounts and features
Demo accounts (data is stored in the browser): **admin** `admin@acme.com` / `admin123`, **learner** `rohan@acme.com` / `learner123` (also priya, kabir, ananya, dev, sara, vikram, meera `@acme.com`, same password).
- Learners: 28 quizzes, five question types (multiple choice, match, fill in the blanks, drag to order, free text) plus images, skills-based picks, ratings, share links, live group quizzes, weak-topic report, PDF/CSV/Excel report.
- Admins: dashboard with every learner's report, groups (import learners, assign quizzes), configuration (duration, word limit, pass mark, attempts…), quiz creator with learner-view preview, live quiz host.

## Pages and URLs
Each page has its own address: `/login`, `/quizzes`, `/insights`, `/live`, `/settings` (learner) and `/dashboard`, `/create`, `/groups`, `/configuration` (admin). Shared quizzes use `/quiz/<id>`. Opening the site without a sign-in in that tab always shows `/login`. `netlify.toml` redirects every path to `index.html` so deep links and refreshes work.
# quizkaro
