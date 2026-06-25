import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createInMemoryPartyEventBus,
  type PartyEvent,
} from '../../src/plugins/party-bus.js';

const PARTY_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_PARTY_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

test('party bus publishes events to same-party subscribers', () => {
  const bus = createInMemoryPartyEventBus();
  const received: PartyEvent[] = [];

  bus.subscribe(PARTY_ID, (event) => {
    received.push(event);
  });

  bus.publish(PARTY_ID, {
    type: 'character.updated',
    characterId: 'char-1',
    fields: ['currentHp'],
  });

  assert.deepEqual(received, [
    {
      type: 'character.updated',
      characterId: 'char-1',
      fields: ['currentHp'],
    },
  ]);
});

test('party bus isolates subscribers by party id', () => {
  const bus = createInMemoryPartyEventBus();
  const received: PartyEvent[] = [];

  bus.subscribe(PARTY_ID, (event) => {
    received.push(event);
  });

  bus.publish(OTHER_PARTY_ID, { type: 'party.closed' });

  assert.deepEqual(received, []);
});

test('party bus unsubscribe stops delivery and is idempotent', () => {
  const bus = createInMemoryPartyEventBus();
  const received: PartyEvent[] = [];

  const unsubscribe = bus.subscribe(PARTY_ID, (event) => {
    received.push(event);
  });

  unsubscribe();
  unsubscribe();
  bus.publish(PARTY_ID, { type: 'party.closed' });

  assert.deepEqual(received, []);
});

test('party bus fan-out snapshots subscribers during publish', () => {
  const bus = createInMemoryPartyEventBus();
  const received: string[] = [];

  const unsubscribeFirst = bus.subscribe(PARTY_ID, () => {
    received.push('first');
    unsubscribeFirst();
  });
  bus.subscribe(PARTY_ID, () => {
    received.push('second');
  });

  bus.publish(PARTY_ID, { type: 'party.closed' });
  bus.publish(PARTY_ID, { type: 'party.closed' });

  assert.deepEqual(received, ['first', 'second', 'second']);
});

test('party bus publishes presence changes on first connect and last disconnect', () => {
  const bus = createInMemoryPartyEventBus();
  const received: PartyEvent[] = [];

  bus.subscribe(PARTY_ID, (event) => {
    received.push(event);
  });

  const disconnectFirst = bus.connectPresence(PARTY_ID, 'char-1');
  const disconnectSecond = bus.connectPresence(PARTY_ID, 'char-1');

  assert.deepEqual(received, [
    { type: 'character.presence', characterId: 'char-1', connected: true },
  ]);
  assert.deepEqual(bus.presenceSnapshot(PARTY_ID, ['char-1', 'char-2']), {
    'char-1': true,
    'char-2': false,
  });

  disconnectFirst();
  assert.deepEqual(received, [
    { type: 'character.presence', characterId: 'char-1', connected: true },
  ]);

  disconnectSecond();
  assert.deepEqual(received, [
    { type: 'character.presence', characterId: 'char-1', connected: true },
    { type: 'character.presence', characterId: 'char-1', connected: false },
  ]);
});

test('party bus keeps presence isolated by party id', () => {
  const bus = createInMemoryPartyEventBus();

  const disconnect = bus.connectPresence(PARTY_ID, 'char-1');

  assert.deepEqual(bus.presenceSnapshot(OTHER_PARTY_ID, ['char-1']), {
    'char-1': false,
  });

  disconnect();
});
