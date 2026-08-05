export const heroCopy = {
  pageTitle: 'DocsOps – Betriebswissen verbindlich dokumentieren',
  metaDescription:
    'Internes Wissen übersichtlich pflegen. Feste Org-Struktur statt beliebiger Wiki-Ablage. Rollenbasierte Freigaben. Open Source und zum Selbst-Hosten. Live-Demo ansehen ➔',
  headlineLead: 'Ihr Betriebswissen.',
  headlineQualities: ['Strukturiert', 'Transparent', 'Verbindlich'] as const,
  headlineTail: 'dokumentiert',
  headlineAccessible: 'Ihr Betriebswissen. Strukturiert, transparent, verbindlich dokumentiert.',
  subline: 'Mit DocsOps pflegen Sie den internen Wissensstand und die Abläufe Ihrer Organisation.',
  trustPills: ['Open Source', 'Self-hosted'] as const,
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
    'In Organisationen ist jeder Nutzer in einen hierarchischen Geltungsbereich eingebettet: von der Firma über die Abteilung bis ins Team. DocsOps bildet diese Ebenen nach und leitet daraus Sichtbarkeit und Zugänge ab.',
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
      'In jeder DocsOps-Instanz gibt es genau eine Firma als organisatorische Wurzel. Alle Anwender sind ihr zugeordnet und haben dadurch Zugriff auf diesen Bereich.',
    department:
      'Abteilungen gliedern die Firma nach fachlicher Zuständigkeit (zum Beispiel IT oder Vertrieb).\n\nIn DocsOps können Sie Anwender genau einer Abteilung zuordnen und erweitern damit deren Zugriff auf Kontexte und Dokumente dieser Abteilung.',
    team: 'Teams sind die kleinste operative Einheit der Organisation und gehören immer einer Abteilung an.\n\nIn DocsOps können Anwender genau einem Team zugeordnet werden. Dadurch erhalten diese Zugriff auf Kontexte und Dokumente des Teams sowie der übergeordneten Abteilung.',
    user: 'Jeder Anwender hat einen eigenen Organisationsbereich außerhalb der Firmenstruktur.\n\n Kontexte und Dokumente dort sind nicht über Firma, Abteilung oder Team einsehbar und gehören nur diesem Anwender.',
  },
} as const;

export const contextCopy = {
  title: {
    before: 'Informationen brauchen ',
    accent: 'Kontext',
  },
  intro:
    'Informationen werden erst durch Bündelung zusammengehöriger Inhalte wirksam. DocsOps verlangt daher für jedes Dokument die Zuordnung zu einem Kontext.\n\nDabei ist die grundlegende Unterscheidung festgelegt: Prozess oder Projekt – dauerhafte Abläufe einerseits, Wissen zu einem Thema oder Vorhaben andererseits.',
  introHighlights: ['Kontext', 'Prozess', 'Projekt'],
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
  intro: 'Vor dem Anlegen: Geltungsbereich und Kontext festlegen.',
  introHighlights: ['Geltungsbereich', 'Kontext'],
  steps: [
    {
      question: 'Was soll dokumentiert werden?',
      answer: 'Aktueller Stand der Barrierefreiheit von Software X.',
    },
    {
      question: 'In welchem Geltungsbereich ist das relevant?',
      answer: 'Abteilung IT: dort liegt die Verantwortung für die Software.',
    },
    {
      question: 'Gehört es in einen Prozess oder ein Projekt?',
      answer:
        'Nicht der Prüfablauf (Prozess), sondern der Produktstand. Deshalb Projekt-Kontext „Software X“.',
    },
    {
      question: 'Wie heißt das Dokument?',
      answer: 'Dokument: „Stand Barrierefreiheit“.',
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
    'Gute Texte sind Teamwork, doch nicht jede Änderung gehört sofort in die verbindliche Fassung. In DocsOps steuern Rollen, wer im Entwurf mitarbeitet und wer veröffentlicht. So entsteht eine verbindliche, veröffentlichte Fassung.',
  introHighlights: ['Rollen', 'Teamwork', 'Entwurf'],
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

/** FAQ on home – `FaqSection` */
export const faqCopy = {
  title: 'FAQ',
} as const;

export const philosophieCopy = {
  pageHeadline: 'Unser Ansatz',
  metaDescription:
    'Der DocsOps-Ansatz: Dokumentation als Teil des Betriebs, Organisation als Rahmen, Kontext, getrennte Mitwirkung und Veröffentlichung, Verantwortung und Zugriff.',
  tagline: 'Dokumentation ist Teil des Betriebs, nicht nur dessen Abdruck.',
  narrative: [
    'Unternehmen bestehen aus Abläufen, Regeln, Entscheidungen, Projekten und Dingen, mit denen gearbeitet wird. Dieses Wissen entsteht laufend, verändert sich und wird von vielen Menschen genutzt.',
    'DocsOps bildet diesen Teil des Unternehmens ab: eine gemeinsame Grundlage dafür, wie ein Unternehmen arbeitet und was dabei gilt. Struktur, Zusammenarbeit und Verbindlichkeit gehören zusammen.',
  ],
  meansTitle: 'Was DocsOps anders macht',
  meansItems: [
    {
      title: 'Die Organisation gibt den Rahmen vor',
      paragraphs: [
        'Unternehmen haben Strukturen und Zuständigkeiten. DocsOps nimmt diese Organisation als Rahmen für Dokumentation, ohne die Inhalte vorzuschreiben.',
      ],
    },
    {
      title: 'Information braucht Kontext',
      paragraphs: [
        'Wissen braucht einen festen Bezug im Unternehmen. So bleibt klar, wozu etwas gehört, nicht nur, was geschrieben wurde.',
      ],
    },
    {
      title: 'Gemeinsam bearbeiten. Verbindlich veröffentlichen.',
      paragraphs: [
        'Mitwirkung und Veröffentlichung bleiben getrennt. Erst die freigegebene Fassung ist der Stand, auf den andere ihre Arbeit stützen.',
      ],
    },
    {
      title: 'Verantwortung ist nicht dasselbe wie Zugriff',
      paragraphs: [
        'Zuständigkeit und Leserecht sind verschiedene Dinge. Verantwortung bleibt lokal; Sichtbarkeit in der Organisation kann darüber hinaus reichen.',
      ],
    },
  ],
  visionTitle: 'Unsere Vision',
  vision: [
    'Unternehmen sollten nicht davon abhängen, dass jemand weiß, wie es läuft. Was bleibt, gehört zur Organisation selbst: wie wir arbeiten, womit wir arbeiten, was gilt, wer verantwortlich ist.',
    'DocsOps soll daraus eine nachvollziehbare Abbildung machen: strukturiert genug für Orientierung, offen genug für die eigene Organisation, verbindlich genug zum Arbeiten danach.',
    'Gute Unternehmensdokumentation beschreibt nicht nur, was ein Unternehmen tut. Sie ist Teil davon, wie es funktioniert.',
  ],
  summaryTitle: 'Für wen DocsOps gedacht ist',
  fitsForTitle: 'DocsOps passt zu Ihnen, wenn Sie',
  fitsFor: [
    'Abläufe und Bestand strukturiert abbilden möchten',
    'klare Verantwortlichkeiten brauchen',
    'gemeinsam arbeiten möchten, ohne jeden Entwurf sofort offiziell zu machen',
    'eine vorgegebene Struktur als Orientierung schätzen',
  ],
  doesNotFitForTitle: 'DocsOps ist eher nichts für Sie, wenn Sie',
  doesNotFitFor: [
    'vor allem eine freie Notiz- oder Brainstorming-Fläche suchen',
    'ohne Organisationsmodell dokumentieren möchten',
    'maximale Gestaltungsfreiheit wichtiger finden als einen gemeinsamen Rahmen',
  ],
  ctaBody: 'Genug Haltung. Demo öffnen oder das Projekt unterstützen.',
  primaryCta: 'Live-Demo',
  secondaryCta: 'Unterstützen',
} as const;

export const philosophyTeaserCopy = {
  title: 'Warum so viele Regeln?',
  body: 'Geltungsbereich, Kontext und Rollen können nach viel Aufwand aussehen. Der Ansatz dahinter: Dokumentation ist Teil des Betriebs, nicht nur dessen Abdruck.',
  cta: 'Zur Philosophie',
} as const;

export const finalCtaCopy = {
  title: 'DocsOps ausprobieren',
  body: 'Genug erklärt. Jetzt Live-Demo öffnen oder DocsOps selbst installieren.',
  primaryCta: 'Live-Demo',
  secondaryCta: 'Installation',
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
} as const;

export const changelogCopy = {
  title: 'Changelog',
  metaDescription: 'Versionshistorie und Änderungen an DocsOps.',
  intro:
    'Versionshistorie von DocsOps. Die Notes stammen aus denselben Release-Dateien wie in der App.',
  empty: 'Noch keine Release Notes veröffentlicht.',
  latestBadge: 'Aktuell',
  noBody: 'Keine ausführlichen Notes für diese Version.',
} as const;

export const sponsorCopy = {
  title: 'Unterstützen',
  metaDescription:
    'Unterstützen Sie die Entwicklung von DocsOps – Open Source, self-hosted Dokumentationsplattform.',
  intro:
    'DocsOps ist Open Source (MIT) und kommt ohne Abo-Modell. Freiwillige Unterstützung hilft bei Infrastruktur, Pflege und Weiterentwicklung.',
  whyTitle: 'Wofür die Unterstützung da ist',
  whyItems: [
    'Hosting und Betrieb der öffentlichen Demo',
    'Zeit für Fixes, Releases und Dokumentation',
    'Weiterentwicklung des Modells und der Plattform',
  ],
  ctaBody: 'Aktuell hilft am besten ein Stern auf GitHub.',
  ctaPrimary: 'GitHub Sponsors',
  ctaStar: 'Stern auf GitHub',
} as const;

export const vergleichHubCopy = {
  title: 'Vergleiche',
  metaDescription:
    'DocsOps im Vergleich zu anderen Dokumentations- und Wiki-Tools – Head-to-head-Seiten folgen schrittweise.',
  intro:
    'Ausführliche Head-to-head-Vergleiche zu einzelnen Tools folgen schrittweise. Die Startseiten-Tabelle ist vorübergehend zurückgestellt.',
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

/** Footer-only: personal site of the maintainer. */
export const authorSiteLink = {
  label: 'bjoernkawecki.de',
  href: 'https://bjoernkawecki.de/projects/docs-ops/',
} as const;

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
