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
