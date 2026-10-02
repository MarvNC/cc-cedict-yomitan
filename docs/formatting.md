# Definition formatting

The converter renders CC-CEDICT's existing editorial notation using Yomitan
structured content. It does not infer parts of speech, add translations, or
reorganize meanings by guessed categories.

- Slash-delimited entries become separate numbered senses (one sense uses a
  bullet). Semicolon-delimited glosses stay together in their original order.
- Explicit usage labels have small outlined badges. The conservative allowlist
  leaves unknown labels and explanatory parentheses as ordinary text.
- Chinese references have separate traditional/simplified internal lookup links.
  Bracketed pronunciation stays visible beside the reference in smaller type.
  Missing target entries are possible in CC-CEDICT; links do not promise a
  match.
- `CL:` is retained and highlighted, with a classifier/measure-word tooltip.
- Pronunciation notes such as `Taiwan pr.` and `also pr.` are highlighted while
  preserving their original wording and the existing `alt-pronunciation` data.
- No fixed foreground/background colors are used, so light/dark themes inherit
  the reader's colors. English definitions are marked `en`; Chinese links retain
  `zh`, `zh-Hant`, or `zh-Hans` language metadata.

## Source formats and fallbacks

Both v1 `[pin1 yin1]` and v2 `[[pin1yin1]]` readings are accepted, even in a
mixed file. Numbered syllables are converted individually, preserving v2 word
spacing, capitalization, hyphens, literal Latin text, unknown syllables, and
punctuation. Joined pinyin adds apostrophes before a/e/o; neutral erhua `r5`
becomes `r`. Grouping braces and unpronounced placeholders are retained. Unknown
bracketed material is not interpreted as pronunciation.

Hanzi meanings remain plain strings because the kanji-bank format does not
support structured definitions. CC-Canto keeps its source definitions and
Jyutping unchanged (including entries with empty Mandarin readings); comments
following a completed entry are ignored. CC-CEDICT Canto shares the richer
Mandarin definitions with its existing Jyutping readings.

## Research and design choices

Primary format references:

- [CC-CEDICT v1 syntax](https://cc-cedict.org/wiki/syntax)
- [CC-CEDICT v2 syntax](https://cc-cedict.org/wiki/syntax_v2)
- [Reference wording and semantics](https://cc-cedict.org/wiki/references)
- [Editorial labels](https://cc-cedict.org/wiki/labels)
- [Yomitan structured-content schema](https://github.com/yomidevs/yomitan/blob/master/ext/data/schemas/dictionary-term-bank-v3-schema.json)

MDBG's live
[麵包 entry](https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=麵包)
shows slash-separated glosses and clickable classifier references. This
implementation adapts those relationships to Yomitan's internal dictionary
links, rather than sending readers to MDBG. Always-visible reference readings,
numbered senses, and theme-neutral label badges are deliberate Yomitan design
choices; they are not claims that CC-CEDICT supplies additional semantic data.

## Development checks

Run `bun install`, `bun test`, and `bun run typecheck`. Run `bun run fetch` and
`bun run start` to exercise all five complete dictionary builds. Regression
fixtures cover v1/v2, mixed-script and non-BMP references, classifier and
pronunciation notation, parenthetical prose, unknown material, malformed input,
plain Hanzi output, and CC-Canto compatibility.
