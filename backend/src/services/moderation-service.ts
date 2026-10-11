import type { ModerationReportReason } from '@prisma/client';
import { apiError, notFound } from '../errors.js';
import { moderationRepository } from '../repositories/moderation-repository.js';
import { createMailService } from './mail-service.js';
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
  locale?: 'en' | 'pl';
};
const CSAM = 'child_sexual_abuse_material';
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
        if (!cls || (cls.source === 'user' && cls.visibility !== 'public'))
          return fail(
            notFound('CLASS_NOT_FOUND', 'The reported class no longer exists')
          );
        const report = await moderationRepository.createOrMergeReport({
          classId: cls.id,
          reason: input.reason,
          explanation,
          reporterName,
          reporterEmail,
        });
        if (reporterEmail && !report.merged) {
          const receipt = await createMailService(log).sendReportReceipt({
            to: reporterEmail,
            locale: input.locale,
            reportId: report.id,
            className: cls.name,
          });
          if (!receipt.ok)
            log.warn(
              { err: receipt.error, reportId: report.id },
              'Report receipt email failed'
            );
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
      if (!authorUserId) return fail(apiError(401, 'UNAUTHORIZED', 'Sign in to dispute this decision'));
      try {
        const result = await moderationRepository.createDispute(
          input.classId,
          authorUserId,
          input.text.trim()
        );
        if (result.kind === 'missing')
          return fail(notFound('TAKEDOWN_NOT_FOUND', 'No takedown decision was found for this class'));
        if (result.kind === 'limit')
          return fail(apiError(429, 'DISPUTE_LIMIT', 'You have already disputed this decision 3 times'));
        const email = result.report.class.owner?.email;
        if (email) {
          const copy = await createMailService(log).sendDisputeCopy({
            reportId: result.report.id,
            className: result.report.class.name,
            ownerEmail: email,
            disputeText: input.text.trim(),
          });
          if (!copy.ok) log.warn({ err: copy.error, reportId: result.report.id }, 'Dispute copy email failed');
        }
        return ok({ id: result.dispute.id });
      } catch (err) {
        return fail(unexpected(log, err, 'MODERATION_DISPUTE_SAVE_FAILED', 'Failed to save the dispute'));
      }
    },
    async listOpen(input: { session: AppSession }) {
      if (!isModerationAdmin(input.session)) return hiddenAdminResource();
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
          if (entry.action === 'restored' || !entry.class?.ownerUserId) continue;
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
    async dismiss(input: { session: AppSession; id: string; reason: string }) {
      const actorUserId = sessionUserId(input.session);
      if (!isModerationAdmin(input.session) || !actorUserId) return hiddenAdminResource();
      const reason = input.reason.trim();
      if (!reason)
        return fail(apiError(400, 'MODERATION_REASON_REQUIRED', 'A reason is required'));
      try {
        const report = await moderationRepository.dismissReport(input.id, actorUserId, reason);
        if (report?.reporterEmail) {
          const decision = await createMailService(log).sendReportDecision({
            to: report.reporterEmail,
            locale: 'en',
            reportId: report.id,
            className: report.class.name,
            outcome: 'dismissed',
            explanation: reason,
          });
          if (!decision.ok)
            log.warn({ err: decision.error, reportId: report.id }, 'Report decision email failed');
        }
        return report ? ok({ dismissed: true }) : fail(notFound('REPORT_NOT_FOUND', 'Open report not found'));
      } catch (err) {
        return fail(unexpected(log, err, 'MODERATION_DISMISS_FAILED', 'Failed to dismiss the report'));
      }
    },
    async takeDown(input: { session: AppSession; id: string; reason: string }) {
      const actorUserId = sessionUserId(input.session);
      if (!isModerationAdmin(input.session) || !actorUserId) return hiddenAdminResource();
      const reason = input.reason.trim();
      if (!reason)
        return fail(apiError(400, 'MODERATION_REASON_REQUIRED', 'A reason is required'));
      try {
        const report = await moderationRepository.takeDownReport(input.id, actorUserId, reason);
        const mail = createMailService(log);
        if (report?.reporterEmail) {
          const decision = await mail.sendReportDecision({
            to: report.reporterEmail,
            locale: 'en',
            reportId: report.id,
            className: report.class.name,
            outcome: 'taken_down',
            explanation: reason,
          });
          if (!decision.ok)
            log.warn({ err: decision.error, reportId: report.id }, 'Report decision email failed');
        }
        if (report?.class.owner?.email) {
          const statement = await mail.sendStatementOfReasons({
            to: report.class.owner.email,
            locale: 'en',
            className: report.class.name,
            measure: 'taken_down',
            followedNotice: true,
            ground: reason,
            explanation: reason,
            reportId: report.id,
          });
          if (!statement.ok)
            log.warn({ err: statement.error, reportId: report.id }, 'Statement of reasons email failed');
        }
        return report ? ok({ takenDown: true }) : fail(notFound('REPORT_NOT_FOUND', 'Open report not found'));
      } catch (err) {
        return fail(unexpected(log, err, 'MODERATION_TAKEDOWN_FAILED', 'Failed to take down the class'));
      }
    },
    async removeContent(input: { session: AppSession; id: string; reason: string }) {
      const actorUserId = sessionUserId(input.session);
      if (!isModerationAdmin(input.session) || !actorUserId) return hiddenAdminResource();
      const reason = input.reason.trim();
      if (!reason) return fail(apiError(400, 'MODERATION_REASON_REQUIRED', 'A reason is required'));
      try {
        const report = await moderationRepository.removeContentReport(input.id, actorUserId, reason);
        const mail = createMailService(log);
        if (report?.reporterEmail) {
          const decision = await mail.sendReportDecision({
            to: report.reporterEmail,
            locale: 'en',
            reportId: report.id,
            className: report.class.name,
            outcome: 'content_removed',
            explanation: reason,
          });
          if (!decision.ok) log.warn({ err: decision.error, reportId: report.id }, 'Report decision email failed');
        }
        if (report?.class.owner?.email) {
          const statement = await mail.sendStatementOfReasons({
            to: report.class.owner.email,
            locale: 'en',
            className: report.class.name,
            measure: 'content_removed',
            followedNotice: true,
            ground: reason,
            explanation: reason,
            reportId: report.id,
          });
          if (!statement.ok) log.warn({ err: statement.error, reportId: report.id }, 'Statement of reasons email failed');
        }
        return report ? ok({ contentRemoved: true }) : fail(notFound('REPORT_NOT_FOUND', 'Open report not found'));
      } catch (err) {
        return fail(unexpected(log, err, 'MODERATION_CONTENT_REMOVE_FAILED', 'Failed to remove class content'));
      }
    },    async restore(input: { session: AppSession; id: string; reason: string }) {
      const actorUserId = sessionUserId(input.session);
      if (!isModerationAdmin(input.session) || !actorUserId) return hiddenAdminResource();
      const reason = input.reason.trim();
      if (!reason) return fail(apiError(400, 'MODERATION_REASON_REQUIRED', 'A reason is required'));
      try {
        const report = await moderationRepository.restoreReport(input.id, actorUserId, reason);
        return report ? ok({ restored: true }) : fail(notFound('REPORT_NOT_FOUND', 'Taken-down report not found'));
      } catch (err) {
        return fail(unexpected(log, err, 'MODERATION_RESTORE_FAILED', 'Failed to restore the class'));
      }
    },
  };
}
