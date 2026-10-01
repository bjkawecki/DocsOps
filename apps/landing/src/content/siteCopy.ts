export const heroCopy = {
  pageTitle: 'DocsOps – Betriebswissen verbindlich dokumentieren',
  metaDescription:
    'Internes Wissen übersichtlich pflegen. Feste Org-Struktur statt beliebiger Wiki-Ablage. Rollenbasierte Freigaben. Open Source und zum Selbst-Hosten. Live-Demo ansehen ➔',
  headlineLead: 'Ihr Betriebswissen.',
  headlineQualities: ['Hierarchisch', 'Strukturiert', 'Verbindlich'] as const,
  headlineTail: 'dokumentiert',
  headlineAccessible: 'Ihr Betriebswissen. Hierarchisch, strukturiert, verbindlich dokumentiert.',
  subline: 'Mit DocsOps pflegen Sie den internen Wissensstand in der Struktur Ihrer Organisation.',
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
    'Warum DocsOps so gedacht ist: Wissen in Unternehmen wandert, wird umgeschrieben oder ersetzt und kann mit der Zeit an Wert verlieren. DocsOps ordnet diese Arbeit am Wissen entlang der Organisation.',
  intro: [
    'Jedes Unternehmen ist ein komplexes Zusammenspiel aus Abläufen, Regeln, Entscheidungen, Projekten, Produkten, Systemen sowie Vorlieben und Interessen.',
    'In diesem Zusammenspiel entsteht ständig Wissen. Es wandert zwischen Menschen, wird umgeschrieben, ergänzt oder ersetzt und kann mit der Zeit an Wert verlieren.',
    'Mit diesem Wandel umzugehen heißt, dafür zu sorgen, dass Wissen für die Arbeit im Unternehmen brauchbar bleibt und bewusst weitergeführt wird.',
  ],
  howCare: [
    {
      title: 'Wissen muss festgehalten werden',
      paragraphs: [
        'Das beginnt damit, dass Wissen überhaupt nachlesbar wird. Solange es nur in Köpfen oder in Gesprächen steckt, lässt es sich schwer teilen und noch schwerer weiterführen.',
        'Ein erster Schritt ist deshalb, Wissen zu dokumentieren: in einem System, das andere nachlesen und später ändern können.',
      ],
    },
    {
      title: 'Wissen braucht Kontext',
      paragraphs: [
        'Sobald eine solche Dokumentation existiert, reicht ihr Inhalt allein oft nicht aus. Es fehlt, für wen sie gedacht ist und in welcher Situation sie gilt.',
        'Diesen Zusammenhang findet man in der Organisation schon vor: in Teams, Prozessen und Projekten. Wissen gehört dorthin und zu den Themen, die dort schon geführt werden.',
      ],
    },
    {
      title: 'Wissen braucht Verantwortlichkeit',
      paragraphs: [
        'Eingordnetes Wissen braucht jemanden, der den Stand im Blick behält, während die Arbeit weitergeht.',
        'Deshalb braucht diese Arbeit Zuständige. Diese Rolle kennt die Organisation oft schon: jemanden, der entscheidet, ob ein Stand weitergeführt, als gültig freigegeben, archiviert oder gelöscht wird.',
      ],
    },
  ],
  vision: {
    title: 'Was wir mit DocsOps erreichen wollen',
    paragraphs: [
      'Verlässliche Zusammenarbeit setzt voraus, dass die Arbeit auf einem gemeinsamen, aktuellen Wissensstand ruhen kann.',
      'DocsOps hält diesen Stand in der Organisation. Dokumentation entsteht so nicht als paralleles System neben der Arbeit, sondern in derselben Struktur, in der schon entschieden und verantwortet wird.',
    ],
  },
} as const;

export const philosophyTeaserCopy = {
  title: 'Warum so viele Regeln?',
  body: 'Festzulegen, wo Wissen hingehört und wer sich darum kümmert, kann zunächst nach zu viel Aufwand aussehen. Damit werden Anwender jedoch zu einem Denkprozess angehalten, der auf Dauer die Ordnung aufrechterhält. Mehr dazu unter Philosophie.',
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
    'DocsOps self-hosted im Intranet: Host-Voraussetzungen, curl-Install und Link zur Installationsdoku.',
  intro:
    'Self-hosted auf einem Linux-Host per Docker Compose. Standard: HTTP hinter Caddy auf Port 80 im Intranet.',
  requirementsTitle: 'Voraussetzungen',
  requirements: [
    'Linux-Host mit root-Zugriff',
    'Docker Engine und Compose-Plugin (Install-Skript installiert sie bei Bedarf)',
    'Mindestens 4 GB RAM und 20 GB freier Speicher',
  ],
  installTitle: 'Standard-Installation',
  installHint: 'Lädt das aktuelle Release-Bundle nach /opt/docsops, startet den Stack auf Port 80.',
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
