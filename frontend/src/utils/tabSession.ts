export const TAB_SESSION_KEY = "scvm.tabSession";

export function authHeaders(): Record<string, string> {
  try {
    const token = sessionStorage.getItem(TAB_SESSION_KEY);
    return token ? { Authorization: "Bearer " + token } : {};
  } catch {
    return {};
  }
}

export function setTabSession(token: string | null): boolean {
  try {
    if (token) sessionStorage.setItem(TAB_SESSION_KEY, token);
    else sessionStorage.removeItem(TAB_SESSION_KEY);
    window.dispatchEvent(new Event(TAB_SESSION_KEY));
    return true;
  } catch {
    return false;
  }
}
