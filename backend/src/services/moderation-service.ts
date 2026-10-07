import type { ModerationReportReason } from '@prisma/client';
import { apiError, notFound } from '../errors.js';
import { moderationRepository } from '../repositories/moderation-repository.js';
import { createMailService } from './mail-service.js';
import { fail, ok, unexpected, type ServiceResult } from './result.js';

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
      const reporterEmail = input.reporterEmail?.trim() || null;
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
        const report = await moderationRepository.createReport({
          classId: cls.id,
          reason: input.reason,
          explanation: input.explanation.trim(),
          reporterName,
          reporterEmail,
        });
        if (reporterEmail) {
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
  };
}
