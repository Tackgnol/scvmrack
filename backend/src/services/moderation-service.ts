import { randomUUID } from 'node:crypto';
import type { ModerationReportReason, ModerationReportStatus } from '@prisma/client';
import { apiError, notFound } from '../errors.js';
import { isReportable, REMOVAL_MARKER } from '../lib/class-model.js';
import { blankedContent } from '../lib/class-version.js';
import {
  ANONYMOUS_REASON,
  DECIDED_STATUSES,
  IN_FORCE_STATUSES,
  isMeasure,
  type ReportDecision,
} from '../lib/moderation-model.js';
import { DAY_MS } from '../lib/time.js';
import {
  moderationRepository,
  type RemovalEvidence,
  type ReportOps,
  type ReportWithClass,
} from '../repositories/moderation-repository.js';
import type { MailLogger } from './mail-service.js';
import type { MailLocale } from './mail-templates.js';
import { createModerationNotifier, type ModerationNotifier } from './moderation-notifier.js';
import { buildModerationQueue } from './moderation-queue.js';
import { fail, ok, unexpected, type ServiceResult } from './result.js';
import { hiddenAdminResource, isModerationAdmin, moderatorId, reasonRequired } from './moderation-admin.js';
import { sessionUserId, type AppSession } from './session.js';

export type PublicModerationReport = {
  classId: number;
  reason: ModerationReportReason;
  explanation: string;
  reporterName?: string;
  reporterEmail?: string;
  locale?: MailLocale;
  /** Honeypot field: only bots fill it. */
  website?: string;
};
type DecisionInput = {
  session: AppSession;
  id: string;
  reason: string;
  /** Required for a takedown or removal: the category its statement of reasons cites. */
  ground?: ModerationReportReason;
};
/** A repeat report from the same email on the same class within this window merges into the first. */
const REPORT_MERGE_WINDOW_MS = DAY_MS;
const DISPUTE_LIMIT = 3;
const LOG_PAGE_SIZE = 100;
const OPEN: ModerationReportStatus[] = ['open'];

/** Removes reporter details from reports resolved at least two years ago. */
export async function anonymizeExpiredModerationReports(now = new Date()) {
  const before = new Date(now);
  before.setUTCFullYear(before.getUTCFullYear() - 2);
  return moderationRepository.anonymizeReports({
    statuses: [...DECIDED_STATUSES],
    before,
    explanation: '[reporter details removed]',
  });
}

/** Public reports, author disputes and allowlisted moderators' decisions on Custom Classes. */
export function createModerationService(
  log: MailLogger,
  notifier: ModerationNotifier = createModerationNotifier(log)
) {
  return {
    async submit(
      input: PublicModerationReport
    ): Promise<ServiceResult<{ id: string }>> {
      if (input.website?.trim()) {
        // A filled honeypot looks accepted so the bot learns nothing.
        return ok({ id: randomUUID() });
      }
      const reporterName = input.reporterName?.trim() || null;
      const reporterEmail = input.reporterEmail?.trim().toLowerCase() || null;
      const explanation = input.explanation.trim();
      if (!explanation) {
        return fail(apiError(400, 'REPORT_EXPLANATION_REQUIRED', 'Explain why you are reporting this class'));
      }
      if (input.reason !== ANONYMOUS_REASON && (!reporterName || !reporterEmail)) {
        return fail(
          apiError(
            400,
            'REPORTER_CONTACT_REQUIRED',
            'Your name and email are required for this report'
          )
        );
      }
      try {
        const cls = await moderationRepository.findClass(input.classId);
        if (!cls || !isReportable(cls)) {
          return fail(
            notFound('CLASS_NOT_FOUND', 'The reported class no longer exists')
          );
        }
        const report = await moderationRepository.transaction(async (ops) => {
          if (reporterEmail) {
            // Serialize one reporter-class pair so simultaneous retries still merge.
            await ops.lock(`${cls.id}:${reporterEmail}`);
            const since = new Date(Date.now() - REPORT_MERGE_WINDOW_MS);
            const recent = await ops.findReportSince(cls.id, reporterEmail, since);
            if (recent) {
              return { ...recent, merged: true };
            }
          }
          const created = await ops.createReport({
            classId: cls.id,
            reason: input.reason,
            explanation,
            reporterName,
            reporterEmail,
            reporterLocale: input.locale ?? 'en',
          });
          return { ...created, merged: false };
        });
        if (reporterEmail && !report.merged) {
          await notifier.received({ to: reporterEmail, locale: input.locale, reportId: report.id, className: cls.name });
        }
        return ok({ id: report.id });
      } catch (err) {
        return fail(
          unexpected(
            log,
            err,
            'MODERATION_REPORT_SAVE_FAILED',
            'Failed to save the report'
          )
        );
      }
    },
    async dispute(input: {
      session: AppSession;
      classId: number;
      text: string;
    }): Promise<ServiceResult<{ id: string }>> {
      const authorUserId = sessionUserId(input.session);
      if (!authorUserId) {
        return fail(apiError(401, 'UNAUTHORIZED', 'Sign in to dispute this decision'));
      }
      try {
        const result = await moderationRepository.transaction(async (ops) => {
          const report = await ops.findLatestOwnerReport(input.classId, authorUserId, IN_FORCE_STATUSES);
          if (!report) {
            return { kind: 'missing' as const };
          }
          await ops.lock(`dispute:${report.id}`);
          if ((await ops.countDisputes(report.id)) >= DISPUTE_LIMIT) {
            return { kind: 'limit' as const };
          }
          const dispute = await ops.createDispute(report.id, authorUserId, input.text.trim());
          return { kind: 'created' as const, dispute, report };
        });
        if (result.kind === 'missing') {
          return fail(notFound('TAKEDOWN_NOT_FOUND', 'No takedown decision was found for this class'));
        }
        if (result.kind === 'limit') {
          return fail(apiError(429, 'DISPUTE_LIMIT', `You have already disputed this decision ${DISPUTE_LIMIT} times`));
        }
        const email = result.report.class.owner?.email;
        if (email) {
          await notifier.disputed({
            reportId: result.report.id,
            className: result.report.class.name,
            ownerEmail: email,
            text: input.text.trim(),
          });
        }
        return ok({ id: result.dispute.id });
      } catch (err) {
        return fail(unexpected(log, err, 'MODERATION_DISPUTE_SAVE_FAILED', 'Failed to save the dispute'));
      }
    },
    /** The newest moderation log entries, for allowlisted moderators. */
    async listLog(input: { session: AppSession }) {
      if (!isModerationAdmin(input.session)) {
        return hiddenAdminResource();
      }
      try {
        const entries = await moderationRepository.listLog(LOG_PAGE_SIZE);
        return ok(
          entries.map((entry) => ({
            id: entry.id,
            action: entry.action,
            reason: entry.reason,
            ground: entry.ground,
            actorUserId: entry.actorUserId,
            reportId: entry.reportId,
            targetUserId: entry.targetUserId,
            classId: entry.class?.id ?? null,
            className: entry.class?.name ?? null,
            createdAt: entry.createdAt.toISOString(),
          }))
        );
      } catch (err) {
        return fail(unexpected(log, err, 'MODERATION_LOG_LOAD_FAILED', 'Failed to load the moderation log'));
      }
    },
    async listOpen(input: { session: AppSession }) {
      if (!isModerationAdmin(input.session)) {
        return hiddenAdminResource();
      }
      try {
        return ok(buildModerationQueue(await moderationRepository.listOpenReports()));
      } catch (err) {
        return fail(unexpected(log, err, 'MODERATION_REPORT_LIST_FAILED', 'Failed to load moderation reports'));
      }
    },
    dismiss(input: DecisionInput) {
      return decide(input, {
        from: OPEN,
        to: 'dismissed',
        value: { dismissed: true },
        failure: ['MODERATION_DISMISS_FAILED', 'Failed to dismiss the report'],
      });
    },
    takeDown(input: DecisionInput) {
      return decide(input, {
        from: OPEN,
        to: 'taken_down',
        effect: async (ops, report, reason, now) => {
          await ops.hideLineage(report.class.lineageId, reason, now);
          await ops.removeFromPools(report.class.lineageId);
        },
        value: { takenDown: true },
        failure: ['MODERATION_TAKEDOWN_FAILED', 'Failed to take down the class'],
      });
    },
    removeContent(input: DecisionInput) {
      return decide(input, {
        from: OPEN,
        to: 'content_removed',
        userContentOnly: true,
        // The blanked content is kept as log evidence so a restore can put it back. When another
        // removal is still in force the text is already blanked, so its evidence is the original.
        effect: async (ops, report, reason, now) => {
          const earlier = await ops.findLineageRemovalEvidence(report.class.lineageId, ['content_removed']);
          const evidence = earlier ?? (await ops.snapshotContent(report.class.lineageId));
          if (!earlier) {
            await ops.blankContent(blankedContent(evidence, REMOVAL_MARKER), now);
          }
          await ops.hideLineage(report.class.lineageId, reason, now);
          await ops.removeFromPools(report.class.lineageId);
          return evidence;
        },
        value: { contentRemoved: true },
        failure: ['MODERATION_CONTENT_REMOVE_FAILED', 'Failed to remove class content'],
      });
    },
    /** Undoes this report's decision; the class stays hidden while another takedown on it is in force. */
    restore(input: DecisionInput) {
      return decide(input, {
        from: IN_FORCE_STATUSES,
        to: 'restored',
        effect: async (ops, report) => {
          const lineageId = report.class.lineageId;
          const stillInForce = await ops.lineageReportStatuses(lineageId, IN_FORCE_STATUSES);
          if (report.status === 'content_removed' && !stillInForce.includes('content_removed')) {
            const evidence = await ops.findRemovalEvidence(report.id);
            if (!evidence) {
              throw new Error('Missing content-removal evidence');
            }
            await ops.restoreContent(evidence);
            await ops.clearContentRemoved(lineageId);
          }
          if (stillInForce.length === 0) {
            await ops.unhideLineage(lineageId);
          }
        },
        value: { restored: true },
        missing: 'Taken-down report not found',
        failure: ['MODERATION_RESTORE_FAILED', 'Failed to restore the class'],
      });
    },
  };

  /**
   * Moves a report from one of `from` to `to`, applies the decision's effect and logs it in one
   * transaction, then tells the reporter the outcome and, for a takedown or removal, sends the
   * author a statement of reasons. A restore mails nobody. Mail failures only warn.
   */
  async function decide<T>(
    input: DecisionInput,
    decision: {
      from: readonly ModerationReportStatus[];
      to: ReportDecision;
      /** Returns content evidence to keep on the log entry. */
      effect?: (
        ops: ReportOps,
        report: ReportWithClass,
        reason: string,
        now: Date
      ) => Promise<RemovalEvidence | void>;
      value: T;
      /** Refuses Built-in Classes, which have no user-written content to act on. */
      userContentOnly?: boolean;
      missing?: string;
      failure: [code: string, message: string];
    }
  ): Promise<ServiceResult<T>> {
    const actorUserId = moderatorId(input.session);
    if (!actorUserId) {
      return hiddenAdminResource();
    }
    const reason = input.reason.trim();
    if (!reason) {
      return fail(reasonRequired());
    }
    const measure = isMeasure(decision.to) ? decision.to : null;
    if (measure && !input.ground) {
      return fail(apiError(400, 'MODERATION_GROUND_REQUIRED', 'Choose the ground for this decision'));
    }
    const ground = measure ? input.ground : undefined;
    try {
      const report = await moderationRepository.transaction(async (ops) => {
        const found = await ops.findReport(input.id);
        if (found && decision.userContentOnly && found.class.source !== 'user') {
          return 'built-in' as const;
        }
        if (found) {
          // One decision per lineage at a time, so each sees the others' report statuses committed.
          await ops.lockLineage(found.class.lineageId);
        }
        const now = new Date();
        const resolvedAt = found?.status === 'open' ? now : undefined;
        if (!found || !(await ops.claimReport(found.id, decision.from, decision.to, resolvedAt))) {
          return null;
        }
        const evidence = (await decision.effect?.(ops, found, reason, now)) ?? undefined;
        await ops.appendLog({
          classId: found.classId,
          reportId: found.id,
          actorUserId,
          action: decision.to,
          reason,
          ground,
          evidence,
        });
        return found;
      });
      if (report === 'built-in') {
        return fail(apiError(409, 'MODERATION_BUILT_IN_CLASS', 'A Built-in Class has no user content to remove; hide it instead'));
      }
      if (!report) {
        return fail(notFound('REPORT_NOT_FOUND', decision.missing ?? 'Open report not found'));
      }
      if (decision.to !== 'restored') {
        await notifier.decided({
          report,
          outcome: decision.to,
          explanation: reason,
          statement: measure && ground ? { measure, ground } : null,
        });
      }
      return ok(decision.value);
    } catch (err) {
      return fail(unexpected(log, err, ...decision.failure));
    }
  }
}
