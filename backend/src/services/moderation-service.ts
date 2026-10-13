import type { ModerationReportReason, ModerationReportStatus } from '@prisma/client';
import { apiError, notFound } from '../errors.js';
import {
  moderationRepository,
  type RemovalEvidence,
  type ReportOps,
  type ReportWithClass,
} from '../repositories/moderation-repository.js';
import { createMailService } from './mail-service.js';
import type { MailLocale, ReportDecisionInput } from './mail-templates.js';
import { fail, ok, unexpected, type ServiceResult } from './result.js';
import { isModerationAdmin } from '../lib/moderation-admin.js';
import { sessionUserId, type AppSession } from './session.js';

type ModerationLogger = {
  error(obj: unknown, msg?: string): void;
  warn(obj: unknown, msg?: string): void;
};
export type PublicModerationReport = {
  classId: number;
  reason: ModerationReportReason;
  explanation: string;
  reporterName?: string;
  reporterEmail?: string;
  locale?: MailLocale;
};
type DecisionInput = { session: AppSession; id: string; reason: string };
const CSAM = 'child_sexual_abuse_material';
/** A repeat report from the same email on the same class within this window merges into the first. */
const REPORT_MERGE_WINDOW_MS = 24 * 60 * 60 * 1000;
const DISPUTE_LIMIT = 3;
const OPEN: ModerationReportStatus[] = ['open'];
const REMOVED: ModerationReportStatus[] = ['taken_down', 'content_removed'];
const hiddenAdminResource = () => fail(notFound('MODERATION_NOT_FOUND', 'Moderation resource not found'));

/** Removes reporter details from reports resolved at least two years ago. */
export async function anonymizeExpiredModerationReports(now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 2);
  return moderationRepository.anonymizeResolvedReports(cutoff);
}

/** Accepts a signed-out report and records it for human moderation. */
export function createModerationService(log: ModerationLogger) {
  return {
    async submit(
      input: PublicModerationReport
    ): Promise<ServiceResult<{ id: string }>> {
      const reporterName = input.reporterName?.trim() || null;
      const reporterEmail = input.reporterEmail?.trim().toLowerCase() || null;
      const explanation = input.explanation.trim();
      if (!explanation) {
        return fail(apiError(400, 'REPORT_EXPLANATION_REQUIRED', 'Explain why you are reporting this class'));
      }
      if (input.reason !== CSAM && (!reporterName || !reporterEmail)) {
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
        if (!cls || (cls.source === 'user' && cls.visibility !== 'public')) {
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
          });
          return { ...created, merged: false };
        });
        if (reporterEmail && !report.merged) {
          const receipt = await createMailService(log).sendReportReceipt({
            to: reporterEmail,
            locale: input.locale,
            reportId: report.id,
            className: cls.name,
          });
          if (!receipt.ok) {
            log.warn(
              { err: receipt.error, reportId: report.id },
              'Report receipt email failed'
            );
          }
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
          const report = await ops.findLatestOwnerReport(input.classId, authorUserId, REMOVED);
          if (!report) {
            return { kind: 'missing' as const };
          }
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
          const copy = await createMailService(log).sendDisputeCopy({
            reportId: result.report.id,
            className: result.report.class.name,
            ownerEmail: email,
            disputeText: input.text.trim(),
          });
          if (!copy.ok) {
            log.warn({ err: copy.error, reportId: result.report.id }, 'Dispute copy email failed');
          }
        }
        return ok({ id: result.dispute.id });
      } catch (err) {
        return fail(unexpected(log, err, 'MODERATION_DISPUTE_SAVE_FAILED', 'Failed to save the dispute'));
      }
    },
    async listOpen(input: { session: AppSession }) {
      if (!isModerationAdmin(input.session)) {
        return hiddenAdminResource();
      }
      try {
        const { reports, versions, removalLogs } = await moderationRepository.listOpenReports();
        const versionsByLineage = new Map<string, typeof versions>();
        for (const version of versions) {
          const lineageVersions = versionsByLineage.get(version.lineageId) ?? [];
          lineageVersions.push(version);
          versionsByLineage.set(version.lineageId, lineageVersions);
        }
        const restoredReports = new Set(removalLogs.filter((entry) => entry.action === 'restored').map((entry) => entry.reportId));
        const historyByOwner = new Map<string, Array<{
          id: string; className: string; date: string; reason: string | null; restored: boolean;
        }>>();
        for (const entry of removalLogs) {
          if (entry.action === 'restored' || !entry.class?.ownerUserId) {
            continue;
          }
          const history = historyByOwner.get(entry.class.ownerUserId) ?? [];
          history.push({
            id: entry.id,
            className: entry.class.name,
            date: entry.createdAt.toISOString(),
            reason: entry.reason,
            restored: entry.reportId !== null && restoredReports.has(entry.reportId),
          });
          historyByOwner.set(entry.class.ownerUserId, history);
        }
        const ownerByLineage = new Map(reports.map((report) => [report.class.lineageId, report.class.ownerUserId]));
        const reportData = reports.map((report) => ({
          id: report.id,
          classId: report.classId,
          className: report.class.name,
          lineageId: report.class.lineageId,
          classVersion: report.class.version,
          reason: report.reason,
          explanation: report.explanation,
          reporterName: report.reporterName,
          reporterEmail: report.reporterEmail,
          status: report.status,
          disputes: report.disputes.map((dispute) => ({
            id: dispute.id,
            text: dispute.text,
            createdAt: dispute.createdAt.toISOString(),
          })),
          createdAt: report.createdAt.toISOString(),
          serious: ['child_sexual_abuse_material', 'threat_to_life_or_safety', 'terrorist_content'].includes(report.reason),
        }));
        const groups = new Map<string, {
          lineageId: string;
          latest: (typeof versions)[number];
          versions: typeof versions;
          reports: typeof reportData;
          ownerUserId: string | null;
          removalHistory: ReturnType<typeof historyByOwner.get> | null;
        }>();
        for (const report of reportData) {
          const ownerUserId = ownerByLineage.get(report.lineageId);
          const classVersions = versionsByLineage.get(report.lineageId) ?? [{
            id: report.classId,
            lineageId: report.lineageId,
            name: report.className,
            version: report.classVersion,
          }];
          const group = groups.get(report.lineageId);
          if (group) {
            group.reports.push(report);
          } else {
            groups.set(report.lineageId, {
              lineageId: report.lineageId,
              latest: classVersions[0],
              versions: classVersions,
              reports: [report],
              ownerUserId: ownerUserId ?? null,
              removalHistory: ownerUserId ? historyByOwner.get(ownerUserId) ?? [] : null,
            });
          }
        }
        return ok([...groups.values()]);
      } catch (err) {
        return fail(unexpected(log, err, 'MODERATION_REPORT_LIST_FAILED', 'Failed to load moderation reports'));
      }
    },
    dismiss(input: DecisionInput) {
      return decide(input, {
        from: OPEN,
        to: 'dismissed',
        outcome: 'dismissed',
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
        outcome: 'taken_down',
        value: { takenDown: true },
        failure: ['MODERATION_TAKEDOWN_FAILED', 'Failed to take down the class'],
      });
    },
    removeContent(input: DecisionInput) {
      return decide(input, {
        from: OPEN,
        to: 'content_removed',
        // The blanked content is kept as log evidence so a restore can put it back.
        effect: async (ops, report, reason, now) => {
          const evidence = await ops.snapshotContent(report.class.lineageId);
          await ops.blankContent(evidence, now);
          await ops.hideLineage(report.class.lineageId, reason, now);
          await ops.removeFromPools(report.class.lineageId);
          return evidence;
        },
        outcome: 'content_removed',
        value: { contentRemoved: true },
        failure: ['MODERATION_CONTENT_REMOVE_FAILED', 'Failed to remove class content'],
      });
    },
    restore(input: DecisionInput) {
      return decide(input, {
        from: REMOVED,
        to: 'restored',
        effect: async (ops, report) => {
          if (report.status === 'content_removed') {
            const evidence = await ops.findRemovalEvidence(report.id);
            if (!evidence) {
              throw new Error('Missing content-removal evidence');
            }
            await ops.restoreContent(evidence);
          }
          await ops.unhideLineage(report.class.lineageId);
        },
        outcome: null,
        value: { restored: true },
        missing: 'Taken-down report not found',
        failure: ['MODERATION_RESTORE_FAILED', 'Failed to restore the class'],
      });
    },
  };

  /**
   * Moves a report from one of `from` to `to`, applies the decision's effect and logs it in one
   * transaction, then tells the reporter the outcome and, for a takedown or removal, sends the
   * author a statement of reasons. Mail failures only warn.
   */
  async function decide<T>(
    input: DecisionInput,
    decision: {
      from: ModerationReportStatus[];
      to: ModerationReportStatus;
      /** Returns content evidence to keep on the log entry. */
      effect?: (
        ops: ReportOps,
        report: ReportWithClass,
        reason: string,
        now: Date
      ) => Promise<RemovalEvidence | void>;
      /** Null for a restore, which mails nobody. */
      outcome: ReportDecisionInput['outcome'] | null;
      value: T;
      missing?: string;
      failure: [code: string, message: string];
    }
  ): Promise<ServiceResult<T>> {
    const actorUserId = sessionUserId(input.session);
    if (!isModerationAdmin(input.session) || !actorUserId) {
      return hiddenAdminResource();
    }
    const reason = input.reason.trim();
    if (!reason) {
      return fail(apiError(400, 'MODERATION_REASON_REQUIRED', 'A reason is required'));
    }
    try {
      const report = await moderationRepository.transaction(async (ops) => {
        const found = await ops.findReport(input.id);
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
          evidence,
        });
        return found;
      });
      if (!report) {
        return fail(notFound('REPORT_NOT_FOUND', decision.missing ?? 'Open report not found'));
      }
      const { outcome } = decision;
      if (outcome) {
        const mail = createMailService(log);
        const common = { locale: 'en' as const, reportId: report.id, className: report.class.name };
        if (report.reporterEmail) {
          const sent = await mail.sendReportDecision({
            ...common,
            to: report.reporterEmail,
            outcome,
            explanation: reason,
          });
          if (!sent.ok) {
            log.warn({ err: sent.error, reportId: report.id }, 'Report decision email failed');
          }
        }
        const ownerEmail = report.class.owner?.email;
        if (outcome !== 'dismissed' && ownerEmail) {
          const sent = await mail.sendStatementOfReasons({
            ...common,
            to: ownerEmail,
            measure: outcome,
            followedNotice: true,
            ground: reason,
            explanation: reason,
          });
          if (!sent.ok) {
            log.warn({ err: sent.error, reportId: report.id }, 'Statement of reasons email failed');
          }
        }
      }
      return ok(decision.value);
    } catch (err) {
      return fail(unexpected(log, err, ...decision.failure));
    }
  }
}
