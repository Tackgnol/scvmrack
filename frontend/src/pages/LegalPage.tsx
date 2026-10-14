import { LegalCopyPage } from "@/pages/LegalCopyPage";
import { legalCopy } from "@/pages/legalCopy";

export function LegalPage() {
  return <LegalCopyPage copy={legalCopy} path="/legal" />;
}
