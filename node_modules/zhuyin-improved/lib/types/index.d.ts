export declare const toneMarks: string[]
export declare const fromPinyinSyllable: (pinyin: string) => string
export declare const fromPinyin: (
  input: string | string[],
  everything?: boolean
) => string[] | string[][]
export declare const splitZhuyin: (
  zhuyin: string,
  everything?: boolean
) => (string | string[])[]
export declare const toPinyinSyllable: (zhuyin: string) => string
declare type ToPinyinOptions = {
  everything?: boolean
  numbered?: boolean
}
export declare const toPinyin: (
  zhuyin: string,
  opts?: ToPinyinOptions
) => (string | string[])[]
export default fromPinyin
