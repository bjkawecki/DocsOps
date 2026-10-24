export type ComparisonValue = 'yes' | 'no' | 'partial';

export type ComparisonRow = {
  label: string;
  detail?: string;
  docsops: ComparisonValue;
  docsopsNote?: string;
  confluence: ComparisonValue;
  confluenceNote?: string;
};

/** Compact head-to-head for `/vergleich` (DocsOps vs. Confluence). */
export const comparisonRows: ComparisonRow[] = [
  {
    label: 'Self-hosted / On-Prem',
    docsops: 'yes',
    confluence: 'partial',
    confluenceNote: 'oft Cloud',
  },
  {
    label: 'Open Source',
    docsops: 'yes',
    docsopsNote: 'MIT',
    confluence: 'no',
  },
  {
    label: 'Firma, Abteilung, Team',
    detail: 'Org-Modell im Produkt',
    docsops: 'yes',
    confluence: 'no',
  },
  {
    label: 'Zugriff je Dokument',
    docsops: 'yes',
    confluence: 'partial',
  },
  {
    label: 'Nur Leads veröffentlichen',
    detail: 'verbindliche Fassung',
    docsops: 'yes',
    confluence: 'no',
  },
  {
    label: 'Vorschläge & Lead-Freigabe',
    docsops: 'yes',
    confluence: 'partial',
  },
  {
    label: 'Versionierung',
    detail: 'Entwurf und freigegebene Fassung',
    docsops: 'yes',
    confluence: 'partial',
  },
  {
    label: 'Leitplanken statt leerer Fläche',
    docsops: 'yes',
    confluence: 'no',
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
