import { describe, expect, test } from 'bun:test';
import { parseLine } from '../src/parseLine';
import { formatDefinition } from '../src/definitionFormatting';
import { getPinyin, getZhuyin, replacePinyinNumbers } from '../src/pinyinUtils';
import type { StructuredContentNode } from 'yomichan-dict-builder/dist/types/yomitan/termbank';

function flatten(node: StructuredContentNode): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(flatten).join('');
  return 'content' in node && node.content ? flatten(node.content) : '';
}

describe('source structure', () => {
  test('v1 slash senses and semicolon glosses stay distinct', () => {
    const result = parseLine(
      '字 字 [zi4] /character; word/(literary) style name/',
    );
    expect(result.rawDefinitionArray).toEqual([
      'character; word',
      '(literary) style name',
    ]);
    expect(result.pinyinDefinitionArray.map(flatten)).toEqual(
      result.rawDefinitionArray,
    );
  });
  test('v2 and v1 can be parsed without global format flags', () => {
    expect(
      parseLine('麵包 面包 [[mian4bao1]] /bread/CL:片[pian4],塊|块[kuai4]/')
        .pinyin,
    ).toBe('miànbāo');
    expect(parseLine('麵包 面包 [mian4 bao1] /bread/').pinyin).toBe('miànbāo');
  });
  test('Cantonese raw definitions and reading are preserved, comments excluded', () => {
    const result = parseLine(
      '丁 丁 [ding1] {ding1} /fourth/a surname/ # adapted from cc-cedict',
      true,
    );
    expect(result.jyutReading).toBe('ding1');
    expect(result.rawDefinitionArray).toEqual(['fourth', 'a surname']);
  });
  test.each([
    '',
    '# comment',
    'broken',
    '字 字 [zi4 /word/',
    '字 字 [[zi4] /word/',
    '字 字 [zi4] word',
  ])('invalid input fails promptly: %s', (line) => {
    expect(() => parseLine(line)).toThrow();
  });
});

describe('rich notation without invented meanings', () => {
  test('Canto legacy brace typo stays in the reading, not the gloss', () => {
    const result = parseLine(
      '陳慧琳 陈慧琳 [chen2 hui4 lin2] {can4 wai6} lam4} /Kelly Chen Wai Lam, a Hong Kong singer/',
      true,
    );
    expect(result.jyutReading).toBe('can4 wai6} lam4');
    expect(result.rawDefinitionArray).toEqual([
      'Kelly Chen Wai Lam, a Hong Kong singer',
    ]);
  });
  test('slashes in trailing comments do not become senses', () => {
    const result = parseLine('字 字 [zi4] /character/ # note/comment/');
    expect(result.rawDefinitionArray).toEqual(['character']);
  });

  test('parenthetical references and mixed-script targets are complete', () => {
    for (const text of [
      '(abbr. for 獨立顯卡|独立显卡[du2li4 xian3ka3])',
      'see 3C產品|3C产品[san1 C chan3 pin3]',
      '卡拉OK[ka3 la1 OK]',
    ]) {
      const result = JSON.stringify(formatDefinition(text, true));
      expect(result).toContain('?query=');
    }
    expect(
      JSON.stringify(
        formatDefinition('see 3C產品|3C产品[san1 C chan3 pin3]', true),
      ),
    ).toContain(encodeURIComponent('3C产品'));
  });
  test('CC-Canto permits an empty Mandarin reading', () => {
    const result = parseLine(
      '乒鈴𠾴唥 乒鈴𠾴唥 [] {ping1 ling1 baang4 laang4} /onomatopoeia/',
      true,
    );
    expect(result.pinyin).toBe('');
    expect(result.jyutReading).toBe('ping1 ling1 baang4 laang4');
  });

  test('classifiers and both scripts link independently', () => {
    const result = formatDefinition('CL:片[pian4],塊|块[kuai4]', true);
    expect(flatten(result)).toBe('CL:片 [piàn],塊｜块 [kuài]');
    const json = JSON.stringify(result);
    expect(json).toContain('?query=%E5%A1%8A');
    expect(json).toContain('?query=%E5%9D%97');
    expect(json).toContain('classifier-label');
  });
  test('non-BMP characters and punctuation references stay intact', () => {
    const result = formatDefinition('used in 鮟鱇|𩽾𩾌[an1kang1]', true);
    expect(flatten(result)).toBe('used in 鮟鱇｜𩽾𩾌 [ānkāng]');
    expect(JSON.stringify(result)).toContain(encodeURIComponent('𩽾𩾌'));
  });
  test('arbitrary parentheses and unknown brackets are literal', () => {
    const result = formatDefinition(
      'capital (city); (fig.) example [x<y] (not a label)',
      true,
    );
    expect(flatten(result)).toBe(
      'capital (city); (fig.) example [x<y] (not a label)',
    );
    expect(JSON.stringify(result)).toContain('usage-label');
    expect(
      JSON.stringify(formatDefinition('capital (city)', true)),
    ).not.toContain('usage-label');
  });
  test('multiple pronunciation notes retain metadata', () => {
    const result = formatDefinition('Taiwan pr. [an4], also pr. [mi4]', true);
    expect(flatten(result)).toBe('Taiwan pr. [àn], also pr. [mì]');
    expect(JSON.stringify(result).match(/alt-pronunciation/g)?.length).toBe(2);
  });
  test('Zhuyin and plain Hanzi meaning fallback', () => {
    const result = parseLine('麵包 面包 [[mian4bao1]] /bread/CL:片[pian4]/');
    expect(flatten(result.zhuyinDefinitionArray[1])).toContain('ㄆㄧㄢˋ');
    expect(result.stringDefinitionArray[1]).toBe('CL:片[piàn]');
  });
});

describe('numbered pronunciation', () => {
  test.each([
    ['nu:3er2', "nǚ'ér"],
    ['hua1r5', 'huār'],
    ['Ying1-Fa3', 'Yīng-Fǎ'],
    ['e-ren2', 'e-rén'],
    ['{bai3ke4}', '{bǎikè}'],
    ['{21} san1ti3 zong1he2zheng4', '{21} sāntǐ zōnghézhèng'],
    ['xx5', 'xx5'],
    ['pai1an4', "pāi'àn"],
  ])('%s -> %s', (input, output) =>
    expect(getPinyin(input, true)).toBe(output),
  );
  test('v1 standalone Latin tokens do not consume following syllables', () => {
    expect(getPinyin('B chao1')).toBe('Bchāo');
    expect(getZhuyin('B chao1')).toBe('Bㄔㄠ');
    expect(getPinyin('T xu4')).toBe('Txù');
    expect(getPinyin('A1 Q Zheng4 zhuan4')).toBe('ĀQZhèngzhuàn');
    expect(getPinyin('pai1 an4')).toBe("pāi'àn");
  });
  test('unrecognized pronunciation never disappears in Zhuyin', () => {
    expect(getZhuyin('e-ren2 xx5', true)).toBe('e-ㄖㄣˊ xx5');
  });
  test('unknown bracket material is preserved', () => {
    expect(replacePinyinNumbers('[x<y] [note] [abc7] [a1?]', true)).toBe(
      '[x<y] [note] [abc7] [a1?]',
    );
  });
});
