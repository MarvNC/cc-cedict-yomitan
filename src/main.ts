import { existsSync } from 'fs';
import { join } from 'path';
import { Dictionary, DictionaryIndex } from 'yomichan-dict-builder';
import {
  FILE_NAME,
  BUILD_DIR,
  DATA_DIR,
  TERM_ZIP_NAME,
  HANZI_ZIP_NAME,
  TERM_INDEX_NAME,
  HANZI_INDEX_NAME,
} from './config';
import { processLine } from './dictionaryUtils';
import { parseComments } from './fileUtils';

async function main() {
  // Check for file existence
  const filePath = join(process.cwd(), DATA_DIR, FILE_NAME);
  if (!existsSync(filePath)) {
    throw new Error(
      `File not found: ${filePath}. Please run fetch-cedict.sh first to download the file.`
    );
  }

  // Read file
  const file = Bun.file(filePath);
  const fileContents = await file.text();
  const lines = fileContents.split('\n');

  // Parse comments
  const { creationDateClean } = parseComments(lines);
  console.log(`Creation date: ${creationDateClean}`);

  const termDict = new Dictionary({ fileName: TERM_ZIP_NAME });
  const hanziDict = new Dictionary({ fileName: HANZI_ZIP_NAME });

  // Parse entries
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    await processLine(line, termDict, hanziDict, i);
    if (i % 1000 === 0) {
      console.log(`Processed ${i} lines...`);
    }
  }

  console.log(`Parsed ${lines.length} lines.`);
  console.log(`Exporting dictionaries...`);

  const index = createDictionaryIndex(creationDateClean);

  // Export term dict
  index.setIndexUrl(
    `https://github.com/MarvNC/cc-cedict-yomitan/releases/latest/download/${TERM_INDEX_NAME}`
  );
  index.setDownloadUrl(
    `https://github.com/MarvNC/cc-cedict-yomitan/releases/latest/download/${TERM_ZIP_NAME}`
  );
  await Bun.write(
    join(BUILD_DIR, TERM_INDEX_NAME),
    JSON.stringify(index.build())
  );
  await termDict.setIndex(index.build());
  const termDictStats = await termDict.export(BUILD_DIR);
  console.log(`Exported ${termDictStats.termCount} terms.`);
  console.log(`Wrote ${TERM_ZIP_NAME} to ${BUILD_DIR}.`);

  // Export hanzi dict
  index.setIndexUrl(
    `https://github.com/MarvNC/cc-cedict-yomitan/releases/latest/download/${HANZI_INDEX_NAME}`
  );
  index.setDownloadUrl(
    `https://github.com/MarvNC/cc-cedict-yomitan/releases/latest/download/${HANZI_ZIP_NAME}`
  );
  await Bun.write(
    join(BUILD_DIR, HANZI_INDEX_NAME),
    JSON.stringify(index.build())
  );
  index.setTitle(`CC-CEDICT Hanzi [${creationDateClean}]`);
  await hanziDict.setIndex(index.build());
  const hanziDictStats = await hanziDict.export(BUILD_DIR);
  console.log(`Exported ${hanziDictStats.kanjiCount} hanzi.`);
  console.log(`Wrote ${HANZI_ZIP_NAME} to ${BUILD_DIR}.`);
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
