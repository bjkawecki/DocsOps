import type { TablerIcon } from '@tabler/icons-react';
import {
  IconBuilding,
  IconCloudDownload,
  IconFolder,
  IconGitPullRequest,
  IconKey,
  IconShieldCheck,
} from '@tabler/icons-react';

export type FeatureItem = {
  title: string;
  description: string;
  icon: TablerIcon;
};

export const features: FeatureItem[] = [
  {
    title: 'Firmenstruktur eingebaut',
    description:
      'Firma, Abteilung und Team sind Teil des Produkts – nicht nur frei benannte Spaces, die jeder anders nutzt.',
    icon: IconBuilding,
  },
  {
    title: 'Rechte pro Dokument',
    description:
      'Leser und Schreiber je Dokument festlegen – feiner als „alle im Space sehen alles“.',
    icon: IconKey,
  },
  {
    title: 'Veröffentlichung durch Leads',
    description: 'Nur Team-, Abteilungs- oder Firmen-Leads setzen die Version, die Leser sehen.',
    icon: IconShieldCheck,
  },
  {
    title: 'Entwürfe & Vorschläge',
    description:
      'Änderungen im Entwurf oder als Vorschlag – ohne paralleles Live-Editing im selben Text.',
    icon: IconGitPullRequest,
  },
  {
    title: 'Prozess & Projekt',
    description:
      'Dokumente leben in Kontexten mit klarer Bedeutung – Prozessdoku und Projektdoku getrennt.',
    icon: IconFolder,
  },
  {
    title: 'Self-hosted & Open Source',
    description: 'MIT-Lizenz, Docker on-prem – eure Daten bleiben in eurer Infrastruktur.',
    icon: IconCloudDownload,
  },
];

export const philosophiePrinciples = [
  {
    title: 'Firmenstruktur abbilden',
    description: 'Company → Department → Team als festes Modell.',
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
    description: 'Kontexte statt einer flachen Seitenliste.',
    icon: IconFolder,
  },
  {
    title: 'Self-hosted & Open Source',
    description: 'MIT-Lizenz, Docker auf eigener Infrastruktur.',
    icon: IconCloudDownload,
  },
];
