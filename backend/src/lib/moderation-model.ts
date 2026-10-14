import type { ModerationReportReason, ModerationReportStatus } from '@prisma/client';
import { enumValues } from './class-model.js';

export type { ModerationReportReason, ModerationReportStatus };

export const MODERATION_REPORT_REASONS = enumValues<ModerationReportReason>()([
  'copyright',
  'child_sexual_abuse_material',
  'threat_to_life_or_safety',
  'terrorist_content',
  'other_illegal_content',
  'abusive_or_hateful',
  'owner_removal',
  'other',
]);

export const MODERATION_REPORT_STATUSES = enumValues<ModerationReportStatus>()([
  'open',
  'dismissed',
  'taken_down',
  'content_removed',
  'restored',
]);

/** A decided report's status: every status but `open`. */
export type ReportDecision = Exclude<ModerationReportStatus, 'open'>;
/** Decisions that hide a class until restored, and its measure in a statement of reasons. */
export type ReportMeasure = Extract<ReportDecision, 'taken_down' | 'content_removed'>;
export const IN_FORCE_STATUSES: readonly ReportMeasure[] = ['taken_down', 'content_removed'];
export const isMeasure = (status: string): status is ReportMeasure =>
  (IN_FORCE_STATUSES as readonly string[]).includes(status);
export const DECIDED_STATUSES = MODERATION_REPORT_STATUSES.filter(
  (status): status is ReportDecision => status !== 'open'
);
/** The one report reason a reporter may file without leaving contact details. */
export const ANONYMOUS_REASON: ModerationReportReason = 'child_sexual_abuse_material';

/** Report reasons flagged for priority review. */
export const SERIOUS_REPORT_REASONS: readonly ModerationReportReason[] = [
  'child_sexual_abuse_material',
  'threat_to_life_or_safety',
  'terrorist_content',
];

/** Longest moderator reason, report explanation or dispute text. */
export const MODERATION_TEXT_MAX = 4000;
