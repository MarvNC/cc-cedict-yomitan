import { getPinyin, getZhuyin, replacePinyinNumbers } from './pinyinUtils';
import type { ParsedLine } from './types';

export function parseLine(line: string): ParsedLine {
  const lineArr = line.split('');
  let traditional = '';
  let simplified = '';
  let pinyinNumbers = '';
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
    pinyinNumbers += lineArr.shift();
  }
  lineArr.shift(); // ]
  if (lineArr[0] !== ' ') {
    throw new Error(`Expected space before english: ${line}`);
  }
  lineArr.shift(); // space
  english = lineArr.join('');

  // Process
  // Convert pinyin
  const pinyin = getPinyin(pinyinNumbers);

  // Zhuyin
  const zhuyin = getZhuyin(pinyinNumbers);

  // Convert number pinyin in definition to tone
  const { pinyinDefinitionArray, zhuyinDefinitionArray } =
    processDefinitionText(english);

  return {
    traditional,
    simplified,
    pinyin,
    zhuyin,
    pinyinDefinitionArray,
    zhuyinDefinitionArray,
  };
}

function processDefinitionText(text: string): {
  pinyinDefinitionArray: string[];
  zhuyinDefinitionArray: string[];
} {
  const english = text;

  const processText = (usePinyin: boolean) =>
    replacePinyinNumbers(english, usePinyin)
      .split('/')
      .filter((e) => e.trim() !== '');

  // Process pinyin and zhuyin
  const pinyinDefinitionArray = processText(true);
  const zhuyinDefinitionArray = processText(false);

  return { pinyinDefinitionArray, zhuyinDefinitionArray };
}
