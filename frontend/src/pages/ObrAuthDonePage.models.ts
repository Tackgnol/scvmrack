import type { z } from "zod";
import type { obrApprovalSchema } from "./ObrAuthDonePage.schemas";

export type ObrApprovalFields = z.infer<typeof obrApprovalSchema>;
export type ObrApprovalState =
  | { status: "ready" | "approving" | "cancelling" | "finished" | "cancelled" }
  | { status: "failed"; message: string };
