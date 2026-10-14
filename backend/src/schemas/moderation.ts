import { SUPPORTED_LOCALES } from '../config/locales.js';
import {
  MODERATION_REPORT_REASONS,
  MODERATION_REPORT_STATUSES,
  MODERATION_TEXT_MAX,
} from '../lib/moderation-model.js';
import { IdSchema } from './character.js';

const ModerationTextSchema = { type: 'string', minLength: 1, maxLength: MODERATION_TEXT_MAX } as const;
const UuidSchema = { type: 'string', format: 'uuid' } as const;
const DateTimeSchema = { type: 'string', format: 'date-time' } as const;
const ReasonCodeSchema = { type: 'string', enum: MODERATION_REPORT_REASONS } as const;

export const ModerationReportBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['classId', 'reason', 'explanation', 'goodFaith'],
  properties: {
    classId: IdSchema,
    reason: ReasonCodeSchema,
    explanation: ModerationTextSchema,
    reporterName: { type: 'string', minLength: 1, maxLength: 200 },
    reporterEmail: { type: 'string', format: 'email', maxLength: 320 },
    website: { type: 'string', maxLength: 200 },
    locale: { type: 'string', enum: SUPPORTED_LOCALES },
    goodFaith: { const: true },
  },
} as const;

/** A created report or dispute. */
export const ModerationReportResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id'],
  properties: { id: UuidSchema },
} as const;

export const DisputeBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['text'],
  properties: { text: ModerationTextSchema },
} as const;

export const ReportIdParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: { id: UuidSchema },
} as const;

export const UserIdParamsSchema = {
  type: 'object',
  required: ['userId'],
  properties: { userId: { type: 'string', minLength: 1, maxLength: 255 } },
} as const;

/** A moderator's written reason, required for every decision. */
export const DecisionBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['reason'],
  properties: { reason: ModerationTextSchema },
} as const;

/** A takedown or removal: the reason plus the ground its statement of reasons cites. */
export const MeasureBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['reason', 'ground'],
  properties: { reason: ModerationTextSchema, ground: ReasonCodeSchema },
} as const;

const ClassVersionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'lineageId', 'name', 'version'],
  properties: {
    id: IdSchema,
    lineageId: { type: 'string' },
    name: { type: 'string' },
    version: { type: 'integer' },
  },
} as const;

const AdminReportSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'id', 'classId', 'className', 'lineageId', 'classVersion', 'reason', 'explanation',
    'reporterName', 'reporterEmail', 'status', 'disputes', 'createdAt', 'serious',
  ],
  properties: {
    id: UuidSchema,
    classId: IdSchema,
    className: { type: 'string' },
    lineageId: { type: 'string' },
    classVersion: { type: 'integer' },
    reason: ReasonCodeSchema,
    explanation: { type: 'string' },
    reporterName: { type: ['string', 'null'] },
    reporterEmail: { type: ['string', 'null'] },
    status: { type: 'string', enum: MODERATION_REPORT_STATUSES },
    disputes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'text', 'createdAt'],
        properties: { id: UuidSchema, text: { type: 'string' }, createdAt: DateTimeSchema },
      },
    },
    createdAt: DateTimeSchema,
    serious: { type: 'boolean' },
  },
} as const;

const RemovalHistorySchema = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'className', 'date', 'reason', 'restored'],
    properties: {
      id: UuidSchema,
      className: { type: 'string' },
      date: DateTimeSchema,
      reason: { type: ['string', 'null'] },
      restored: { type: 'boolean' },
    },
  },
} as const;

/** The moderation queue: open or disputed reports grouped by class lineage. */
export const AdminReportGroupsSchema = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['lineageId', 'latest', 'versions', 'reports', 'ownerUserId', 'builtIn', 'removalHistory'],
    properties: {
      lineageId: { type: 'string' },
      latest: ClassVersionSchema,
      versions: { type: 'array', items: ClassVersionSchema },
      reports: { type: 'array', items: AdminReportSchema },
      ownerUserId: { type: ['string', 'null'] },
      /** A Built-in Class has no user-written content to remove; it can only be hidden. */
      builtIn: { type: 'boolean' },
      removalHistory: { anyOf: [RemovalHistorySchema, { type: 'null' }] },
    },
  },
} as const;

/** The newest moderation log entries: every decision, who made it, when and why. */
export const ModerationLogSchema = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'action', 'reason', 'ground', 'actorUserId', 'reportId', 'targetUserId', 'classId', 'className', 'createdAt'],
    properties: {
      id: UuidSchema,
      action: { type: 'string' },
      reason: { type: ['string', 'null'] },
      ground: { anyOf: [ReasonCodeSchema, { type: 'null' }] },
      actorUserId: { type: ['string', 'null'] },
      reportId: { anyOf: [UuidSchema, { type: 'null' }] },
      targetUserId: { type: ['string', 'null'] },
      classId: { anyOf: [IdSchema, { type: 'null' }] },
      className: { type: ['string', 'null'] },
      createdAt: DateTimeSchema,
    },
  },
} as const;

export const CreationBanStatusSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['banned'],
  properties: { banned: { type: 'boolean' } },
} as const;

export const CreationBanViewSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['userId', 'active', 'history'],
  properties: {
    userId: { type: 'string' },
    active: {
      anyOf: [
        {
          type: 'object',
          additionalProperties: false,
          required: ['reason', 'bannedAt'],
          properties: { reason: { type: 'string' }, bannedAt: DateTimeSchema },
        },
        { type: 'null' },
      ],
    },
    history: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'action', 'actorUserId', 'reason', 'date'],
        properties: {
          id: { type: 'string' },
          action: { type: 'string' },
          actorUserId: { type: ['string', 'null'] },
          reason: { type: ['string', 'null'] },
          date: DateTimeSchema,
        },
      },
    },
  },
} as const;

const flag = <const F extends string>(name: F) =>
  ({
    type: 'object',
    additionalProperties: false,
    required: [name],
    properties: { [name]: { type: 'boolean' } } as { [K in F]: { type: 'boolean' } },
  }) as const;

/** The outcome flag each decision returns. */
export const DismissedSchema = flag('dismissed');
export const TakenDownSchema = flag('takenDown');
export const ContentRemovedSchema = flag('contentRemoved');
export const RestoredSchema = flag('restored');
