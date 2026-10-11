export interface LegalSection {
  id?: string;
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

const morkBorgLicense: Record<LegalLocale, string> = {
  en: "MÖRK BORG is copyright Ockult Örtmästare Games and Stockholm Kartell. Scvm Rack is not affiliated with them and is published under the MÖRK BORG Third Party License.",
  pl: "MÖRK BORG jest chronione prawem autorskim Ockult Örtmästare Games i Stockholm Kartell. Scvm Rack nie jest z nimi powiązany i jest publikowany na podstawie MÖRK BORG Third Party License.",
};

export const termsCopy: Record<LegalLocale, LegalDocument> = {
  en: {
    title: "Terms of Service",
    description:
      "Scvm Rack rules for accounts, Custom Classes, moderation, and appeals.",
    lastUpdated: "Last updated: 9 October 2026",
    introduction:
      "These terms apply to your use of Scvm Rack. The English version is binding. The Polish version is a courtesy translation; if the two differ, the English text controls.",
    sections: [
      {
        title: "The service",
        paragraphs: [
          "Scvm Rack is a free MÖRK BORG character-sheet service operated in Poland by Adam Kościelniak as a non-commercial project. Contact: contact@rpgtools.co.",
          "You may use it as a guest or with an account. An account keeps your characters available across devices.",
          "The service needs a current web browser, JavaScript, and cookies or similar browser storage needed to keep a session. Internet access is required while using the service.",
          "You must be at least 16, or have a parent's or guardian's permission, to use the service.",
          "Keep your sign-in details to yourself, and tell us at contact@rpgtools.co if you think someone else has used your account. Our privacy notice at /privacy explains how we handle personal data.",
        ],
      },
      {
        id: "publishing",
        title: "Your content and licence",
        paragraphs: [
          "You are responsible for the content you submit. You keep the rights to the Custom Classes and other content you create. You give Scvm Rack a non-exclusive licence to host, store, display, and technically adapt that content only to operate the service.",
          "If you make a class public, you also permit Scvm Rack to show it to anyone through the service. Public class pages may be found through search engines.",
        ],
      },
      {
        title: "Acceptable use",
        paragraphs: [
          "Do not submit unlawful, infringing, or harmful content, or content you do not have the right to share. Do not use the service to harm others, interfere with the service, or bypass its limits and safeguards.",
        ],
      },
      {
        id: "moderation",
        title: "Moderation and restrictions",
        paragraphs: [
          "We may take down a class (hide it from search, class pickers, and class pools), remove its content, or otherwise restrict content or accounts. We may do this after a report, at the author's request, or when content or conduct breaks these terms or the law.",
          "A person makes every moderation decision. We do not use automated moderation and do not generally monitor content.",
        ],
      },
      {
        id: "reporting",
        title: "Reporting content",
        paragraphs: [
          "Anyone, signed in or not, may report a public class with the report form at /report. A person reviews every report. If you give an email address, we confirm receipt and email you the decision.",
          "Authors may use the same form to ask for their own class to be taken down.",
        ],
      },
      {
        id: "disputes",
        title: "Decisions and appeals",
        paragraphs: [
          "When we restrict your content or account, we email you the reason if we have an email address for you. To ask for a review, reply to that email or write to scvmrack-appeal@rpgtools.co. A person reviews every appeal. This does not limit your right to go to court.",
        ],
      },
      {
        title: "Complaints",
        paragraphs: [
          "You can complain about anything related to the service by writing to contact@rpgtools.co. Describe the problem and give the email address for our reply. We reply within 14 days. Moderation decisions are appealed as described above.",
        ],
      },
      {
        title: "Availability and liability",
        paragraphs: [
          "Scvm Rack is a free hobby project. We aim to keep it available but cannot guarantee uninterrupted service or that data will never be lost; keep your own copies of anything important. Nothing in these terms limits liability that cannot be limited by law.",
          "We may change or discontinue the service. If we plan to shut it down, we will announce it in the service in advance where reasonably possible, so you can keep copies of your content.",
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
          "You can delete your characters and remove your Custom Classes. If a class is still used by a character, it is archived so that existing characters keep working. Public classes may remain available after account removal; you can request their takedown through /report. For account removal, contact contact@rpgtools.co.",
          "We show the date of any update here and announce significant changes in the service before they take effect where reasonably possible.",
        ],
      },
      {
        title: "Third parties and feedback",
        paragraphs: [
          morkBorgLicense.en,
          "Some features connect to third-party services, such as Owlbear Rodeo. Those services have their own terms and privacy rules.",
          "If you send us feedback, we may use it to improve the service, with no obligation to you.",
        ],
      },
      {
        title: "Governing law",
        paragraphs: [
          "Polish law governs these terms. If you are a consumer, this does not remove any protection you have under the mandatory consumer law of the country where you live.",
        ],
      },
    ],
  },
  pl: {
    title: "Regulamin usługi",
    description:
      "Regulamin Scvm Rack dotyczący kont, klas własnych, moderacji i odwołań.",
    lastUpdated: "Ostatnia aktualizacja: 9 października 2026",
    introduction:
      "Regulamin dotyczy korzystania ze Scvm Rack. Wiążąca jest wersja angielska. Wersja polska jest tłumaczeniem pomocniczym; w razie rozbieżności rozstrzyga tekst angielski.",
    sections: [
      {
        title: "Usługa",
        paragraphs: [
          "Scvm Rack to bezpłatna usługa kart postaci do MÖRK BORG, prowadzona w Polsce przez Adama Kościelniaka jako niekomercyjny projekt. Kontakt: contact@rpgtools.co.",
          "Możesz korzystać z niej jako gość albo przez konto. Konto pozwala zachować postacie i otwierać je na różnych urządzeniach.",
          "Do korzystania potrzebujesz aktualnej przeglądarki, JavaScriptu oraz plików cookie lub podobnego magazynu przeglądarki potrzebnego do utrzymania sesji. Podczas korzystania z usługi wymagany jest dostęp do internetu.",
          "Aby korzystać z usługi, musisz mieć co najmniej 16 lat albo zgodę rodzica lub opiekuna.",
          "Nie udostępniaj innym danych logowania i napisz na contact@rpgtools.co, jeśli podejrzewasz, że ktoś inny użył Twojego konta. Informacja o prywatności pod adresem /privacy wyjaśnia, jak przetwarzamy dane osobowe.",
        ],
      },
      {
        id: "publishing",
        title: "Twoje treści i licencja",
        paragraphs: [
          "Odpowiadasz za przesyłane treści. Zachowujesz prawa do utworzonych Klas Własnych i innych treści. Udzielasz Scvm Rack niewyłącznej licencji na hostowanie, przechowywanie, wyświetlanie i techniczne dostosowanie tych treści wyłącznie w celu działania usługi.",
          "Gdy publikujesz klasę, zezwalasz też Scvm Rack pokazywać ją każdemu w usłudze. Strony publicznych klas mogą być dostępne przez wyszukiwarki.",
        ],
      },
      {
        title: "Zasady korzystania",
        paragraphs: [
          "Nie przesyłaj treści niezgodnych z prawem, naruszających prawa innych lub szkodliwych ani takich, do których udostępnienia nie masz prawa. Nie używaj usługi do szkodzenia innym, zakłócania jej działania ani obchodzenia limitów i zabezpieczeń.",
        ],
      },
      {
        id: "moderation",
        title: "Moderacja i ograniczenia",
        paragraphs: [
          "Możemy zdjąć klasę (ukryć ją w wyszukiwaniu, wyborze klas i pulach klas), usunąć jej treść albo w inny sposób ograniczyć treści lub konta. Możemy to zrobić po zgłoszeniu, na prośbę autora albo gdy treść lub zachowanie narusza regulamin lub prawo.",
          "Każdą decyzję moderacyjną podejmuje człowiek. Nie stosujemy automatycznej moderacji i nie monitorujemy treści w sposób ogólny.",
        ],
      },
      {
        id: "reporting",
        title: "Zgłaszanie treści",
        paragraphs: [
          "Każdy, zalogowany lub nie, może zgłosić publiczną klasę formularzem pod adresem /report. Każde zgłoszenie sprawdza człowiek. Jeśli podasz adres e-mail, potwierdzimy otrzymanie zgłoszenia i prześlemy decyzję.",
          "Autorzy mogą tym samym formularzem poprosić o zdjęcie własnej klasy.",
        ],
      },
      {
        id: "disputes",
        title: "Decyzje i odwołania",
        paragraphs: [
          "Gdy ograniczymy Twoją treść lub konto, prześlemy Ci e-mailem uzasadnienie, jeśli mamy Twój adres e-mail. Aby poprosić o ponowne rozpatrzenie, odpowiedz na tę wiadomość albo napisz na scvmrack-appeal@rpgtools.co. Każde odwołanie rozpatruje człowiek. Nie ogranicza to Twojego prawa do drogi sądowej.",
        ],
      },
      {
        title: "Reklamacje",
        paragraphs: [
          "Reklamacje dotyczące usługi możesz składać na adres contact@rpgtools.co. Opisz problem i podaj adres e-mail do odpowiedzi. Odpowiemy w ciągu 14 dni. Od decyzji moderacyjnych odwołujesz się w sposób opisany wyżej.",
        ],
      },
      {
        title: "Dostępność i odpowiedzialność",
        paragraphs: [
          "Scvm Rack to bezpłatny projekt hobbystyczny. Staramy się utrzymać jego dostępność, ale nie gwarantujemy nieprzerwanego działania ani tego, że dane nigdy nie zostaną utracone; zachowuj własne kopie ważnych treści. Nic w regulaminie nie ogranicza odpowiedzialności, której nie można ograniczyć na mocy prawa.",
          "Możemy zmienić usługę lub zakończyć jej działanie. Jeśli zamierzamy ją wyłączyć, ogłosimy to w usłudze z wyprzedzeniem, gdy będzie to racjonalnie możliwe, aby można było zachować kopie treści.",
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
          "Możesz usunąć swoje postacie i Klasy Własne. Jeśli klasa jest nadal używana przez postać, zostaje zarchiwizowana, aby istniejące postacie nadal działały. Publiczne klasy mogą pozostać dostępne po usunięciu konta; możesz poprosić o ich zdjęcie przez /report. Aby usunąć konto, napisz na contact@rpgtools.co.",
          "Datę każdej aktualizacji podajemy na tej stronie, a o istotnych zmianach informujemy w usłudze przed ich wejściem w życie, gdy jest to racjonalnie możliwe.",
        ],
      },
      {
        title: "Usługi zewnętrzne i opinie",
        paragraphs: [
          morkBorgLicense.pl,
          "Niektóre funkcje łączą się z usługami zewnętrznymi, takimi jak Owlbear Rodeo. Te usługi mają własne regulaminy i zasady prywatności.",
          "Jeśli przekażesz nam opinię, możemy wykorzystać ją do ulepszenia usługi bez zobowiązań wobec Ciebie.",
        ],
      },
      {
        title: "Prawo właściwe",
        paragraphs: [
          "Regulamin podlega prawu polskiemu. Jeśli jesteś konsumentem, nie pozbawia Cię to ochrony, jaką daje Ci bezwzględnie obowiązujące prawo konsumenckie kraju, w którym mieszkasz.",
        ],
      },
    ],
  },
};

export const privacyCopy: Record<LegalLocale, LegalDocument> = {
  en: {
    title: "Privacy notice",
    description: "How Scvm Rack processes personal data.",
    lastUpdated: "Last updated: 9 October 2026",
    introduction:
      "This notice explains the personal data Scvm Rack processes and why. The English version is binding. The Polish version is a courtesy translation; if the two differ, the English text controls.",
    sections: [
      {
        title: "Controller and contact",
        paragraphs: [
          "Adam Kościelniak operates Scvm Rack in Poland as a non-commercial project and is the controller of your personal data. Contact contact@rpgtools.co about your data.",
        ],
      },
      {
        title: "What we process and why",
        paragraphs: [
          "Account and guest-session data, character sheets, parties, Custom Classes, and drafts: to provide the service you use (performance of a contract, Art. 6(1)(b) GDPR). Public classes show the author’s display name to anyone, and their pages may be indexed by search engines. Others, including search engines, may copy or cache public content, and we cannot control that use.",
          "Reports and appeals, including the name, email address, and explanation you submit: to review them, send decisions, and meet Digital Services Act duties (legal obligation, Art. 6(1)(c) GDPR).",
          "Moderation records kept after a decision: to establish or defend legal claims (legitimate interests, Art. 6(1)(f) GDPR).",
          "Technical data such as IP addresses and error reports: to keep the service secure, limit abuse, and fix faults (legitimate interests, Art. 6(1)(f) GDPR).",
          "Usage statistics through Google Analytics, only after you opt in (consent, Art. 6(1)(a) GDPR).",
          "Messages you send through the feedback form, with the page address and technical context: to answer them and improve the service (legitimate interests, Art. 6(1)(f) GDPR). They are stored with error reports.",
          "An account is optional. Reports need a name and email address so we can send you the decision, except reports of child sexual abuse material. Without the session cookie the service cannot work.",
          "We do not make decisions about you based solely on automated processing, including profiling.",
        ],
      },
      {
        title: "Cookies and browser storage",
        paragraphs: [
          "We use a session cookie to keep you signed in, and browser storage for your preferences, privacy choice, last opened character, and unsaved class drafts. These are needed for the service to work. Google Analytics cookies are set only after you opt in. You can block or delete cookies in your browser settings, but the service cannot work without the session cookie.",
        ],
      },
      {
        title: "Retention",
        paragraphs: [
          "Characters and parties, including guest characters, are kept until you delete them or ask us to. Generating a replacement guest character removes the previous one. Account data is kept until you ask us to remove the account.",
          "Removed classes still used by characters are archived, with their content retained for those characters. Public classes may remain available after account removal; you can request their takedown through /report.",
          "Unfinished server drafts with no edits for more than 90 days are deleted when you next open your draft list. Until then, they may remain stored. Browser recovery copies are stored separately on your device and have no automatic expiry; you can remove them by clearing the site's browser storage.",
          "Reporter-identifying details are anonymised two years after a decision. Moderation records and removed content are kept as evidence of decisions and for legal claims. Error reports are deleted after 90 days.",
        ],
      },
      {
        title: "Recipients",
        paragraphs: [
          "The service, including sign-in (Logto) and error reporting (GlitchTip), runs on our own server hosted by Oracle Cloud Infrastructure in Amsterdam, the Netherlands. These providers also process data for the service: Cloudflare (network and security), Amazon SES (email) and, with your consent, Google Analytics. Where a provider transfers data outside the EEA, it relies on an EU adequacy decision (such as the EU–US Data Privacy Framework) or the EU Standard Contractual Clauses. You can ask for a copy of these safeguards at contact@rpgtools.co.",
          "We disclose data to authorities only when the law requires it, for example under an order to act against illegal content.",
        ],
      },
      {
        title: "Your rights",
        paragraphs: [
          "You may request access, rectification, erasure, restriction, or portability of your data, or object to processing based on legitimate interests. Write to contact@rpgtools.co. We may ask you to confirm your identity before acting on a request.",
          "You may withdraw analytics consent at any time in the Blood Oath panel; this does not affect processing before the withdrawal. You may complain to Poland’s data protection authority (PUODO).",
        ],
      },
      {
        title: "Children",
        paragraphs: [
          "The service is meant for people aged 16 or older, or younger people with a parent's or guardian's permission. If you think a child gave us personal data without that permission, write to contact@rpgtools.co and we will delete it.",
        ],
      },
      {
        title: "Changes to this notice",
        paragraphs: [
          "We show the date of any update here and announce significant changes in the service.",
        ],
      },
    ],
  },
  pl: {
    title: "Informacja o prywatności",
    description: "Jak Scvm Rack przetwarza dane osobowe.",
    lastUpdated: "Ostatnia aktualizacja: 9 października 2026",
    introduction:
      "Ta informacja wyjaśnia, jakie dane osobowe przetwarza Scvm Rack i po co. Wiążąca jest wersja angielska. Wersja polska jest tłumaczeniem pomocniczym; w razie rozbieżności rozstrzyga tekst angielski.",
    sections: [
      {
        title: "Administrator i kontakt",
        paragraphs: [
          "Adam Kościelniak prowadzi Scvm Rack w Polsce jako niekomercyjny projekt i jest administratorem Twoich danych osobowych. W sprawach danych napisz na contact@rpgtools.co.",
        ],
      },
      {
        title: "Co przetwarzamy i po co",
        paragraphs: [
          "Dane kont i sesji gościa, karty postaci, drużyny, Klasy Własne i szkice: aby świadczyć usługę, z której korzystasz (wykonanie umowy, art. 6 ust. 1 lit. b RODO). Publiczne klasy pokazują każdemu nazwę autora, a ich strony mogą być indeksowane przez wyszukiwarki. Inni, w tym wyszukiwarki, mogą kopiować lub przechowywać publiczne treści, a my nie mamy na to wpływu.",
          "Zgłoszenia i odwołania, w tym podane imię, adres e-mail i wyjaśnienie: aby je rozpatrzyć, przekazać decyzje i wykonać obowiązki z aktu o usługach cyfrowych (obowiązek prawny, art. 6 ust. 1 lit. c RODO).",
          "Zapisy moderacji przechowywane po decyzji: aby ustalić i dochodzić roszczeń lub bronić się przed nimi (prawnie uzasadniony interes, art. 6 ust. 1 lit. f RODO).",
          "Dane techniczne, takie jak adresy IP i raporty błędów: aby zabezpieczyć usługę, ograniczać nadużycia i naprawiać usterki (prawnie uzasadniony interes, art. 6 ust. 1 lit. f RODO).",
          "Statystyki korzystania przez Google Analytics, wyłącznie po wyrażeniu zgody (zgoda, art. 6 ust. 1 lit. a RODO).",
          "Wiadomości wysłane formularzem opinii, wraz z adresem strony i danymi technicznymi: aby na nie odpowiedzieć i ulepszać usługę (prawnie uzasadniony interes, art. 6 ust. 1 lit. f RODO). Przechowujemy je razem z raportami błędów.",
          "Konto jest dobrowolne. Zgłoszenie wymaga imienia i adresu e-mail, abyśmy mogli przesłać decyzję, z wyjątkiem zgłoszeń materiałów przedstawiających seksualne wykorzystywanie dzieci. Bez pliku cookie sesji usługa nie może działać.",
          "Nie podejmujemy wobec Ciebie decyzji opartych wyłącznie na zautomatyzowanym przetwarzaniu, w tym profilowaniu.",
        ],
      },
      {
        title: "Pliki cookie i magazyn przeglądarki",
        paragraphs: [
          "Używamy pliku cookie sesji, aby utrzymać logowanie, oraz magazynu przeglądarki na ustawienia, wybór dotyczący prywatności, ostatnio otwartą postać i niezapisane szkice klas. Są one potrzebne do działania usługi. Pliki cookie Google Analytics są zapisywane dopiero po wyrażeniu zgody. Pliki cookie możesz blokować lub usuwać w ustawieniach przeglądarki, ale bez pliku cookie sesji usługa nie może działać.",
        ],
      },
      {
        title: "Okres przechowywania",
        paragraphs: [
          "Postacie i drużyny, także postacie gościa, przechowujemy do czasu ich usunięcia przez Ciebie lub na Twoją prośbę. Wygenerowanie nowej postaci gościa w miejsce poprzedniej usuwa poprzednią. Dane konta przechowujemy, dopóki nie poprosisz o usunięcie konta.",
          "Usuwane klasy nadal używane przez postacie archiwizujemy, zachowując ich treść dla tych postaci. Publiczne klasy mogą pozostać dostępne po usunięciu konta; możesz poprosić o ich zdjęcie przez /report.",
          "Niedokończone szkice na serwerze, nieedytowane przez ponad 90 dni, usuwamy przy następnym otwarciu listy szkiców. Do tego czasu mogą pozostać zapisane. Kopie odzyskiwania w przeglądarce są zapisane osobno na Twoim urządzeniu i nie wygasają automatycznie; możesz je usunąć, czyszcząc dane witryny w przeglądarce.",
          "Dane identyfikujące zgłaszającego anonimizujemy dwa lata po decyzji. Zapisy moderacji i usunięte treści zachowujemy jako dowód decyzji i na potrzeby roszczeń. Raporty błędów usuwamy po 90 dniach.",
        ],
      },
      {
        title: "Odbiorcy",
        paragraphs: [
          "Usługa, w tym logowanie (Logto) i raporty błędów (GlitchTip), działa na naszym serwerze w Oracle Cloud Infrastructure w Amsterdamie (Holandia). Dane dla usługi przetwarzają też: Cloudflare (sieć i bezpieczeństwo), Amazon SES (e-mail) oraz — po wyrażeniu zgody — Google Analytics. Gdy dostawca przekazuje dane poza EOG, opiera się na decyzji Komisji Europejskiej stwierdzającej odpowiedni stopień ochrony (np. EU–US Data Privacy Framework) albo na standardowych klauzulach umownych UE. Kopię tych zabezpieczeń możesz otrzymać, pisząc na contact@rpgtools.co.",
          "Dane przekazujemy organom wyłącznie wtedy, gdy wymaga tego prawo, na przykład na podstawie nakazu podjęcia działań przeciwko nielegalnym treściom.",
        ],
      },
      {
        title: "Twoje prawa",
        paragraphs: [
          "Możesz żądać dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania lub przeniesienia albo sprzeciwić się przetwarzaniu opartemu na prawnie uzasadnionym interesie. Napisz na contact@rpgtools.co. Przed realizacją żądania możemy poprosić o potwierdzenie tożsamości.",
          "Zgodę na analitykę możesz w każdej chwili cofnąć w panelu Krwawa Przysięga; nie wpływa to na przetwarzanie sprzed jej cofnięcia. Możesz złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (PUODO).",
        ],
      },
      {
        title: "Dzieci",
        paragraphs: [
          "Usługa jest przeznaczona dla osób, które ukończyły 16 lat, albo młodszych za zgodą rodzica lub opiekuna. Jeśli uważasz, że dziecko przekazało nam dane osobowe bez takiej zgody, napisz na contact@rpgtools.co, a usuniemy je.",
        ],
      },
      {
        title: "Zmiany tej informacji",
        paragraphs: [
          "Datę każdej aktualizacji podajemy na tej stronie, a o istotnych zmianach informujemy w usłudze.",
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
      {
        title: "MÖRK BORG licence",
        paragraphs: [morkBorgLicense.en],
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
      {
        title: "Licencja MÖRK BORG",
        paragraphs: [morkBorgLicense.pl],
      },
    ],
  },
};
