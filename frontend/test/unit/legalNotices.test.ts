import { describe, expect, it } from 'vitest';
import { canSendNoticeOn, hasRequiredNoticePeriod, type LegalChangeNotice } from '@/legal/legalNotices';

const notice: LegalChangeNotice = {
  kind: 'terms',
  date: '2026-10-09',
  effectiveDate: '2026-10-23',
  summary: { en: 'Changed publishing rules.', pl: 'Zmieniono zasady publikacji.' },
};

describe('legal change notices', () => {
  it('requires a dated notice at least fourteen days before effect', () => {
    expect(hasRequiredNoticePeriod(notice)).toBe(true);
    expect(hasRequiredNoticePeriod({ ...notice, effectiveDate: '2026-10-22' })).toBe(false);
    expect(hasRequiredNoticePeriod({ ...notice, date: 'bad date' })).toBe(false);
    expect(hasRequiredNoticePeriod({ ...notice, effectiveDate: '2026-11-31' })).toBe(false);
    expect(canSendNoticeOn(notice, '2026-10-09')).toBe(true);
    expect(canSendNoticeOn(notice, '2026-10-08')).toBe(false);
    expect(canSendNoticeOn(notice, '2026-10-10')).toBe(false);
  });
});
