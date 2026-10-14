import { useTranslation } from "react-i18next";
import type { ApiLocale } from "@/api";
import { getApiLocale } from "@/hooks/utils";
import { LegalDocumentPage } from "@/pages/LegalDocumentPage";
import type { LegalDocument } from "@/pages/legalCopy";
import { Seo } from "@/seo/Seo";

interface LegalCopyPageProps {
  copy: Record<ApiLocale, LegalDocument>;
  path: string;
}

/** A legal document in the reader's language, with its page metadata. */
export function LegalCopyPage({ copy, path }: LegalCopyPageProps) {
  const { i18n } = useTranslation();
  const document = copy[getApiLocale(i18n.language)];

  return (
    <>
      <Seo title={document.title} description={document.description} path={path} />
      <LegalDocumentPage document={document} />
    </>
  );
}
