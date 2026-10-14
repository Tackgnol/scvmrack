import { LegalCopyPage } from "@/pages/LegalCopyPage";
import { privacyCopy } from "@/pages/legalCopy";

export function PrivacyPage() {
  return <LegalCopyPage copy={privacyCopy} path="/privacy" />;
}
