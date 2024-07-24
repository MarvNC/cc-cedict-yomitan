import { Dictionary, KanjiEntry, TermEntry } from 'yomichan-dict-builder';
import { parseLine } from './parseLine';
import { isCJKHanzi } from 'is-cjk-hanzi';

export async function processLine(
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
  if (!isCJKHanzi(traditional)) {
    return;
  }

  const hanziEntry = new KanjiEntry(traditional)
    .setOnyomi(pinyin)
    .addMeanings(definitionArray);

  // Trad
  await hanziDict.addKanji(hanziEntry.build());

  // Simp
  if (traditional !== simplified) {
    hanziEntry.setKanji(simplified);
    await hanziDict.addKanji(hanziEntry.build());
  }
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
