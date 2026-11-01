# ADR 001: Preact and @preact/signals

- **Context:** Need Monkeytype-level instant keystroke response while keeping JS bundle ≤ 35 KB gzip.
- **Decision:** Use Preact with `@preact/signals`.
- **Justification:** Preact weighs ~4 KB gzip, and signals allow bypass of component tree re-renders for ultra-low latency keystroke updates.
