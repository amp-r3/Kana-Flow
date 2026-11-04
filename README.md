# Nekotype (ねこタイプ)

> A lightweight, keyboard-first Japanese kana speed trainer inspired by Monkeytype. Master Hiragana and Katakana with instantaneous typing feedback, dual-tier romaji matching, adaptive weak-kana weighting, and zero latency.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Max%20Strict-blue.svg)](https://www.typescriptlang.org/)
[![FSD: Verified](https://img.shields.io/badge/Architecture-Feature--Sliced%20Design-orange.svg)](https://feature-sliced.design/)
[![Bundle Budget](https://img.shields.io/badge/First%20Load-94.7%20KB%20%2F%20160%20KB-success.svg)](#-performance-budgets)

---

## ✨ Features

- **⚡ Zero-Latency Typing:** Driven by an immutable Non-deterministic Finite Automaton (NFA) engine and fine-grained Preact signals. Keystrokes update without component tree re-renders.
- **🎯 Two-Tier Romaji Matching:**
  - **Strict IME Mode:** Strictly enforces official Microsoft IME / Google Japanese Input romaji keystrokes (e.g. `ti` → ち, `thi` → ティ, `who` → ウォ, `wo` → を).
  - **Learner Mode:** Accommodates intuitive learner habits (Hepburn, Kunrei, Nihon-shiki, vowel lengthening like `koohii`, and reading hints like `wa` for particle は in こんにちは).
- **🔤 Comprehensive Kana Coverage:**
  - 31 complete row sets across **Gojūon** (Basic), **Dakuten & Handakuten**, **Yōon** (Digraphs), and **Extended Katakana** (`ext_fa`, `ext_va`, `ext_wi`, `ext_ti`, `ext_che`).
  - Single Kana, Common Words, and Everyday Phrases modes.
- **🧠 Adaptive Weak-Kana Weighting:**
  - Bayesian-inspired weakness formula: $\text{weakness} = \frac{m + 1}{a + 2}$.
  - Dynamically weights prompts during practice so your most frequent mistakes surface more often. For words and phrases the weight is the mean of the weights of their kana.
- **📊 Detailed Results & Speed Charts:**
  - WPM, raw WPM, accuracy, kana/min, elapsed time, and best streak.
  - SVG speed-over-time trend line.
  - Breakdown of weakest kana during the session with canonical romaji lookup.
- **⌨️ Keyboard-First Ergonomics:**
  - Hidden input sink auto-focuses on mount and upon clicking the arena.
  - Typing any letter while a button has focus immediately refocuses and processes the key (Plan 6.2).
  - Automatic fallback for Russian Cyrillic keyboard layouts via physical `event.code` mapping.
  - Japanese IME warning notice when full-width Japanese IME is accidentally left enabled.
- **🌐 Localization:** Instant bilingual toggle between English and Russian (`en` / `ru`).
- **♿ Accessible:**
  - Native `<dialog>` modal backdrops with automatic focus restoration to opener elements.
  - Polite live regions (`aria-live="polite"`) announcing test results to screen readers.
  - Radio group semantics on segmented selectors.
  - Respects `prefers-reduced-motion` operating system settings.

---

## 🗂️ Repository Layout

A pnpm workspace ([ADR 027](docs/adr/027-pnpm-workspace-layout-for-the-monorepo.md)); packages are consumed as TypeScript source, with no build step.

| Path               | Package            | Contents                                                                                   |
| ------------------ | ------------------ | ------------------------------------------------------------------------------------------ |
| `apps/web/`        | `@nekotype/web`    | The Preact single-page app (Feature-Sliced Design), its tests, e2e tests, scripts, assets  |
| `packages/engine/` | `@nekotype/engine` | The NFA romaji engine and the kana tables; imports nothing, runs in a browser or a Worker  |
| `packages/shared/` | `@nekotype/shared` | Types (`Clock`, `Rng`, `Scheduler`, …) and runtime type guards shared with a future server |

Root scripts run the package scripts with `pnpm -r`; run one package directly with `pnpm --filter @nekotype/web run <script>`.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v24` or higher
- **pnpm**: `v10` or higher — the exact version is pinned in `packageManager` (`corepack enable` picks it up)

### Installation

```bash
git clone https://github.com/amp-r3/nekotype.git
cd nekotype
pnpm install
```

### Development Server

Start the local development server with Vite:

```bash
pnpm run dev
```

Open your browser to `http://localhost:5173`.

### Automated Verification Suite

Run the full verification pipeline (typecheck, ESLint + Steiger FSD lint, Prettier check, Vitest tests with the engine coverage threshold, production build, size budgets, Playwright e2e):

```bash
pnpm run verify
```

To run individual verification gates:

```bash
pnpm run typecheck    # tsc --noEmit (zero any, zero as T, zero !)
pnpm run lint         # eslint in every package, plus steiger ./src in apps/web
pnpm run format:check # prettier --check .
pnpm test             # vitest run in every package (engine with a coverage threshold)
pnpm run build        # vite production build into apps/web/dist
pnpm run budget       # check-budget.mjs (size budgets from the Vite manifest)
pnpm run e2e          # Playwright (Chromium)
```

Fonts are subset by hand, not in CI: `pnpm --filter @nekotype/web run fonts` downloads the pinned sources into `apps/web/scripts/font-src/` (ignored by git), checks their SHA-256 and rewrites `glyphs.txt` and the `woff2` files in `apps/web/src/assets/fonts/` (ADR 034).

### End-to-End Testing (Playwright)

End-to-end browser integration tests are powered by Playwright and run as the last step of `pnpm run verify`, locally and in CI. They need Chromium once.

To install the browser binary and run the E2E suite:

```bash
pnpm --filter @nekotype/web exec playwright install chromium    # One-time install of Chromium browser
pnpm run e2e                        # Run Playwright E2E suite against Vite dev server
```

### Git Hooks

`pnpm install --frozen-lockfile` runs the `prepare` script, which points Git at the versioned hooks in `.githooks/`. No extra dependencies are involved.

| Hook         | Runs                                                                                                               | Notes                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `pre-commit` | Line limit for `AGENTS.md`/`CLAUDE.md` (250), `prettier --check` on staged files, then `typecheck`, `lint`, `test` | Code checks are skipped when only Markdown files are staged                                                                |
| `pre-push`   | `pnpm run verify` (includes e2e)                                                                                   | Reuses a running `pnpm run dev` if there is one; needs `pnpm --filter @nekotype/web exec playwright install chromium` once |

CI still runs `verify` on every push and pull request; the hooks catch the same failures earlier. In an emergency, `git commit --no-verify` / `git push --no-verify` skips them.

---

## 📦 Performance Budgets

Nekotype adheres to strict first-load asset caps, checked by `pnpm run budget` (part of `verify`) from the Vite manifest. Figures of the current build:

| Asset                      | Budget Limit | Actual (gzip / woff2) | Status                    |
| -------------------------- | ------------ | --------------------- | ------------------------- |
| **Initial HTML**           | $\le 5$ KB   | **0.30 KB**           | ✅ Passed                 |
| **Initial JavaScript**     | $\le 35$ KB  | **26.71 KB**          | ✅ Passed                 |
| **Initial CSS**            | $\le 10$ KB  | **5.19 KB**           | ✅ Passed                 |
| **Noto Sans JP 400**       | $\le 45$ KB  | **20.77 KB** (woff2)  | ✅ Passed                 |
| **JetBrains Mono 400/500** | $\le 45$ KB  | **10.66 / 10.69 KB**  | ✅ Passed                 |
| **Golos Text 400/500**     | $\le 45$ KB  | **9.38 / 9.55 KB**    | ✅ Passed                 |
| **Logo (SVG)**             | counted      | **1.45 KB**           | ✅ Passed                 |
| **Total First Load**       | $\le 160$ KB | **94.69 KB**          | ✅ Passed (59% of budget) |
| **Lazy content chunk**     | $\le 40$ KB  | **2.05 KB** (largest) | ✅ Passed                 |
| **Lazy route chunk**       | $\le 25$ KB  | none yet              | —                         |

---

## ☁️ Deployment

Nekotype is a fully static SPA (`apps/web/dist/`, no backend, state in `localStorage`) and ships to **Cloudflare Pages** at the domain root, so `VITE_BASE` stays at its default `/`.

**Production:** <https://nekotype.pages.dev> · **Previews:** one URL per pull request.

### CI/CD Pipeline

`.github/workflows/deploy.yml` runs on every push to `main` and on every pull request:

1. `pnpm install --frozen-lockfile` → `pnpm run verify` (typecheck + lint + Prettier + unit tests with coverage + build + size budget + e2e on Chromium). Any failure blocks the deploy.
2. `wrangler pages deploy apps/web/dist` — pushes to `main` go to production, PRs get a preview deployment. Fork PRs verify but never deploy, since they cannot read secrets.

### One-Time Setup

1. Create the Pages project (the workflow also does this automatically on first run):
   ```bash
   pnpm dlx wrangler pages project create nekotype --production-branch=main
   ```
   Check that the project got exactly `nekotype.pages.dev` (no random suffix): `pnpm dlx wrangler pages project list`.
2. Copy **Account ID** from the Cloudflare dashboard → _Workers & Pages_ → _Overview_.
3. Create an API token with the **Cloudflare Pages — Edit** permission (_My Profile_ → _API Tokens_).
4. Add repository secrets under _Settings_ → _Secrets and variables_ → _Actions_:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
5. Push to `main` (or run the _Deploy_ workflow manually via `workflow_dispatch`).

A custom domain can be attached later in _Workers & Pages_ → _nekotype_ → _Custom domains_; no rebuild or code change is required.

### Manual Deploy

```bash
pnpm run verify                     # guarantees a passing build + budget
pnpm dlx wrangler pages deploy apps/web/dist --project-name nekotype --branch=main
```

### Caching & Headers

`apps/web/public/_headers` is copied into `apps/web/dist/` verbatim and served by Cloudflare Pages:

| Path          | Policy                                                                                                  | Why                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `/assets/*`   | `max-age=31536000, immutable`                                                                           | Vite emits content-hashed filenames, so a URL's bytes never change |
| `/index.html` | `max-age=0, must-revalidate`                                                                            | New deploys must be picked up immediately                          |
| `/*`          | `nosniff`, `strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, restrictive `Permissions-Policy` | Baseline hardening                                                 |

No `_redirects` file is needed, because there is no client-side router. A `404.html` **is** needed though: without it Cloudflare Pages answers every unknown path — including `/assets/typo.js` — with `index.html` and a `200`, which then gets cached as `immutable` under `/assets/*`. `apps/web/public/404.html` is a self-contained page (no extra requests) that turns misses into real `404`s.

---

## 🏛️ Architecture & Documentation

- **[docs/README.md](docs/README.md):** Documentation index — where to find each topic.
- **[docs/spec/](docs/spec/README.md):** MVP specification, one file per area. Normative.
- **[docs/adr/](docs/adr/README.md):** Architecture decision records, one file per decision.
- **[docs/architecture/baseline-v1.md](docs/architecture/baseline-v1.md):** Architecture of the current v1 code: layers, import boundaries, the NFA romaji engine, two-tier spelling tables, extension recipes.
- **[AGENTS.md](AGENTS.md):** Rules for AI coding agents (`CLAUDE.md` is a symlink to it).

---

## 📄 License

- **Source Code:** [MIT License](LICENSE)
- **Typography:**
  - Noto Sans JP: [SIL Open Font License 1.1](apps/web/src/assets/fonts/OFL-NotoSansJP.txt)
  - JetBrains Mono: [SIL Open Font License 1.1](apps/web/src/assets/fonts/OFL-JetBrainsMono.txt)
  - Golos Text: [SIL Open Font License 1.1](apps/web/src/assets/fonts/OFL-GolosText.txt)
