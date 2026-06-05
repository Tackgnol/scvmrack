import { expect, test } from 'vitest';
import {
  hpDeathWatchReducer,
  initialHpDeathWatchState,
  type HpDeathWatchState,
} from '../../../src/hooks/useHpDeathWatch.ts';

const sync = (
  state: HpDeathWatchState,
  currentHp: number,
  characterId = 'char-1',
  prefersReducedMotion = false,
) =>
  hpDeathWatchReducer(state, {
    type: 'sync',
    currentHp,
    characterId,
    prefersReducedMotion,
  });

test('first sync records HP without pulsing or opening the death modal', () => {
  const state = sync(initialHpDeathWatchState, 10);
  expect(state.previousHp).toBe(10);
  expect(state.hpPulse).toBe(false);
  expect(state.deathModalOpen).toBe(false);
});

test('an HP change pulses', () => {
  const state = sync(sync(initialHpDeathWatchState, 10), 8);
  expect(state.hpPulse).toBe(true);
  expect(state.previousHp).toBe(8);
});

test('reduced motion suppresses the pulse', () => {
  const state = sync(sync(initialHpDeathWatchState, 10), 8, 'char-1', true);
  expect(state.hpPulse).toBe(false);
});

test('dropping to 0 opens the death modal', () => {
  const state = sync(sync(initialHpDeathWatchState, 8), 0);
  expect(state.deathModalOpen).toBe(true);
});

test('a character loaded already at 0 opens the death modal', () => {
  const state = sync(initialHpDeathWatchState, 0);
  expect(state.deathModalOpen).toBe(true);
});

test('staying at 0 does not re-open a death modal the user closed', () => {
  let state = sync(sync(initialHpDeathWatchState, 8), 0);
  expect(state.deathModalOpen).toBe(true);
  state = hpDeathWatchReducer(state, { type: 'setDeathModalOpen', open: false });
  expect(state.deathModalOpen).toBe(false);
  // Another render while still at 0 must not force it back open.
  state = sync(state, 0);
  expect(state.deathModalOpen).toBe(false);
});

test('switching characters resets pulse and previous HP', () => {
  const afterFirst = sync(sync(initialHpDeathWatchState, 10), 4); // pulsing
  expect(afterFirst.hpPulse).toBe(true);
  const afterSwitch = sync(afterFirst, 9, 'char-2');
  expect(afterSwitch.hpPulse).toBe(false);
  expect(afterSwitch.previousHp).toBe(9);
  expect(afterSwitch.previousCharacterId).toBe('char-2');
});

test('switching to a character at 0 HP opens the death modal', () => {
  const afterFirst = sync(initialHpDeathWatchState, 10);
  const afterSwitch = sync(afterFirst, 0, 'char-2');
  expect(afterSwitch.deathModalOpen).toBe(true);
});

test('pulseEnd clears the pulse', () => {
  const pulsing = sync(sync(initialHpDeathWatchState, 10), 8);
  expect(pulsing.hpPulse).toBe(true);
  const ended = hpDeathWatchReducer(pulsing, { type: 'pulseEnd' });
  expect(ended.hpPulse).toBe(false);
});

test('setDeathModalOpen with an unchanged value returns the same state', () => {
  const state = sync(initialHpDeathWatchState, 10);
  expect(hpDeathWatchReducer(state, { type: 'setDeathModalOpen', open: false })).toBe(
    state,
  );
});
