import { existsSync } from 'fs';
import { join } from 'path';
import { Dictionary, DictionaryIndex } from 'yomichan-dict-builder';
import {
  CC_CEDICT_FILE_NAME,
  CC_CEDICT_CANTO_READINGS_FILE_NAME,
  BUILD_DIR,
  DATA_DIR,
  TERM_ZIP_NAME,
  HANZI_ZIP_NAME,
  TERM_INDEX_NAME,
  HANZI_INDEX_NAME,
  ZHUYIN_ZIP_NAME,
  ZHUYIN_INDEX_NAME,
  CANTO_ZIP_NAME,
  CANTO_INDEX_NAME,
} from './config';
import { processLine } from './dictionaryUtils';
import { parseComments } from './fileUtils';
import { parseCantoReadings } from './parseCantoReadings';

async function main() {
  // Check for file existence
  const ccCedictFilePath = join(process.cwd(), DATA_DIR, CC_CEDICT_FILE_NAME);
  const ccCedictCantoReadingsFilePath = join(
    process.cwd(),
    DATA_DIR,
    CC_CEDICT_CANTO_READINGS_FILE_NAME
  );
  if (!existsSync(ccCedictFilePath)) {
    throw new Error(
      `File not found: ${ccCedictFilePath}. Please run fetch-cedict.sh first to download the file.`
    );
  }
  if (!existsSync(ccCedictCantoReadingsFilePath)) {
    throw new Error(
      `File not found: ${ccCedictCantoReadingsFilePath}. Please run fetch-cedict.sh first to download the file.`
    );
  }

  // Read file
  const ccCedictFile = Bun.file(ccCedictFilePath);
  const ccCedictLines = (await ccCedictFile.text()).split('\n');

  // Parse comments
  const { creationDateClean } = parseComments(ccCedictLines);
  console.log(`Creation date: ${creationDateClean}`);

  // Parse Canto readings
  const cantoReadings = await parseCantoReadings(ccCedictCantoReadingsFilePath);

  const pinyinDict = new Dictionary({ fileName: TERM_ZIP_NAME });
  const zhuyinDict = new Dictionary({ fileName: ZHUYIN_ZIP_NAME });
  const hanziDict = new Dictionary({ fileName: HANZI_ZIP_NAME });
  const cantoDict = new Dictionary({ fileName: CANTO_ZIP_NAME });

  // Parse entries
  for (let i = 0; i < ccCedictLines.length; i++) {
    const line = ccCedictLines[i];
    await processLine({
      line,
      pinyinDict,
      zhuyinDict,
      hanziDict,
      cantoDict,
      cantoReadings,
      lineNumber: i,
    });
    if (i % 1000 === 0) {
      console.log(`Processed ${i} lines...`);
    }
  }

  console.log(`Parsed ${ccCedictLines.length} lines.`);
  console.log(`Exporting dictionaries...`);

  // Index constants
  const description = `CC-CEDICT is a continuation of the CEDICT project started by Paul Denisowski in 1997 with the aim to provide a complete downloadable Chinese to English dictionary with pronunciation in pinyin for the Chinese characters.
    This dictionary for Yomitan was converted from the data available at https://www.mdbg.net/chinese/dictionary?page=cc-cedict using https://github.com/MarvNC/cc-cedict-yomitan and https://github.com/MarvNC/yomichan-dict-builder.`;
  const revision = creationDateClean;
  const author = 'MDBG, CC-CEDICT, Marv';
  const url = 'https://github.com/MarvNC/cc-cedict-yomitan';
  const attribution = `https://cc-cedict.org/wiki/
Thanks go out to everyone who submitted new words or corrections. Special thanks go out to the CC-CEDICT editor team, who spend many hours doing research to maintain a high quality level:

goldyn_chyld - Matic Kavcic
richwarm - Richard Warmington
vermillion - Julien Baley
ycandau - Yves Candau
feilipu
and the editors who wish to remain anonymous
Special thanks to:

Craig Brelsford, for his extensive list of bird names
Erik Peterson, for his work as the editor of CEDICT
Paul Andrew Denisowski, the original creator of CEDICT`;

  // Export dictionaries
  await exportDictionary({
    dictionary: pinyinDict,
    indexName: TERM_INDEX_NAME,
    zipName: TERM_ZIP_NAME,
    buildDir: BUILD_DIR,
    title: `CC-CEDICT [${creationDateClean}]`,
    description,
    revision,
    author,
    url,
    attribution,
  });
  await exportDictionary({
    dictionary: zhuyinDict,
    indexName: ZHUYIN_INDEX_NAME,
    zipName: ZHUYIN_ZIP_NAME,
    buildDir: BUILD_DIR,
    title: `CC-CEDICT Zhuyin [${creationDateClean}]`,
    description,
    revision,
    author,
    url,
    attribution,
  });
  await exportDictionary({
    dictionary: hanziDict,
    indexName: HANZI_INDEX_NAME,
    zipName: HANZI_ZIP_NAME,
    buildDir: BUILD_DIR,
    title: `CC-CEDICT Hanzi [${creationDateClean}]`,
    description,
    revision,
    author,
    url,
    attribution,
  });

  await exportDictionary({
    dictionary: cantoDict,
    indexName: CANTO_INDEX_NAME,
    zipName: CANTO_ZIP_NAME,
    buildDir: BUILD_DIR,
    title: `CC-CEDICT Canto [${creationDateClean}]`,
    description,
    revision,
    author: `${author}, Pleco`,
    url,
    attribution: `${attribution}

Canto readings for CC-CEDICT are provided by Pleco, a Chinese dictionary app. The CC-Canto project is located at https://cccanto.org/`,
  });
}

async function exportDictionary({
  dictionary,
  indexName,
  zipName,
  buildDir,
  title,
  description,
  revision,
  author,
  url,
  attribution,
}: {
  dictionary: Dictionary;
  indexName: string;
  zipName: string;
  buildDir: string;
  title: string;
  description: string;
  revision: string;
  author: string;
  url: string;
  attribution: string;
}) {
  const index = new DictionaryIndex()
    .setTitle(title)
    .setDescription(description)
    .setRevision(revision)
    .setAuthor(author)
    .setUrl(url)
    .setAttribution(attribution)
    .setSequenced(true)
    .setIsUpdatable(true)
    .setIndexUrl(
      `https://github.com/MarvNC/cc-cedict-yomitan/releases/latest/download/${indexName}`
    )
    .setDownloadUrl(
      `https://github.com/MarvNC/cc-cedict-yomitan/releases/latest/download/${zipName}`
    );

  await Bun.write(join(buildDir, indexName), JSON.stringify(index.build()));
  await dictionary.setIndex(index.build());
  const dictStats = await dictionary.export(buildDir);
  console.log(`Exported ${dictStats.termCount || dictStats.kanjiCount} items.`);
  console.log(`Wrote ${zipName} to ${buildDir}.`);
}

main().catch((error) => {
  console.error('An error occurred:', error);
  process.exit(1);
});
