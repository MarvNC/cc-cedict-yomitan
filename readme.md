# CC-CEDICT for Yomichan/Yomitan

[![](https://img.shields.io/github/v/tag/marvnc/cc-cedict-yomitan?style=for-the-badge&label=Last%20Release)](https://github.com/MarvNC/cc-cedict-yomitan/releases/latest)

This repository contains automatically generated Mandarin and Cantonese
dictionaries for use with
[Yomitan](https://github.com/themoeway/yomitan)/[Yomichan](https://foosoft.net/projects/yomichan/),
a free Japanese dictionary browser extension. The dictionaries are based on the
[CC-CEDICT](https://cc-cedict.org/wiki/) project, which is a free
Chinese-English dictionary that is
[regularly updated](https://cc-cedict.org/editor/editor.php?handler=ListChanges).
Cantonese readings are provided by [CC-Canto](https://cccanto.org/).

This repository is automatically updated daily and the dictionary files are
built from
[the latest dumps](https://www.mdbg.net/chinese/dictionary?page=cedict) using
the [convert script](./convert.js) in this repository and built using
[yomichan-dict-builder](https://github.com/MarvNC/yomichan-dict-builder).

For more Yomitan dictionaries and tools, see
[Yomichan Dictionaries](https://github.com/MarvNC/yomichan-dictionaries).

## Download CC-CEDICT for Yomitan

The download links below will always point toward the latest release.

- [CC-CEDICT](https://github.com/MarvNC/cc-cedict-yomitan/releases/latest/download/CC-CEDICT.zip)
- [CC-CCDICT Hanzi](https://github.com/MarvNC/cc-cedict-yomitan/releases/latest/download/CC-CEDICT.Hanzi.zip)
- [CC-CEDICT Canto](https://github.com/MarvNC/cc-cedict-yomitan/releases/latest/download/CC-CEDICT.Canto.zip)

## How to Use

- The base CC-CEDICT dictionary is a Chinese to English dictionary with pinyin
  readings.

- The Hanzi dictionary is a Chinese to English dictionary that you can access by
  clicking on the hanzi within Yomitan.

- The Canto dictionary is a Chinese to English dictionary with the same entries
  as CC-CEDICT, but with Jyutping readings for Cantonese.

### Screenshots

![chrome_𰻞𰻞麵_-_Wikiwand_-_Google_Chrome_2023-12-19_01-22-05](https://github.com/MarvNC/cc-cedict-yomitan/assets/17340496/7f032de8-2c0e-4fe5-8dcc-056b5d54c704)
![chrome_𰻞𰻞麵_-_Wikiwand_-_Google_Chrome_2023-12-19_01-22-11](https://github.com/MarvNC/cc-cedict-yomitan/assets/17340496/c59ca4e7-736a-48c9-9b87-59ffa307e1ae)

## License

The code in this repository is licensed under the MIT license. The released
dictionaries are licensed under the
[Creative Commons Attribution-ShareAlike Licence (V3.0)](https://creativecommons.org/licenses/by-sa/3.0/)
that [CC-CEDICT is licensed under](https://cc-cedict.org/wiki/).
