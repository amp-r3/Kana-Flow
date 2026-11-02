# ADR 027: pnpm Workspace Layout for the Monorepo

- **Status:** In force.
- **Context:** The spec (`docs/spec/architecture.md`) targets `apps/*` and `packages/*`. P0 moves the baseline there without changing behaviour, and later phases add `apps/api` and more packages.
- **Decision:**
  - `pnpm-workspace.yaml` lists `apps/*` and `packages/*`. The baseline moves unchanged to `apps/web` (package `@nekotype/web`); only paths and configuration change.
  - Tooling is declared per package: each package has its own scripts and its own `tsconfig.json`, ESLint config and test config. The root keeps only Prettier, the shared base configs (`tsconfig.base.json`, `eslint.base.js` with `createBaseConfig`) and orchestration scripts that run `pnpm -r --if-present run <script>`.
  - Workspace packages are consumed as TypeScript source (`exports` points at `.ts` files); there is no package build step. Vite, Vitest and tsx compile them.
  - The deploy artifact is `apps/web/dist`; `functions/` will live at the repository root.
- **Justification:** Per-package tooling keeps relative paths and `process.cwd()`-based tests and scripts working unchanged, and lets each package set its own strictness (the engine gets no DOM types). Source-only packages avoid a build graph and keep Vite's HMR and tests simple. Alternative rejected: root-level tooling with workspace-wide configs, which would have required rewriting paths in every script and test in the same step as the move.
