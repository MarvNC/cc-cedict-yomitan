const fs = require('fs');
const path = require('path');

const {
  Dictionary,
  DictionaryIndex,
  KanjiEntry,
  TermEntry,
} = require('yomichan-dict-builder');

/**
 * @type {(string) => string}
 */
// @ts-ignore
const pinyinNumbersToTone = require('pinyin-tone');
const hasUTF16SurrogatePairAt = require('@stdlib/assert-has-utf16-surrogate-pair-at');

const fileName = 'cedict_1_0_ts_utf-8_mdbg.txt';
const buildDir = './build';

const termZipName = 'CC-CEDICT.zip';
const hanziZipName = 'CC-CEDICT Hanzi.zip';

(async () => {
  // Check for file existence
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `File not found: ${filePath}. Please run fetch-cedict.sh first to download the file.`
    );
  }

  // Read file
  const fileContents = fs.readFileSync(filePath, { encoding: 'utf-8' });
  const lines = fileContents.split('\n');

  // Parse comments
  const comments = [];
  while (lines[0].startsWith('#')) {
    comments.push(lines.shift());
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
    fileName: termZipName,
  });
  const hanziDict = new Dictionary({
    fileName: hanziZipName,
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
  const termDictStats = await termDict.export(buildDir);
  console.log(`Exported ${termDictStats.termCount} terms.`);
  console.log(`Wrote ${termZipName} to ${buildDir}.`);

  // Export hanzi dict
  index.setTitle(`CC-CEDICT Hanzi [${creationDateClean}]`);
  await hanziDict.setIndex(index.build());
  const hanziDictStats = await hanziDict.export(buildDir);
  console.log(`Exported ${hanziDictStats.kanjiCount} hanzi.`);
  console.log(`Wrote ${hanziZipName} to ${buildDir}.`);
})();

/**
 * Given a line, adds the entry/hanzi information to the dictionary.
 * @param {string} line
 * @param {Dictionary} termDict
 * @param {Dictionary} hanziDict
 * @param {number} lineNumber
 */
async function processLine(line, termDict, hanziDict, lineNumber) {
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

/**
 * Adds a hanzi entry to the dictionary.
 * @param {Dictionary} hanziDict
 * @param {string} traditional
 * @param {string} simplified
 * @param {string} pinyin
 * @param {string[]} definitionArray
 */
async function addHanziEntry(
  hanziDict,
  traditional,
  simplified,
  pinyin,
  definitionArray
) {
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

/**
 * Tests if a string is a valid hanzi character.
 * @param {string} hanzi
 */
function isValidHanzi(hanzi) {
  if (hanzi.length !== 1) {
    if (hasUTF16SurrogatePairAt(hanzi, 0)) {
      return hanzi.length === 2;
    }
    return false;
  }
  return true;
}

/**
 * Adds a term entry to the dictionary.
 * @param {Dictionary} termDict
 * @param {string} traditional
 * @param {string} simplified
 * @param {string} pinyin
 * @param {string[]} definitionArray
 * @param {number} sequenceNumber
 */
async function addTermEntry(
  termDict,
  traditional,
  simplified,
  pinyin,
  definitionArray,
  sequenceNumber
) {
  const termEntry = new TermEntry(traditional)
    .setReading(pinyin)
    .setSequenceNumber(sequenceNumber);
  /**
   * @type {import('yomichan-dict-builder/dist/types/yomitan/termbank').StructuredContent}
   */
  const definitionList = {
    tag: 'ul',
    data: {
      cccedict: 'definition',
    },
    content: definitionArray.map((d) => ({
      tag: 'li',
      content: d,
    })),
  };

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
          definitionList,
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

/**
 * Parses a line such as
 * Traditional Simplified [pin1 yin1] /English equivalent 1/equivalent 2/
 * @param {string} line
 */
function parseLine(line) {
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

/**
 * Lowercases and converts pinyin numbers to tones.
 * @param {string} pinyin
 */
function normalizePinyin(pinyin) {
  pinyin = pinyin.replace(/u:/g, 'v');
  return pinyinNumbersToTone(pinyin.toLowerCase());
}

/**
 * Replaces all instances of pinyin numbers with tone numbers in a string.
 * @param {string} string
 * @returns
 */
function replacePinyinNumbers(string) {
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
