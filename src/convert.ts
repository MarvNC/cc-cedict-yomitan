import { existsSync } from 'fs';
import { join } from 'path';

import {
  Dictionary,
  DictionaryIndex,
  KanjiEntry,
  TermEntry,
} from 'yomichan-dict-builder';

import pinyinNumbersToTone from 'pinyin-tone';
import hasUTF16SurrogatePairAt from '@stdlib/assert-has-utf16-surrogate-pair-at';

const FILE_NAME = 'cedict_1_0_ts_utf-8_mdbg.txt';
const BUILD_DIR = './build';
const DATA_DIR = './data';

const TERM_ZIP_NAME = 'CC-CEDICT.zip';
const HANZI_ZIP_NAME = 'CC-CEDICT Hanzi.zip';

interface ParsedLine {
  traditional: string;
  simplified: string;
  pinyin: string;
  definitionArray: string[];
}

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
  const comments: string[] = [];
  while (lines[0].startsWith('#')) {
    comments.push(lines.shift()!);
  }

  const creationDateLine = comments.find((c) => c?.startsWith('#! date'));
  const creationDateText = creationDateLine?.split('=')[1]?.trim();
  if (!creationDateText) {
    throw new Error(
      `Could not find creation date in comments: ${creationDateLine}`
    );
  }
  const creationDate = new Date(creationDateText);
  const creationDateClean = creationDate.toISOString().split('T')[0];
  console.log(`Creation date: ${creationDateClean}`);

  const termDict = new Dictionary({
    fileName: TERM_ZIP_NAME,
  });
  const hanziDict = new Dictionary({
    fileName: HANZI_ZIP_NAME,
  });

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

  const index = new DictionaryIndex()
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
    .setSequenced(true);

  // Export term dict
  await termDict.setIndex(index.build());
  const termDictStats = await termDict.export(BUILD_DIR);
  console.log(`Exported ${termDictStats.termCount} terms.`);
  console.log(`Wrote ${TERM_ZIP_NAME} to ${BUILD_DIR}.`);

  // Export hanzi dict
  index.setTitle(`CC-CEDICT Hanzi [${creationDateClean}]`);
  await hanziDict.setIndex(index.build());
  const hanziDictStats = await hanziDict.export(BUILD_DIR);
  console.log(`Exported ${hanziDictStats.kanjiCount} hanzi.`);
  console.log(`Wrote ${HANZI_ZIP_NAME} to ${BUILD_DIR}.`);
}

async function processLine(
  line: string,
  termDict: Dictionary,
  hanziDict: Dictionary,
  lineNumber: number
): Promise<void> {
  const { traditional, simplified, pinyin, definitionArray } = parseLine(line);

  await addTermEntry(
    termDict,
    traditional,
    simplified,
    pinyin,
    definitionArray,
    lineNumber
  );

  await addHanziEntry(
    hanziDict,
    traditional,
    simplified,
    pinyin,
    definitionArray
  );
}

async function addHanziEntry(
  hanziDict: Dictionary,
  traditional: string,
  simplified: string,
  pinyin: string,
  definitionArray: string[]
): Promise<void> {
  if (!isValidHanzi(traditional)) {
    return;
  }

  const hanziEntry = new KanjiEntry(traditional)
    .setOnyomi(pinyin)
    .addMeaning(definitionArray);

  // Trad
  await hanziDict.addKanji(hanziEntry.build());

  // Simp
  if (traditional !== simplified) {
    hanziEntry.setKanji(simplified);
    await hanziDict.addKanji(hanziEntry.build());
  }
}

function isValidHanzi(hanzi: string): boolean {
  if (hanzi.length !== 1) {
    if (hasUTF16SurrogatePairAt(hanzi, 0)) {
      return hanzi.length === 2;
    }
    return false;
  }
  return true;
}

async function addTermEntry(
  termDict: Dictionary,
  traditional: string,
  simplified: string,
  pinyin: string,
  definitionArray: string[],
  sequenceNumber: number
): Promise<void> {
  const termEntry = new TermEntry(traditional)
    .setReading(pinyin)
    .setSequenceNumber(sequenceNumber);

  // Build definition
  termEntry.addDetailedDefinition({
    type: 'structured-content',
    content: [
      {
        tag: 'div',
        lang: 'zh',
        content: [
          {
            tag: 'div',
            data: {
              cccedict: 'headword',
            },
            content: `【${
              traditional === simplified
                ? traditional
                : traditional + '・' + simplified
            }】`,
          },
          {
            tag: 'ul',
            data: {
              cccedict: 'definition',
            },
            content: definitionArray.map((d) => ({
              tag: 'li',
              content: d,
            })),
          },
        ],
      },
    ],
  });

  // Trad
  await termDict.addTerm(termEntry.build());

  // Simp
  if (traditional !== simplified) {
    termEntry.setTerm(simplified);
    await termDict.addTerm(termEntry.build());
  }
}

function parseLine(line: string): ParsedLine {
  const lineArr = line.split('');
  let traditional = '';
  let simplified = '';
  let pinyin = '';
  let english = '';

  while (lineArr[0] !== ' ') {
    traditional += lineArr.shift();
  }
  lineArr.shift(); // space
  while (lineArr[0] !== ' ') {
    simplified += lineArr.shift();
  }
  lineArr.shift(); // space
  // @ts-ignore
  if (lineArr[0] !== '[') {
    throw new Error(`Expected [ before pinyin: ${line}`);
  }
  lineArr.shift(); // [
  while (lineArr[0] !== ']') {
    pinyin += lineArr.shift();
  }
  lineArr.shift(); // ]
  if (lineArr[0] !== ' ') {
    throw new Error(`Expected space before english: ${line}`);
  }
  lineArr.shift(); // space
  english = lineArr.join('');

  // Process

  // Convert pinyin to tone
  pinyin = normalizePinyin(pinyin);

  // Remove spaces
  pinyin = pinyin.replace(/ /g, '');

  // Convert number pinyin in definition to tone
  english = replacePinyinNumbers(english);

  const definitionArray = english.split('/').filter((e) => e.trim() !== '');

  return {
    traditional,
    simplified,
    pinyin,
    definitionArray,
  };
}

function normalizePinyin(pinyin: string): string {
  pinyin = pinyin.replace(/u:/g, 'v');
  return pinyinNumbersToTone(pinyin.toLowerCase());
}

function replacePinyinNumbers(string: string): string {
  // Find all pinyin within the definition and replace with tone
  const pinyinRegex = /\[(([a-zA-Z\:]+)([1-5]) ?)+\]/g;
  const pinyinMatches = string.match(pinyinRegex);
  if (pinyinMatches) {
    for (const match of pinyinMatches) {
      // Remove brackets
      const pinyinOnly = match.substring(1, match.length - 1);
      const pinyinTone = normalizePinyin(pinyinOnly);
      string = string.replace(pinyinOnly, pinyinTone);
    }
  }
  return string;
}

main().catch((error) => {
  console.error('An error occurred:', error);
  process.exit(1);
});
