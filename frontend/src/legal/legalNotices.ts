export type LegalChangeNotice = {
  kind: 'terms' | 'privacy';
  date: string;
  effectiveDate: string;
  summary: { en: string; pl: string };
};

export const activeLegalNotices: readonly LegalChangeNotice[] = [];

/** Checks that a significant legal change has at least fourteen days' notice. */
export function hasRequiredNoticePeriod(notice: LegalChangeNotice): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(notice.date) || !/^\d{4}-\d{2}-\d{2}$/.test(notice.effectiveDate)) {
    return false;
  }
  const start = Date.parse(`${notice.date}T00:00:00Z`);
  const effective = Date.parse(`${notice.effectiveDate}T00:00:00Z`);
  return Number.isFinite(start) && Number.isFinite(effective)
    && new Date(start).toISOString().slice(0, 10) === notice.date
    && new Date(effective).toISOString().slice(0, 10) === notice.effectiveDate
    && effective - start >= 14 * 24 * 60 * 60 * 1000;
}

/** Checks that a notice can still be sent fourteen days before it takes effect. */
export function canSendNoticeOn(notice: LegalChangeNotice, today: string): boolean {
  return today >= notice.date && hasRequiredNoticePeriod({ ...notice, date: today });
}

for (const notice of activeLegalNotices) {
  if (!hasRequiredNoticePeriod(notice)) {
    throw new Error(`Legal notice ${notice.kind}:${notice.date} needs at least fourteen days' lead time`);
  }
}
