const JOIN_TOKEN_PATH = /^\/join\/([^/]+)/;
const INVITE_TOKEN_SHAPE = /^[A-Za-z0-9_-]{1,256}$/;

/**
 * Reads the invite token from /join/:token[/...]. A token that cannot be a real invite
 * (bad percent-encoding, a null byte, path characters, over 256 characters) yields null so the page
 * shows the normal invalid-invite message instead of calling the API with hostile text.
 */
export function getJoinToken(pathname: string): string | null {
  const raw = pathname.match(JOIN_TOKEN_PATH)?.[1];
  if (!raw) {
    return null;
  }
  try {
    const token = decodeURIComponent(raw);
    return INVITE_TOKEN_SHAPE.test(token) ? token : null;
  } catch {
    return null;
  }
}
