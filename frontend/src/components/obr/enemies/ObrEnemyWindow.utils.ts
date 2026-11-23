/** Trimmed query-string value, or null when absent or blank. */
export function getSearchParam(
  name: string,
  search = window.location.search,
): string | null {
  return new URLSearchParams(search).get(name)?.trim() || null;
}
