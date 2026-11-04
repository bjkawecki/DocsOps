export type FaqItem = {
  question: string;
  answer: string;
  /** Optional CTA after the answer (e.g. install page). */
  link?: { to: string; label: string };
};

/** FAQ on home: Einwände und Einstieg – kein Modell-/Feature-Nachschlag, kein Vergleich. */
export const faqItems: FaqItem[] = [
  {
    question: 'Für wen ist DocsOps gedacht?',
    answer:
      'DocsOps richtet sich an Organisationen, in denen klar sein muss, was gilt und wer dafür verantwortlich ist. Der Wissensstand soll nachvollziehbar bleiben, auch wenn viele mitarbeiten. Weniger geeignet ist DocsOps, wenn vor allem eine freie Fläche zum gemeinsamen Schreiben zählt und feste Zuständigkeit wenig Rolle spielt.',
  },
  {
    question: 'Was brauche ich für den Betrieb?',
    answer:
      'DocsOps läuft auf Ihrer Infrastruktur: Sie stellen Server, Datenbank und Backup bereit und kümmern sich um Updates. Es gibt kein Cloud-Abo und kein Managed Hosting durch uns. Die Anwendung ist quelloffen und bleibt unter Ihrer Kontrolle.',
  },
  {
    question: 'Was kostet DocsOps?',
    answer:
      'Die Software ist quelloffen und ohne Seat-Gebühren nutzbar. Kosten entstehen bei Ihnen durch Betrieb und Pflege der Instanz – Rechenleistung, Speicher und die Zeit für Updates.',
    link: { to: 'install', label: 'Zur Installationsanleitung' },
  },
  {
    question: 'Kann ich DocsOps erst ausprobieren?',
    answer:
      'Ja. Die Live-Demo zeigt den Ablauf ohne eigene Einrichtung. Was dort steht, ist nicht Ihr Wissensstand und eignet sich nicht für produktive Dokumente. Für den Einsatz mit Ihren Daten und Rechten brauchen Sie eine eigene Installation.',
  },
  {
    question: 'Werden Dokumente automatisch als veraltet markiert?',
    answer:
      'Nein. Alter allein bedeutet nicht, dass ein Dokument falsch ist. Zuständige Leads sehen unter Aktualität, wo eine Entscheidung fällig ist, und legen fest, ob der Stand weiter gilt, ein Update nötig ist oder die Prüfung später wiederholt wird.',
  },
];
