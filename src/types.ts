export interface ParsedLine {
  traditional: string;
  simplified: string;
  pinyin: string;
  zhuyin: string;
  jyutReading: string;
  rawDefinitionArray: string[];
  pinyinDefinitionArray: string[];
  zhuyinDefinitionArray: string[];
}

type jyutping = string;

export interface CantoReadings {
  [traditional: string]: jyutping;
}
