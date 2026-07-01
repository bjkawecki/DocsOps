# Landing – Drei Sections: Scope · Kontext · Rechte

**Stand:** Juni 2026  
**Bezug:** [Positionierung-und-Landing.md](./Positionierung-und-Landing.md), [Landing-Page-Plan.md](./Landing-Page-Plan.md)  
**Code:** `apps/landing`

Dieses Dokument ist der **Umsetzungsplan** für die drei Modell-Sections der Startseite. Inhaltliche These und Abgrenzung → Positionierung; Technik und Routen → Landing-Page-Plan.

---

## 1. Grundprinzip

Die Startseite erklärt das DocsOps-Modell in **drei getrennten Perspektiven** – nicht in einem Diagramm vermischen:

| #   | Section-Titel                   | Leitfrage (Subtitle)                         | Was beantwortet wird                                                  |
| --- | ------------------------------- | -------------------------------------------- | --------------------------------------------------------------------- |
| 1   | **Organisation und Zuordnung**  | Wo gehört ein Nutzer hin – und was sieht er? | Org-Hierarchie, Zugehörigkeit, Lesesicht entlang des Geltungsbereichs |
| 2   | **Kontext und Dokumente**       | Wo wird Wissen abgelegt?                     | Prozess vs. Projekt, Dokumente in Kontexten                           |
| 3   | **Rollen und Veröffentlichung** | Wie entsteht die verbindliche Fassung?       | Rollen (Leitung / Autor / Mitglied), Entwurf → Version                |

**Optional (Block 4):** Konkretes Beispiel (IT / Software X / Stand Barrierefreiheit) – illustriert Scope + Kontext; keine eigene Leitfrage.

**Abgrenzung** zu anderen Tools bleibt im Hero (offizieller Wissensstand vs. gleichzeitiges Schreiben).

---

## 2. UX-Regeln (alle Sections)

- **Kein** „Hinweis: Klicke auf die Knoten …“ in Section-Subtitles.
- Klick-Hinweis nur im **Detail-Panel** (Default, wenn nichts ausgewählt) – oder weglassen, wenn Interaktion offensichtlich genug ist.
- **Hover:** nur Border in Primary-Farbe (`blue-4`).
- **Active/Selected:** gleiche Primary-Farbe.
- Detail-Panel rechts, **ohne** Diagramm-Layout zu verkleinern (absolut auf breitem Container).
- **Mobile:** statische Liste mit vollständigen Texten statt interaktiver Grafik.

---

## 3. Section 1 – Scope

### 3.1 Ziel

- Zeigen: **Company** hat **mehrere Departments**, jedes **mehrere Teams** (Landing minimal: 2 Departments × 1 Team).
- Zeigen: **Zugehörigkeit** (Member in Team) steuert **Sichtbarkeit** entlang der Hierarchie nach oben.
- **User-Scope** (persönlich) **außerhalb** der Org-Hierarchie – nicht als Kind von Team.

### 3.2 Begriffe in der Grafik

| Knoten           | Label                 | Bedeutung                                               |
| ---------------- | --------------------- | ------------------------------------------------------- |
| Company          | Company               | Oberster Scope                                          |
| Department A / B | Department            | Parallele Zweige                                        |
| Team A / B       | Team                  | Je ein Team pro Department (Beispiel)                   |
| Member           | Member (oder Persona) | **Person im Team** – nicht User-Scope                   |
| User             | User · persönlich     | **Owner-Scope** außerhalb der Org, gestrichelter Rahmen |

**Nicht:** „User“ unter jedem Team als Scope-Ebene – das verwechselt Membership und persönlichen Scope.

### 3.3 Layout (Ziel)

```
                    [Company]
                        │
            ┌───────────┴───────────┐
      [Department A]         [Department B]
            │                       │
       [Team A]               [Team B]
            │                       │
      [Member Alex]           [Member Sam]

      - - - [User · persönlich] - - -   (gestrichelt, parallel, nicht unter A/B)
```

### 3.4 Interaktion: Sichtbarkeits-Kette

**Klick auf Member (z. B. Alex in Team A):**

1. **Highlight (Primary):** Team A → Department A → Company.
2. **Abblenden:** Zweig B (Dept B, Team B, Member Sam).
3. **Panel:** Lesesicht für Team-Mitglieder; Leads übergeordneter Scopes sehen mehr (ohne Schreib-/Publish-Details).

**Klick auf User (persönlich):** Highlight am User-Knoten; Panel zu privatem Scope.

**Zweiter Klick** auf denselben Knoten: Auswahl aufheben.

Section 1 = **„was siehst du?“** – nicht `canWrite` / Veröffentlichen (Section 3).

### 3.5 Was Section 1 nicht enthält

- Kein Kontext-Block (Prozess/Projekt) → Section 2.
- Keine nummerierte Anlege-Schritte-Liste.
- Kein Querverweis auf Rollen-Verhalten (→ Section 3).

### 3.6 Technik

- Kein React Flow nötig (CSS-Baum + Highlight-State).
- Copy: `scopeCopy` in `siteCopy.ts`.
- Mermaid: [diagramme/scope-hierarchie.mmd](./diagramme/scope-hierarchie.mmd).
- Anker: `#scope`.

### 3.7 Ist → Soll (Code)

| Ist (Stand Phase A)                                | Soll                                       |
| -------------------------------------------------- | ------------------------------------------ |
| Titel „Struktur & Einordnung“, linearer Baum 1×1×1 | Titel **Scope**, 2-Zweig-Baum              |
| Kontext-Typografie in derselben Section            | Kontext → eigene Section                   |
| Klick auf Scope-Knoten, kein Pfad-Highlight        | Member-Klick + farbige Sichtbarkeits-Kette |
| User entfernt                                      | User-Scope gestrichelt, separat            |

---

## 4. Section 2 – Kontext

### 4.1 Ziel

- **Wo wird Wissen abgelegt?**
- Jeder **Scope** kann **beliebig viele Kontexte** haben.
- Kontext: **Prozess** (dauerhaft) oder **Projekt** (zeitlich begrenzt).
- **Dokumente** in **genau einem** Kontext.

### 4.2 Darstellung

- Eigene Section, Titel **Kontext**.
- Typografie + ggf. kleine statische Grafik (kein zweiter React-Flow nötig).
- Struktur: `Scope → Kontext (Prozess | Projekt) → Dokument`.

### 4.3 Technik

- Copy: `contextCopy` in `siteCopy.ts`.
- Mermaid: [diagramme/kontext-dokument.mmd](./diagramme/kontext-dokument.mmd).
- Anker: `#kontext`.

---

## 5. Section 3 – Rechte

### 5.1 Ziel

- **Wie entsteht die verbindliche Fassung?**
- Rollen: Lead, Author, Member.
- Entwurf → veröffentlichte Version.

### 5.2 Darstellung

- Bestehendes Rollen-Diagramm (`RolesDocumentDiagram`).
- Section-Titel **Rechte**; Subtitle = Leitfrage.
- Anker: `#rechte` (Migration von `#rollen-veroeffentlichung`).
- Mermaid: [diagramme/rollen-dokument.mmd](./diagramme/rollen-dokument.mmd).

---

## 6. Section 4 – Beispiel (optional)

Wie [Positionierung §3.4](./Positionierung-und-Landing.md):

```
Abteilung IT
  └─ Projekt „Software X“
       └─ Dokument „Stand Barrierefreiheit“
```

---

## 7. Startseiten-Reihenfolge (Ziel)

1. Hero
2. **Scope** (`#scope`)
3. **Kontext** (`#kontext`)
4. **Rechte** (`#rechte`)
5. _(optional)_ Beispiel (`#einordnen`)
6. Footer

Navbar/Footer: Modell-Menü mit Ankern `#scope`, `#kontext`, `#rechte`, `#einordnen`.

---

## 8. Umsetzungsphasen

| Phase | Inhalt                                                                                           | Status |
| ----- | ------------------------------------------------------------------------------------------------ | ------ |
| **A** | Dieser Plan + Marketing-Docs synchronisieren                                                     | [x]    |
| **B** | Scope-Section: 2-Zweig-Baum, Member-Highlight, User gestrichelt; Kontext aus Section 1 entfernen | [x]    |
| **C** | Kontext-Section neu (`ContextSection`)                                                           | [x]    |
| **D** | Rechte-Section: Umbenennung, Anker `#rechte`, Subtitle ohne Klick-Hinweis                        | [x]    |
| **E** | Beispiel Barrierefreiheit                                                                        | [x]    |
| **G** | Kritik-Fixes: deutsche Labels, Layout, Card-Glow, Scope 2×1×1 + User                             | [x]    |

---

## 9. Feinentscheidungen (erledigt)

1. Member-Labels: Personas **Alex / Sam** (deutsch: Mitglied Alex/Sam).
2. Scope-Knoten klickbar; Member-Klick zeigt Sichtbarkeitskette.
3. Default-Panel-Text Scope: Klick-Hinweis im Panel.

---

## 10. Referenzen

- [Rechtesystem](../platform/datenmodell/Rechtesystem.md) – Scope, Lesevererbung, User-Scope
- [Doc-Platform-Konzept](../platform/Doc-Platform-Konzept.md) – Kontexte, Ownership
