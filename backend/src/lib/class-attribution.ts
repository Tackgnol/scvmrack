import type { ClassSource } from './class-model.js';

const COPY = {
  en: {
    owner: (name: string) => `created by ${name}`,
    ownerFormer: 'created by a former GM',
    credit: (work: string, author: string) => `from ${work} by ${author}`,
  },
  pl: {
    owner: (name: string) => `stworzona przez ${name}`,
    ownerFormer: 'stworzona przez byłego MG',
    credit: (work: string, author: string) => `z ${work}, autor: ${author}`,
  },
};

/** Returns the credit line shown beside a class when its source requires one, in the reader's locale. */
export function classAttribution(input: {
  source: ClassSource;
  ownerName: string | null;
  creditWork: string | null;
  creditAuthor: string | null;
}, locale: string): string | null {
  const copy = locale === 'pl' ? COPY.pl : COPY.en;
  if (input.source === 'user') {
    return input.ownerName ? copy.owner(input.ownerName) : copy.ownerFormer;
  }
  if (input.creditWork && input.creditAuthor) {
    return copy.credit(input.creditWork, input.creditAuthor);
  }
  return null;
}
