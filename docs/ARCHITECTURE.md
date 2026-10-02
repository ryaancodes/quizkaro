# Architecture
- `src/main.ts` – boot, theme toggle, click delegation (`data-a` / `data-v` attributes map to `actions`).
- `src/state.ts` – single in-memory store, persisted to localStorage (`qz_q`, `qz_a`, `qz_n`).
- `src/lib/adaptive.ts` – pure difficulty logic (level up after 2 correct, down on a miss).
- `src/lib/stats.ts` – leaderboard ranking and per-topic accuracy.
- `src/views/*` – one module per screen: home, quiz, result, insights, make.
- `tests/` – unit tests for the pure logic.
## Limits and next steps
Data is per-browser. A shared leaderboard needs a backend (e.g. Netlify Functions + a hosted DB). AI question generation should call an LLM API from a Netlify Function so the key stays server-side.
