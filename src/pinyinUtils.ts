import pinyinNumbersToTone from 'pinyin-tone';

export function normalizePinyin(pinyin: string): string {
  pinyin = pinyin.replace(/u:/g, 'v');
  return pinyinNumbersToTone(pinyin.toLowerCase());
}

export function replacePinyinNumbers(string: string): string {
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
