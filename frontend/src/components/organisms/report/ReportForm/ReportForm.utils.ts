/**
 * The class id in what a reporter typed: a bare number, or a pasted class link such as
 * `/classes/12` or `?classId=12`. Null when there is none.
 */
export function parseClassReference(text: string): number | null {
  const match = /^\s*(\d+)\s*$/.exec(text) ?? /\/classes\/(\d+)/.exec(text) ?? /[?&]classId=(\d+)/.exec(text);
  const id = match ? Number(match[1]) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
