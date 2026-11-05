# ADR 044: Kana Row Names Are Romaji

- **Status:** In force. Amends the row-names item of the "Interface" rule in `docs/spec/frontend.md`.
- **Context:** The spec said row names come from the i18n dictionaries. PR #29 left them as the romaji labels of the kana table (`rows-dialog.tsx`) and noted it in the PR description, but neither the spec nor an ADR recorded the choice, so the code disagreed with the spec.
- **Decision:** Row names are the romaji labels from the kana table (`k`, `s`, `ky`, ...), identical in every interface language. They are not in the dictionaries. The rule that all other user-visible strings come from `shared/i18n` is unchanged.
- **Justification:** A row is identified by its romaji syllables, which is what the user types; translating it would add no information and would require a second name for every row in every language. The sample kana shown beside it already carries the Japanese form.
