import { removeTone, getToneNumber, numberToMark } from "pinyin-utils"
import { split } from "pinyin-split"
import py2zy from "./py2zy.js"

export const toneMarks = ["", "ˊ", "ˇ", "ˋ", "˙"]

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

export const fromPinyinSyllable = (pinyin) => {
  pinyin = convertToneMarks(pinyin)
  let zy = py2zy[removeTone(pinyin).toLowerCase()]
  const result = zy + toneMarks[getToneNumber(pinyin) - 1]
  const formattedResult = splitZhuyin2(result, false).join("")
  return formattedResult
}

export const fromPinyin = (input, everything = false) => {
  const translate = (pinyin) => {
    return split(pinyin, everything).map((item) => {
      if (everything) {
        if (typeof item === "string") return item
        else {
          return fromPinyinSyllable(item[0])
        }
      } else {
        return fromPinyinSyllable(item)
      }
    })
  }
  if (typeof input === "string") return translate(input)
  else return input.map(translate)
}

export const splitZhuyin = (zhuyin, everything = false) => {
  const list = []
  let index = 0
  while (index < zhuyin.length) {
    let count = zhuyin.length - index
    let wordFound = false
    while (count >= 1) {
      let word = zhuyin.substr(index, count)
      if (Object.values(py2zy).includes(word)) {
        wordFound = true
        if (toneMarks.includes(zhuyin[index + count])) {
          word += zhuyin[index + count]
          count++
        }
        // 針對"˙"前word前方的處理：應該將"˙"取得後加至後方
        if (toneMarks.includes(zhuyin[index + count - word.length - 1])) {
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

const splitZhuyin2 = (zhuyin, everything = false) => {
  const list = []
  let index = 0
  while (index < zhuyin.length) {
    let count = zhuyin.length - index
    let wordFound = false
    while (count >= 1) {
      let word = zhuyin.substr(index, count)
      if (Object.values(py2zy).includes(word)) {
        wordFound = true
        if (toneMarks.includes(zhuyin[index + count])) {
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

export const toPinyinSyllable = (zhuyin) => {
  let tone = toneMarks.indexOf(zhuyin[zhuyin.length - 1]) + 1
  if (tone > 0) {
    zhuyin = zhuyin.substr(0, zhuyin.length - 1)
  } else {
    tone = 1
  }
  let pinyinIndex = Object.values(py2zy).indexOf(zhuyin)
  if (pinyinIndex > -1) {
    return Object.keys(py2zy)[pinyinIndex] + tone
  } else {
    return zhuyin
  }
}

const convertPinyin = (pinyin) => {
  const pinyinMap = {
    1: "ǖ",
    2: "ǘ",
    3: "ǚ",
    4: "ǜ",
  }
  return pinyin.replace(/v([1-4])/g, (match, p1) => pinyinMap[p1])
}

export const toPinyin = (zhuyin, opts = {}) => {
  let list = splitZhuyin(zhuyin, opts.everything)
  if (!opts.everything) list = list.filter((item) => typeof item === "string")

  list = list.map((item) => {
    if (opts.everything && typeof item === "string") return item
    else if (typeof item !== "string") item = item[0]

    let pinyin = toPinyinSyllable(item)

    // 加入 convertPinyin 的例外處理
    pinyin = convertPinyin(pinyin)

    if (opts.numbered) return opts.everything ? [pinyin] : pinyin
    else if (opts.everything) return [numberToMark(pinyin)]
    else return numberToMark(pinyin)
  })

  return list
}

export default fromPinyin
