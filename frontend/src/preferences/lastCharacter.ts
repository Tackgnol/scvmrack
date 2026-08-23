const LAST_CHARACTER_ID_STORAGE_KEY = 'last-character-id';

export function readRememberedCharacterId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.localStorage.getItem(LAST_CHARACTER_ID_STORAGE_KEY);
    if (!stored) return null;
    const trimmed = stored.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

export function writeRememberedCharacterId(id: string | null): void {
  if (typeof window === 'undefined') return;

  try {
    if (id) {
      window.localStorage.setItem(LAST_CHARACTER_ID_STORAGE_KEY, id);
    } else {
      window.localStorage.removeItem(LAST_CHARACTER_ID_STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function clearRememberedCharacterId(): void {
  writeRememberedCharacterId(null);
}
