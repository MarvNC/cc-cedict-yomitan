const fs = require('fs');
const path = require('path');

const {
  Dictionary,
  DictionaryIndex,
  KanjiEntry,
  TermEntry,
} = require('yomichan-dict-builder');

const pinyinConvert = require('pinyin-tone');

const fileName = 'cedict_1_0_ts_utf-8_mdbg.txt';

const termZipName = '[ZH-EN] CC-CEDICT.zip';
const hanziZipName = '[Hanzi] CC-CEDICT.zip';

(async () => {
  // Check for file existence
  const filePath = path.join(__dirname, fileName);
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

  const creationDateLine = comments.find((c) => c.startsWith('#! date'));
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
  for (const line of lines) {
    processLine(line, termDict, hanziDict);
  }
  console.log(`Parsed ${lines.length} lines`);
})();

/**
 * Given a line, adds the entry/hanzi information to the dictionary.
 * @param {string} line
 * @param {Dictionary} termDict
 * @param {Dictionary} hanziDict
 */
async function processLine(line, termDict, hanziDict) {
  const { traditional, simplified, pinyin, definitionArray } = parseLine(line);

  addTermEntry(termDict, traditional, simplified, pinyin, definitionArray);

  addHanziEntry(hanziDict, traditional, simplified, pinyin, definitionArray);
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
) {}

/**
 * Adds a term entry to the dictionary.
 * @param {Dictionary} termDict
 * @param {string} traditional
 * @param {string} simplified
 * @param {string} pinyin
 * @param {string[]} definitionArray
 */
async function addTermEntry(
  termDict,
  traditional,
  simplified,
  pinyin,
  definitionArray
) {
  const termEntry = new TermEntry(traditional).setReading(pinyin);
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
            style: {
              fontSize: '1.5em',
            },
            data: {
              cccedict: 'headword',
            },
            content: `【${traditional}・${simplified}】`,
          },
          definitionList,
        ],
      },
    ],
  });

  // Trad
  termDict.addTerm(termEntry.build());

  // Simp
  termEntry.setTerm(simplified);
  termDict.addTerm(termEntry.build());
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
  pinyin = pinyinConvert(pinyin);

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
 * Replaces all instances of pinyin numbers with tone numbers in a string.
 * @param {string} string
 * @returns
 */
function replacePinyinNumbers(string) {
  // Find all pinyin within the definition and replace with tone
  const pinyinRegex = /\[(([a-zA-Z]+)([1-5]) ?)+\]/g;
  const pinyinMatches = string.match(pinyinRegex);
  if (pinyinMatches) {
    for (const match of pinyinMatches) {
      const pinyinOnly = match.substring(1, match.length - 1);
      const pinyinTone = pinyinConvert(pinyinOnly);
      string = string.replace(pinyinOnly, pinyinTone);
    }
  }
  return string;
}
