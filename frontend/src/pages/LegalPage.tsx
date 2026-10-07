import { useTranslation } from "react-i18next";
import { LegalDocumentPage } from "@/pages/LegalDocumentPage";
import { legalCopy } from "@/pages/legalCopy";
import { Seo } from "@/seo/Seo";

export function LegalPage() {
  const { i18n } = useTranslation();
  const document = legalCopy[i18n.language.startsWith("pl") ? "pl" : "en"];

  return (
    <>
      <Seo
        title={document.title}
        description={document.description}
        path="/legal"
      />
      <LegalDocumentPage document={document} />
    </>
  );
}
