import express from 'express';
import mysql from 'mysql2/promise';
const app = express();
app.use(express.json({ limit: '50kb' }));
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db', user: process.env.DB_USER || 'quizly',
  password: process.env.DB_PASSWORD || 'quizly', database: process.env.DB_NAME || 'quizly', connectionLimit: 5,
});
let requests = 0, saved = 0;
app.use((_req, _res, next) => { requests++; next(); });
app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true }); } catch { res.status(503).json({ ok: false }); }
});
app.post('/api/attempts', async (req, res) => {
  const { quiz, name, pts, correct, total, seconds } = req.body ?? {};
  if (!Number.isInteger(quiz) || typeof name !== 'string' || !name.trim() || ![pts, correct, total, seconds].every(Number.isFinite))
    return res.status(400).json({ error: 'invalid attempt' });
  await pool.execute('INSERT INTO attempts (quiz_id, player, points, correct, total, seconds) VALUES (?,?,?,?,?,?)',
    [quiz, name.trim().slice(0, 24), pts, correct, total, seconds]);
  saved++; res.status(201).json({ ok: true });
});
app.get('/api/leaderboard/:quiz', async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT quiz_id AS q, player AS n, points AS pts, correct AS c, total AS tot, seconds AS sec FROM attempts WHERE quiz_id = ? ORDER BY points DESC, seconds ASC LIMIT 5',
    [Number(req.params.quiz)]);
  res.json(rows);
});
// Prometheus text format (Expt 7)
app.get('/metrics', (_req, res) => {
  res.type('text/plain').send(
    `# TYPE quizly_http_requests_total counter\nquizly_http_requests_total ${requests}\n` +
    `# TYPE quizly_attempts_saved_total counter\nquizly_attempts_saved_total ${saved}\n`);
});
app.listen(3000, () => console.log('QuizKaro API on :3000'));
