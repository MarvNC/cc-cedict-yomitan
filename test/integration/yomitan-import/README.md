# Yomitan importer/database integration test

This optional test runs the actual importer and database code from an extracted
[official Yomitan release](https://github.com/yomidevs/yomitan/releases). Upstream
code and dictionary archives are not bundled. It is independent of the converter's
Bun unit tests and dependencies.

## Run

Requirements: Node.js 24+, npm, generated dictionary ZIPs, and an extracted Yomitan
release directory containing `manifest.json`, `js/`, and `lib/`. Tested with Yomitan
26.9.8.0. Its version is read from the supplied manifest, not hard-coded.

From this directory:

```sh
npm ci
YOMITAN_ROOT=/path/to/extracted/yomitan npm test -- /path/to/CC-CEDICT.zip
```

Alternatively, pass the release directory as the second positional argument:

```sh
npm test -- /path/to/CC-CEDICT.zip /path/to/extracted/yomitan
```

Run each archive in a fresh process so dictionaries cannot contaminate one another
and memory is released between imports:

```sh
export YOMITAN_ROOT=/path/to/extracted/yomitan
for archive in /path/to/generated/dictionaries/*.zip; do
  node --max-old-space-size=6144 roundtrip.mjs "$archive" || exit "$?"
done
```

A failing assertion exits nonzero. Direct `node` invocation emits JSON Lines: one
start event and a final report. Redirect stdout to save results. Reports include
archive SHA-256, release/runtime versions, stored counts, and assertion counts.
No files are written by the harness.

## Coverage

- Import every row through the release's `DictionaryImporter`, bundled ZIP reader,
  and compiled schema validators; require zero errors and successful completion
- Check importer counts and actual `DictionaryDatabase` counts
- Query exact term+reading combinations and compare complete structured-content
  objects against the source ZIP
- Query Hanzi-format entries and compare definitions and statistics
- Sample first/middle/last entries of every bank plus selected common traditional
  and simplified words
- Check bulk exact word lookup, missing terms, dictionary isolation, and rejection
  of duplicate imports

## Runtime boundary

`fake-indexeddb` implements IndexedDB in memory. A Window-named `self` selects
Yomitan's main-thread database setup. A no-op `Worker` stands in only for the unused
image-drawing worker; media loading intentionally throws if encountered. ZIP web
workers are disabled through its public configuration API. Yomitan source files
are not modified.

This tests importer/storage/query compatibility for these text dictionaries. It
does **not** test native browser persistence, extension activation, popup input,
image rendering, or visual layout. Future Yomitan releases can change internal APIs
and may require harness updates. See [the compact recorded result](../../../docs/validation/yomitan-import-26.9.8.json)
from the five complete validation archives.
