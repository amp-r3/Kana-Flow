# ADR 026: pnpm as the Package Manager

- **Context:** The spec (`docs/spec/architecture.md`) targets a pnpm monorepo, but the baseline was on npm, so P0 would have changed the package manager and the repository layout in one step. npm 10 vs 11 lockfile mismatches had also already broken CI.
- **Decision:** The baseline moves to pnpm now. `packageManager` in `package.json` pins the exact version, CI installs it through `pnpm/action-setup`, and the lockfile is `pnpm-lock.yaml`. `pnpm-workspace.yaml` only lists `onlyBuiltDependencies` (`esbuild`); workspaces still arrive in P0. Git hooks, Playwright and CI use `pnpm run` / `pnpm exec` / `pnpm dlx`.
- **Justification:** P0 then only restructures packages. A pinned manager removes the lockfile-version drift. Alternative rejected: staying on npm until P0 (a second migration with no benefit).
