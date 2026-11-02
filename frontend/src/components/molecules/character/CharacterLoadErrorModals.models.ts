export type CharacterLoadIssue = 'not-found' | 'access-denied' | 'load-error' | 'session-required';

export type CharacterLoadErrorModalsProps = {
  issue: CharacterLoadIssue | null;
  error: unknown;
  onGenerateNew: () => void;
  showRoster?: boolean;
};
