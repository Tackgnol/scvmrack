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

export function getViewTransitionTypes(
  fromPathname: string | undefined,
  toPathname: string,
): string[] | false {
  if (!fromPathname || fromPathname === toPathname) return false;

  const fromSheet = isSheetRoutePath(fromPathname);
  const toSheet = isSheetRoutePath(toPathname);

  if (fromSheet && toPathname === '/print') return ['sheet-to-print'];
  if (fromPathname === '/print' && toSheet) return ['print-to-sheet'];
  if (fromSheet && toSheet) return ['sheet-swap'];
  if (toSheet) return ['to-sheet'];
  if (fromSheet) return ['from-sheet'];

  return ['page-change'];
}

export function getCharacterViewTransitionName(
  characterId: string | null | undefined,
): string {
  return characterId ? `scvm-identity-${characterId}` : 'none';
}
