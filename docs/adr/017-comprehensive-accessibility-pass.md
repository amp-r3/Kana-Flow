# ADR 017: Comprehensive Accessibility Pass

- **Context:** Ensure keyboard-first ergonomics, screen reader transparency, and respect for operating system motion preferences.
- **Decision:**
  - **Native Modal Dialog Focus Restoration:** `Dialog` records `document.activeElement` when opened and automatically restores focus to that exact opener element on close (both via close button and Escape key).
  - **Polite Live Region:** `ResultsPanel` includes an `aria-live="polite"` element with `aria-atomic="true"` announcing test speed, accuracy, prompts completed, and mistakes to assistive technologies.
  - **Segmented Radio Group Semantics:** `Segmented` control uses `role="radiogroup"` with individual options bearing `role="radio"` and dynamic `aria-checked` attributes.
  - **Reduced Motion Support:** `@media (prefers-reduced-motion: reduce)` disables shake animations and transitions across all elements.
- **Justification:** Conforms to WCAG 2.1 AA keyboard navigation and accessibility standards.
