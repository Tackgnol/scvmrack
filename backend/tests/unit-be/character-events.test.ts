import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';
import { createInMemoryPartyEventBus } from '../../src/plugins/party-bus.js';

const sensitive = 'private sheet text and bearer SECRET';
let lookupError: Error | null;
let captureThrows: boolean;
let processor: ((event: Record<string, unknown>) => unknown) | undefined;
const events: unknown[] = [];
const log = { error: mock.fn() };

mock.module('../../src/repositories/character-repository.js', {
  namedExports: { characterRepository: {
    getUpdateAudiences: async (characterIds: string[]) => {
      if (lookupError) {
        throw lookupError;
      }
      return characterIds.map(characterId => ({ characterId, partyIds: ['party-a', 'party-b'] }));
    },
  } },
});

mock.module('@sentry/node', {
  namedExports: {
    isInitialized: () => true,
    withScope: (callback: (scope: { addEventProcessor: (value: typeof processor) => void }) => void) =>
      callback({ addEventProcessor: value => { processor = value; } }),
    captureException: (error: Error) => {
      if (captureThrows) {
        throw new Error('Monitoring unavailable');
      }
      const event = { event_id: 'event', exception: { values: [{ value: error.message }] },
        request: { data: sensitive }, user: { email: sensitive }, breadcrumbs: [{ message: sensitive }], extra: { text: sensitive } };
      events.push(processor ? processor(event) : event);
    },
  },
});

const { publishCharacterUpdates } = await import('../../src/services/character-events.js');

beforeEach(() => {
  lookupError = null;
  captureThrows = false;
  processor = undefined;
  events.length = 0;
  log.error.mock.resetCalls();
});

test('audience lookup failure produces one sanitized GlitchTip event', async () => {
  lookupError = new Error(sensitive);
  await publishCharacterUpdates(createInMemoryPartyEventBus(), ['scvm'], ['notes'], log);
  assert.equal(events.length, 1);
  assert.equal(JSON.stringify(events).includes(sensitive), false);
  assert.deepEqual((events[0] as { tags: unknown }).tags,
    { source: 'backend', operation: 'character.notification', notification_stage: 'audience_lookup' });
  assert.equal(log.error.mock.calls.length, 1);
});

test('a failed recipient is reported without preventing the healthy recipient', async () => {
  const delivered: string[] = [];
  const bus = createInMemoryPartyEventBus();
  bus.publish = partyId => {
    if (partyId === 'party-a') {
      throw new Error(sensitive);
    }
    delivered.push(partyId);
  };
  await publishCharacterUpdates(bus, ['scvm'], ['currentHp'], log);
  assert.deepEqual(delivered, ['party-b']);
  assert.equal(events.length, 1);
  assert.equal(JSON.stringify(events).includes(sensitive), false);
  assert.equal((events[0] as { tags: { notification_stage: string } }).tags.notification_stage, 'publish');
});

test('monitoring failure cannot reject a committed change notification', async () => {
  lookupError = new Error(sensitive);
  captureThrows = true;
  await assert.doesNotReject(publishCharacterUpdates(createInMemoryPartyEventBus(), ['scvm'], ['currentHp'], log));
  assert.equal(log.error.mock.calls.length, 1);
});

test('successful notifications produce no monitoring event', async () => {
  await publishCharacterUpdates(createInMemoryPartyEventBus(), ['scvm'], ['currentHp'], log);
  assert.deepEqual(events, []);
});
