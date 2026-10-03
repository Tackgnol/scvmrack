/** Reads typed text as a whole number, accepting a true minus or en dash; null when it isn't one. */
export function parseStepperText(text: string): number | null {
  const normalized = text.trim().replace(/[−–]/g, "-").replace(/^\+/, "");
  if (!/^-?\d+$/.test(normalized)) return null;
  return Number(normalized);
}
