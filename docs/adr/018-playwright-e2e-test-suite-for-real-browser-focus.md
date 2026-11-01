# ADR 018: Playwright E2E Test Suite for Real Browser Focus Redirection and Layout Physics Verification

- **Status:** Amended by the [MVP spec](../spec/README.md) D21: e2e becomes part of `verify` and CI.
- **Context:** Happy-dom simulates DOM trees in Node.js but does not emulate genuine browser window focus, native button activation, mouse drag/click coordinate mechanics, or Cumulative Layout Shift (CLS) during focus changes.
- **Decision:**
  - Add Playwright as a `devDependency` (`@playwright/test`) with test specs isolated under `e2e/`.
  - Add script `"e2e": "playwright test"` to `package.json`.
  - Keep `npm run verify` untouched and fast (Node/happy-dom unit tests only via `vitest`), running `e2e` separately for browser certification.
  - Fix focus-induced layout jump: reserved a fixed `h-6 -mt-4` height for the "Click to focus" indicator so blurring the input never triggers vertical recentering of flex parents, ensuring mouse click coordinates remain stable.
- **Justification:** Real browser testing pins keyboard-first autofocus, focus stealing recovery, dialog focus restoration, and cross-reload persistence under real Chromium layout and event-dispatch physics.
