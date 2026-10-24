export type ComparisonValue = 'yes' | 'no' | 'partial';

export type ComparisonRow = {
  label: string;
  detail?: string;
  docsops: ComparisonValue;
  docsopsNote?: string;
  confluence: ComparisonValue;
  confluenceNote?: string;
  docmost: ComparisonValue;
  tooltip?: string;
};

/** Compact head-to-head for `/vergleich` (not on the home page). */
export const comparisonRows: ComparisonRow[] = [
  {
    label: 'Self-hosted / On-Prem',
    docsops: 'yes',
    confluence: 'partial',
    confluenceNote: 'oft Cloud',
    docmost: 'yes',
    tooltip:
      'DocsOps läuft auf Ihrer Infrastruktur. Confluence Data Center ist möglich, viele Organisationen nutzen Cloud.',
  },
  {
    label: 'Open Source',
    docsops: 'yes',
    docsopsNote: 'MIT',
    confluence: 'no',
    docmost: 'yes',
    tooltip: 'DocsOps: MIT. Docmost: AGPL. Confluence ist proprietär.',
  },
  {
    label: 'Firma, Abteilung, Team',
    detail: 'Org-Modell im Produkt',
    docsops: 'yes',
    confluence: 'no',
    docmost: 'no',
    tooltip:
      'Die Plattform kennt Firma, Abteilung und Team. Confluence und Docmost arbeiten mit Spaces ohne eingebaute Org-Hierarchie.',
  },
  {
    label: 'Zugriff je Dokument',
    docsops: 'yes',
    confluence: 'partial',
    docmost: 'partial',
    tooltip:
      'Pro Dokument festlegen, wer lesen und schreiben darf – feiner als nur Bereichs-Rechte.',
  },
  {
    label: 'Nur Leads veröffentlichen',
    detail: 'verbindliche Fassung',
    docsops: 'yes',
    confluence: 'no',
    docmost: 'no',
    tooltip:
      'Die offizielle Leser-Version setzt die Leitung in der Linie. Schreibrecht allein ändert bei DocsOps nicht den freigegebenen Stand.',
  },
  {
    label: 'Vorschläge & Lead-Freigabe',
    docsops: 'yes',
    confluence: 'partial',
    docmost: 'no',
    tooltip:
      'Mitarbeitende arbeiten im Rahmen der Struktur; Verantwortliche führen Änderungen zusammen.',
  },
  {
    label: 'Versionierung',
    detail: 'Entwurf und freigegebene Fassung',
    docsops: 'yes',
    confluence: 'partial',
    docmost: 'no',
    tooltip:
      'Entwurf und veröffentlichte Fassung sind getrennt. Leser sehen eine stabile Version; der Verlauf bleibt nachvollziehbar.',
  },
  {
    label: 'Leitplanken statt leerer Fläche',
    docsops: 'yes',
    confluence: 'no',
    docmost: 'no',
    tooltip:
      'Kontexte und Org-Ebenen sind Teil des Produkts. Weniger Wiki-Wildwuchs, weil die Ordnung nicht erst erfunden werden muss.',
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
