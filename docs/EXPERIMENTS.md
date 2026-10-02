# Experiment coverage
| Expt | Topic | Where in this repo | Demo |
|---|---|---|---|
| 1 | Version control with Git | `CONTRIBUTING.md`, `.github/pull_request_template.md`, `.gitignore` | Create `feature/QZ-n-…`, push, open a PR |
| 2 | Containerise with Docker | `Dockerfile`, `nginx.conf`, `server/Dockerfile` | `docker build -t quizly-web .` |
| 3 | Docker Compose, multi-service | `docker-compose.yml` (web, API, MySQL, phpMyAdmin, Prometheus, Grafana) | `docker compose up --build` |
| 4 | Jenkins | `Jenkinsfile` (install, lint, test, build) | Create a Pipeline job from SCM |
| 5 | Automated deployment with GitHub/Jenkins | `Jenkinsfile` deploy stage (Netlify CLI), GitHub webhook | Push to `main`, watch the job deploy |
| 6 | Agile with Jira + GitHub Actions | `docs/AGILE.md`, `.github/workflows/ci.yml` | Move a story to Done, show the green run |
| 7 | Monitoring with Prometheus/Grafana | `monitoring/`, API `/metrics` | Grafana at :3001, query `quizly_attempts_saved_total` |
| 8 | AWS CodePipeline | `buildspec.yml` | See below |

## Local URLs after `docker compose up --build`
App http://localhost:8080 · API http://localhost:3000/api/health · phpMyAdmin http://localhost:8081 (server `db`, user `quizly`) · Prometheus http://localhost:9090 · Grafana http://localhost:3001 (admin/admin).
The shared leaderboard uses MySQL through the API. On Netlify the API is absent, so the app falls back to the per-browser leaderboard.

## Jenkins setup (Expt 4/5)
Add credentials `netlify-token` and `netlify-site-id` (secret text), create a Pipeline job from this repo, and add a GitHub webhook to `<jenkins-url>/github-webhook/`.

## AWS CodePipeline (Expt 8)
1. Create an S3 bucket with static website hosting.
2. CodePipeline → Source: GitHub (via connection), branch `main`.
3. Build: CodeBuild project (Ubuntu, Node 20 image) using `buildspec.yml`.
4. Deploy: Amazon S3, target bucket, tick "Extract file before deploy".
5. Push a small change (e.g. a new accent colour in `src/style.css`) and watch the pipeline update the site.
