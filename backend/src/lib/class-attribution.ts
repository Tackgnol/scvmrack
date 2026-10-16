import type { ClassSource } from './class-model.js';

/** Returns the credit line shown beside a class when its source requires one. */
export function classAttribution(input: {
  source: ClassSource;
  ownerName: string | null;
  creditWork: string | null;
  creditAuthor: string | null;
}): string | null {
  if (input.source === 'user') {
    return `created by ${input.ownerName ?? 'a former GM'}`;
  }
  if (input.creditWork && input.creditAuthor) {
    return `from ${input.creditWork} by ${input.creditAuthor}`;
  }
  return null;
}