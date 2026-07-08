# Weitere Docs-Wettbewerber: Mintlify · GitBook · Fern · Read the Docs · KnowledgeOwl

**Status:** Vorbereitet für `/vergleich` und Marketing – **nicht** auf der Startseiten-Tabelle (dort bleiben DocsOps · Confluence · Docmost).

Diese Anbieter sind im **Docs-Business**, zielen aber auf **andere Jobs-to-be-done** als DocsOps: öffentliche Developer-Docs, API-Referenzen, Git-/CI-getriebene Publikation oder klassische Knowledge Bases – nicht auf **org-native interne Dokumentation** mit Firma → Abteilung → Team und Lead-gesteuerter Veröffentlichung.

Legende: **✓** ja / im Kernmodell · **✗** nein / nicht im Kernmodell · **◐** teilweise, Add-on oder nur mit Disziplin/Enterprise

Siehe auch: [startseite-confluence-docmost.md](./startseite-confluence-docmost.md) (Kernvergleich Intranet-Wikis)

---

## Kurzprofile (Ansatz & Aufwand)

| Produkt           | Primärer Einsatz                                     | Typischer Ansatz                                                     | Hosting / Aufwand                                                                                                              |
| ----------------- | ---------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Mintlify**      | Öffentliche Product- & API-Docs, Developer Portals   | MDX in Git, starke Themes, AI-Search/Chat, `docs.json`-Konfiguration | **SaaS**; Self-host/Static Export nur **Enterprise**                                                                           |
| **GitBook**       | Product Docs, interne Tech-Docs, Spaces              | Git-Sync + Editor, schnelle Publikation, Spaces/Collections          | **SaaS**; kein echtes Self-hosting der Plattform (nur separates OSS-**Rendering**-Repo, nicht empfohlen)                       |
| **Fern**          | API-Docs + SDK-Generierung aus OpenAPI/Specs         | **Docs-as-Code** aus API-Definitionen; generierte Referenz + Prosa   | **Managed Cloud**; Self-host als **Enterprise**-Docker-Image                                                                   |
| **Read the Docs** | Open-Source- & Tech-Projekt-Docs (Sphinx, MkDocs, …) | Build & Host aus Git; Versionen pro Branch/Tag                       | **OSS** (`readthedocs.org`); Self-host **möglich**, offiziell **nicht** für On-Prem empfohlen – Hauptprodukt ist **RTD Cloud** |
| **KnowledgeOwl**  | Help Center, Support-KB, interne Wissensdatenbank    | Kategorien/Artikel, WYSIWYG, Suche, öffentlich/privat/hybrid         | **SaaS only** – kein Self-hosting                                                                                              |

**Gemeinsam:** Fokus auf **schnelles Publizieren**, **gute Leser-UX** (oft öffentlich) und/oder **Docs-from-Git** – wenig bis keine eingebaute **Organisationshierarchie** mit Lead-Verantwortung pro Linie.

**DocsOps:** Mehr **Implementierungs- und Betriebsaufwand** (eigene Instanz, opinionated Modell), dafür **Struktur, Rechte und Freigabe** für interne Compliance- und Prozessdoku.

---

## Vergleichstabelle (DocsOps-Kriterien)

Gleiche Zeilen wie in der [Startseiten-Tabelle](./startseite-confluence-docmost.md#tabelle-startseite) – erweitert um fünf weitere Spalten.

| Kriterium                                                               | DocsOps | Mintlify | GitBook | Fern | Read the Docs     | KnowledgeOwl |
| ----------------------------------------------------------------------- | ------- | -------- | ------- | ---- | ----------------- | ------------ |
| **Self-hosted / On-Prem**                                               | ✓       | ◐        | ✗       | ◐    | ◐                 | ✗            |
| **Open Source**                                                         | ✓ (MIT) | ✗        | ✗       | ✗    | ✓ (Plattform OSS) | ✗            |
| **Firmenstruktur im Produkt** (Company → Department → Team)             | ✓       | ✗        | ✗       | ✗    | ✗                 | ✗            |
| **Rechte pro Dokument** (explizit, nicht nur „Space“)                   | ✓       | ◐        | ◐       | ◐    | ◐                 | ◐            |
| **Kontrolle entlang der Hierarchie** (verbindliche Fassung durch Leads) | ✓       | ✗        | ✗       | ✗    | ✗                 | ✗            |
| **Hierarchisches Kollaborationsmodell** (Linie führt zusammen)          | ✓       | ✗        | ◐       | ✗    | ✗                 | ◐            |
| **Entwürfe & veröffentlichte Versionen**                                | ✓       | ◐        | ◐       | ◐    | ◐                 | ◐            |
| **Struktur & Leitplanken eingebaut** (org-native, nicht Whiteboard)     | ✓       | ◐        | ◐       | ◐    | ◐                 | ◐            |

Zusatzdimension (nicht in der Landing-Tabelle, hier zur Einordnung):

| Zusatzkriterium                               | DocsOps | Mintlify | GitBook | Fern | Read the Docs | KnowledgeOwl |
| --------------------------------------------- | ------- | -------- | ------- | ---- | ------------- | ------------ |
| **API-/Developer-Docs aus Specs**             | ✗       | ◐        | ◐       | ✓    | ◐             | ✗            |
| **Öffentliche Product-Docs / Marketing-Site** | ◐       | ✓        | ✓       | ✓    | ✓             | ✓            |
| **Support-Help-Center (Ticket-Kontext)**      | ◐       | ◐        | ◐       | ✗    | ✗             | ✓            |
| **Interne Org- & Prozessdoku**                | ✓       | ◐        | ◐       | ✗    | ◐             | ◐            |

---

## Zeilen – Begründung & Nuancen

### Self-hosted / On-Prem

| Produkt       | Wert | Kurz                                                                                                                                         |
| ------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Mintlify      | ◐    | Standard **Cloud**; Enterprise: Static Export + Helm / Custom Frontend                                                                       |
| GitBook       | ✗    | Plattform nur SaaS; separates GPLv3-Render-Repo ist **kein** vollwertiges Self-hosting                                                       |
| Fern          | ◐    | Enterprise: Docker-Container auf eigener Infrastruktur                                                                                       |
| Read the Docs | ◐    | Code OSS, Self-host **technisch** möglich; RTD rät für On-Prem ab – typisch **readthedocs.org** oder eigener Static-Host für Build-Artefakte |
| KnowledgeOwl  | ✗    | Ausschließlich managed SaaS                                                                                                                  |

### Open Source

| Produkt       | Wert | Kurz                                                                                                     |
| ------------- | ---- | -------------------------------------------------------------------------------------------------------- |
| Mintlify      | ✗    | Proprietär; OSS-Starter (z. B. Astro) für Custom Frontends, nicht die Plattform                          |
| GitBook       | ✗    | Aktuelle Plattform proprietär (Legacy-GitBook historisch, nicht mehr der Kern)                           |
| Fern          | ✗    | Proprietär; Generierung/Hosting als Produkt                                                              |
| Read the Docs | ✓    | `readthedocs.org` AGPL; viele Teams nutzen aber nur den **Build** (Sphinx/MkDocs) und hosten HTML selbst |
| KnowledgeOwl  | ✗    | Proprietär                                                                                               |

### Firmenstruktur · Kontrolle · Hierarchisches Kollaborationsmodell

Für **Mintlify, GitBook, Fern, Read the Docs, KnowledgeOwl** gilt durchgängig:

- **Firmenstruktur:** ✗ – Projekte, Spaces, Sites, Kategorien oder Repos, keine Company/Department/Team-Leads mit Vererbung.
- **Kontrolle entlang der Hierarchie:** ✗ – Freigabe über Git/PR, Editor-Rollen oder Artikel-Workflows, nicht „Lead in der Linie setzt Leser-Version“.
- **Hierarchisches Kollaborationsmodell:** ✗ oder ◐ – Kollaboration flach (alle Berechtigten) oder über Branches/Review; nicht org-liniengetrieben wie DocsOps.

**KnowledgeOwl ◐:** Co-Authoring, Rollen, ggf. Review – aber ohne Org-Hierarchie.

**GitBook ◐:** Change Requests / Kommentare in höheren Plänen – kein Lead-Draft-Modell entlang Firma/Abteilung/Team.

### Entwürfe & veröffentlichte Versionen

| Produkt       | Wert | Kurz                                                                                                    |
| ------------- | ---- | ------------------------------------------------------------------------------------------------------- |
| Mintlify      | ◐    | Git-Branches/PRs; keine getrennte Leser-Entwurfs-Version wie DocsOps                                    |
| GitBook       | ◐    | Change requests, Versionierung in Spaces – anderes Modell als Snapshot-Publish durch Lead               |
| Fern          | ◐    | Git-basiert; API-Referenz aus Spec regeneriert                                                          |
| Read the Docs | ◐    | **Versionen** pro Branch/Release stark; klassisch für Software-Releases, nicht für interne SOP-Freigabe |
| KnowledgeOwl  | ◐    | Artikel-Entwurf/Veröffentlichung; kein Dokument-Snapshot-Modell mit expliziten Grants                   |

### Struktur & Leitplanken

| Produkt       | Wert | Kurz                                                                                             |
| ------------- | ---- | ------------------------------------------------------------------------------------------------ |
| Mintlify      | ◐    | `docs.json`, Navigation, MDX-Komponenten – **Leitplanken für Dev-Docs**, nicht für Org-Einheiten |
| GitBook       | ◐    | Spaces/Collections – flexible Gliederung, wenig org-native                                       |
| Fern          | ◐    | Stark **API-zentriert**; Struktur folgt der Spec                                                 |
| Read the Docs | ◐    | Projekte + Versionen – gut für **Tech-Projekte**, nicht für Unternehmens-Prozesse                |
| KnowledgeOwl  | ◐    | Kategorien, Books, Artikel – **KB-Struktur**, nicht Firma/Abteilung/Team                         |

---

## Wann welches Tool – und wo DocsOps bleibt

| Szenario                                                    | Typische Wahl             | DocsOps?                                   |
| ----------------------------------------------------------- | ------------------------- | ------------------------------------------ |
| Öffentliche API-Referenz + SDKs aus OpenAPI                 | **Fern**, ggf. Mintlify   | Nein – anderer Stack                       |
| Schöne Product-Docs für Entwickler, schnell live            | **Mintlify**, **GitBook** | Nein – SaaS/Dev-Portal-Fokus               |
| OSS-Projekt-Docs mit Sphinx/MkDocs, Versionen               | **Read the Docs**         | Nein – Build/Host-Pipeline                 |
| Kunden-Help-Center, Support-Artikel, FAQ                    | **KnowledgeOwl**          | Nur teilweise (interne KB ohne Org-Modell) |
| Interne SOPs/Prozesse mit Lead-Freigabe, Abteilungs-Rechten | **DocsOps**               | **Ja** – Kernzweck                         |
| Wiki mit Echtzeit-Editor, wenig Governance                  | Docmost, Confluence       | Eher nein                                  |

**Kernaussage für Marketing:** DocsOps konkurriert mit diesen Tools **selten head-to-head**. Sie lösen „Dokumentation publizieren“ – DocsOps löst „**interne Dokumentation in der echten Firmenstruktur steuern**“. Überschneidung gibt es bei **internen Tech-Docs** (GitBook, Mintlify) und **internen KBs** (KnowledgeOwl); dort gewinnt DocsOps, wenn **Hierarchie, dokumentweise Rechte und verbindliche Lead-Version** zählen – nicht wenn **öffentliche Developer-UX** oder **Zero-Ops-SaaS** Priorität hat.

---

## Copy-Hinweise (kurz)

- **Nicht** als „DocsOps vs. Mintlify“-Feature-Krieg formulieren – unterschiedliche Primärziele.
- **Stattdessen:** „Für öffentliche API-Docs: Fern/Mintlify. Für interne, org-gesteuerte Prozessdoku: DocsOps.“
- Fußnote: Marken gehören den jeweiligen Anbietern; Angaben ohne Gewähr (Produkt und Pläne ändern sich).

---

## Siehe auch

- [startseite-confluence-docmost.md](./startseite-confluence-docmost.md)
- [Vergleich-DocsOps-Docmost.md](../../platform/Vergleich-DocsOps-Docmost.md)
- [Positionierung-und-Landing.md](../Positionierung-und-Landing.md)
