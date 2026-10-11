import { legalNoticeRepository } from '../repositories/legal-notice-repository.js';
import { apiError } from '../errors.js';
import { createMailService, type MailLogger } from './mail-service.js';
import type { TermsChangeInput } from './mail-templates.js';
import { fail, ok, unexpected, type ServiceResult } from './result.js';

/** Previews or delivers a terms notice to every GM with an active public class. */
export async function sendPublicClassTermsNotice(
  input: TermsChangeInput & { send: boolean },
  log: MailLogger,
): Promise<ServiceResult<{ recipients: number; sent: number }>> {
  try {
    const authors = await legalNoticeRepository.listPublicClassAuthorEmails();
    if (!input.send) return ok({ recipients: authors.length, sent: 0 });
    const mail = createMailService(log);
    let sent = 0;
    const { send: _send, ...notice } = input;
    // shortcut: retrying a partially sent low-volume campaign can duplicate earlier emails; add persisted receipts if this grows.
    for (const author of authors) {
      const result = await mail.sendTermsChange({ to: author.email, ...notice });
      if (!result.ok) return result;
      if (!result.value.sent) return fail(apiError(503, 'SES_UNAVAILABLE', 'SES is not configured'));
      sent += 1;
    }
    return ok({ recipients: authors.length, sent });
  } catch (err) {
    return fail(unexpected(log, err, 'TERMS_NOTICE_FAILED', 'Failed to send terms notice'));
  }
}
