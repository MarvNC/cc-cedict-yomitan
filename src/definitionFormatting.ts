import type { StructuredContentNode } from 'yomichan-dict-builder/dist/types/yomitan/termbank';
import { replacePinyinNumbers } from './pinyinUtils';

// Only explicit editorial labels, not arbitrary parenthetical English glosses.
const usageLabels = new Set([
  'abbr.',
  'archaic',
  'bound form',
  'CL',
  'coll.',
  'colloquial',
  'derog.',
  'dialect',
  'euphemistic',
  'fig.',
  'formal',
  'idiom',
  'Internet slang',
  'literary',
  'lit.',
  'loanword',
  'neologism',
  'old',
  'onom.',
  'onomatopoeia',
  'polite',
  'rare',
  'Tw',
  'HK',
  'PRC',
  'computing',
  'math.',
  'medicine',
  'TCM',
  'esp.',
  'lit. and fig.',
  'slang',
  'Taiwan',
  'variant',
  'vulgar',
]);

function label(content: string, kind: string): StructuredContentNode {
  return {
    tag: 'span',
    content,
    data: { cccedict: kind },
    style: {
      fontSize: '0.85em',
      fontWeight: 'bold',
      borderStyle: 'solid',
      borderWidth: '1px',
      borderRadius: '0.25em',
      padding: '0.05em 0.3em',
    },
  };
}

/** Format only source-encoded notation; unknown text remains literal. */
export function formatDefinition(
  text: string,
  pinyin: boolean,
): StructuredContentNode[] {
  const nodes: StructuredContentNode[] = [];
  // Unicode properties also cover supplementary-plane characters. Punctuation
  // within multiword references belongs to the reference, not the English gloss.
  const tokens =
    /([\p{Script=Han}A-Za-z0-9〇·・，、：？！…—－]+(?:\|[\p{Script=Han}A-Za-z0-9〇·・，、：？！…—－]+)?)(\[[^\[\]]+\])|((?:[A-Za-z]+\s+)*pr\.)\s*(\[[^\[\]]+\])|(\([^()]+\))|(^CL:)/gu;
  let offset = 0;
  for (const match of text.matchAll(tokens)) {
    if (match.index! > offset)
      nodes.push(replacePinyinNumbers(text.slice(offset, match.index), pinyin));
    const [
      full,
      headwords,
      reading,
      pronunciationLabel,
      pronunciation,
      parenthesis,
      classifier,
    ] = match;
    if (
      headwords &&
      /\p{Script=Han}/u.test(headwords) &&
      /[1-5]/.test(reading)
    ) {
      const forms = headwords.split('|');
      const links: StructuredContentNode[] = [];
      forms.forEach((form, index) => {
        if (index) links.push('｜');
        links.push({
          tag: 'a',
          href: `?query=${encodeURIComponent(form)}`,
          content: form,
          lang: forms.length === 1 ? 'zh' : index === 0 ? 'zh-Hant' : 'zh-Hans',
        });
      });
      nodes.push({
        tag: 'span',
        data: { cccedict: 'reference' },
        content: [
          ...links,
          ' ',
          {
            tag: 'span',
            data: { cccedict: 'reference-reading' },
            style: { fontSize: '0.85em' },
            content: replacePinyinNumbers(reading, pinyin),
          },
        ],
      });
    } else if (pronunciationLabel) {
      const converted = replacePinyinNumbers(pronunciation, pinyin);
      nodes.push({
        tag: 'span',
        data: {
          cccedict: 'alt-pronunciation',
          type: pronunciationLabel.replace(/ pr\.$/, ''),
          value: converted.slice(1, -1),
        },
        content: [
          label(pronunciationLabel, 'pronunciation-label'),
          ' ',
          converted,
        ],
      });
    } else if (classifier) {
      nodes.push({
        tag: 'span',
        title: 'Classifier / measure word',
        data: { cccedict: 'classifier' },
        content: label('CL:', 'classifier-label'),
      });
    } else if (parenthesis && usageLabels.has(parenthesis.slice(1, -1))) {
      nodes.push(label(parenthesis, 'usage-label'));
    } else if (parenthesis) {
      nodes.push(
        '(',
        ...formatDefinition(parenthesis.slice(1, -1), pinyin),
        ')',
      );
    } else {
      nodes.push(replacePinyinNumbers(full, pinyin));
    }
    offset = match.index! + full.length;
  }
  if (offset < text.length)
    nodes.push(replacePinyinNumbers(text.slice(offset), pinyin));
  return nodes;
}
