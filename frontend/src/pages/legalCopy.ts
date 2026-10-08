export interface LegalSection {
  title: string;
  paragraphs: readonly string[];
}

export interface LegalDocument {
  title: string;
  description: string;
  lastUpdated?: string;
  introduction: string;
  sections: readonly LegalSection[];
}

type LegalLocale = "en" | "pl";

export const termsCopy: Record<LegalLocale, LegalDocument> = {
  en: {
    title: "Terms of Service",
    description:
      "Scvm Rack rules for accounts, Custom Classes, moderation, and appeals.",
    lastUpdated: "Last updated: 7 October 2026",
    introduction:
      "Draft terms for the operator’s review before public Custom Classes ship. They explain how Scvm Rack works; they are not legal advice.",
    sections: [
      {
        title: "The service",
        paragraphs: [
          "Scvm Rack is a free MÖRK BORG character-sheet service. You may use it as a guest or with an account. An account keeps your characters available across devices.",
          "The service needs a current web browser, JavaScript, and cookies or similar browser storage needed to keep a session. Internet access is required while using the service.",
        ],
      },
      {
        title: "Your content and licence",
        paragraphs: [
          "You keep the rights to the Custom Classes and other content you create. You give Scvm Rack a non-exclusive licence to host, store, display, and technically adapt that content only to operate the service.",
          "If you make a class public, you also permit Scvm Rack to show it to other users and GMs through the service.",
        ],
      },
      {
        title: "Acceptable use",
        paragraphs: [
          "Do not submit unlawful content or content you do not have the right to share. Do not use the service to harm others, interfere with the service, or bypass its limits and safeguards.",
        ],
      },
      {
        title: "Moderation, reports, and appeals",
        paragraphs: [
          "Anyone may report suspected unlawful or rule-breaking public content. A person reviews reports. We may hide content while reviewing it, remove it, or leave it available when the report is not upheld.",
          "When we make a moderation decision, we aim to give the affected author a statement of reasons. To challenge a decision, write to scvmrack-appeal@rpgtools.co.",
        ],
      },
      {
        title: "Custom Class limits",
        paragraphs: [
          "An account may keep up to 50 Custom Classes. Versions are not capped. An account may publish up to five newly public classes each day.",
        ],
      },
      {
        title: "Leaving and changes",
        paragraphs: [
          "You can delete your Custom Classes. For account removal, contact contact@rpgtools.co. We will show the date of any terms update here and give signed-in users notice of material changes before they take effect where reasonably possible.",
        ],
      },
    ],
  },
  pl: {
    title: "Regulamin usługi",
    description:
      "Regulamin Scvm Rack dotyczący kont, klas własnych, moderacji i odwołań.",
    lastUpdated: "Ostatnia aktualizacja: 7 października 2026",
    introduction:
      "Projekt regulaminu do zatwierdzenia przez operatora przed uruchomieniem publicznych Klas Własnych. Wyjaśnia zasady działania Scvm Rack i nie stanowi porady prawnej.",
    sections: [
      {
        title: "Usługa",
        paragraphs: [
          "Scvm Rack to bezpłatna usługa kart postaci do MÖRK BORG. Możesz korzystać z niej jako gość albo przez konto. Konto pozwala zachować postacie i otwierać je na różnych urządzeniach.",
          "Do korzystania potrzebujesz aktualnej przeglądarki, JavaScriptu oraz plików cookie lub podobnego magazynu przeglądarki potrzebnego do utrzymania sesji. Podczas korzystania z usługi wymagany jest dostęp do internetu.",
        ],
      },
      {
        title: "Twoje treści i licencja",
        paragraphs: [
          "Zachowujesz prawa do utworzonych Klas Własnych i innych treści. Udzielasz Scvm Rack niewyłącznej licencji na hostowanie, przechowywanie, wyświetlanie i techniczne dostosowanie tych treści wyłącznie w celu działania usługi.",
          "Gdy publikujesz klasę, zezwalasz też Scvm Rack wyświetlać ją innym użytkownikom i MG w usłudze.",
        ],
      },
      {
        title: "Zasady korzystania",
        paragraphs: [
          "Nie przesyłaj treści niezgodnych z prawem ani takich, do których udostępnienia nie masz prawa. Nie używaj usługi do szkodzenia innym, zakłócania jej działania ani obchodzenia limitów i zabezpieczeń.",
        ],
      },
      {
        title: "Moderacja, zgłoszenia i odwołania",
        paragraphs: [
          "Każdy może zgłosić podejrzenie, że publiczna treść jest niezgodna z prawem lub zasadami. Zgłoszenia sprawdza człowiek. Możemy ukryć treść na czas sprawdzenia, usunąć ją albo pozostawić dostępną, jeżeli zgłoszenie nie zostanie uwzględnione.",
          "Gdy podejmiemy decyzję moderacyjną, staramy się przekazać autorowi uzasadnienie. Aby zakwestionować decyzję, napisz na scvmrack-appeal@rpgtools.co.",
        ],
      },
      {
        title: "Limity Klas Własnych",
        paragraphs: [
          "Jedno konto może przechowywać do 50 Klas Własnych. Liczba wersji nie jest ograniczona. Jedno konto może opublikować do pięciu nowych publicznych klas dziennie.",
        ],
      },
      {
        title: "Rezygnacja i zmiany regulaminu",
        paragraphs: [
          "Możesz usunąć swoje Klasy Własne. Aby usunąć konto, napisz na contact@rpgtools.co. Datę aktualizacji regulaminu podajemy na tej stronie, a o istotnych zmianach poinformujemy zalogowanych użytkowników przed ich wejściem w życie, gdy będzie to racjonalnie możliwe.",
        ],
      },
    ],
  },
};

export const legalCopy: Record<LegalLocale, LegalDocument> = {
  en: {
    title: "Legal and contact",
    description:
      "Scvm Rack contact points for users, authorities, and appeals.",
    introduction:
      "Scvm Rack is independently operated in Poland by Adam Kościelniak. Use the contacts below in Polish or English.",
    sections: [
      {
        title: "Users and authorities",
        paragraphs: [
          "contact@rpgtools.co is Scvm Rack’s contact point for users and authorities, including the Digital Services Act contact points under Articles 11 and 12.",
        ],
      },
      {
        title: "Appeals and disputes",
        paragraphs: [
          "scvmrack-appeal@rpgtools.co handles disputes and appeals of moderation decisions.",
        ],
      },
      {
        title: "Terrorist content orders",
        paragraphs: [
          "contact@rpgtools.co is also the contact point for terrorist-content removal orders under Article 15 of the Terrorist Content Online Regulation.",
        ],
      },
    ],
  },
  pl: {
    title: "Informacje prawne i kontakt",
    description:
      "Punkty kontaktowe Scvm Rack dla użytkowników, organów i odwołań.",
    introduction:
      "Scvm Rack jest niezależnie prowadzony w Polsce przez Adama Kościelniaka. Z poniższych kontaktów można korzystać po polsku i po angielsku.",
    sections: [
      {
        title: "Użytkownicy i organy",
        paragraphs: [
          "contact@rpgtools.co jest punktem kontaktowym Scvm Rack dla użytkowników i organów, w tym punktem kontaktowym z art. 11 i 12 aktu o usługach cyfrowych.",
        ],
      },
      {
        title: "Odwołania i spory",
        paragraphs: [
          "scvmrack-appeal@rpgtools.co obsługuje spory i odwołania od decyzji moderacyjnych.",
        ],
      },
      {
        title: "Nakazy dotyczące treści terrorystycznych",
        paragraphs: [
          "contact@rpgtools.co jest także punktem kontaktowym dla nakazów usunięcia treści o charakterze terrorystycznym zgodnie z art. 15 rozporządzenia o rozpowszechnianiu w internecie treści o charakterze terrorystycznym.",
        ],
      },
    ],
  },
};
