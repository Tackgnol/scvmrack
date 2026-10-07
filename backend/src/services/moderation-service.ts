import type { ModerationReportReason } from '@prisma/client';
import { apiError, forbidden, notFound } from '../errors.js';
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

/** Accepts a signed-out report and records it for human moderation. */
export function createModerationService(log: ModerationLogger) {
  return {
    async submit(
      input: PublicModerationReport
    ): Promise<ServiceResult<{ id: string }>> {
      const reporterName = input.reporterName?.trim() || null;
      const reporterEmail = input.reporterEmail?.trim().toLowerCase() || null;
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
        if (!cls)
          return fail(
            notFound('CLASS_NOT_FOUND', 'The reported class no longer exists')
          );
        const report = await moderationRepository.createOrMergeReport({
          classId: cls.id,
          reason: input.reason,
          explanation: input.explanation.trim(),
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
    },    async listOpen(input: { session: AppSession }) {
      if (!isModerationAdmin(input.session)) return fail(forbidden());
      try {
        const reports = await moderationRepository.listOpenReports();
        return ok(reports.map((report) => ({
          id: report.id, classId: report.classId, className: report.class.name,
          reason: report.reason, explanation: report.explanation,
          reporterName: report.reporterName, reporterEmail: report.reporterEmail,
          createdAt: report.createdAt.toISOString(),
          serious: ['child_sexual_abuse_material', 'threat_to_life_or_safety', 'terrorist_content'].includes(report.reason),
        })));
      } catch (err) {
        return fail(unexpected(log, err, 'MODERATION_REPORT_LIST_FAILED', 'Failed to load moderation reports'));
      }
    },
    async dismiss(input: { session: AppSession; id: string; reason: string }) {
      const actorUserId = sessionUserId(input.session);
      if (!isModerationAdmin(input.session) || !actorUserId) return fail(forbidden());
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
      if (!isModerationAdmin(input.session) || !actorUserId) return fail(forbidden());
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
    async restore(input: { session: AppSession; id: string; reason: string }) {
      const actorUserId = sessionUserId(input.session);
      if (!isModerationAdmin(input.session) || !actorUserId) return fail(forbidden());
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