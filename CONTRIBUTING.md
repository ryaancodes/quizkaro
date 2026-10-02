# Contributing
Branches: `main` (deployed) ← `develop` ← `feature/QZ-<n>-short-name`.
1. `git checkout -b feature/QZ-4-timer develop`
2. Commit small and often, prefixing the Jira key: `QZ-4 add auto-submit on timeout`
3. `git push -u origin feature/QZ-4-timer`, then open a pull request into `develop` (template is pre-filled).
4. CI (GitHub Actions) must pass and one teammate must review before merging.
5. At the end of a sprint, merge `develop` into `main`; Netlify and the pipelines redeploy.
