export type LegalSection = {
  title: string;
  paragraphs: readonly string[];
};

export const legalCopy = {
  impressum: {
    pageTitle: 'Impressum',
    metaDescription: 'Impressum der DocsOps Marketing-Website.',
    sections: [
      {
        title: 'Anbieter',
        paragraphs: ['[FIRMA]', '[ADRESSE]'],
      },
      {
        title: 'Kontakt',
        paragraphs: ['E-Mail: [E-MAIL]', 'Telefon: [TELEFON] (optional)'],
      },
      {
        title: 'Umsatzsteuer-ID',
        paragraphs: ['USt-IdNr.: [UST_ID] (falls vorhanden, sonst Absatz entfernen)'],
      },
      {
        title: 'Verantwortlich für den Inhalt',
        paragraphs: ['[VERANTWORTLICHER_NAME]', '[ADRESSE]'],
      },
    ] satisfies LegalSection[],
  },
  datenschutz: {
    pageTitle: 'Datenschutz',
    metaDescription: 'Datenschutzhinweise der DocsOps Marketing-Website.',
    sections: [
      {
        title: 'Verantwortlicher',
        paragraphs: ['[FIRMA]', '[ADRESSE]', 'E-Mail: [E-MAIL]'],
      },
      {
        title: 'Hosting',
        paragraphs: [
          'Diese Website wird gehostet bei [HOSTING_ANBIETER].',
          'Adresse des Hosters: [HOSTING_ADRESSE]',
        ],
      },
      {
        title: 'Server-Logfiles',
        paragraphs: [
          'Beim Aufruf der Website können technische Zugriffsdaten (z. B. IP-Adresse, Zeitpunkt, angeforderte URL, User-Agent) in Server-Logfiles verarbeitet werden – zur Bereitstellung und Sicherheit der Website.',
          'Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO).',
        ],
      },
      {
        title: 'Kontaktformular',
        paragraphs: [
          'Auf dieser Marketing-Website gibt es kein Kontaktformular. Kontakt nur über die im Impressum genannten Kanäle.',
        ],
      },
      {
        title: 'Cookies',
        paragraphs: [
          'Die statische Marketing-Website setzt keine eigenen Session-Cookies. Externe Links (z. B. Live-Demo, GitHub) unterliegen den Richtlinien der jeweiligen Anbieter.',
        ],
      },
      {
        title: 'Betroffenenrechte',
        paragraphs: [
          'Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Widerspruch und Datenübertragbarkeit im Rahmen der gesetzlichen Vorgaben.',
          'Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde.',
        ],
      },
      {
        title: 'Stand',
        paragraphs: ['[DATUM]'],
      },
    ] satisfies LegalSection[],
  },
} as const;
