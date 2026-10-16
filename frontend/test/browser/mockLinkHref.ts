export function mockLinkHref(
  to: string,
  params: Record<string, string> = {},
  search?: Record<string, string>,
): string {
  const path = Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`$${key}`, encodeURIComponent(value)),
    to,
  );
  return path + (search ? `?${new URLSearchParams(search)}` : '');
}
