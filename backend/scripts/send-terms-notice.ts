import 'dotenv/config';
import { activeLegalNotices, canSendNoticeOn, hasRequiredNoticePeriod } from '../../frontend/src/legal/legalNotices.ts';

const notice = activeLegalNotices.find((entry) => entry.kind === 'terms');
if (!notice || !hasRequiredNoticePeriod(notice)) {
  throw new Error('Configure one valid active terms notice with at least 14 days lead time before running this command');
}

if (!canSendNoticeOn(notice, new Date().toISOString().slice(0, 10))) {
  throw new Error('The notice cannot be emailed at least 14 days before its effective date');
}

const send = process.argv.includes('--send');
const { sendPublicClassTermsNotice } = await import('../src/services/legal-notice-service.js');
const { default: prisma } = await import('../src/lib/prisma.js');
try {
  const result = await sendPublicClassTermsNotice({ ...notice, send }, console);
  if (!result.ok) {
    throw result.error;
  }
  console.log(`${send ? 'Sent' : 'Preview'}: ${result.value.sent} emails sent to ${result.value.recipients} public-class GMs`);
} finally {
  await prisma.$disconnect();
}
