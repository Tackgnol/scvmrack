/** A number with a sign, using a true minus (−1, 0, +2) as the sheet's stamps do. */
export function signed(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return "0";
}
