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
        paragraphs: ['Björn Kawecki'],
      },
      {
        title: 'Kontakt',
        paragraphs: ['E-Mail: post@bjoernkawecki.de', 'Website: https://bjoernkawecki.de'],
      },
      {
        title: 'Verantwortlich für den Inhalt',
        paragraphs: ['Björn Kawecki'],
      },
    ] satisfies LegalSection[],
  },
  datenschutz: {
    pageTitle: 'Datenschutz',
    metaDescription: 'Datenschutzhinweise der DocsOps Marketing-Website.',
    sections: [
      {
        title: 'Verantwortlicher',
        paragraphs: [
          'Björn Kawecki',
          'E-Mail: post@bjoernkawecki.de',
          'Website: https://bjoernkawecki.de',
        ],
      },
      {
        title: 'Hosting',
        paragraphs: [
          'Diese Website wird gehostet bei DigitalOcean, LLC.',
          'Adresse: 101 Avenue of the Americas, 2nd Floor, New York, NY 10013, USA.',
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
          'Die statische Marketing-Website setzt keine eigenen Session-Cookies. Externe Links (z. B. GitHub) unterliegen den Richtlinien der jeweiligen Anbieter.',
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
        paragraphs: ['4. August 2026'],
      },
    ] satisfies LegalSection[],
  },
} as const;
