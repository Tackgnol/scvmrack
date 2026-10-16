import { mailRepository } from '../repositories/mail-repository.js';
import {
  APPEAL_ADDRESS,
  disputeCopy,
  mailLocale,
  reportDecision,
  reportReceipt,
  statementOfReasons,
  termsChangeNotice,
  type DisputeCopyInput,
  type RenderedMail,
  type ReportDecisionInput,
  type ReportReceiptInput,
  type StatementOfReasonsInput,
  type TermsChangeInput,
} from './mail-templates.js';
import { fail, ok, unexpected, type ServiceLogger, type ServiceResult } from './result.js';

export interface MailLogger extends ServiceLogger {
  warn(obj: unknown, msg?: string): void;
}

export type MailOutcome = { sent: true; messageId: string } | { sent: false };

type Recipient = { to: string; locale: string | null | undefined };

type MailKind = 'report_receipt' | 'report_decision' | 'statement_of_reasons' | 'dispute_copy' | 'terms_change';

/**
 * Transactional email in the recipient's language. When SES isn't configured
 * nothing is sent: callers get `{ sent: false }` and the skip is logged.
 */
export function createMailService(log: MailLogger) {
  async function deliver(to: string, mail: RenderedMail, kind: MailKind): Promise<ServiceResult<MailOutcome>> {
    if (!mailRepository.isAvailable()) {
      log.warn({ kind }, 'Email not sent: SES is not configured');
      return ok({ sent: false });
    }
    try {
      const { messageId } = await mailRepository.send({ to, ...mail });
      return ok({ sent: true, messageId });
    } catch (err) {
      return fail(unexpected(log, err, 'MAIL_SEND_FAILED', 'Failed to send email'));
    }
  }

  return {
    sendReportReceipt(input: Recipient & ReportReceiptInput) {
      return deliver(input.to, reportReceipt(mailLocale(input.locale), input), 'report_receipt');
    },

    sendReportDecision(input: Recipient & ReportDecisionInput) {
      return deliver(input.to, reportDecision(mailLocale(input.locale), input), 'report_decision');
    },

    sendStatementOfReasons(input: Recipient & StatementOfReasonsInput) {
      return deliver(input.to, statementOfReasons(mailLocale(input.locale), input), 'statement_of_reasons');
    },

    sendDisputeCopy(input: DisputeCopyInput) {
      return deliver(APPEAL_ADDRESS, disputeCopy(input), 'dispute_copy');
    },

    sendTermsChange(input: { to: string } & TermsChangeInput) {
      return deliver(input.to, termsChangeNotice(input), 'terms_change');
    },
  };
}
