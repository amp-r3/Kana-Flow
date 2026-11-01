# ADR 023: Local Git Hooks Complement CI

- **Context:** Checks ran only in GitHub Actions, so failures surfaced a minute after a push. Removing CI to save Actions minutes was considered, but standard GitHub-hosted runners are free for public repositories, and CI is the only guarantee that production receives a verified build.
- **Decision:** Versioned hooks in `.githooks/`, enabled by the `prepare` script (`git config core.hooksPath .githooks`), with no new dependencies. `pre-commit` runs Prettier on staged files, then typecheck, lint and unit tests (code checks are skipped for Markdown-only commits). `pre-push` runs `npm run verify` and `npm run e2e`. CI keeps running `verify` and deploying. Playwright reuses a running dev server locally (`reuseExistingServer: !process.env.CI`).
- **Justification:** Failures are caught before they leave the machine, while CI still protects `main` and production. Prettier checks only staged files because most baseline files are not yet formatted.
