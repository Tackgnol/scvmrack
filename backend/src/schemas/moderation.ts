export const ModerationReportBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['classId', 'reason', 'explanation', 'goodFaith'],
  properties: {
    classId: { type: 'integer', minimum: 1, maximum: 2147483647 },
    reason: {
      type: 'string',
      enum: [
        'copyright',
        'child_sexual_abuse_material',
        'threat_to_life_or_safety',
        'terrorist_content',
        'other_illegal_content',
        'abusive_or_hateful',
        'other',
      ],
    },
    explanation: { type: 'string', minLength: 1, maxLength: 4000 },
    reporterName: { type: 'string', minLength: 1, maxLength: 200 },
    reporterEmail: { type: 'string', format: 'email', maxLength: 320 },
    locale: { type: 'string', enum: ['en', 'pl'] },
    goodFaith: { const: true },
  },
} as const;

export const ModerationReportResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id'],
  properties: { id: { type: 'string', format: 'uuid' } },
} as const;
