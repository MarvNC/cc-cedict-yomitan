import 'fake-indexeddb/auto';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
// Usage: YOMITAN_ROOT=/path/to/extracted/release node roundtrip.mjs dictionary.zip
// Or: node roundtrip.mjs dictionary.zip /path/to/extracted/release
const archive = process.argv[2];
const rootArgument = process.argv[3] ?? process.env.YOMITAN_ROOT;
if (!archive || !rootArgument) {
  console.error(
    'Usage: YOMITAN_ROOT=/path/to/extracted/release node roundtrip.mjs dictionary.zip [release-directory]',
  );
  process.exit(2);
}
const root = path.resolve(rootArgument);
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'),
);
const yomitanVersion = manifest.version;
assert.equal(
  manifest.name,
  'Yomitan Popup Dictionary',
  'Expected an extracted official Yomitan release',
);
globalThis.self = new (class Window {})();
// Database.prepare creates a worker solely for offloaded image drawing. This test
// never invokes image rendering; all import, storage and query code is original.
globalThis.Worker = class {
  addEventListener() {}
  terminate() {}
};
const { configure, ZipReader, Uint8ArrayReader, TextWriter } = await import(
  pathToFileURL(root + '/lib/zip.js')
);
configure({ useWebWorkers: false });
const { DictionaryImporter } = await import(
  pathToFileURL(root + '/js/dictionary/dictionary-importer.js')
);
const { DictionaryDatabase } = await import(
  pathToFileURL(root + '/js/dictionary/dictionary-database.js')
);
const buffer = fs.readFileSync(archive);
const zip = new ZipReader(new Uint8ArrayReader(new Uint8Array(buffer)));
const entries = await zip.getEntries();
const index = JSON.parse(
  await entries
    .find((x) => x.filename === 'index.json')
    .getData(new TextWriter()),
);
const terms = [];
const kanji = [];
let kanjiTotal = 0;
const probes = new Set([
  '測試',
  '测试',
  '電腦',
  '电脑',
  '中國',
  '中国',
  '你好',
  '學習',
  '学习',
  '𰻞',
  '重慶',
  '重庆',
  '乾',
  '干',
]);
let total = 0;
for (const entry of entries.filter((x) =>
  /^term_bank_\d+\.json$/.test(x.filename),
)) {
  const rows = JSON.parse(await entry.getData(new TextWriter()));
  total += rows.length;
  for (const row of rows) if (probes.has(row[0])) terms.push(row);
  // Cover every bank boundary plus a representative midpoint.
  for (const i of new Set([0, Math.floor(rows.length / 2), rows.length - 1]))
    if (rows[i]) terms.push(rows[i]);
}
for (const entry of entries.filter((x) =>
  /^kanji_bank_\d+\.json$/.test(x.filename),
)) {
  const rows = JSON.parse(await entry.getData(new TextWriter()));
  kanjiTotal += rows.length;
  for (const row of rows) if (probes.has(row[0])) kanji.push(row);
  for (const i of new Set([0, Math.floor(rows.length / 2), rows.length - 1]))
    if (rows[i]) kanji.push(rows[i]);
}
await zip.close();
console.log(
  JSON.stringify({
    phase: 'start',
    archive: path.basename(archive),
    total,
    kanjiTotal,
    probes: terms.length + kanji.length,
  }),
);
const db = new DictionaryDatabase();
await db.prepare();
const importer = new DictionaryImporter({
  getImageDetails() {
    throw new Error('Unexpected image media');
  },
  getImageResolution() {
    throw new Error('Unexpected image media');
  },
});
const start = Date.now();
const { result, errors } = await importer.importDictionary(
  db,
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  { prefixWildcardsSupported: true, yomitanVersion },
);
assert.deepEqual(errors, []);
assert.ok(result.importSuccess);
assert.equal(result.counts.terms.total, total);
assert.equal(result.counts.kanji.total, kanjiTotal);
const info = await db.getDictionaryInfo();
assert.equal(info.length, 1);
assert.equal(info[0].title, index.title);
const storedCounts = await db.getDictionaryCounts([index.title], true);
assert.equal(storedCounts.total.terms, total);
assert.equal(storedCounts.total.kanji, kanjiTotal);
assert.equal(storedCounts.counts[0].terms, total);
assert.equal(storedCounts.counts[0].kanji, kanjiTotal);
const dictionaries = new Set([index.title]);
let matched = 0,
  structured = 0;
for (const row of terms) {
  const found = await db.findTermsExactBulk(
    [{ term: row[0], reading: row[1] }],
    dictionaries,
  );
  const match = found.find(
    (x) =>
      x.sequence === row[6] &&
      JSON.stringify(x.definitions) === JSON.stringify(row[5]),
  );
  assert.ok(
    match,
    `Exact roundtrip mismatch: ${row[0]} / ${row[1]} / ${row[6]}`,
  );
  assert.deepEqual(match.definitions, row[5]);
  if (
    row[5].some((x) => typeof x === 'object' && x.type === 'structured-content')
  )
    structured++;
  matched++;
}
for (const row of kanji) {
  const found = await db.findKanjiBulk([row[0]], dictionaries);
  const match = found.find(
    (x) =>
      JSON.stringify(x.definitions) === JSON.stringify(row[4]) &&
      JSON.stringify(x.stats) === JSON.stringify(row[5]),
  );
  assert.ok(match, `Kanji roundtrip mismatch: ${row[0]}`);
  assert.deepEqual(match.definitions, row[4]);
}
if (kanji.length) {
  assert.equal(
    (await db.findKanjiBulk(['zzzzNO_SUCH_TERM_827704'], dictionaries)).length,
    0,
  );
  assert.equal(
    (await db.findKanjiBulk([kanji[0][0]], new Set(['NOT_IMPORTED']))).length,
    0,
  );
}
const lookupWords = [...new Set(terms.map((x) => x[0]))].slice(0, 25);
const bulk = await db.findTermsBulk(lookupWords, dictionaries, 'exact');
for (let i = 0; i < lookupWords.length; i++)
  assert.ok(
    bulk.some((x) => x.index === i),
    `Word lookup missing ${lookupWords[i]}`,
  );
assert.equal(
  (await db.findTermsBulk(['zzzzNO_SUCH_TERM_827704'], dictionaries, 'exact'))
    .length,
  0,
);
assert.equal(
  (
    await db.findTermsBulk(
      [terms[0]?.[0] ?? kanji[0]?.[0] ?? 'zzzzNO_SUCH_TERM_827704'],
      new Set(['NOT_IMPORTED']),
      'exact',
    )
  ).length,
  0,
);
const duplicate = await importer.importDictionary(
  db,
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  { prefixWildcardsSupported: true, yomitanVersion },
);
assert.equal(duplicate.result, null);
assert.equal(duplicate.errors.length, 1);
const report = {
  yomitanVersion,
  nodeVersion: process.version,
  archiveSha256: createHash('sha256').update(buffer).digest('hex'),
  archive: path.basename(archive),
  title: index.title,
  totalImported: total + kanjiTotal,
  kanjiRoundtripAssertions: kanji.length,
  exactRoundtripAssertions: matched,
  structuredContentRoundtrips: structured,
  bulkExactLookupWords: lookupWords.length,
  negativeLookup: true,
  dictionaryIsolation: true,
  duplicateRejected: true,
  elapsedSeconds: (Date.now() - start) / 1000,
  counts: result.counts,
  storedCounts,
  errors: [],
};
// stdout is JSON Lines: one start event followed by the final report.
// Redirect it to a file when a persistent report is desired.
console.log(JSON.stringify(report));
await db.close();
