export interface ParsedLine {
  traditional: string;
  simplified: string;
  pinyin: string;
  zhuyin: string;
  pinyinDefinitionArray: string[];
  zhuyinDefinitionArray: string[];
}

type jyutping = string;

export interface CantoReadings {
  [traditional: string]: jyutping;
}
