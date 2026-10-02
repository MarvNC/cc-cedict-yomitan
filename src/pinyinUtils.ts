import pinyinNumbersToTone from 'pinyin-tone';
import zhuyin from 'zhuyin-improved';

export function replaceUWithV(pinyin: string) {
  return pinyin.replace(/u:/gi, (value) => (value[0] === 'U' ? 'V' : 'v'));
}

function convertReading(
  reading: string,
  pinyin: boolean,
  preserveSpaces: boolean,
): string {
  // Convert individual numbered syllables, including joined v2 words. Preserve
  // Latin material, braces, hyphens, punctuation and unknown syllables verbatim.
  const input = reading;
  let previousEnd = -1;
  const result = input.replace(
    /[A-Za-züÜvV:]+[1-5]/g,
    (syllable, offset: number) => {
      const normalized = replaceUWithV(syllable).toLowerCase();
      let converted = pinyin
        ? normalized === 'r5'
          ? 'r'
          : pinyinNumbersToTone(normalized)
        : zhuyin(normalized, false, true).join('');
      if (!converted || converted === normalized) return syllable;
      if (pinyin && /^[A-Z]/.test(syllable))
        converted = converted[0].toUpperCase() + converted.slice(1);
      if (
        pinyin &&
        (offset === previousEnd ||
          (!preserveSpaces &&
            previousEnd >= 0 &&
            /^ +$/.test(input.slice(previousEnd, offset)))) &&
        /^[aeo]/i.test(syllable)
      )
        converted = "'" + converted;
      previousEnd = offset + syllable.length;
      return converted;
    },
  );
  return preserveSpaces ? result : result.replace(/ /g, '');
}

export function getPinyin(pinyin: string, preserveSpaces = false): string {
  return convertReading(pinyin, true, preserveSpaces);
}

export function getZhuyin(pinyin: string, preserveSpaces = false): string {
  return convertReading(pinyin, false, preserveSpaces);
}

export function replacePinyinNumbers(text: string, pinyin: boolean): string {
  // Only bracketed numbered pronunciation notation is eligible. Bracketed
  // English, editorial notes, and unsupported content must not be rewritten.
  return text.replace(/\[([^\[\]]+)\]/g, (full, reading: string) => {
    if (
      !/[A-Za-züÜvV:]+[1-5]/.test(reading) ||
      !/^[A-Za-züÜvV:0-9{} .,'·-]+$/.test(reading)
    )
      return full;
    return `[${convertReading(reading, pinyin, true)}]`;
  });
}
