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
  secondaryCta: 'Installation',
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
  title: {
    before: 'Organisation als ',
    accent: 'Ebenenmodell',
  },
  intro:
    'In Organisationen hat jeder Nutzer einen Geltungsbereich – Firma, optional Abteilung und Team. DocsOps bildet diese Ebenen nach und leitet daraus Sichtbarkeit und Zugänge ab. So findet jeder die Inhalte, die zu seinem Arbeitsbereich gehören – ohne manuelle Berechtigungslisten pro Seite.',
  introHighlights: ['Bereich', 'Firma', 'Team'],
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
  title: {
    before: 'Informationen brauchen ',
    accent: 'Kontext',
  },
  intro:
    'Selten steht eine Information für sich allein – ein Kontext bündelt zusammengehörige Inhalte innerhalb eines Bereichs. Beim Anlegen eines Dokuments wählen Sie in DocsOps Prozess oder Projekt; eine weitere Kategorie gibt es nicht. So trennen Sie dauerhafte Abläufe von Wissen zu einem Thema oder Vorhaben.',
  introHighlights: ['Bereich', 'Prozess', 'Projekt'],
  orLabel: 'oder',
  types: {
    process: {
      title: 'Prozess',
      description:
        'Sie dokumentieren, wie etwas gemacht wird – Abläufe, Standards und wiederkehrende Regeln.',
      examples: [
        'Onboarding-Leitfaden',
        'Störungsablauf und Eskalation',
        'Freigabeprozess für Releases',
      ],
    },
    project: {
      title: 'Projekt',
      description: 'Sie bündeln den Ist-Stand zu einem Thema, Produkt oder Vorhaben.',
      examples: [
        'Dokumentation eines Repository',
        'Infrastruktur-Übersicht',
        'CI/CD-Pipeline und Deployment',
      ],
    },
  },
} as const;

export const exampleCopy = {
  title: {
    before: '',
    accent: 'Beispiel',
    after: ': ein Dokument einordnen',
  },
  intro: 'So finden Sie Geltungsbereich und Kontext, bevor Sie ein Dokument anlegen.',
  introHighlights: ['Geltungsbereich', 'Kontext'],
  steps: [
    {
      question: 'Was soll dokumentiert werden?',
      answer:
        'Der aktuelle Stand der Barrierefreiheit für Software X – als verbindliche, veröffentlichte Fassung für alle Beteiligten.',
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
  title: {
    before: '',
    accent: 'Rollenbasierte',
    after: ' Zusammenarbeit',
  },
  intro:
    'Gute Texte sind Teamwork, doch nicht jede Änderung gehört sofort in die verbindliche Fassung. In DocsOps steuern Rollen, wer im Entwurf mitarbeitet und wer veröffentlicht. So entsteht eine verbindliche, veröffentlichte Fassung, zu der Leser in Kommentaren Feedback geben können.',
  introHighlights: ['Rollen', 'Teamwork', 'Kommentaren'],
  diagramClickHint: 'Auf Knoten klicken, um mehr zu erfahren.',
  nodeDescriptions: {
    scope: 'Organisationseinheit, in der Rollen und Dokumente gelten – von der Firma bis zum Team.',
    document: 'Ein Dokument besteht aus einem Entwurf und einer veröffentlichten Version.',
    lead: 'Verantwortlich für Qualität und Freigabe. Kann Entwürfe erstellen, bearbeiten, Vorschläge von Autoren annehmen oder verwerfen und als verbindliche Version veröffentlichen.',
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

export const philosophieCopy = {
  title: 'Philosophie',
  metaDescription:
    'Warum DocsOps bewusst anders ist: Hierarchie, Veröffentlichung und verbindlicher Wissensstand statt freier Wiki-Fläche.',
  intro:
    'DocsOps ist bewusst schlank: klare Leitplanken für interne Dokumentation in Organisationen – statt unbegrenzter Baukasten-Fläche.',
  problemTitle: 'Das Problem',
  problemItems: [
    'Viele Tools bieten viel – aber oft keine Firmenhierarchie im Produkt.',
    'Unklar, wer für die verbindliche Fassung verantwortlich ist.',
    'Unübersichtlichkeit durch Features und frei benannte Bereiche.',
  ],
  thesisTitle: 'Unsere These',
  thesis:
    'Dokumentation in Organisationen braucht vorgegebene Struktur und klare Verantwortliche – keine leere Fläche, in der jeder seine eigene Ordnung erfindet.',
  abgrenzungTitle: 'Abgrenzung',
  abgrenzung:
    'DocsOps ist kein Wiki mit freier Seitenstruktur. Wir setzen auf vorgegebene Hierarchie und kontrollierte Veröffentlichung – nicht auf paralleles Live-Editing in derselben Fassung. Wer maximale Flexibilität ohne Leitplanken sucht, findet eher in offenen Kollaborations-Tools.',
  principlesTitle: 'Prinzipien',
  forWhomTitle: 'Für wen?',
  forWhom:
    'Teams mit Org-Struktur und Steuerungsbedarf: klare Verantwortliche, kontrollierte Veröffentlichung, übersichtliche Dokumentation.',
  notForWhomTitle: 'Nicht für wen?',
  notForWhom:
    'Teams, die maximale Flexibilität und paralleles Live-Editing ohne Freigabe wollen – DocsOps optimiert den offiziellen Wissensstand, nicht gleichzeitiges Mitschreiben.',
  ctaDemo: 'Live-Demo',
  ctaInstall: 'Installation',
} as const;

export const philosophyTeaserCopy = {
  title: 'Warum so viele Regeln?',
  body: 'Scope, Kontext und Rollen wirken auf den ersten Blick komplex – sie sichern aber einen verbindlichen Wissensstand statt einer unübersichtlichen Wiki-Fläche.',
  cta: 'Zur Philosophie',
} as const;

export const finalCtaCopy = {
  title: 'DocsOps ausprobieren',
  body: 'Verstehen Sie das Modell auf der Startseite – vertiefen Sie in der Philosophie – und testen Sie dann Demo oder Installation.',
  primaryCta: 'Live-Demo',
  secondaryCta: 'Installation',
  philosophyLink: 'Philosophie',
} as const;

export const installCopy = {
  title: 'Installation',
  metaDescription:
    'DocsOps self-hosted im Intranet installieren: Voraussetzungen, Standard-Install per curl und Link zur vollständigen Doku.',
  intro:
    'DocsOps läuft self-hosted in Ihrer Infrastruktur – typisch als Intranet-Installation auf einem Linux-Server mit Docker.',
  audienceTitle: 'Für wen?',
  audience:
    'IT-Teams, die interne Dokumentation on-prem betreiben wollen – ohne SaaS-Abhängigkeit. Standard: HTTP auf Port 80 im Intranet.',
  requirementsTitle: 'Voraussetzungen',
  requirements: [
    'Linux-Server mit sudo',
    'Docker (wird bei Bedarf vom Install-Skript eingerichtet)',
    'Port 80 frei',
    'Minimum: 4 GB RAM, 20 GB freier Speicherplatz',
  ],
  installTitle: 'Standard-Installation',
  installHint:
    'Lädt das neueste Release-Bundle nach /opt/docsops und startet DocsOps auf Port 80. Nur Release-Tags (vX.Y.Z), kein Branch main.',
  fullDocsLabel: 'Vollständige Installationsdoku',
  ctaDemo: 'Live-Demo',
  backLink: 'Zur Startseite',
} as const;

export const changelogCopy = {
  title: 'Changelog',
  metaDescription: 'Versionshistorie und Änderungen an DocsOps.',
  backLink: 'Zur Startseite',
} as const;

export const sponsorCopy = {
  title: 'Unterstützen',
  metaDescription:
    'Unterstützen Sie die Entwicklung von DocsOps – Open Source, self-hosted Dokumentationsplattform.',
  intro:
    'DocsOps ist Open Source (MIT) und wird ohne Abo-Modell betrieben. Freiwillige Unterstützung hilft bei Infrastruktur, Pflege und Weiterentwicklung.',
  linksTitle: 'Unterstützung',
  linksHint: 'Externe Dienste – Sie verlassen docsops.de.',
  backLink: 'Zur Startseite',
} as const;

export const vergleichHubCopy = {
  title: 'Vergleiche',
  intro:
    'Ausführliche Head-to-head-Vergleiche zu einzelnen Tools folgen schrittweise. Die Startseiten-Tabelle ist vorübergehend zurückgestellt.',
  backLink: 'Zur Startseite',
  comingSoon: 'Demnächst',
} as const;

export const modellNavLinks = [
  { label: 'Organisation', href: '/#scope' },
  { label: 'Kontext', href: '/#kontext' },
  { label: 'Rollen', href: '/#rollen' },
  { label: 'Beispiel', href: '/#einordnen' },
] as const;

export const projectNavLinks = [
  { label: 'GitHub', href: 'github', external: true },
  { label: 'Changelog', href: '/changelog', external: false },
  { label: 'Unterstützen', href: '/sponsor', external: false },
] as const;

export const footerCopy = {
  productTitle: 'Produkt',
  projectTitle: 'Projekt',
  legalTitle: 'Rechtliches',
  modellTitle: 'So funktioniert’s',
  links: {
    philosophie: 'Philosophie',
    installation: 'Installation',
    demo: 'Live-Demo',
    github: 'GitHub',
    changelog: 'Changelog',
    sponsor: 'Unterstützen',
    impressum: 'Impressum',
    datenschutz: 'Datenschutz',
  },
  meta: (year: number) => `© ${year} DocsOps`,
} as const;

export const navbarCopy = {
  modell: 'So funktioniert’s',
  philosophie: 'Philosophie',
  demoCta: 'Live-Demo',
} as const;
