import { getPinyin, getZhuyin, replacePinyinNumbers } from './pinyinUtils';
import { formatDefinition } from './definitionFormatting';
import type { ParsedLine } from './types';

export function parseLine(line: string, isCanto = false): ParsedLine {
  // v1 [pin1 yin1] and v2 [[pin1yin1]] can coexist in the same dump.
  // Match the entire entry so malformed input fails rather than looping forever.
  // CC-Canto includes empty Mandarin readings, trailing comments, and a legacy
  // extra brace inside one Jyutping field. Keep that field verbatim.
  const match = line
    .trim()
    .match(
      /^(\S+) (\S+) (?:\[\[([^\[\]]+)\]\]|\[([^\[\]]*)\]) (?:\{(.+)\} )?(\/.*?\/)(?:\s+#.*)?$/u,
    );
  if (!match || isCanto !== (match[5] !== undefined)) {
    throw new Error(
      `Invalid ${isCanto ? 'CC-Canto' : 'CC-CEDICT'} entry: ${line}`,
    );
  }
  const [
    ,
    traditional,
    simplified,
    v2Reading,
    v1Reading,
    jyutReading = '',
    rawEnglishDefinition,
  ] = match;
  const reading = v2Reading ?? v1Reading;
  const rawDefinitionArray = rawEnglishDefinition
    .slice(1, -1)
    .split('/')
    .filter((e) => e.trim() !== '');
  return {
    traditional,
    simplified,
    pinyin: getPinyin(reading, v2Reading !== undefined),
    zhuyin: getZhuyin(reading, v2Reading !== undefined),
    jyutReading,
    rawDefinitionArray,
    pinyinDefinitionArray: rawDefinitionArray.map((definition) =>
      formatDefinition(definition, true),
    ),
    zhuyinDefinitionArray: rawDefinitionArray.map((definition) =>
      formatDefinition(definition, false),
    ),
    stringDefinitionArray: rawDefinitionArray.map((definition) =>
      replacePinyinNumbers(definition, true),
    ),
  };
}
