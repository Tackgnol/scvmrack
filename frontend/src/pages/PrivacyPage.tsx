import { useTranslation } from "react-i18next";
import { LegalDocumentPage } from "@/pages/LegalDocumentPage";
import { Seo } from "@/seo/Seo";

const documents = {
  en: { title: "Privacy notice", description: "How Scvm Rack processes personal data.", lastUpdated: "Draft for review: 7 October 2026", introduction: "This draft privacy notice explains the personal data Scvm Rack processes. The Polish version is binding.", sections: [
    { title: "Controller and contact", paragraphs: ["Adam Kościelniak operates Scvm Rack as a non-commercial project. Contact contact@rpgtools.co about your data."] },
    { title: "What we process", paragraphs: ["We process account and guest-session data, character sheets, parties, Custom Classes and drafts to provide the service. Public classes show the author’s display name.", "Reports and disputes include the contact details and explanation you submit. We use them to review reports, issue decisions and meet Digital Services Act duties.", "We send report and decision emails through Amazon SES. GlitchTip receives technical error reports; Google Analytics is used only after you opt in."] },
    { title: "Retention", paragraphs: ["Guest characters are kept for 7 days and unfinished class drafts for 90 days after their last edit. Account data remains until removal.", "Reporter-identifying details are anonymised two years after a decision. Moderation records and removed content are retained as evidence of decisions and legal claims."] },
    { title: "Recipients", paragraphs: ["Hosting, Cloudflare, Logto, Amazon SES, GlitchTip and, with consent, Google Analytics process data for the service. Some providers may transfer data outside the EEA under their applicable safeguards."] },
    { title: "Your rights", paragraphs: ["You may request access, rectification, erasure, restriction, portability or object to legitimate-interest processing. You may withdraw analytics consent in the Blood Oath panel. You may complain to Poland’s data protection authority (PUODO)."] },
  ] },
  pl: { title: "Informacja o prywatności", description: "Jak Scvm Rack przetwarza dane osobowe.", lastUpdated: "Projekt do weryfikacji: 7 października 2026", introduction: "Ten projekt informacji o prywatności wyjaśnia, jakie dane osobowe przetwarza Scvm Rack. Wersja polska jest wiążąca.", sections: [
    { title: "Administrator i kontakt", paragraphs: ["Adam Kościelniak prowadzi Scvm Rack jako niekomercyjny projekt. W sprawach danych napisz na contact@rpgtools.co."] },
    { title: "Co przetwarzamy", paragraphs: ["Przetwarzamy dane kont i sesji gościa, karty postaci, drużyny, Klasy Własne i szkice, aby świadczyć usługę. Publiczne klasy pokazują nazwę autora.", "Zgłoszenia i odwołania obejmują podane dane kontaktowe i wyjaśnienie. Służą do sprawdzania zgłoszeń, przekazywania decyzji i wykonania obowiązków z aktu o usługach cyfrowych.", "Wysyłamy e-maile przez Amazon SES. GlitchTip otrzymuje techniczne raporty błędów, a Google Analytics działa tylko po wyrażeniu zgody."] },
    { title: "Okres przechowywania", paragraphs: ["Postacie gościa przechowujemy 7 dni, a niedokończone szkice klas 90 dni od ostatniej zmiany. Dane konta pozostają do usunięcia.", "Dane identyfikujące zgłaszającego anonimizujemy dwa lata po decyzji. Zapisy moderacji i usunięte treści zachowujemy jako dowód decyzji i roszczeń."] },
    { title: "Odbiorcy", paragraphs: ["Hosting, Cloudflare, Logto, Amazon SES, GlitchTip oraz — po zgodzie — Google Analytics przetwarzają dane dla usługi. Część dostawców może przekazywać dane poza EOG z odpowiednimi zabezpieczeniami."] },
    { title: "Twoje prawa", paragraphs: ["Możesz żądać dostępu, sprostowania, usunięcia, ograniczenia, przeniesienia danych albo sprzeciwić się przetwarzaniu opartemu na uzasadnionym interesie. Zgodę na analitykę można cofnąć w panelu Krwawa Przysięga. Skargę można złożyć do PUODO."] },
  ] },
} as const;

export function PrivacyPage() {
  const { i18n } = useTranslation();
  const document = documents[i18n.language.startsWith("pl") ? "pl" : "en"];
  return <><Seo title={document.title} description={document.description} path="/privacy" /><LegalDocumentPage document={document} /></>;
}