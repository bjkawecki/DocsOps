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

/** FAQ on home – `FaqSection` */
export const faqCopy = {
  title: 'FAQ',
} as const;

export const philosophieCopy = {
  pageHeadline: 'Unser Ansatz',
  metaDescription:
    'Warum DocsOps Zusammenarbeit und Veröffentlichung trennt – und wofür der Ansatz gedacht ist.',
  tagline:
    'Interne Dokumentation ist Betriebswissen: gepflegt, verantwortet und für Leser verlässlich – nicht nur ein gemeinsamer Speicher.',
  narrative: [
    'Organisationen brauchen einen offiziellen Wissensstand. Nicht jede Notiz ist sofort gültig; nicht jeder Entwurf ist schon der Stand der Firma. DocsOps trennt deshalb Mitwirkung von Veröffentlichung: Beiträge entstehen im Arbeitsmodus, Leser erhalten eine geprüfte, versionierte Fassung.',
    'Viele Tools optimieren flexible Ablage und offene Zusammenarbeit. DocsOps optimiert Verlässlichkeit und Verantwortung: Wer darf mitwirken, wer gibt frei, welcher Stand gilt – das ist keine Nebenfrage, sondern Teil des Ansatzes. Wie das im Produkt umgesetzt ist, sehen Sie auf der Startseite.',
  ],
  meansTitle: 'Was das bedeutet',
  meansSubtitle: 'Grundsätze hinter dem Modell – nicht die Bedienung.',
  meansItems: [
    {
      title: 'Verbindlicher Stand.',
      description:
        'Leser sollen sich auf Dokumentation verlassen können – nicht auf den jeweils aktuellen Bearbeitungsstand.',
    },
    {
      title: 'Verantwortung statt Selbstorganisation.',
      description:
        'Es gibt einen offiziellen Wissensstand; Freigabe ist ein bewusster Schritt, nicht ein Nebenprodukt des Speicherns.',
    },
    {
      title: 'Struktur folgt der Organisation.',
      description:
        'Wissen gehört in den Kontext der Firma – nicht in beliebige Ordner, die jede Abteilung neu erfindet.',
    },
    {
      title: 'Mitwirkung ohne Sofort-Verbindlichkeit.',
      description:
        'Beiträge und Vorschläge sind erwünscht; Veröffentlichung markiert, was ab jetzt gilt.',
    },
    {
      title: 'Dauerhaftes und Vorhaben-Wissen.',
      description:
        'Prozesswissen und Projektstand sind verschiedene Dinge – beides braucht klare, haltbare Fassungen.',
    },
    {
      title: 'Self-hosted und Open Source.',
      description: 'Betriebswissen bleibt unter Ihrer Kontrolle – technisch und organisatorisch.',
    },
  ],
  summaryTitle: 'Kurz gesagt',
  fitsForTitle: 'DocsOps eignet sich für',
  fitsFor: [
    'Organisationen, die internen Wissensstand steuern und absichern wollen',
    'Unternehmen mit klaren Verantwortlichen für verbindliche Fassungen',
    'Teams, die Mitwirkung wollen, ohne jeden Entwurf sofort offiziell zu machen',
    'Betriebe, die Wissen als organisatorisches Gut pflegen – nicht als private Notizen',
    'Umgebungen mit Qualitäts- oder Compliance-Anforderungen an Dokumentation',
  ],
  doesNotFitForTitle: 'DocsOps eignet sich nicht für',
  doesNotFitFor: [
    'Reine Brainstorming- oder Notizflächen ohne offiziellen Stand',
    'Teams, die Struktur und Freigabe vollständig den Nutzenden überlassen wollen',
    'Szenarien ohne Bedarf an nachvollziehbarem, freigegebenem Wissensstand',
    'Projekte, die vor allem maximale Gestaltungsfreiheit ohne Leitplanken suchen',
  ],
} as const;

export const philosophyTeaserCopy = {
  title: 'Warum so viele Regeln?',
  body: 'Scope, Kontext und Rollen auf der Startseite zeigen, wie DocsOps arbeitet – hier geht es um den Ansatz dahinter: verbindlicher Wissensstand statt ungebremster Wiki-Fläche.',
  cta: 'Zur Philosophie',
} as const;

export const finalCtaCopy = {
  title: 'DocsOps ausprobieren',
  body: 'Verstehen Sie das Modell auf der Startseite – und testen Sie dann Demo oder Installation.',
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
    'DocsOps ist Open Source (MIT) und wird ohne Abo-Modell betrieben. Freiwillige Unterstützung hilft bei Infrastruktur, Pflege und Weiterentwicklung.',
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
