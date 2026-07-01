export type ComparisonValue = 'yes' | 'no' | 'partial';

export type ComparisonRow = {
  label: string;
  detail?: string;
  docsops: ComparisonValue;
  docsopsNote?: string;
  confluence: ComparisonValue;
  docmost: ComparisonValue;
  tooltip?: string;
};

export const comparisonRows: ComparisonRow[] = [
  {
    label: 'Self-hosted / On-Prem',
    docsops: 'yes',
    confluence: 'partial',
    docmost: 'yes',
  },
  {
    label: 'Open Source',
    docsops: 'yes',
    docsopsNote: 'MIT',
    confluence: 'no',
    docmost: 'yes',
    tooltip: 'Docmost: AGPL',
  },
  {
    label: 'Firmenstruktur im Produkt',
    detail: 'Company → Department → Team',
    docsops: 'yes',
    confluence: 'no',
    docmost: 'no',
    tooltip: 'Die Plattform kennt Firma, Abteilung und Team – nicht nur beliebige „Spaces“.',
  },
  {
    label: 'Rechte pro Dokument',
    detail: 'explizit, nicht nur „Space“',
    docsops: 'yes',
    confluence: 'partial',
    docmost: 'partial',
    tooltip:
      'Pro Dokument festlegen, wer lesen und schreiben darf – feiner als nur Bereichs-Rechte.',
  },
  {
    label: 'Kontrolle entlang der Hierarchie',
    detail: 'verbindliche Fassung durch Leads',
    docsops: 'yes',
    confluence: 'no',
    docmost: 'no',
    tooltip:
      'Die offizielle Leser-Version setzt die verantwortliche Person in der Linie – nicht jede Schreibberechtigung.',
  },
  {
    label: 'Hierarchisches Kollaborationsmodell',
    detail: 'Linie führt zusammen',
    docsops: 'yes',
    confluence: 'partial',
    docmost: 'no',
    tooltip:
      'Mitarbeitende arbeiten im Rahmen der Struktur; Verantwortliche führen Änderungen zusammen.',
  },
  {
    label: 'Entwürfe & veröffentlichte Versionen',
    docsops: 'yes',
    confluence: 'partial',
    docmost: 'no',
    tooltip:
      'Entwurf und veröffentlichte Fassung sind getrennt; Leser sehen eine stabile Version, Verlauf bleibt nachvollziehbar.',
  },
  {
    label: 'Struktur & Leitplanken eingebaut',
    docsops: 'yes',
    confluence: 'no',
    docmost: 'no',
    tooltip:
      'Firma, Abteilung, Team und Kontexte sind Teil des Produkts – klare Ordnung von Anfang an, ohne leere Fläche und Plugin-Bazaar.',
  },
];

export type VergleichHubItem = {
  slug: string;
  name: string;
  description: string;
};

export const vergleichHubItems: VergleichHubItem[] = [
  {
    slug: 'confluence',
    name: 'Confluence',
    description: 'Spaces, Plugins und etablierte Intranet-Doku – im Vergleich zu DocsOps.',
  },
  {
    slug: 'notion',
    name: 'Notion',
    description: 'Flexibilität und All-in-one – vs. org-native Leitplanken.',
  },
  {
    slug: 'docmost',
    name: 'Docmost',
    description: 'Self-hosted OSS mit Echtzeit-Kollaboration – vs. hierarchische Kontrolle.',
  },
  {
    slug: 'outline',
    name: 'Outline',
    description: 'Team-Wiki mit klarem Fokus – vs. DocsOps-Strukturmodell.',
  },
];
