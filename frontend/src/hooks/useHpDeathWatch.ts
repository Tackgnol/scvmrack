import { useEffect, useReducer } from 'react';

// Watches a character's current HP and drives two pieces of UI feedback:
//   - deathModalOpen: opens the death prompt when HP reaches 0 (including a
//     character that loads already at 0). Only ever opened here; closing is the
//     caller's responsibility via setDeathModalOpen.
//   - hpPulse: a short flash whenever HP changes (suppressed under reduced motion).
//
// The transition logic lives in a pure reducer so it can be unit-tested without
// React, and so the effect issues a single dispatch (no cascading setState).

export type HpDeathWatchState = {
  hpPulse: boolean;
  deathModalOpen: boolean;
  previousHp: number | null;
  previousCharacterId: string | null;
};

export type HpDeathWatchAction =
  | {
      type: 'sync';
      currentHp: number;
      characterId: string;
      prefersReducedMotion: boolean;
    }
  | { type: 'pulseEnd' }
  | { type: 'setDeathModalOpen'; open: boolean };

export const initialHpDeathWatchState: HpDeathWatchState = {
  hpPulse: false,
  deathModalOpen: false,
  previousHp: null,
  previousCharacterId: null,
};

const HP_PULSE_DURATION_MS = 220;

export function hpDeathWatchReducer(
  state: HpDeathWatchState,
  action: HpDeathWatchAction,
): HpDeathWatchState {
  switch (action.type) {
    case 'sync': {
      const { currentHp, characterId, prefersReducedMotion } = action;
      // On a character switch, forget the previous HP so the new character's
      // first reading can't be misread as a same-character HP change.
      const characterChanged = state.previousCharacterId !== characterId;
      const previousHp = characterChanged ? null : state.previousHp;

      const reachedZero =
        (previousHp === null && currentHp === 0) ||
        (previousHp !== null && previousHp !== 0 && currentHp === 0);

      const shouldPulse =
        previousHp !== null && previousHp !== currentHp && !prefersReducedMotion;

      return {
        hpPulse: characterChanged ? false : shouldPulse || state.hpPulse,
        deathModalOpen: reachedZero ? true : state.deathModalOpen,
        previousHp: currentHp,
        previousCharacterId: characterId,
      };
    }
    case 'pulseEnd':
      return state.hpPulse ? { ...state, hpPulse: false } : state;
    case 'setDeathModalOpen':
      return state.deathModalOpen === action.open
        ? state
        : { ...state, deathModalOpen: action.open };
  }
}

export function useHpDeathWatch(
  currentHp: number,
  characterId: string | null | undefined,
  prefersReducedMotion: boolean,
) {
  const [state, dispatch] = useReducer(
    hpDeathWatchReducer,
    initialHpDeathWatchState,
  );

  useEffect(() => {
    if (!characterId) return;
    dispatch({ type: 'sync', currentHp, characterId, prefersReducedMotion });
  }, [characterId, currentHp, prefersReducedMotion]);

  useEffect(() => {
    if (!state.hpPulse) return;
    const timeoutId = window.setTimeout(
      () => dispatch({ type: 'pulseEnd' }),
      HP_PULSE_DURATION_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [state.hpPulse]);

  const setDeathModalOpen = (open: boolean) =>
    dispatch({ type: 'setDeathModalOpen', open });

  return {
    hpPulse: state.hpPulse,
    deathModalOpen: state.deathModalOpen,
    setDeathModalOpen,
  };
}
