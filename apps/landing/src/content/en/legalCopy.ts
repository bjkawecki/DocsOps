export type LegalSection = {
  title: string;
  paragraphs: readonly string[];
};

export const legalCopy = {
  impressum: {
    pageTitle: 'Imprint',
    metaDescription: 'Legal notice for the DocsOps marketing website.',
    sections: [
      {
        title: 'Provider',
        paragraphs: ['Björn Kawecki'],
      },
      {
        title: 'Contact',
        paragraphs: ['Email: post@bjoernkawecki.de', 'Website: https://bjoernkawecki.de'],
      },
      {
        title: 'Responsible for content',
        paragraphs: ['Björn Kawecki'],
      },
    ] satisfies LegalSection[],
  },
  datenschutz: {
    pageTitle: 'Privacy',
    metaDescription: 'Privacy notice for the DocsOps marketing website.',
    sections: [
      {
        title: 'Controller',
        paragraphs: [
          'Björn Kawecki',
          'Email: post@bjoernkawecki.de',
          'Website: https://bjoernkawecki.de',
        ],
      },
      {
        title: 'Hosting',
        paragraphs: [
          'This website is hosted by DigitalOcean, LLC.',
          'Address: 101 Avenue of the Americas, 2nd Floor, New York, NY 10013, USA.',
        ],
      },
      {
        title: 'Server log files',
        paragraphs: [
          'When you visit the website, technical access data (e.g. IP address, time, requested URL, user agent) may be processed in server log files – to provide and secure the website.',
          'Legal basis: legitimate interest (Art. 6(1)(f) GDPR).',
        ],
      },
      {
        title: 'Contact form',
        paragraphs: [
          'This marketing website has no contact form. Contact only via the channels listed in the imprint.',
        ],
      },
      {
        title: 'Cookies',
        paragraphs: [
          'The static marketing website does not set its own session cookies. External links (e.g. GitHub) are subject to the policies of those providers.',
        ],
      },
      {
        title: 'Your rights',
        paragraphs: [
          'You have the right to access, rectification, erasure, restriction of processing, objection, and data portability within the scope of applicable law.',
          'You may lodge a complaint with a data protection supervisory authority.',
        ],
      },
      {
        title: 'As of',
        paragraphs: ['4 August 2026'],
      },
    ] satisfies LegalSection[],
  },
} as const;
