export type FaqItem = {
  question: string;
  answer: string;
};

export const faqItems: FaqItem[] = [
  {
    question: 'Für wen ist DocsOps gedacht?',
    answer:
      'Für Organisationen mit Firma-, Abteilungs- und Teamstruktur, Leitungen pro Geltungsbereich und freigegebenem Wissensstand für Leser. Weniger geeignet, wenn ihr vor allem eine freie Wiki-Fläche ohne Hierarchie und Kontextmodell braucht.',
  },
  {
    question: 'Was unterscheidet DocsOps von Confluence oder Docmost?',
    answer:
      'DocsOps bringt Firma, Abteilung und Team ins Produkt, regelt Rechte pro Dokument und trennt Entwurf von veröffentlichter Leser-Version. Confluence und Docmost setzen stärker auf Spaces und Feature-Masse.',
  },
  {
    question: 'Muss DocsOps in der Cloud laufen?',
    answer:
      'Nein. DocsOps ist für Self-hosting gedacht – Docker auf eurer Infrastruktur, MIT-Lizenz, volle Datenhoheit.',
  },
  {
    question: 'Wie funktioniert die Zusammenarbeit?',
    answer:
      'Autoren arbeiten in Entwürfen und reichen Vorschläge ein. Die Leitung des Geltungsbereichs – Team, Abteilung oder Firma – veröffentlicht die Fassung, die Leser sehen.',
  },
  {
    question: 'Gibt es eine Live-Demo?',
    answer:
      'Ja – über den Button „Live-Demo“ oben. Die Demo-Instanz läuft separat; produktive Daten gehören nicht hinein.',
  },
  {
    question: 'Ist DocsOps Open Source?',
    answer: 'Ja, MIT-Lizenz. Quellcode und Install-Anleitung liegen auf GitHub.',
  },
];
