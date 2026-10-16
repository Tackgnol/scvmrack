import type { ModerationReportReason } from '@prisma/client';
import type { ReportMeasure } from '../lib/moderation-model.js';
import { createMailService, type MailLogger } from './mail-service.js';
import type { MailLocale, ReportDecisionInput } from './mail-templates.js';

/** A decided report as the notifier needs it. */
export type NotifiedReport = {
  id: string;
  reporterEmail: string | null;
  reporterLocale: string;
  class: { name: string; owner: { email: string | null } | null };
};

/** Who hears about each moderation step. Failed mail is logged as a warning and never fails the step. */
export type ModerationNotifier = {
  received(input: { to: string; locale: MailLocale | undefined; reportId: string; className: string }): Promise<void>;
  /** Tells the reporter the outcome and, for a takedown or removal, sends the author a statement of reasons. */
  decided(input: {
    report: NotifiedReport;
    outcome: ReportDecisionInput['outcome'];
    explanation: string;
    statement: { measure: ReportMeasure; ground: ModerationReportReason } | null;
  }): Promise<void>;
  disputed(input: { reportId: string; className: string; ownerEmail: string; text: string }): Promise<void>;
};

/** The notifier that sends real mail through SES. */
export function createModerationNotifier(log: MailLogger): ModerationNotifier {
  const mail = createMailService(log);
  const warnOnFailure = (reportId: string, what: string) => (result: { ok: boolean; error?: unknown }) => {
    if (!result.ok) {
      log.warn({ err: result.error, reportId }, `${what} email failed`);
    }
  };
  return {
    async received({ to, locale, reportId, className }) {
      warnOnFailure(reportId, 'Report receipt')(await mail.sendReportReceipt({ to, locale, reportId, className }));
    },
    async decided({ report, outcome, explanation, statement }) {
      const common = { reportId: report.id, className: report.class.name };
      if (report.reporterEmail) {
        warnOnFailure(report.id, 'Report decision')(
          await mail.sendReportDecision({
            ...common,
            to: report.reporterEmail,
            locale: report.reporterLocale,
            outcome,
            explanation,
          })
        );
      }
      const ownerEmail = report.class.owner?.email;
      if (statement && ownerEmail) {
        // shortcut: author language isn't stored; English until accounts carry a locale.
        warnOnFailure(report.id, 'Statement of reasons')(
          await mail.sendStatementOfReasons({
            ...common,
            to: ownerEmail,
            locale: 'en',
            measure: statement.measure,
            followedNotice: true,
            ground: statement.ground,
            explanation,
          })
        );
      }
    },
    async disputed({ reportId, className, ownerEmail, text }) {
      warnOnFailure(reportId, 'Dispute copy')(
        await mail.sendDisputeCopy({ reportId, className, ownerEmail, disputeText: text })
      );
    },
  };
}
