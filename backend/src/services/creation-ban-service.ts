import { apiError, notFound, unauthorized } from '../errors.js';
import { isModerationAdmin } from '../lib/moderation-admin.js';
import { creationBanRepository } from '../repositories/creation-ban-repository.js';
import { fail, ok, unexpected, type ServiceLogger } from './result.js';
import { sessionUserId, type AppSession } from './session.js';

const hidden = () => fail(notFound('MODERATION_NOT_FOUND', 'Moderation resource not found'));

/** Own status is readable by the GM; decisions and history require the moderation allowlist. */
export function createCreationBanService(log: ServiceLogger) {
  return {
    async own(input: { session: AppSession }) {
      const userId = sessionUserId(input.session);
      if (!userId) {
        return fail(unauthorized());
      }
      try {
        const active = await creationBanRepository.findActive(userId);
        return ok({ banned: active !== null });
      } catch (err) {
        return fail(unexpected(log, err, 'CREATION_BAN_LOAD_FAILED', 'Failed to load class creation status'));
      }
    },
    async inspect(input: { session: AppSession; userId: string }) {
      if (!isModerationAdmin(input.session)) {
        return hidden();
      }
      try {
        const user = await creationBanRepository.findUser(input.userId);
        if (!user) {
          return fail(notFound('USER_NOT_FOUND', 'User not found'));
        }
        const [active, history] = await Promise.all([
          creationBanRepository.findActive(input.userId),
          creationBanRepository.listHistory(input.userId),
        ]);
        return ok({
          userId: input.userId,
          active: active ? { reason: active.reason, bannedAt: active.bannedAt.toISOString() } : null,
          history: history.map((entry) => ({
            id: entry.id,
            action: entry.action,
            actorUserId: entry.actorUserId,
            reason: entry.reason,
            date: entry.createdAt.toISOString(),
          })),
        });
      } catch (err) {
        return fail(unexpected(log, err, 'CREATION_BAN_HISTORY_FAILED', 'Failed to load class creation history'));
      }
    },
    async ban(input: { session: AppSession; userId: string; reason: string }) {
      const actorUserId = sessionUserId(input.session);
      if (!isModerationAdmin(input.session) || !actorUserId) {
        return hidden();
      }
      const reason = input.reason.trim();
      if (!reason) {
        return fail(apiError(400, 'MODERATION_REASON_REQUIRED', 'A reason is required'));
      }
      try {
        const result = await creationBanRepository.ban(input.userId, actorUserId, reason);
        if (result === 'missing') {
          return fail(notFound('USER_NOT_FOUND', 'User not found'));
        }
        if (result === 'already') {
          return fail(apiError(409, 'CLASS_CREATION_ALREADY_BANNED', 'This user is already banned from class creation'));
        }
        return ok({ banned: true });
      } catch (err) {
        return fail(unexpected(log, err, 'CREATION_BAN_SAVE_FAILED', 'Failed to ban class creation'));
      }
    },
    async unban(input: { session: AppSession; userId: string; reason: string }) {
      const actorUserId = sessionUserId(input.session);
      if (!isModerationAdmin(input.session) || !actorUserId) {
        return hidden();
      }
      const reason = input.reason.trim();
      if (!reason) {
        return fail(apiError(400, 'MODERATION_REASON_REQUIRED', 'A reason is required'));
      }
      try {
        const removed = await creationBanRepository.unban(input.userId, actorUserId, reason);
        return removed ? ok({ banned: false }) : fail(notFound('CLASS_CREATION_BAN_NOT_FOUND', 'No active creation ban found'));
      } catch (err) {
        return fail(unexpected(log, err, 'CREATION_UNBAN_SAVE_FAILED', 'Failed to lift class creation ban'));
      }
    },
  };
}
