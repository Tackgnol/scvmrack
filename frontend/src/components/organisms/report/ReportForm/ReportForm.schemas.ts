import { REPORT_REASONS, type ReportReason } from "@/api/reports";
import { z } from "zod";
import { parseClassReference } from "./ReportForm.utils";

/** The one reason a reporter may file without leaving contact details. */
export const ANONYMOUS_REASON: ReportReason = "child_sexual_abuse_material";

const isReason = (value: string): value is ReportReason => (REPORT_REASONS as readonly string[]).includes(value);

/**
 * The public report form. Each issue's message is the field it belongs to, so the page can list
 * what is still needed; the server checks the same rules again.
 */
export const reportFormSchema = z
  .object({
    classReference: z.string().refine((value) => parseClassReference(value) !== null, "classReference"),
    reason: z.string().refine(isReason, "reason"),
    explanation: z.string().refine((value) => value.trim().length > 0, "explanation"),
    name: z.string(),
    email: z.string(),
    website: z.string(),
    goodFaith: z.boolean().refine((value) => value, "goodFaith"),
  })
  .superRefine((form, ctx) => {
    if (form.reason === ANONYMOUS_REASON) {
      return;
    }
    if (!form.name.trim()) {
      ctx.addIssue({ code: "custom", path: ["name"], message: "name" });
    }
    if (!z.email().safeParse(form.email.trim()).success) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "email" });
    }
  });

export type ReportFormValues = z.input<typeof reportFormSchema>;
