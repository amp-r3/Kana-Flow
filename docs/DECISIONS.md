# Architecture Decisions Record (DECISIONS.md)

### ADR 001: Preact and @preact/signals
- **Context:** Need Monkeytype-level instant keystroke response while keeping JS bundle ≤ 35 KB gzip.
- **Decision:** Use Preact with `@preact/signals`.
- **Justification:** Preact weighs ~4 KB gzip, and signals allow bypass of component tree re-renders for ultra-low latency keystroke updates.

### ADR 002: Tailwind CSS v4 CSS-First Configuration
- **Context:** Fast styling, small CSS bundle (≤ 10 KB limit), dynamic semantic tokens.
- **Decision:** Use `@tailwindcss/vite` with `@theme inline` mapping CSS variables from `shared/styles/tokens.css`.
- **Justification:** Eliminates `tailwind.config.ts`, leverages CSS variables for instant theme switching without runtime CSS-in-JS.

### ADR 003: Steiger for FSD Architecture Enforcement
- **Context:** Enforce strict Feature-Sliced Design layer hierarchy, public API boundaries, and prevent same-layer slice imports.
- **Decision:** Integrate `steiger` directly into `npm run lint` (`eslint . && steiger ./src`).
- **Justification:** Steiger is the official FSD linter, catching layer violations and unexported segment sidesteps reliably without complex AST resolver configurations.

### ADR 004: Node-based Font Subsetting (`subset-font`)
- **Context:** Self-hosted kana and UI fonts must meet ≤ 45 KB per woff2 limit without requiring a Python environment.
- **Decision:** Use `subset-font` in `scripts/subset-fonts.mjs` as a devDependency.
- **Justification:** Keeps all build/tooling within the Node/npm toolchain.

### ADR 005: Extended Katakana Row Prefix (`ext_`)
- **Context:** Avoid ID collisions between Gojūon rows and extended Katakana rows.
- **Decision:** Prefix all 5 extended katakana rows with `ext_` (`ext_fa`, `ext_va`, `ext_wi`, `ext_ti`, `ext_che`).
- **Justification:** Guarantees uniqueness across persistent row sets and clear identification.
