const {
  Dictionary,
  DictionaryIndex,
  KanjiEntry,
  TermEntry,
} = require('yomichan-dict-builder');

const fs = require('fs');
const path = require('path');

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
    //
  }
})();

/**
 * @returns {import('yomichan-dict-builder/dist/types/yomitan/termbank').TermInformation}
 */
function parseLine() {
  //
}
