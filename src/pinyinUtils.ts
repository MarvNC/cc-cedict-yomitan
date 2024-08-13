import pinyinNumbersToTone from 'pinyin-tone';
import zhuyin from 'zhuyin-improved';

export function getPinyin(pinyin: string): string {
  pinyin = replaceUWithV(pinyin);
  return pinyinNumbersToTone(pinyin.toLowerCase()).replace(/ /g, '');
}

export function replaceUWithV(pinyin: string) {
  pinyin = pinyin.replace(/u:/g, 'v');
  return pinyin;
}

export function replacePinyinNumbers(string: string, pinyin: boolean): string {
  // Find all pinyin within the definition and replace with tone
  const pinyinRegex = /\[(([a-zA-Z\:]+)([1-5]) ?)+\]/g;
  const pinyinMatches = string.match(pinyinRegex);
  if (pinyinMatches) {
    for (const match of pinyinMatches) {
      // Remove brackets
      const pinyinOnly = match.substring(1, match.length - 1);
      const processedText = pinyin
        ? getPinyin(pinyinOnly)
        : getZhuyin(pinyinOnly);
      string = string.replace(pinyinOnly, processedText);
    }
  }
  return string;
}

export function getZhuyin(pinyin: string): string {
  pinyin = replaceUWithV(pinyin);
  return zhuyin(pinyin.toLowerCase()).join('');
}
