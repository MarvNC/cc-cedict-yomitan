## improved
- 修正無法轉換單音的bug
- 修正注音4聲會轉換錯誤的bug
- 修正注音'ㄩ'轉換成pinyin會不正確的問題。
- 修正輕聲判別位置賺前後與轉換後，應在前方而不是在後方。 ex: Ｘ[ㄇㄜ˙],Ｏ[˙ㄇㄜ]
- 加入一些少用的拼音。 ex: 黁[ㄋㄨㄣˊ]

## Install

```shell
npm install zhuyin-imporved
```

## Usage

```js
const zhuyin = require("zhuyin-improved")

zhuyin("wǒ de māo xǐhuan hē níunǎi").then(console.log)

zhuyin("wo3 de mao1 xi3huan he1niu2 nai3").then(console.log)

zhuyin("wǒdemāoxǐhuanhēníunǎi").then(console.log)

zhuyin("wo3demao1xi3huanhe1niu2nai3").then(console.log)

// [ 'ㄨㄛˇ', 'ㄉㄜ˙', 'ㄇㄠ', 'ㄒㄧˇ', 'ㄏㄨㄢ˙', 'ㄏㄜ', 'ㄋㄧㄡˊ', 'ㄋㄞˇ' ]
```

## Related

- [`pinyin-utils`](https://github.com/pepebecker/pinyin-utils)
- [`pinyin-split`](https://github.com/pepebecker/pinyin-split)
- [`find-hanzi`](https://github.com/pepebecker/find-hanzi)
- [`hsk-words`](https://github.com/pepebecker/hsk-words)
- [`cedict`](https://github.com/pepebecker/cedict)
- [`mdbg`](https://github.com/pepebecker/mdbg)
- [`pinyin-or-hanzi`](https://github.com/pepebecker/pinyin-or-hanzi)
- [`hanzi-to-pinyin`](https://github.com/pepebecker/hanzi-to-pinyin)
- [`pinyin-convert`](https://github.com/pepebecker/pinyin-convert)
- [`pinyin-rest`](https://github.com/pepebecker/pinyin-rest)
- [`pinyin-api`](https://github.com/pepebecker/pinyin-api)
- [`pinyin-bot-core`](https://github.com/pepebecker/pinyin-bot-core)
- [`pinyin-telegram`](https://github.com/pepebecker/pinyin-telegram)
- [`pinyin-messenger`](https://github.com/pepebecker/pinyin-messenger)
- [`pinyin-line`](https://github.com/pepebecker/pinyin-line)
- [`pinyin-chrome`](https://github.com/pepebecker/pinyin-chrome)
- [`pinyin-cli`](https://github.com/pepebecker/pinyin-cli)
- [`hanzi-cli`](https://github.com/pepebecker/hanzi-cli)
