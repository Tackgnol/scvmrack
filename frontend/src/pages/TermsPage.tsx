import { useTranslation } from "react-i18next";
import { LegalDocumentPage } from "@/pages/LegalDocumentPage";
import { termsCopy } from "@/pages/legalCopy";
import { Seo } from "@/seo/Seo";

export function TermsPage() {
  const { i18n } = useTranslation();
  const document = termsCopy[i18n.language.startsWith("pl") ? "pl" : "en"];

  return (
    <>
      <Seo
        title={document.title}
        description={document.description}
        path="/terms"
      />
      <LegalDocumentPage document={document} />
    </>
  );
}
