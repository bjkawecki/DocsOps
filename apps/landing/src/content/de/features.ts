import type { TablerIcon } from '@tabler/icons-react';
import {
  IconBuilding,
  IconCloudLock,
  IconFileCheck,
  IconFolder,
  IconGitPullRequest,
  IconKey,
  IconShieldCheck,
  IconSitemap,
} from '@tabler/icons-react';

export type FeatureItem = {
  title: string;
  description: string;
  icon: TablerIcon;
};

export const features: FeatureItem[] = [
  {
    title: 'Org-Hierarchie',
    description:
      'DocsOps bildet die vorhandene Struktur eures Unternehmens ab und knüpft die Sichtbarkeit von Wissen an die Zugehörigkeit.',
    icon: IconSitemap,
  },
  {
    title: 'Governance',
    description:
      'Mit dokumentbezogenen Rollen und Freigaben werden Dokumente verbindlich und Änderungen nachvollziehbar.',
    icon: IconShieldCheck,
  },
  {
    title: 'Do11y',
    description:
      'Documentation Observability (Do11y) zeigt Verantwortlichen, bei welchen Dokumenten eine Prüfung ansteht, ob sie noch aktuell sind.',
    icon: IconFileCheck,
  },
  {
    title: 'Datenkontrolle',
    description:
      'Eure Wissensbasis – eure Kontrolle. DocsOps lässt sich selbst betreiben. Export, Backup und Import halten den Bestand portierbar.',
    icon: IconCloudLock,
  },
];

export const philosophiePrinciples = [
  {
    title: 'Firmenstruktur abbilden',
    description: 'Company, Department und Team als festes Modell.',
    icon: IconBuilding,
  },
  {
    title: 'Rechte am Dokument',
    description: 'Explizite Leser- und Schreiberrechte – nicht nur Bereichs-Rechte.',
    icon: IconKey,
  },
  {
    title: 'Veröffentlichung durch Leads',
    description: 'Leads setzen die verbindliche Fassung für Leser.',
    icon: IconShieldCheck,
  },
  {
    title: 'Entwürfe & Vorschläge',
    description: 'Beiträge im Entwurf, Verantwortliche führen zusammen.',
    icon: IconGitPullRequest,
  },
  {
    title: 'Prozess & Projekt',
    description:
      'Kontexte statt flacher Seitenliste – Dokumente können mit Lead-Freigabe zwischen Scopes wechseln.',
    icon: IconFolder,
  },
  {
    title: 'Self-hosted & Quelloffen',
    description: 'Quelloffen, Docker auf eigener Infrastruktur.',
    icon: IconCloudLock,
  },
];
