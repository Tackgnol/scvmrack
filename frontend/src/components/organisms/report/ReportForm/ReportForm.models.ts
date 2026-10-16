import type { PublicReportInput } from "@/api/reports";

export type ReportFormProps = {
  /** A class id from the link that opened the form. */
  initialClassId?: string;
  pending: boolean;
  error: unknown;
  onSubmit: (report: PublicReportInput) => void;
};
