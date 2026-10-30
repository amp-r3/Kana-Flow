# Kana Flow (かなフロー)

> A lightweight, keyboard-first Japanese kana speed trainer inspired by Monkeytype. Master Hiragana and Katakana with instantaneous typing feedback, dual-tier romaji matching, adaptive weak-kana weighting, and zero latency.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Max%20Strict-blue.svg)](https://www.typescriptlang.org/)
[![FSD: Verified](https://img.shields.io/badge/Architecture-Feature--Sliced%20Design-orange.svg)](https://feature-sliced.design/)
[![Bundle Budget](https://img.shields.io/badge/First%20Load-61.7%20KB%20%2F%20160%20KB-success.svg)](#performance-budgets)

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
  - Dynamically weights prompts during practice so your most frequent mistakes surface more often.
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

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher

### Installation

```bash
git clone https://github.com/amp-r3/Kana-Flow.git
cd Kana-Flow
npm ci
```

### Development Server

Start the local development server with Vite:

```bash
npm run dev
```

Open your browser to `http://localhost:5173`.

### Automated Verification Suite

Run the full verification pipeline (Typecheck + Steiger FSD Lint + Vitest Tests + Production Build + Size Budget Check):

```bash
npm run verify
```

To run individual verification gates:

```bash
npm run typecheck    # tsc --noEmit (zero any, zero as T, zero !)
npm run lint         # eslint . && steiger ./src
npm test             # vitest run (96 tests across 18 test suites)
npm run build        # vite production build
npm run budget       # check-budget.mjs (enforces first-load size caps)
```

### End-to-End Testing (Playwright)

End-to-end browser integration tests are powered by Playwright. **Note:** `npm run e2e` runs in real browser environments and is intentionally kept separate—it is **NOT** part of `npm run verify`.

To install the browser binary and run the E2E suite:

```bash
npx playwright install chromium    # One-time install of Chromium browser
npm run e2e                        # Run Playwright E2E suite against Vite dev server
```

---

## 📦 Performance Budgets

Kana Flow adheres to strict first-load asset caps. Production bundle metrics:

| Asset | Budget Limit | Actual (gzip / woff2) | Status |
|---|---|---|---|
| **Initial HTML** | $\le 5$ KB | **0.28 KB** | ✅ Passed |
| **Initial JavaScript** | $\le 35$ KB | **23.51 KB** | ✅ Passed |
| **Initial CSS** | $\le 10$ KB | **6.52 KB** | ✅ Passed |
| **Noto Sans JP Bold** | $\le 45$ KB | **16.45 KB** (woff2) | ✅ Passed |
| **JetBrains Mono Regular** | $\le 45$ KB | **14.95 KB** (woff2) | ✅ Passed |
| **Total First Load** | $\le 160$ KB | **61.71 KB** | ✅ Passed (38% of budget) |

---

## 🏛️ Architecture & Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md):** Detailed guide to architectural layers, unidirectional import boundaries, the NFA romaji state machine, two-tier spelling tables, extension recipes, and mobile input adapter seams.
- **[docs/DECISIONS.md](docs/DECISIONS.md):** Complete Architecture Decision Records (ADRs 001–017) documenting all technical design choices and plan alignments.

---

## 📄 License

- **Source Code:** [MIT License](LICENSE)
- **Typography:**
  - Noto Sans JP: [SIL Open Font License 1.1](src/assets/fonts/OFL-NotoSansJP.txt)
  - JetBrains Mono: [SIL Open Font License 1.1](src/assets/fonts/OFL-JetBrainsMono.txt)
