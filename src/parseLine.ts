import type { StructuredContentNode } from 'yomichan-dict-builder/dist/types/yomitan/termbank';
import { getPinyin, getZhuyin, replacePinyinNumbers } from './pinyinUtils';
import type { ParsedLine } from './types';

export function parseLine(line: string, isCanto?: boolean): ParsedLine {
  const lineArr = line.split('');
  let traditional = '';
  let simplified = '';
  let rawReadingWithNumbers = '';
  let rawEnglishDefinition = '';

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
    rawReadingWithNumbers += lineArr.shift();
  }
  lineArr.shift(); // ]
  if (lineArr[0] !== ' ') {
    throw new Error(`Expected space before english: ${line}`);
  }
  lineArr.shift(); // space

  let jyutReading = '';
  if (isCanto) {
    if (lineArr[0] !== '{') {
      throw new Error(`Expected { before jyut reading: ${line}`);
    }
    lineArr.shift(); // {
    while (lineArr[0] !== '}') {
      jyutReading += lineArr.shift();
    }
    lineArr.shift(); // }
    if (lineArr[0] !== ' ') {
      throw new Error(`Expected space after jyut reading: ${line}`);
    }
    lineArr.shift(); // space
  }

  rawEnglishDefinition = lineArr.join('');

  // Process
  // Convert pinyin
  const pinyin = getPinyin(rawReadingWithNumbers);

  // Zhuyin
  const zhuyin = getZhuyin(rawReadingWithNumbers);

  // Convert number pinyin in definition to tone
  const {
    pinyinDefinitionArray,
    zhuyinDefinitionArray,
    stringDefinitionArray,
  } = processDefinitionText(rawEnglishDefinition);

  const rawDefinitionArray = rawEnglishDefinition
    .split('/')
    .filter((e) => e.trim() !== '');

  return {
    traditional,
    simplified,
    pinyin,
    zhuyin,
    jyutReading,
    pinyinDefinitionArray,
    zhuyinDefinitionArray,
    stringDefinitionArray,
    rawDefinitionArray,
  };
}

function processDefinitionText(text: string): {
  pinyinDefinitionArray: StructuredContentNode[];
  zhuyinDefinitionArray: StructuredContentNode[];
  stringDefinitionArray: string[];
} {
  const english = text;

  function processText(type: 'Pinyin' | 'Zhuyin'): StructuredContentNode[];
  function processText(type: 'Hanzi'): string[];
  function processText(type: 'Pinyin' | 'Zhuyin' | 'Hanzi') {
    const stringDefinitions = replacePinyinNumbers(
      english,
      type !== 'Zhuyin' ? true : false
    )
      .split('/')
      .filter((e) => e.trim() !== '');
    if (type === 'Hanzi') return stringDefinitions;

    return stringDefinitions.map((defEntry) => {
      const altPronunciationMatch = defEntry.match(
        /(.*?)((\w+) pr\. \[(.+?)\])(.*)/
      );
      if (altPronunciationMatch) {
        const [_, before, altPronunciationFull, label, pronunciation, after] =
          altPronunciationMatch;
        return [
          before,
          {
            tag: 'span',
            content: altPronunciationFull,
            data: {
              cccedict: 'alt-pronunciation',
              type: label,
              value: pronunciation,
            },
          },
          after,
        ] satisfies StructuredContentNode[];
      }
      return defEntry;
    });
  }

  // Process pinyin, zhuyin and hanzi definitions
  const pinyinDefinitionArray = processText('Pinyin');
  const zhuyinDefinitionArray = processText('Zhuyin');
  const stringDefinitionArray = processText('Hanzi');

  return {
    pinyinDefinitionArray,
    zhuyinDefinitionArray,
    stringDefinitionArray,
  };
}
