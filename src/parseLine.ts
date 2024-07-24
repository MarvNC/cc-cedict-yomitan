import { normalizePinyin, replacePinyinNumbers } from './pinyinUtils';
import type { ParsedLine } from './types';

export function parseLine(line: string): ParsedLine {
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
