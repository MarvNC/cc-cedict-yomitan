# Static formatting previews

These are **document-engine previews, not browser or installed-extension screenshots**. Each image includes that label.

| Preview | Coverage |
| --- | --- |
| [Classifier references, light](01-bank-light.png) | 銀行: original bullets, classifier badge, linked paired forms with ruby pinyin |
| [Contraction, dark](02-contraction-dark.png) | 甭: contraction link, separate readings, usage badge |
| [Multiple readings, light](03-readings-light.png) | 泡: independent reading entries and original bullet density |
| [Rare characters, dark](04-rare-character-dark.png) | 鱇: traditional/simplified forms and non-BMP reference text |

## Source and method

- Source renderer: [official Yomitan 26.9.8.0 release](https://github.com/yomidevs/yomitan/releases/tag/26.9.8.0), `js/display/structured-content-generator.js`.
- The original `StructuredContentGenerator` and its dependencies were bundled without source edits using esbuild. It ran in jsdom against unchanged before/after generated dictionary rows.
- Original Yomitan `material.css`, `display.css`, and `structured-content.css` styled the glossary DOM, with the document-only ruby placement override described below. Outer comparison panels, entry headings, and explanatory labels are fixture UI.
- WeasyPrint 70.0 laid out the resulting HTML. Because it lacks native ruby layout, an explicitly document-only CSS shim uses inline-block positioning to place `rt` above its base. The actual `ruby`/`rt` DOM remains unchanged; the shim is not converter output. Every image labels ruby layout as an approximation. Poppler rasterized each single-page PDF to PNG. PDFs and the large offline fixture are deliberately not checked in.
- The two QA archives contain the same 32 selected dictionary rows before/after. A separate fixture bank supplies 26 unchanged rows from the full after dictionary for the 20 referenced target headwords.

## Checks and limitations

[renderer-assertions.json](renderer-assertions.json) records actual renderer checks across all 32 after rows / 23 headwords, plus resolution of all 20 unique reference queries to generated dictionary rows. Checks cover original bullet lists with no added list/item styles, glossary language, 65 ruby/rt nodes, internal anchor attributes, query encoding, and target availability. Link navigation is adapted to fixture queries; this is **not an actual browser click or extension-navigation test**.

The managed environment explicitly blocked extension installation and both HTTP/local-file browser previews. No policy was disabled or bypassed. Consequently these images do not establish Chromium layout, extension popup scanning, saved settings, browser IndexedDB behavior, or Anki integration. Document-engine layout can differ from Chromium, particularly ruby line metrics. The fixture uses the official default line-height ratio (20/14); the previous fixture's 1.65 override was removed. The previous converter's extra list top margin and per-item bottom margins were also removed, rather than attributing their effect to ordered-list browser defaults.

Importer validation is separate from these images: the official Yomitan importer/database roundtrip tests are documented elsewhere in this PR. The previews must not be described as proof that a dictionary was installed in a browser.
