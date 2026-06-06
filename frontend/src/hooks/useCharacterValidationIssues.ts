import { useState } from 'react';
import { useSnackbar } from '@/SnackbarContext/SnackbarProvider.tsx';

type ValidationState = {
  key: string;
  issues: Record<string, string>;
  shownMessages: Record<string, string>;
};

function createValidationState(key: string): ValidationState {
  return { key, issues: {}, shownMessages: {} };
}

function normalizeValidationState(
  state: ValidationState,
  key: string
): ValidationState {
  return state.key === key ? state : createValidationState(key);
}

/**
 * Owns per-character/per-locale field validation issues. The state is keyed by
 * `validationStateKey` so switching character or locale transparently resets it.
 */
export function useCharacterValidationIssues(validationStateKey: string) {
  const { showError } = useSnackbar();
  const [validationState, setValidationState] = useState<ValidationState>(() =>
    createValidationState(validationStateKey)
  );

  if (validationState.key !== validationStateKey) {
    setValidationState(createValidationState(validationStateKey));
  }

  const active = normalizeValidationState(validationState, validationStateKey);

  const setValidationIssue = (id: string, message: string) => {
    if (active.shownMessages[id] !== message) {
      showError(message);
    }

    setValidationState((previous) => {
      const current = normalizeValidationState(previous, validationStateKey);
      if (
        current.issues[id] === message &&
        current.shownMessages[id] === message
      ) {
        return previous;
      }

      return {
        key: validationStateKey,
        issues: { ...current.issues, [id]: message },
        shownMessages: { ...current.shownMessages, [id]: message },
      };
    });
  };

  const clearValidationIssue = (id: string) => {
    setValidationState((previous) => {
      const current = normalizeValidationState(previous, validationStateKey);
      if (!(id in current.issues) && !(id in current.shownMessages)) {
        return previous;
      }

      const nextIssues = { ...current.issues };
      const nextShownMessages = { ...current.shownMessages };
      delete nextIssues[id];
      delete nextShownMessages[id];

      return {
        key: validationStateKey,
        issues: nextIssues,
        shownMessages: nextShownMessages,
      };
    });
  };

  const clearValidationIssues = () => {
    setValidationState(createValidationState(validationStateKey));
  };

  const validationIssues = Object.entries(active.issues).map(
    ([id, message]) => ({ id, message })
  );

  return {
    validationIssues,
    setValidationIssue,
    clearValidationIssue,
    clearValidationIssues,
    validationIssueHandlers: { setValidationIssue, clearValidationIssue },
  };
}
