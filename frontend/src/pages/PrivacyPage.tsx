import { useTranslation } from "react-i18next";
import { LegalDocumentPage } from "@/pages/LegalDocumentPage";
import { privacyCopy } from "@/pages/legalCopy";
import { Seo } from "@/seo/Seo";

export function PrivacyPage() {
  const { i18n } = useTranslation();
  const document = privacyCopy[i18n.language.startsWith("pl") ? "pl" : "en"];

  return (
    <>
      <Seo
        title={document.title}
        description={document.description}
        path="/privacy"
      />
      <LegalDocumentPage document={document} />
    </>
  );
}
