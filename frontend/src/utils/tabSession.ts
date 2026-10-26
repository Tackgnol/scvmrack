export const TAB_SESSION_KEY = "scvm.tabSession";
let receivingSessionEstablished = false;
const UNVERIFIED_SESSION_KEY = "scvm.unverifiedSession";
let unverifiedSession = false;

export function isTabSessionUnverified(): boolean {
  try {
    return (
      unverifiedSession ||
      sessionStorage.getItem(UNVERIFIED_SESSION_KEY) === "1"
    );
  } catch {
    return unverifiedSession;
  }
}

export function quarantineTabSession(): void {
  unverifiedSession = true;
  try {
    sessionStorage.setItem(UNVERIFIED_SESSION_KEY, "1");
  } catch {
    /* Memory keeps this document blocked when storage is unavailable. */
  }
  setTabSession(null);
}

export function confirmTabSession(): void {
  unverifiedSession = false;
  try {
    sessionStorage.removeItem(UNVERIFIED_SESSION_KEY);
  } catch {
    /* Storage may be disabled by the host. */
  }
  window.dispatchEvent(new Event(TAB_SESSION_KEY));
}

export function requireVerifiedSession(): void {
  if (isTabSessionUnverified()) {
    throw new Error("Retry sign-out before using this unverified session");
  }
}

export function tabSessionSnapshot(): string | null {
  try {
    return sessionStorage.getItem(TAB_SESSION_KEY);
  } catch {
    return null;
  }
}

export function subscribeTabSession(changed: () => void): () => void {
  window.addEventListener(TAB_SESSION_KEY, changed);
  return () => window.removeEventListener(TAB_SESSION_KEY, changed);
}

export function authHeaders(): Record<string, string> {
  try {
    // New tabs inherit sessionStorage. Approval/opening pages must first read
    // their first-party account, then use only a token issued to this document.
    if (
      (window.location.pathname === "/obr-auth-done" ||
        window.location.pathname === "/obr-open") &&
      !receivingSessionEstablished
    ) {
      return {};
    }
    const token = tabSessionSnapshot();
    return token ? { Authorization: "Bearer " + token } : {};
  } catch {
    return {};
  }
}

export function setTabSession(token: string | null): boolean {
  receivingSessionEstablished = Boolean(token);
  try {
    if (token) {
      sessionStorage.setItem(TAB_SESSION_KEY, token);
    } else {
      sessionStorage.removeItem(TAB_SESSION_KEY);
    }
    window.dispatchEvent(new Event(TAB_SESSION_KEY));
    return true;
  } catch {
    return false;
  }
}
