import { LegalCopyPage } from "@/pages/LegalCopyPage";
import { termsCopy } from "@/pages/legalCopy";

export function TermsPage() {
  return <LegalCopyPage copy={termsCopy} path="/terms" />;
}
