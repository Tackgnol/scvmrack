import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

let active: { reason: string; bannedAt: Date } | null = null;
const history: Array<{ id: string; action: string; actorUserId: string; reason: string; createdAt: Date }> = [];
let reads = 0;
mock.module('../../src/repositories/creation-ban-repository.js', {
  namedExports: {
    creationBanRepository: {
      findUser: async (userId: string) => userId === 'gm-1' ? { id: userId } : null,
      findActive: async () => { reads++; return active; },
      listHistory: async () => history,
      transaction: async (work: (ops: unknown) => Promise<unknown>) =>
        work({
          userExists: async (userId: string) => userId === 'gm-1',
          addBan: async (_userId: string, _actor: string, reason: string) => {
            if (active) {
              return false;
            }
            active = { reason, bannedAt: new Date('2026-10-10T12:00:00.000Z') };
            return true;
          },
          removeBan: async () => {
            if (!active) {
              return false;
            }
            active = null;
            return true;
          },
          appendLog: async (entry: { action: string; actorUserId: string; reason: string }) => {
            history.unshift({ id: `log-${history.length}`, ...entry, createdAt: new Date('2026-10-10T12:00:00.000Z') });
          },
        }),
    },
  },
});

const { createCreationBanService } = await import('../../src/services/creation-ban-service.js');
const service = createCreationBanService({ error: () => {}, warn: () => {} });
const gm = { user: { id: 'gm-1' } };
const admin = { user: { id: 'admin-1' } };

test('only moderators can set, lift, and inspect a user-based creation ban', async () => {
  const previous = process.env.MODERATION_ADMIN_USER_IDS;
  process.env.MODERATION_ADMIN_USER_IDS = 'admin-1';
  reads = 0;
  try {
    const denied = await service.inspect({ session: gm, userId: 'gm-1' });
    assert.equal(!denied.ok && denied.error.statusCode, 404);
    assert.equal(reads, 0);
    const deniedBan = await service.ban({ session: gm, userId: 'gm-1', reason: 'Abuse' });
    const deniedUnban = await service.unban({ session: gm, userId: 'gm-1', reason: 'Appeal' });
    assert.equal(!deniedBan.ok && deniedBan.error.statusCode, 404);
    assert.equal(!deniedUnban.ok && deniedUnban.error.statusCode, 404);
    const missingReason = await service.ban({ session: admin, userId: 'gm-1', reason: '   ' });
    assert.equal(!missingReason.ok && missingReason.error.code, 'MODERATION_REASON_REQUIRED');

    const banned = await service.ban({ session: admin, userId: 'gm-1', reason: '  Repeated removals  ' });
    assert.equal(banned.ok && banned.value.banned, true);
    const duplicate = await service.ban({ session: admin, userId: 'gm-1', reason: 'Again' });
    assert.equal(!duplicate.ok && duplicate.error.code, 'CLASS_CREATION_ALREADY_BANNED');
    const own = await service.own({ session: gm });
    assert.deepEqual(own.ok && own.value, { banned: true });
    const inspected = await service.inspect({ session: admin, userId: 'gm-1' });
    assert.equal(inspected.ok && inspected.value.history[0].actorUserId, 'admin-1');
    assert.equal(inspected.ok && inspected.value.history[0].reason, 'Repeated removals');

    const lifted = await service.unban({ session: admin, userId: 'gm-1', reason: 'Appeal upheld' });
    assert.equal(lifted.ok && lifted.value.banned, false);
    const after = await service.inspect({ session: admin, userId: 'gm-1' });
    assert.deepEqual(after.ok && after.value.history.map((entry) => entry.action), ['class_creation_unbanned', 'class_creation_banned']);
    assert.equal(after.ok && after.value.active, null);
    const ownAfter = await service.own({ session: gm });
    assert.deepEqual(ownAfter.ok && ownAfter.value, { banned: false });
  } finally {
    if (previous === undefined) {
      delete process.env.MODERATION_ADMIN_USER_IDS;
    } else {
      process.env.MODERATION_ADMIN_USER_IDS = previous;
    }
  }
});
