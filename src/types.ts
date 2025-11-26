import type { StructuredContentNode } from 'yomichan-dict-builder/dist/types/yomitan/termbank';

export interface ParsedLine {
  traditional: string;
  simplified: string;
  pinyin: string;
  zhuyin: string;
  jyutReading: string;
  rawDefinitionArray: string[];
  pinyinDefinitionArray: StructuredContentNode[];
  zhuyinDefinitionArray: StructuredContentNode[];
  hanziDefinitionArray: string[];
}

type jyutping = string;

export interface CantoReadings {
  [traditional: string]: jyutping;
}
