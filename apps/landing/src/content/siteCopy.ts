export const heroCopy = {
  headlineLead: 'Ihr Betriebswissen.',
  headlineQualities: ['Strukturiert', 'Transparent', 'Verbindlich'] as const,
  headlineTail: 'dokumentiert',
  headlineAccessible: 'Ihr Betriebswissen. Strukturiert, transparent, verbindlich dokumentiert.',
  subline: 'Mit DocsOps pflegen Sie den internen Wissensstand und die Abläufe Ihrer Organisation.',
  trustLine: 'Open Source · MIT · Self-hosted',
  scrollHint: 'So funktioniert DocsOps',
  showroomAlt:
    'Team-Dashboard in DocsOps mit Prozessen, Projekten und Dokumenten im Geltungsbereich',
  primaryCta: 'Live-Demo',
  secondaryCta: 'Self-hosted installieren',
} as const;

export type RoleDiagramEdge = {
  from: 'author' | 'lead' | 'member';
  to: 'entwurf' | 'version';
  label: string;
};

export type ScopeNodeId =
  | 'company'
  | 'departmentA'
  | 'departmentB'
  | 'teamA1'
  | 'teamA2'
  | 'teamB1'
  | 'teamB2'
  | 'userPersonal';

export type ScopeLevelId = 'company' | 'department' | 'team' | 'user';

export const scopeCopy = {
  title: 'Organisation als Ebenenmodell',
  intro:
    'Mit DocsOps bilden Sie die Struktur Ihrer Firma nach. Jeder Nutzer gehört einem Bereich an – genau wie in Ihrem Unternehmen. Daraus ergeben sich automatisch die passenden Zugänge, Sichtbarkeiten und Grenzen. So findet jeder genau die Inhalte, die für seinen Arbeitsbereich relevant sind.',
  diagramClickHint: 'Auf Knoten klicken, um mehr zu erfahren.',
  scopeLabel: 'Organisation',
  nodes: {
    company: { label: 'Firma' },
    departmentA: { label: 'Abteilung A' },
    departmentB: { label: 'Abteilung B' },
    teamA1: { label: 'Team A1' },
    teamA2: { label: 'Team A2' },
    teamB1: { label: 'Team B1' },
    teamB2: { label: 'Team B2' },
    userPersonal: { label: 'Nutzer' },
  },
  levelDescriptions: {
    company:
      'Jede Nutzerin und jeder Nutzer ist genau einer Firma zugeordnet – das ist die Wurzel des organisatorischen Geltungsbereichs und gilt immer.',
    department:
      'Optional: Zuordnung zu einer Abteilung innerhalb der Firma. Steuert Sichtbarkeit und Verantwortung auf Abteilungsebene – ohne Abteilung bleibt der Nutzer direkt auf Firmenebene.',
    team: 'Optional: Operatives Team innerhalb einer Abteilung. Die Team-Zuordnung verfeinert den Geltungsbereich – ohne Team bleibt der Nutzer nur der Abteilung bzw. der Firma zugeordnet.',
    user: 'Persönlicher Geltungsbereich außerhalb der Organisationshierarchie – für private Dokumente und persönliche Kontexte, unabhängig von Firma, Abteilung und Team.',
  },
} as const;

export const contextCopy = {
  title: 'Dokumente leben in Kontexten',
  intro:
    'Nach der Zuordnung zur Organisation legen Sie in jedem Geltungsbereich Kontexte an – darin entstehen die Dokumente. Jeder Geltungsbereich kann beliebig viele Kontexte haben; jedes Dokument gehört genau einem Kontext an, entweder einem Prozess oder einem Projekt.',
  types: {
    process: {
      title: 'Prozess',
      subtitle: 'Dauerhaft',
      description:
        'Dauerhafter Kontext für wiederkehrende Abläufe und Standards – z. B. Onboarding, Incident-Response oder Qualitätssicherung. Bleibt bestehen, bis er bewusst archiviert wird.',
    },
    project: {
      title: 'Projekt',
      subtitle: 'Zeitlich begrenzt',
      description:
        'Zeitlich begrenzter Kontext für Vorhaben mit Anfang und Ende – z. B. Software-Rollout oder Audit. Dokumente gehören genau einem Projekt-Kontext an.',
    },
  },
} as const;

export const exampleCopy = {
  title: 'Beispiel: Dokument einordnen',
  intro: 'So finden Sie Geltungsbereich und Kontext, bevor Sie ein Dokument anlegen.',
  steps: [
    {
      question: 'Was soll dokumentiert werden?',
      answer:
        'Der aktuelle Stand der Barrierefreiheit für Software X – als verbindliche, veröffentlichte Fassung für alle Beteiligten (siehe Abschnitt Rollen und Veröffentlichung).',
    },
    {
      question: 'In welchem Geltungsbereich ist das relevant?',
      answer:
        'Das Thema betrifft die Abteilung IT – das entspricht einer Abteilung in unserem Organisationsmodell (wie „Abteilung A“ im Diagramm oben). Dort liegt die Verantwortung für die Software und ihren Produktstand.',
    },
    {
      question: 'Gehört es in einen Prozess oder ein Projekt?',
      answer:
        'Der Inhalt beschreibt den Ist-Stand eines Produkts, nicht den dauerhaften Prüfablauf in der Entwicklung. Ein Prozess wie „Barrierefreiheit in der Entwicklung“ würde den Prüfablauf festhalten – hier geht es um den Produktstand. Deshalb wählen wir einen Projekt-Kontext, z. B. „Software X“.',
    },
    {
      question: 'Wie heißt das Dokument?',
      answer:
        '„Stand Barrierefreiheit“ – angelegt im Projekt-Kontext „Software X“ in der Abteilung IT.',
    },
  ],
} as const;

export const rolesPublicationCopy = {
  title: 'Zugriff erfolgt über Rollen',
  intro:
    'In DocsOps steuern Rollen innerhalb der Organisationshierarchie, wer Dokumente bearbeitet, einbringt und freigibt – bis zur veröffentlichten Version. Zusätzlich legen Sie pro Dokument explizit fest, wer lesen und schreiben darf.',
  diagramClickHint: 'Auf Knoten klicken, um mehr zu erfahren.',
  nodeDescriptions: {
    scope: 'Organisationseinheit, in der Rollen und Dokumente gelten – von der Firma bis zum Team.',
    document: 'Ein Dokument besteht aus einem Entwurf und einer veröffentlichten Version.',
    lead: 'Verantwortlich für Qualität und Freigabe. Kann Entwürfe erstellen, bearbeiten, Vorschläge von Autoren annehmen oder verwerfen und als verbiFndliche Version veröffentlichen.',
    author: 'Formuliert und überarbeitet inhaltliche Vorschläge im Entwurf.',
    member: 'Liest die veröffentlichte Version und kann kommentieren.',
    entwurf: 'Arbeitsfassung: hier werden Änderungen vorbereitet und zusammengeführt.',
    version: 'Veröffentlichte, verbindliche Fassung für alle mit Leserecht.',
  },
  roles: {
    author: 'Autor',
    lead: 'Leitung',
    member: 'Mitglied',
  },
  scope: {
    title: 'Geltungsbereich',
    hint: 'Firma / Abteilung / Team',
  },
  document: {
    title: 'Dokument',
    entwurf: 'Entwurf',
    version: 'Version 1',
  },
  transition: 'wird zu',
  edges: [
    { from: 'lead', to: 'entwurf', label: 'Bearbeitet / Veröffentlicht' },
    { from: 'author', to: 'entwurf', label: 'Erstellt Vorschläge' },
    { from: 'member', to: 'version', label: 'Liest / Kommentiert' },
  ] satisfies RoleDiagramEdge[],
} as const;

export const featuresSectionCopy = {
  title: 'Features',
} as const;

/** Startseite zurückgestellt – `ComparisonSection` */
export const comparisonCopy = {
  title: 'Vergleich',
  footnote:
    'Markenzeichen der genannten Produkte gehören den jeweiligen Anbietern. Angaben ohne Gewähr.',
  linkLabel: 'Ausführliche Vergleiche',
} as const;

/** Startseite zurückgestellt – `FaqSection` */
export const faqCopy = {
  title: 'FAQ',
} as const;

export const warumCopy = {
  title: 'Warum DocsOps',
  intro:
    'DocsOps ist bewusst schlank: klare Leitplanken für interne Dokumentation in Organisationen – statt unbegrenzter Baukasten-Fläche.',
  problemTitle: 'Das Problem',
  problemItems: [
    'Viele Tools bieten viel – aber oft keine Firmenhierarchie im Produkt.',
    'Unklar, wer für die verbindliche Fassung verantwortlich ist.',
    'Unübersichtlichkeit durch Features und freie Spaces.',
  ],
  thesisTitle: 'Unsere These',
  thesis:
    'Dokumentation in Organisationen braucht vorgegebene Struktur und klare Verantwortliche – keine leere Fläche, in der jeder seine eigene Ordnung erfindet.',
  principlesTitle: 'Prinzipien',
  forWhomTitle: 'Für wen?',
  forWhom:
    'Teams mit Org-Struktur und Steuerungsbedarf: klare Verantwortliche, kontrollierte Veröffentlichung, übersichtliche Dokumentation.',
  notForWhomTitle: 'Nicht für wen?',
  notForWhom:
    'Teams, die maximale Flexibilität und paralleles Live-Editing wollen – eher Notion oder Docmost.',
  ctaDemo: 'Live-Demo',
  ctaCompare: 'Vergleiche ansehen',
} as const;

export const vergleichHubCopy = {
  title: 'Vergleiche',
  intro:
    'Ausführliche Head-to-head-Vergleiche zu einzelnen Tools folgen schrittweise. Die Startseiten-Tabelle ist vorübergehend zurückgestellt.',
  backLink: 'Zur Startseite',
  comingSoon: 'Demnächst',
} as const;

export const legalPlaceholderCopy = {
  impressumTitle: 'Impressum',
  datenschutzTitle: 'Datenschutz',
  body: 'Inhalt folgt vor Go-live.',
  backLink: 'Zur Startseite',
} as const;

export const modellNavLinks = [
  { label: 'Organisation', href: '/#scope' },
  { label: 'Kontext', href: '/#kontext' },
  { label: 'Rollen', href: '/#rechte' },
  { label: 'Beispiel', href: '/#einordnen' },
] as const;

export const footerCopy = {
  productTitle: 'Produkt',
  projectTitle: 'Projekt',
  legalTitle: 'Rechtliches',
  modellTitle: 'Modell',
  links: {
    warum: 'Warum DocsOps',
    modell: 'Struktur & Rollen',
    demo: 'Live-Demo',
    github: 'GitHub',
    install: 'Install-Doku',
    impressum: 'Impressum',
    datenschutz: 'Datenschutz',
  },
  meta: (year: number) => `© ${year} DocsOps`,
} as const;

export const navbarCopy = {
  modell: 'Modell',
  warum: 'Warum DocsOps',
  github: 'GitHub',
  demoCta: 'Live-Demo',
} as const;
