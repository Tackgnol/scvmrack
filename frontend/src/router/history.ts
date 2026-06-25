import { createBrowserHistory, type RouterHistory } from '@tanstack/history';

// Accept an optional /{lang}/ URL prefix (e.g. /pl/characters). Before the router
// or i18n initialise we pull the locale off the path, write it to the language
// detector's localStorage cache (`i18nextLng`, read first by the detector), then
// rewrite the URL to its unprefixed form so every existing route resolves
// unchanged. ponytail: a bootstrap-time rewrite, not a duplicated `$lang` segment
// on all ~16 routes — `/pl/characters` lands on `/characters` in Polish.
if (typeof window !== 'undefined') {
  const match = window.location.pathname.match(/^\/(en|pl)(?=\/|$)/);
  if (match) {
    try {
      window.localStorage.setItem('i18nextLng', match[1]);
    } catch {
      // No storage (private mode): the detector just falls back to its defaults.
    }
    const stripped = window.location.pathname.slice(match[0].length) || '/';
    window.history.replaceState(
      window.history.state,
      '',
      stripped + window.location.search + window.location.hash,
    );
  }
}

export const appHistory: RouterHistory = createBrowserHistory();
