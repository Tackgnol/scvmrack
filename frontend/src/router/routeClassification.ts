const CHARACTER_DETAIL_RESERVED_SEGMENTS = new Set(['create', 'new']);

export function isPartyCharacterRoutePath(pathname: string): boolean {
  return /^\/party\/[^/]+\/character\/[^/]+$/.test(pathname);
}

export function isSheetRoutePath(pathname: string): boolean {
  if (pathname === '/character' || pathname === '/character/new') {
    return true;
  }

  const characterDetailMatch = pathname.match(/^\/character\/([^/]+)$/);
  if (characterDetailMatch?.[1]) {
    return !CHARACTER_DETAIL_RESERVED_SEGMENTS.has(characterDetailMatch[1]);
  }

  return isPartyCharacterRoutePath(pathname);
}
