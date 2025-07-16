"use strict"
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, "__esModule", { value: true })
exports.toPinyin =
  exports.toPinyinSyllable =
  exports.splitZhuyin =
  exports.fromPinyin =
  exports.fromPinyinSyllable =
  exports.toneMarks =
    void 0
const pinyin_utils_1 = require("pinyin-utils")
const pinyin_split_1 = __importDefault(require("pinyin-split"))
const py2zy_1 = __importDefault(require("./py2zy"))
exports.toneMarks = ["", "ˊ", "ˇ", "ˋ", "˙"]

function convertToneMarks(text) {
  const toneMap = {
    ü: "v",
    ǖ: "v",
    ǘ: "v́",
    ǚ: "v̌",
    ǜ: "v̀",
  }
  return text
    .split("")
    .map((char) => toneMap[char] || char)
    .join("")
}

const fromPinyinSyllable = (pinyin) => {
  pinyin = convertToneMarks(pinyin)
  let zy = py2zy_1.default[pinyin_utils_1.removeTone(pinyin).toLowerCase()]
  const result =
    zy + exports.toneMarks[pinyin_utils_1.getToneNumber(pinyin) - 1]
  const formattedResult = splitZhuyin2(result, false).join("")

  return formattedResult
}
exports.fromPinyinSyllable = fromPinyinSyllable

const fromPinyin = (input, everything = false) => {
  const translate = (pinyin) => {
    return pinyin_split_1.default(pinyin, everything).map((item) => {
      if (everything) {
        if (typeof item === "string") return item
        else {
          return exports.fromPinyinSyllable(item[0])
        }
      } else {
        return exports.fromPinyinSyllable(item)
      }
    })
  }

  if (typeof input === "string") return translate(input)
  else return input.map(translate)
}
exports.fromPinyin = fromPinyin

const splitZhuyin = (zhuyin, everything = false) => {
  const list = []
  let index = 0
  while (index < zhuyin.length) {
    let count = zhuyin.length - index
    let wordFound = false
    while (count >= 1) {
      let word = zhuyin.substr(index, count)
      if (Object.values(py2zy_1.default).includes(word)) {
        wordFound = true
        if (exports.toneMarks.includes(zhuyin[index + count])) {
          word += zhuyin[index + count]
          count++
        }
        // 針對"˙"前word前方的處理：應該將"˙"取得後加至後方
        if (
          exports.toneMarks.includes(zhuyin[index + count - word.length - 1])
        ) {
          word += zhuyin[index + count - word.length - 1]
          count++
        }
        list.push(everything ? [word] : word)
        index += count - 1
        break
      }
      count--
    }
    if (!wordFound && everything) {
      if (index === 0 || typeof list[list.length - 1] === "object") {
        list.push(zhuyin[index])
      } else if (typeof list[list.length - 1] === "string") {
        list[list.length - 1] += zhuyin[index]
      }
    }
    index++
  }
  return list
}
exports.splitZhuyin = splitZhuyin

const splitZhuyin2 = (zhuyin, everything = false) => {
  const list = []
  let index = 0
  while (index < zhuyin.length) {
    let count = zhuyin.length - index
    let wordFound = false
    while (count >= 1) {
      let word = zhuyin.substr(index, count)
      if (Object.values(py2zy_1.default).includes(word)) {
        wordFound = true
        if (exports.toneMarks.includes(zhuyin[index + count])) {
          if (zhuyin[index + count] === "˙") {
            word = zhuyin[index + count] + word
          } else {
            word += zhuyin[index + count]
          }
          count++
        }

        list.push(everything ? [word] : word)
        index += count - 1
        break
      }
      count--
    }
    if (!wordFound && everything) {
      if (index === 0 || typeof list[list.length - 1] === "object") {
        list.push(zhuyin[index])
      } else if (typeof list[list.length - 1] === "string") {
        list[list.length - 1] += zhuyin[index]
      }
    }
    index++
  }
  return list
}

const toPinyinSyllable = (zhuyin) => {
  let tone = exports.toneMarks.indexOf(zhuyin[zhuyin.length - 1]) + 1
  if (tone > 0) {
    zhuyin = zhuyin.substr(0, zhuyin.length - 1)
  } else {
    tone = 1
  }

  let pinyinIndex = Object.values(py2zy_1.default).indexOf(zhuyin)
  if (pinyinIndex > -1) {
    return Object.keys(py2zy_1.default)[pinyinIndex] + tone
  } else {
    return zhuyin
  }
}

exports.toPinyinSyllable = toPinyinSyllable

const convertPinyin = (pinyin) => {
  const pinyinMap = {
    1: "ǖ",
    2: "ǘ",
    3: "ǚ",
    4: "ǜ",
  }

  return pinyin.replace(/v([1-4])/g, (match, p1) => pinyinMap[p1])
}

const toPinyin = (zhuyin, opts = {}) => {
  let list = exports.splitZhuyin(zhuyin, opts.everything)
  if (!opts.everything) list = list.filter((item) => typeof item === "string")

  list = list.map((item) => {
    if (opts.everything && typeof item === "string") return item
    else if (typeof item !== "string") item = item[0]

    let pinyin = exports.toPinyinSyllable(item)

    // 加入 convertPinyin 的例外處理
    pinyin = convertPinyin(pinyin)

    if (opts.numbered) return opts.everything ? [pinyin] : pinyin
    else if (opts.everything) return [pinyin_utils_1.numberToMark(pinyin)]
    else return pinyin_utils_1.numberToMark(pinyin)
  })

  return list
}

exports.toPinyin = toPinyin
exports.default = exports.fromPinyin
