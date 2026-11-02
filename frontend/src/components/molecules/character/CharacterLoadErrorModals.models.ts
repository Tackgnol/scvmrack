export type CharacterLoadIssue = 'not-found' | 'access-denied' | 'load-error';

export type CharacterLoadErrorModalsProps = {
  issue: CharacterLoadIssue | null;
  error: unknown;
  onGenerateNew: () => void;
  showRoster?: boolean;
};
