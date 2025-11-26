import { Dictionary, KanjiEntry, TermEntry } from 'yomichan-dict-builder';
import { parseLine } from './parseLine';
import { isCJKHanzi } from 'is-cjk-hanzi';
import type { CantoReadings } from './types';
import type { StructuredContentNode } from 'yomichan-dict-builder/dist/types/yomitan/termbank';

export async function processLine({
  line,
  pinyinDict,
  zhuyinDict,
  hanziDict,
  ccCedictCantoDict,
  ccCantoDict,
  cantoReadings,
  lineNumber,
  isCanto = false,
}: {
  line: string;
  pinyinDict?: Dictionary;
  zhuyinDict?: Dictionary;
  hanziDict?: Dictionary;
  ccCedictCantoDict?: Dictionary;
  cantoReadings?: CantoReadings;
  ccCantoDict?: Dictionary;
  lineNumber: number;
  isCanto?: boolean;
}): Promise<void> {
  const {
    traditional,
    simplified,
    pinyin,
    zhuyin,
    jyutReading,
    pinyinDefinitionArray,
    zhuyinDefinitionArray,
    rawDefinitionArray,
  } = parseLine(line, isCanto);

  await addTermEntry({
    termDict: pinyinDict,
    traditional,
    simplified,
    reading: pinyin,
    definitionArray: pinyinDefinitionArray,
    sequenceNumber: lineNumber,
  });

  await addTermEntry({
    termDict: zhuyinDict,
    traditional,
    simplified,
    reading: zhuyin,
    definitionArray: zhuyinDefinitionArray,
    sequenceNumber: lineNumber,
  });

  await addHanziEntry({
    hanziDict,
    traditional,
    simplified,
    pinyin,
    definitionArray: pinyinDefinitionArray,
  });

  await addTermEntry({
    termDict: ccCantoDict,
    traditional,
    simplified,
    reading: jyutReading,
    definitionArray: rawDefinitionArray,
    sequenceNumber: lineNumber,
  });

  // Check if Canto reading exists
  if (cantoReadings && cantoReadings[traditional]) {
    await addTermEntry({
      termDict: ccCedictCantoDict,
      traditional,
      simplified,
      reading: cantoReadings[traditional],
      definitionArray: pinyinDefinitionArray,
      sequenceNumber: lineNumber,
    });
  }
}

async function addHanziEntry({
  hanziDict,
  traditional,
  simplified,
  pinyin,
  definitionArray,
}: {
  hanziDict?: Dictionary;
  traditional: string;
  simplified: string;
  pinyin: string;
  definitionArray: string[];
}): Promise<void> {
  if (!hanziDict) {
    return;
  }

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

async function addTermEntry({
  termDict,
  traditional,
  simplified,
  reading,
  definitionArray,
  sequenceNumber,
}: {
  termDict?: Dictionary;
  traditional: string;
  simplified: string;
  reading: string;
  definitionArray: string[];
  sequenceNumber: number;
}): Promise<void> {
  if (!termDict) {
    return;
  }

  const termEntry = new TermEntry(traditional)
    .setReading(reading)
    .setSequenceNumber(sequenceNumber);
  const terms = [
    {
      tag: 'span',
      content: simplified,
      lang: 'zh-Hans',
      data: { cccedict: 'headword-simp' },
    },
  ] as StructuredContentNode[];
  if (simplified !== traditional)
    terms.unshift(
      {
        tag: 'span',
        content: traditional,
        lang: 'zh-Hant',
        data: { cccedict: 'headword-trad' },
      },
      '・'
    );
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
            content: ['【', terms, '】'],
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
