export type FaqItem = {
  question: string;
  answer: string;
  /** Terms rendered in accent color within the answer. */
  highlights?: readonly string[];
  /** Optional CTA after the answer (e.g. install page). */
  link?: { to: string; label: string };
};

export const faqItems: FaqItem[] = [
  {
    question: 'Passt DocsOps zu meiner Organisation?',
    answer:
      'Ja, wenn Sie mit Firma, Abteilung und Team, benannten Leitungen und einem freigegebenen Wissensstand arbeiten. Weniger geeignet, wenn Sie vor allem eine freie Wiki-Fläche ohne Hierarchie und Kontextmodell brauchen.',
    highlights: ['Wissensstand', 'Wiki-Fläche'],
  },
  {
    question: 'Was unterscheidet DocsOps von ähnlichen Programmen?',
    answer:
      'Andere Programme setzen oft auf freie Spaces oder Wiki-Seiten ohne festes Organisationsmodell; wer schreiben darf, ändert meist sofort den Stand für alle. DocsOps folgt Firma, Abteilung und Team: Autoren schlagen Änderungen vor, die Leitung gibt die verbindliche Fassung frei.',
    highlights: ['Wiki-Seiten', 'verbindliche Fassung'],
    link: { to: '/vergleich', label: 'Zum Vergleich mit Confluence' },
  },
  {
    question: 'Warum nicht einfach Confluence?',
    answer:
      'Confluence ist stark, wenn Sie Spaces, Plugins und die Atlassian-Welt brauchen. DocsOps ist für Organisationen gedacht, die Firma, Abteilung und Team sowie eine freigegebene Fassung im Produkt wollen – self-hosted, ohne Cloud-Pflicht.',
    highlights: ['freigegebene Fassung', 'self-hosted'],
    link: { to: '/vergleich', label: 'DocsOps und Confluence im Vergleich' },
  },
  {
    question: 'Wie strukturiert DocsOps mein Wissen?',
    answer:
      'Über Kontexte: Prozesse beschreiben dauerhafte Abläufe (wie Sie arbeiten). Projekte bündeln den Ist-Stand zu einem Thema, Produkt oder Vorhaben. Jedes Dokument gehört zu genau einem solchen Kontext.',
    highlights: ['Prozesse', 'Projekte'],
  },
  {
    question: 'Wie stellt DocsOps Verbindlichkeit her?',
    answer:
      'Indem Mitwirken und Veröffentlichen getrennt bleiben. Autoren formulieren im Entwurf Vorschläge; die Leitung des Geltungsbereichs nimmt an oder verwirft und veröffentlicht. Leser sehen ausschließlich die freigegebene Version.',
    highlights: ['Entwurf', 'Leitung', 'freigegebene Version'],
  },
  {
    question: 'Wie kann ich DocsOps nutzen – und was kostet es?',
    answer:
      'DocsOps ist Open Source unter MIT, kostenlos nutzbar und für Self-hosting auf Ihrer Infrastruktur gedacht. Daten und Betrieb bleiben bei Ihnen.',
    highlights: ['Open Source', 'Self-hosting'],
    link: { to: '/install', label: 'Zur Installationsanleitung' },
  },
];
