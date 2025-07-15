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
} from './config';
import { processLine } from './dictionaryUtils';
import { parseComments } from './fileUtils';

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

  const pinyinDict = new Dictionary({ fileName: TERM_ZIP_NAME });
  const zhuyinDict = new Dictionary({ fileName: ZHUYIN_ZIP_NAME });
  const hanziDict = new Dictionary({ fileName: HANZI_ZIP_NAME });

  // Parse entries
  for (let i = 0; i < ccCedictLines.length; i++) {
    const line = ccCedictLines[i];
    await processLine(line, pinyinDict, zhuyinDict, hanziDict, i);
    if (i % 1000 === 0) {
      console.log(`Processed ${i} lines...`);
    }
  }

  console.log(`Parsed ${ccCedictLines.length} lines.`);
  console.log(`Exporting dictionaries...`);

  const index = createDictionaryIndex(creationDateClean);

  // Export dictionaries
  await exportDictionary({
    index,
    dictionary: pinyinDict,
    indexName: TERM_INDEX_NAME,
    zipName: TERM_ZIP_NAME,
    buildDir: BUILD_DIR,
  });
  await exportDictionary({
    index,
    dictionary: zhuyinDict,
    indexName: ZHUYIN_INDEX_NAME,
    zipName: ZHUYIN_ZIP_NAME,
    buildDir: BUILD_DIR,
    title: `CC-CEDICT Zhuyin [${creationDateClean}]`,
  });
  await exportDictionary({
    index,
    dictionary: hanziDict,
    indexName: HANZI_INDEX_NAME,
    zipName: HANZI_ZIP_NAME,
    buildDir: BUILD_DIR,
    title: `CC-CEDICT Hanzi [${creationDateClean}]`,
  });
}

async function exportDictionary({
  index,
  dictionary,
  indexName,
  zipName,
  buildDir,
  title,
}: {
  index: DictionaryIndex;
  dictionary: Dictionary;
  indexName: string;
  zipName: string;
  buildDir: string;
  title?: string;
}) {
  index.setIndexUrl(
    `https://github.com/MarvNC/cc-cedict-yomitan/releases/latest/download/${indexName}`
  );
  index.setDownloadUrl(
    `https://github.com/MarvNC/cc-cedict-yomitan/releases/latest/download/${zipName}`
  );
  if (title) {
    index.setTitle(title);
  }
  await Bun.write(join(buildDir, indexName), JSON.stringify(index.build()));
  await dictionary.setIndex(index.build());
  const dictStats = await dictionary.export(buildDir);
  console.log(`Exported ${dictStats.termCount || dictStats.kanjiCount} items.`);
  console.log(`Wrote ${zipName} to ${buildDir}.`);
}

function createDictionaryIndex(creationDateClean: string): DictionaryIndex {
  return new DictionaryIndex()
    .setTitle(`CC-CEDICT [${creationDateClean}]`)
    .setDescription(
      `CC-CEDICT is a continuation of the CEDICT project started by Paul Denisowski in 1997 with the aim to provide a complete downloadable Chinese to English dictionary with pronunciation in pinyin for the Chinese characters.
    This dictionary for Yomitan was converted from the data available at https://www.mdbg.net/chinese/dictionary?page=cc-cedict using https://github.com/MarvNC/cc-cedict-yomitan and https://github.com/MarvNC/yomichan-dict-builder.`
    )
    .setRevision(creationDateClean)
    .setAuthor('MDBG, CC-CEDICT, Marv')
    .setUrl('https://github.com/MarvNC/cc-cedict-yomitan')
    .setAttribution(
      `https://cc-cedict.org/wiki/
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
Paul Andrew Denisowski, the original creator of CEDICT`
    )
    .setSequenced(true)
    .setIsUpdatable(true);
}

main().catch((error) => {
  console.error('An error occurred:', error);
  process.exit(1);
});
