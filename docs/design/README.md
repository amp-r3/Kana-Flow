# Design system

The visual reference for Nekotype: tokens, components, logo and cat assets. [ADR 031](../adr/031-adopt-the-nekotype-design-system.md) adopted it from P2. Where it disagrees with [`docs/spec/`](../spec/README.md), the spec wins.

## Where things are

| Path                                         | Contents                                              |
| -------------------------------------------- | ----------------------------------------------------- |
| [`source/README.md`](source/README.md)       | Principles, colour, type, layout, motion, test screen |
| [`source/tokens.json`](source/tokens.json)   | All tokens                                            |
| [`source/components/`](source/components/)   | Guidelines per component, types, reference CSS and JS |
| [`source/assets/`](source/assets/)           | Logo, favicon and the `geometry` cat (ADR 031)        |
| [`source/decisions.md`](source/decisions.md) | How each design question was resolved                 |

`source/` is a verbatim export of the [private artifact](https://claude.ai/artifact/22bxWBXuofNxqfnPzuvej1), version 9. It is therefore in Russian, keeps the export's folder names, and is excluded from Prettier. It is not edited by hand: change the artifact and export again. Live previews stay in the artifact, as do the archived `line` and `silhouette` cats and the font files.

## Moving a component into the app

`bundle.js` and `bundle.css` are a React reference, not a dependency. Components are rewritten in Preact in `shared/ui` under the rules in [Frontend](../spec/frontend.md).

- **Test stream.** The reference controller marks characters, while the engine reports tokens: きゃ and a merged っち are one token. The app maps tokens to character ranges. The engine, not the controller, decides what is a skip token.
- **Fonts.** Fonts are subset by the project's own build ([ADR 032](../adr/032-font-weights-for-the-design-system.md)). The exported JetBrains Mono has no Cyrillic, although units such as `мс` use it, and no font has `←` and `→`. These glyphs, `ū`, `ō`, `é` and `✕` are added by the build ([ADR 034](../adr/034-design-tokens-and-font-build.md)). `！` and `？` are listed as skip characters but are not in the Noto subset; settle this with the content in P4.
- **Identifiers.** Row and strictness values are the engine's (`RowId`, `learner`, `ime`). `index.d.ts` documents them but is not imported.
- **Strings.** Russian and English labels in the reference are examples. All strings come from `shared/i18n`.

## Changes after ADR 058

The export (version 9) predates [ADR 058](../adr/058-learning-first.md), which made learning the core of the product: `/` is the learning screen, typing moved to `/type`, and kana are no longer a typing material. Until the artifact is updated and exported again, `source/` still shows the old structure, including the component READMEs; where it differs, this section and the spec apply.

| Component                                              | Meaning in the MVP                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `KanaChart`                                            | On `/`, a `state` mode replaces `box`: locked, learning, confident and mastered, plus a due mark, each with a marker that does not rely on colour. The tooltip gives the median answer time, the accuracy and the next review date; activating a cell shows its mixups ([Learning](../spec/learning.md)). Kana unlock one at a time, not by group. The `miss` and `time` heatmaps are not used in the MVP |
| `TestArea`, `Stat`, `ResultChart`, `PersonalBestBadge` | Typing on `/type` only, with words and phrases. `Stat` shows KPM and kana accuracy, with the difference to the average and to the personal best ([Metrics](../spec/metrics.md)); `ResultChart` is only the KPM-per-test chart on `/stats`                                                                                                                                                                 |
| `ModePanel`                                            | The material is words or phrases; there is no rows button                                                                                                                                                                                                                                                                                                                                                 |
| `RowPicker`                                            | Not used: there is no row selection                                                                                                                                                                                                                                                                                                                                                                       |
| `WeakKanaList`                                         | The kana mistyped in a typing test, without reaction time                                                                                                                                                                                                                                                                                                                                                 |
| `OptionCard`                                           | Recognition tasks of a learning session on `/`                                                                                                                                                                                                                                                                                                                                                            |
| `Nav`                                                  | Links to learn (`/`), type (`/type`), stats and settings                                                                                                                                                                                                                                                                                                                                                  |

### To redraw in the artifact

1. The learning screen on `/`: track switch, "mastered X of N", current streak, "Continue", "Review (N)" and the chart.
2. The `state` mode of `KanaChart`: four states and the due mark with their markers, the tooltip and the mixups panel.
3. A learning session: introduction, recall (the kana large, the romaji buffer, the Esc hint), recognition with `OptionCard`, progress (task n of 25), feedback after an answer; on a phone, the options stay visible above the open keyboard.
4. The session summary: unlocked kana, newly confident kana, faster and slower kana, confused kana.
5. `/stats`: the daily median answer time per track (milliseconds, lower is better), the current and best streak, mastered kana per track; the typing section with personal bests, KPM per test and history; no heatmap and no confusions.
6. Typing results: KPM with the difference to the average and to the personal best, kana accuracy, time and mistyped kana; no per-second chart, IPM, keystroke accuracy or best streak.
7. `ModePanel` without the kana material and the rows button.
8. The navigation with learn and type.
9. `/settings`: learning strictness, target answer time, sound (P6).
