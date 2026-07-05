# Positionierung & Landing – Erkenntnisstand

**Stand:** Juli 2026  
**Quellen:** Diskussionen zu Hero, `antwort.md`, Produktmodell in `docs/platform/`

Dieses Dokument ist die **aktuelle inhaltliche Leitlinie** für Marketing und Landing. Technik und Routen: [Landing-Page-Plan.md](./Landing-Page-Plan.md).

---

## 1. Kern-These

DocsOps **trennt Zusammenarbeit von Veröffentlichung** – auf Basis einer **Organisationshierarchie im Produkt** (Firma → Abteilung → Team).

- **Autoren** arbeiten in Entwürfen und reichen Vorschläge ein; die **Leitung** des Geltungsbereichs veröffentlicht.
- **Nicht** alles ist sofort offiziell.
- **Mitglieder** und berechtigte Leser sehen einen **veröffentlichten, versionierten Stand** – nicht den laufenden Entwurf.

**Roter Faden:** Es gibt einen **offiziellen Stand** – für Prozesswissen („wie wir arbeiten“) und Projektwissen („woran wir arbeiten“ / konkreter Ist-Stand).

**Abgrenzung (bewusst anderer Weg):** DocsOps ist **stark hierarchiegeprägt** – nicht weil „enterprise“, sondern weil interne Dokumentation in Organisationen **Verantwortliche, Zuständigkeiten und verbindliche Fassungen** braucht. Viele Plattformen setzen auf **flexible Wiki-Flächen und frei gestaltbare Strukturen**; DocsOps modelliert **Organisation, Verantwortung und Veröffentlichung im Produkt** (Firma → Abteilung → Team, Prozess/Projekt, Rechte je Dokument).

**Nicht als Leit-Narrativ:** Einzelne Features wie Live-Co-Editing – das ist höchstens ein Symptom, nicht der Kernunterschied.

Self-hosted und Open Source (MIT) sind **Vertrauensmerkmale**, keine inhaltliche Differenzierung unter OSS-Tools.

---

## 2. Zwei Arten von Wissen

| Art                           | Kontext-Typ | Beispiele                                                                |
| ----------------------------- | ----------- | ------------------------------------------------------------------------ |
| **Wie wir arbeiten**          | **Prozess** | Richtlinien, Abläufe, Standards, „wie Barrierefreiheit hergestellt wird“ |
| **Woran's liegt / Ist-Stand** | **Projekt** | Software X, Audit 2026, „aktueller Stand Barrierefreiheit“               |

Beide teilen: **veröffentlichte Fassung** für Leser, Änderungen im Entwurf / als Vorschläge.

---

## 3. Landing: drei Sections Scope · Kontext · Rechte (+ Beispiel)

**Scope**, **Kontext** und **Rechte** sind **drei Perspektiven** auf dasselbe Modell – getrennt darstellen, nicht in einem Diagramm vermischen.

**Umsetzungsplan (Detail):** [Landing-Sections-Plan.md](./Landing-Sections-Plan.md)

| #   | Section     | Leitfrage (Subtitle)                         |
| --- | ----------- | -------------------------------------------- |
| 1   | **Scope**   | Wo gehört ein Nutzer hin – und was sieht er? |
| 2   | **Kontext** | Wo wird Wissen abgelegt?                     |
| 3   | **Rechte**  | Wie entsteht die verbindliche Fassung?       |

### 3.1 Abgrenzung (kurz, optional vor den Sections)

2–3 Sätze: hierarchiegeprägt, **warum** (Verantwortliche, verbindlicher Stand) – nicht Feature-Liste gegen Confluence und **nicht** auf Live-Co-Editing als Leitkontrast reduzieren. Aktuell im Hero-Subline und auf `/philosophie` vertieft.

### 3.2 Section 1 – Scope

**Perspektive:** Organisations-Hierarchie und Sichtbarkeit – nicht Ablageort, nicht Rollenverhalten.

**Struktur (Ziel-Grafik):**

```
              [Company]
                  │
      ┌───────────┴───────────┐
[Department A]         [Department B]
      │                       │
 [Team A]               [Team B]
      │                       │
[Member …]            [Member …]

- - - [User · persönlich] - - -   (außerhalb der Org-Hierarchie)
```

- **Member** = Person im Team (Zugehörigkeit), **nicht** User-Scope.
- **User-Scope** = persönlicher Besitzer-Scope, gestrichelt parallel zur Hierarchie.
- **Interaktion:** Klick auf Member → farbige Sichtbarkeits-Kette nach oben (Team → Department → Company); anderer Zweig abgedunkelt.
- Leads/Mitglieder **nicht** als eigene Knoten – nur in Klick-Texten der Scope-Ebenen.

**Format Landing:** CSS-Baum (kein React Flow). Mermaid-Referenz: [diagramme/scope-hierarchie.mmd](./diagramme/scope-hierarchie.mmd).

**Nicht in Section 1:** Kontext, Dokumente, Veröffentlichung, Anlege-Schritte-Liste.

### 3.3 Section 2 – Kontext

**Perspektive:** Ablageort von Wissen innerhalb eines Scopes.

```
Scope
  └── Kontext (Prozess | Projekt)  – beliebig viele pro Scope
        └── Dokument
```

| Typ         | Merkmal           | Beispiele                                                        |
| ----------- | ----------------- | ---------------------------------------------------------------- |
| **Prozess** | dauerhaft         | Onboarding, Richtlinien, „wie Barrierefreiheit hergestellt wird“ |
| **Projekt** | zeitlich begrenzt | Software X, Audit 2026, „Stand Barrierefreiheit“                 |

**Format Landing:** Typografie + ggf. statische Mini-Grafik. Mermaid: [diagramme/kontext-dokument.mmd](./diagramme/kontext-dokument.mmd).

### 3.4 Section 3 – Rechte

**Perspektive:** Verantwortungskette und verbindliche Fassung (nicht Org-Baum).

| Rolle                 | Kurz (Landing)                                                 |
| --------------------- | -------------------------------------------------------------- |
| **Lead** (Scope-Lead) | Bearbeitet Entwurf, nimmt Vorschläge an/ab, **veröffentlicht** |
| **Author**            | Erstellt **Vorschläge** im Entwurf                             |
| **Member**            | Sieht **veröffentlichte** Version, kommentiert                 |

**Format Landing:** React Flow read-only – [diagramme/rollen-dokument.mmd](./diagramme/rollen-dokument.mmd). Detail → später `/warum`.

### 3.5 Block 4 – Konkretes Beispiel (optional)

**Barrierefreiheit – Produktstand** (nicht der Prozess „wie A11y hergestellt wird“):

```
Abteilung IT
  └─ Projekt „Software X“
       └─ Dokument „Stand Barrierefreiheit“  (veröffentlicht)
```

- Illustriert Scope (Department) + Kontext (Projekt).
- **Gegenbeispiel (ein Satz):** Prozess „Barrierefreiheit in der Entwicklung“ = wie geprüft wird.

**Format:** Typo-Kasten oder Mermaid.

### 3.6 UX (alle Modell-Sections)

- Subtitles = **Leitfragen**; kein „Klicke auf die Knoten …“ im Subtitle.
- Klick-Hinweis nur im Detail-Panel (falls nötig).
- Hover/Selected: Primary-Border (`blue-4`).

### 3.7 Reihenfolge auf der Startseite

1. Hero
2. **Scope** (`#scope`)
3. **Kontext** (`#kontext`)
4. **Rollen** (`#rollen`)
5. **Beispiel** (`#einordnen`)
6. Footer

**Vorübergehend nicht auf der Startseite:** Vergleichstabelle (Tools), FAQ – Daten unter `docs/marketing/vergleich/`.

**Ersetzt:** Feature-Kachel-Grid (6 Kacheln), Sponsoren, CTA-Band.

---

## 4. Hero (aktuell umgesetzt)

- **H1:** „Ihr Betriebswissen.“ + rotierende Qualitätswörter (Strukturiert / Transparent / Verbindlich) + „dokumentiert.“
- **Subline:** Pflege des internen Wissensstands und der Abläufe – positiv, ohne Feature-Liste.
- **Layout:** vertikal gestapelt (Copy → CTAs → volle Screenshot-Breite). Kein Zwei-Spalten-Hero – breites Dashboard-Bild bleibt sonst unleserlich.
- **Trust:** dezente Zeile „Open Source · Self-hosted“; Scroll-Hinweis unter dem Bild zu `#scope`.
- **Kein:** Philosophy-Zeile im Hero, Anker-Links zu Vergleich/FAQ.

---

## 5. Philosophie-Seite (`/philosophie`)

**Ziel:** Den **Ansatz und die Idee** erklären – **nicht** das Produktmodell wiederholen (das leistet die Startseite mit Scope · Kontext · Rollen). Positiv beginnen, keine Defizit-Formulierungen („bewusst schlank“, „kein Wiki“).

**Aufbau (Coolify-inspiriert, zentriert, schmal ~720px):**

| Block                 | Inhalt                                                                                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hero**              | „Unser Ansatz.“ + Tagline (Mission / Idee in einem Satz)                                                                                              |
| **Erzählung**         | Zwei Absätze: **Warum** offizieller Wissensstand, Trennung Mitwirkung/Veröffentlichung, Verantwortung – Verweis auf Startseite für **Wie** im Produkt |
| **Was das bedeutet.** | Grundsätze (Checkliste), keine Feature-Liste (kein Firma/Abteilung/Team erneut)                                                                       |
| **Kurz gesagt.**      | Zielgruppen-Passung als Listen in zwei Karten – Bedarf und Haltung, nicht Produktmechanik                                                             |

**Copy-Leitlinie „Kurz gesagt“:**

- **Für:** wer steuerbaren, verbindlichen Wissensstand braucht (Listen mit Häkchen, hervorgehobene Karte).
- **Nicht für:** wer offene Notiz-/Wiki-Freedom ohne offiziellen Stand sucht (grau, zurückgenommen).
- **Nicht:** Wiederholung von Scope, Kontext, Rollen, Hierarchie-Begriffen – das gehört auf `/`.

---

## 6. Sprache & Tabellen (Vergleich – später)

Vage Tabellenzeilen vermeiden. Stattdessen verständliche Labels:

| Statt (vage)                         | Besser                     |
| ------------------------------------ | -------------------------- |
| Firmenstruktur im Produkt            | Firma, Abteilung, Team     |
| Rechte pro Dokument                  | Zugriff je Dokument        |
| Kontrolle entlang der Hierarchie     | Nur Leads veröffentlichen  |
| Entwürfe & veröffentlichte Versionen | Versionierung              |
| Hierarchisches Kollaborationsmodell  | Vorschläge & Lead-Freigabe |

Vergleichsdaten: [vergleich/startseite-confluence-docmost.md](./vergleich/startseite-confluence-docmost.md) – **vorbereitet, nicht auf Landing**.

---

## 7. KI-Kurzbeschreibung (2–3 Sätze)

**DocsOps** ist eine self-hosted, Open-Source-Dokumentationsplattform (MIT) für interne Unternehmensdokumentation: Org-Modell Company → Department → Team, Dokumente in Prozess- oder Projekt-Kontexten, Zugriff je Dokument.

Zusammenarbeit über Entwürfe und Vorschläge durch Autoren; Veröffentlichung durch die Leitung des Geltungsbereichs. Leser sehen versionierte, freigegebene Snapshots – eingebettet in Firma → Abteilung → Team und Prozess-/Projektkontexte.

Zielgruppe: Organisationen mit fester Hierarchie, benannten Leitungen und Bedarf an freigegebenem Wissensstand – nicht für Teams, die vor allem eine freie Wiki-Fläche ohne Hierarchie und Kontextmodell suchen.

---

## 8. Nächste Schritte (Landing-Implementierung)

Siehe [Landing-Sections-Plan.md](./Landing-Sections-Plan.md) (Phasen A–F).

- [x] Mermaid + React Flow Rechte-Diagramm – [diagramme/rollen-dokument.mmd](./diagramme/rollen-dokument.mmd)
- [x] Landing: Scope-Vorläufer (`ScopeHierarchySection`, Refactor → Phase B)
- [x] Landing: Rechte-Diagramm (`RolesDocumentDiagram`, Umbenennung → Phase D)
- [x] Scope: 2-Zweig-Baum, Member-Sichtbarkeits-Highlight, User gestrichelt (Phase B)
- [x] Kontext-Section (Phase C)
- [x] Rollen: Anker `#rollen`, Titel Rollenbasierte Zusammenarbeit
- [x] Beispiel IT / Software X / A11y (Phase E)
- [x] Philosophie-Seite `/philosophie` (Ansatz, Was das bedeutet, Kurz gesagt)
- [ ] Vergleichstabelle & FAQ wieder einbinden
- [ ] Demo-Seed: Beispiel IT / Software X / Stand Barrierefreiheit

---

## 9. Referenzen

- [antwort.md](./antwort.md) – Roh-Notiz Positionierungsdiskussion
- [Doc-Platform-Konzept](../platform/Doc-Platform-Konzept.md)
- [Rechtesystem](../platform/datenmodell/Rechtesystem.md)
- [Versionierung](../platform/versionierung/Versionierung%20als%20Snapshots%20+%20Deltas.md)
