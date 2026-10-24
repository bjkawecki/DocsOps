export type ComparisonValue = 'yes' | 'no' | 'partial';

export type ComparisonRow = {
  label: string;
  detail?: string;
  docsops: ComparisonValue;
  docsopsNote?: string;
  confluence: ComparisonValue;
  confluenceNote?: string;
};

/**
 * Kritik-Gegenüberstellung auf `/vergleich`.
 * ✓ = Kritik trifft zu · ✗ = so nicht angelegt.
 */
export const comparisonRows: ComparisonRow[] = [
  {
    label: 'Veraltete Seiten, Duplikate, niemand räumt auf',
    docsops: 'no',
    confluence: 'yes',
  },
  {
    label: 'Keine feste Struktur im Produkt',
    docsops: 'no',
    confluence: 'yes',
  },
  {
    label: 'Teuer',
    docsops: 'no',
    confluence: 'yes',
  },
  {
    label: 'Spaces und Pages schwer für Einsteiger',
    docsops: 'no',
    confluence: 'yes',
  },
  {
    label: 'Cloud-Zwang',
    docsops: 'no',
    confluence: 'yes',
  },
  {
    label: 'Aufgeblähtes UI',
    docsops: 'no',
    confluence: 'yes',
  },
  {
    label: 'Probleme mit der Sicherheit',
    docsops: 'no',
    confluence: 'yes',
  },
  {
    label: 'Vom Editor besser nicht anfangen',
    docsops: 'no',
    confluence: 'yes',
  },
];

export type VergleichHubItem = {
  slug: string;
  name: string;
  description: string;
  ready: boolean;
};

export const vergleichHubItems: VergleichHubItem[] = [
  {
    slug: 'confluence',
    name: 'Confluence',
    description: 'Spaces, Plugins und etablierte Intranet-Doku – im Vergleich zu DocsOps.',
    ready: true,
  },
  {
    slug: 'notion',
    name: 'Notion',
    description: 'Flexibilität und All-in-one – vs. org-native Leitplanken.',
    ready: false,
  },
  {
    slug: 'docmost',
    name: 'Docmost',
    description: 'Self-hosted OSS mit Echtzeit-Kollaboration – vs. hierarchische Kontrolle.',
    ready: false,
  },
  {
    slug: 'outline',
    name: 'Outline',
    description: 'Team-Wiki mit klarem Fokus – vs. DocsOps-Strukturmodell.',
    ready: false,
  },
];
