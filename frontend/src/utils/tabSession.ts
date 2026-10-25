export const TAB_SESSION_KEY = "scvm.tabSession";
let receivingSessionEstablished = false;

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
