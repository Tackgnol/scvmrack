import { z } from "zod";

export const obrApprovalSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-F0-9]{6}$/),
});
