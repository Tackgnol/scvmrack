import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  hasObrWriteSession,
  isGm,
  ownsCharacter,
  sessionId,
  sessionUserId,
} from '../../src/services/session.js';

test('sessionUserId / sessionId read the raw shared-auth shape', () => {
  const session = { session: { id: 'sid' }, user: { id: 'uid' } };
  assert.equal(sessionUserId(session), 'uid');
  assert.equal(sessionId(session), 'sid');
  assert.equal(sessionUserId(null), null);
  assert.equal(sessionId(null), null);
});

test('isGm requires a present, non-anonymous account', () => {
  assert.equal(isGm({ user: { id: 'u', isAnonymous: false } }), true);
  assert.equal(isGm({ user: { id: 'u', isAnonymous: true } }), false);
  assert.equal(isGm({ user: { id: null } }), false);
  assert.equal(isGm(null), false);
});

test('hasObrWriteSession accepts account or anonymous session', () => {
  assert.equal(hasObrWriteSession({ user: { id: 'u' } }), true);
  assert.equal(hasObrWriteSession({ session: { id: 's' } }), true);
  assert.equal(hasObrWriteSession({}), false);
  assert.equal(hasObrWriteSession(null), false);
});

test('ownsCharacter matches account id OR anonymous session id', () => {
  const character = { userId: 'u1', sessionId: 's1' };
  assert.equal(ownsCharacter({ user: { id: 'u1' } }, character), true);
  assert.equal(ownsCharacter({ session: { id: 's1' } }, character), true);
  assert.equal(ownsCharacter({ user: { id: 'u2' }, session: { id: 's2' } }, character), false);
  assert.equal(ownsCharacter(null, character), false);
});
