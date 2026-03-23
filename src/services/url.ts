export function buildClientVerificationUrl(
  authUrl: string,
  requestOrigin?: string
): string {
  const clientOrigin =
    requestOrigin || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const parsed = new URL(authUrl);

  return `${clientOrigin}${parsed.pathname}${parsed.search}`;
}
