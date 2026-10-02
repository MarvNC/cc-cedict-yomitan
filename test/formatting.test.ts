import { describe, expect, test } from 'bun:test';
import { processLine } from '../src/dictionaryUtils';
import type { Dictionary } from 'yomichan-dict-builder';
import { parseLine } from '../src/parseLine';
import {
  formatDefinition,
  formatReferenceRuby,
} from '../src/definitionFormatting';
import { getPinyin, getZhuyin, replacePinyinNumbers } from '../src/pinyinUtils';
import type { StructuredContentNode } from 'yomichan-dict-builder/dist/types/yomitan/termbank';

function flatten(node: StructuredContentNode): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(flatten).join('');
  return 'content' in node && node.content ? flatten(node.content) : '';
}

function baseText(node: StructuredContentNode): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(baseText).join('');
  if (node.tag === 'rt') return '';
  return 'content' in node && node.content ? baseText(node.content) : '';
}
function annotations(node: StructuredContentNode): string[] {
  if (typeof node === 'string') return [];
  if (Array.isArray(node)) return node.flatMap(annotations);
  if (node.tag === 'rt') return [flatten(node)];
  return 'content' in node && node.content ? annotations(node.content) : [];
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
    expect(baseText(result)).toBe('CL:片,塊｜块');
    expect(annotations(result)).toEqual(['piàn', 'kuài', 'kuài']);
    const json = JSON.stringify(result);
    expect(json).toContain('?query=%E5%A1%8A');
    expect(json).toContain('?query=%E5%9D%97');
    expect(json).toContain('classifier-label');
  });
  test('non-BMP characters and punctuation references stay intact', () => {
    const result = formatDefinition('used in 鮟鱇|𩽾𩾌[an1kang1]', true);
    expect(baseText(result)).toBe('used in 鮟鱇｜𩽾𩾌');
    expect(annotations(result)).toEqual(['ān', 'kāng', 'ān', 'kāng']);
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

describe('smart reference ruby', () => {
  test.each(['yin2 hang2', 'yin2hang2'])(
    'aligns safe syllables: %s',
    (reading) => {
      const result = formatReferenceRuby('銀行', reading, true)!;
      expect(baseText(result)).toBe('銀行');
      expect(annotations(result)).toEqual(['yín', 'háng']);
    },
  );
  test('traditional and simplified forms align independently', () => {
    const result = formatDefinition('銀行|银行[yin2hang2]', true);
    expect(baseText(result)).toBe('銀行｜银行');
    expect(annotations(result)).toEqual(['yín', 'háng', 'yín', 'háng']);
    expect(flatten(result)).not.toContain('[');
  });
  test.each([
    ['花兒', 'hua1r5', 'huār'],
    ['B超', 'B chao1', 'B chāo'],
    ['3C產品', 'san1 C chan3 pin3', 'sān C chǎn pǐn'],
    ['你好', 'ni3', 'nǐ'],
    ['你好！', 'ni3hao3', 'nǐhǎo'],
    ['兡', '{bai3ke4}', '{bǎikè}'],
  ])('whole-term fallback for %s', (form, reading, annotation) => {
    const result = formatReferenceRuby(form, reading, true)!;
    expect(baseText(result)).toBe(form);
    expect(annotations(result)).toEqual([annotation]);
  });
  test('different script lengths do not force alignment', () => {
    const result = formatDefinition('甲乙|丙[jia3yi3]', true);
    expect(annotations(result)).toEqual(['jiǎ', 'yǐ', 'jiǎyǐ']);
  });
  test('Zhuyin uses the same safe alignment', () => {
    const result = formatReferenceRuby('銀行', 'yin2hang2', false)!;
    expect(annotations(result)).toEqual(['ㄧㄣˊ', 'ㄏㄤˊ']);
  });
  test.each(['xx5', 'ni3 xx5', 'a1?', 'not pronunciation'])(
    'unknown reading retains bracketed fallback: %s',
    (reading) => {
      expect(formatReferenceRuby('字', reading, true)).toBeUndefined();
    },
  );
  test('unknown inline pronunciation is retained once', () => {
    const result = formatDefinition('字[xx5]', true);
    expect(flatten(result)).toBe('字 [xx5]');
    expect(annotations(result)).toEqual([]);
  });
  test('CL tooltip remains available on its span', () => {
    expect(JSON.stringify(formatDefinition('CL:個[ge4]', true))).toContain(
      'Classifier / measure word',
    );
  });
});

test('dictionary output keeps original bullets and no added list spacing', async () => {
  const entries: unknown[] = [];
  const pinyinDict = {
    addTerm: async (entry: unknown) => {
      entries.push(entry);
    },
  } as unknown as Dictionary;
  await processLine({
    line: '麵包 面包 [[mian4bao1]] /bread/CL:片[pian4]/',
    pinyinDict,
    lineNumber: 1,
  });
  const content = JSON.stringify(entries);
  expect(content).toContain('"tag":"ul"');
  expect(content).not.toContain('"tag":"ol"');
  expect(content).not.toContain('marginBottom');
  expect(content).not.toContain('marginTop');
  expect(content).not.toContain('paddingLeft');
  expect(content).toContain('"tag":"ruby"');
  expect(entries).toHaveLength(2);
});
