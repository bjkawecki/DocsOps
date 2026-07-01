# Startseiten-Vergleich: DocsOps · Confluence · Docmost

**Status:** Daten vorbereitet – **aktuell nicht auf der Landing-Startseite** (zurückgestellt). Leitlinie: [Positionierung-und-Landing.md](../Positionierung-und-Landing.md). Reaktivieren, wenn Tabellen-Labels überarbeitet sind.

**Verwendung (später):** Kompakte Tabelle auf der Landing-Startseite (3 Spalten) oder nur auf `/vergleich`.

## Positionierung (Kern these)

DocsOps ist eine **interne Dokumentationsplattform** mit **vorgegebener Struktur**: Firma → Abteilung → Team, klare Zuständigkeiten, kontrollierte Zusammenarbeit.

Was bei vielen All-in-one-Tools (Confluence, Docmost, Notion, …) aus Sicht der Zielgruppe oft fehlt oder untergeht:

- **Hierarchie** – die echte Firmenstruktur ist nicht im Produkt verankert
- **Kontrolle** – unklar, wer für die verbindliche Fassung verantwortlich ist
- **Übersicht** – zu viele Features und freie Flächen; jeder baut seine eigene Ordnung

DocsOps gibt Nutzerinnen und Nutzern **Leitplanken** – eine sinnvolle Einschränkung, kein leeres Whiteboard.

Legende: **✓** ja / im Kernmodell · **✗** nein / nicht im Kernmodell · **◐** teilweise, Add-on oder nur mit Disziplin/Plugins

---

## Tabelle (Startseite)

| Kriterium                                                               | DocsOps | Confluence | Docmost  |
| ----------------------------------------------------------------------- | ------- | ---------- | -------- |
| **Self-hosted / On-Prem**                                               | ✓       | ◐          | ✓        |
| **Open Source**                                                         | ✓ (MIT) | ✗          | ✓ (AGPL) |
| **Firmenstruktur im Produkt** (Company → Department → Team)             | ✓       | ✗          | ✗        |
| **Rechte pro Dokument** (explizit, nicht nur „Space“)                   | ✓       | ◐          | ◐        |
| **Kontrolle entlang der Hierarchie** (verbindliche Fassung durch Leads) | ✓       | ✗          | ✗        |
| **Hierarchisches Kollaborationsmodell** (Linie führt zusammen)          | ✓       | ◐          | ✗        |
| **Entwürfe & veröffentlichte Versionen**                                | ✓       | ◐          | ✗        |
| **Struktur & Leitplanken eingebaut**                                    | ✓       | ✗          | ✗        |

Link unter der Tabelle: _Ausführliche Vergleiche_ → `/vergleich` (u. a. Notion, Outline)

---

## Zeilen – was die Tabelle meint (Landing-Tooltips)

Kurze Erklärungen für Spaltenüberschriften oder Hover-Texte – **ohne** internen Jargon.

| Zeile                                | In verständlicher Sprache                                                                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Firmenstruktur im Produkt            | Die Plattform kennt Firma, Abteilung und Team – nicht nur beliebige „Spaces“.                                                                                             |
| Rechte pro Dokument                  | Pro Dokument festlegen, wer lesen und schreiben darf – feiner als nur Bereichs-Rechte.                                                                                    |
| Kontrolle entlang der Hierarchie     | Die **offizielle Leser-Version** setzt die verantwortliche Person in der Linie (Team-/Abteilungs-/Firmen-Lead) – nicht jede Schreibberechtigung.                          |
| Hierarchisches Kollaborationsmodell  | Mitarbeitende arbeiten **im Rahmen** der Struktur; Verantwortliche führen Änderungen zusammen.                                                                            |
| Entwürfe & veröffentlichte Versionen | **Entwurf** und **veröffentlichte Fassung** sind getrennt; Leser sehen eine stabile Version, Verlauf bleibt nachvollziehbar – statt ständig live mitgeschriebener Seiten. |
| Struktur & Leitplanken eingebaut     | Firma, Abteilung, Team und Kontexte sind **Teil des Produkts** – klare Ordnung von Anfang an, ohne leere Fläche und ohne Plugin-Bazaar.                                   |

---

## Zeilen – Begründung & Nuancen

### 1. Self-hosted / On-Prem

| Produkt    | Wert | Kurz                                                             |
| ---------- | ---- | ---------------------------------------------------------------- |
| DocsOps    | ✓    | Docker auf eigener Infrastruktur (Intranet-first).               |
| Confluence | ◐    | Data Center self-managed möglich; viele nutzen **Cloud** (SaaS). |
| Docmost    | ✓    | Self-hosted OSS.                                                 |

### 2. Open Source

| Produkt    | Wert | Kurz                                                |
| ---------- | ---- | --------------------------------------------------- |
| DocsOps    | ✓    | [MIT](../../LICENSE).                               |
| Confluence | ✗    | Proprietär (Atlassian).                             |
| Docmost    | ✓    | AGPL (Copyleft; für Self-hosting meist unkritisch). |

### 3. Firmenstruktur im Produkt

| Produkt    | Wert | Kurz                                                                                             |
| ---------- | ---- | ------------------------------------------------------------------------------------------------ |
| DocsOps    | ✓    | Company → Department → Team und Lead-Rollen sind **das Modell** – nicht nachträglich modelliert. |
| Confluence | ✗    | **Spaces** – flexibel, aber keine eingebaute Org-Hierarchie mit Vererbungsregeln.                |
| Docmost    | ✗    | Workspace/Spaces – keine Abbildung der Firmenstruktur im Rechtemodell.                           |

### 4. Rechte pro Dokument

| Produkt    | Wert | Kurz                                                             |
| ---------- | ---- | ---------------------------------------------------------------- |
| DocsOps    | ✓    | Leser/Schreiber pro Dokument (User, Team, Department).           |
| Confluence | ◐    | Primär Space-Rechte; Page Restrictions möglich, oft umständlich. |
| Docmost    | ◐    | Primär Space-Level; feine Steuerung pro Seite nicht Kernstärke.  |

### 5. Kontrolle entlang der Hierarchie

| Produkt    | Wert | Kurz                                                                                                      |
| ---------- | ---- | --------------------------------------------------------------------------------------------------------- |
| DocsOps    | ✓    | Entwurf vs. veröffentlichte Fassung; **Leads in der Linie** setzen, was für Leser gilt (Snapshot).        |
| Confluence | ✗    | Mit Schreibrecht ändert man die sichtbare Seite; kein eingebautes „Lead entscheidet verbindlich“.         |
| Docmost    | ✗    | Berechtigte sehen Änderungen im Space **sofort**; keine Hierarchie-Kontrolle über die offizielle Fassung. |

### 6. Hierarchisches Kollaborationsmodell

| Produkt    | Wert | Kurz                                                                                                                                                  |
| ---------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| DocsOps    | ✓    | Zusammenarbeit **über die Linie**: Beiträge im Rahmen, Verantwortliche führen zusammen (technisch u. a. über Lead-Draft und eingereichte Änderungen). |
| Confluence | ◐    | Kommentare, Reviews, Apps möglich – **kein** einheitliches Modell „Linie führt, Struktur zählt“.                                                      |
| Docmost    | ✗    | Fokus **Echtzeit-Kollaboration** aller Berechtigten – flach, nicht hierarchisch.                                                                      |

### 7. Entwürfe & veröffentlichte Versionen

| Produkt    | Wert | Kurz                                                                                                                        |
| ---------- | ---- | --------------------------------------------------------------------------------------------------------------------------- |
| DocsOps    | ✓    | **Entwurf vs. veröffentlicht** im Kernmodell; Snapshots bei Veröffentlichung; Leser sehen eine klare, versionierte Fassung. |
| Confluence | ◐    | **Versionshistorie** pro Seite; keine eingebaute Trennung „Entwurf für Leser“ vs. „offizielle Fassung“ wie bei DocsOps.     |
| Docmost    | ✗    | Live-Inhalt für Berechtigte; Fokus auf gemeinsames Bearbeiten, nicht auf getrennte Entwurfs- und Leser-Versionen.           |

### 8. Struktur & Leitplanken eingebaut

| Produkt    | Wert | Kurz                                                                                                                         |
| ---------- | ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| DocsOps    | ✓    | **Opinionated:** Kontexte (Prozess/Projekt), Catalog, feste Ebenen – Ordnung ist eingebaut, nicht nachträglich konfiguriert. |
| Confluence | ✗    | Viele Spaces, Plugins, Macros – **Übersicht** hängt stark von Disziplin und Setup ab.                                        |
| Docmost    | ✗    | Reichhaltiger Editor, viele Blöcke/Integrationen – **freie Fläche** ähnlich Notion/Confluence, wenig org-native Leitplanken. |

_(Notion auf Head-to-head-Seiten: ebenfalls ✗ bei Struktur/Kontrolle/Fokus – viel Flexibilität, wenig org-native Leitplanken.)_

---

## Copy-Hinweise für die Landing

**Überschrift Tabelle (Entwurf):**  
„Struktur und Kontrolle – statt Feature-Überfluss“

**Subline:**  
„DocsOps im Vergleich zu etablierten Dokumentations-Tools im Intranet.“

**Ein Satz darüber:**  
DocsOps gibt eurer Organisation eine **vorgegebene Struktur** mit – Firma, Abteilung, Team, klare Verantwortliche – damit Dokumentation **übersichtlich und steuerbar** bleibt, statt mit jedem Space neu anzufangen.

**Fußnote:**  
Markenzeichen der genannten Produkte gehören den jeweiligen Anbietern. Angaben ohne Gewähr.

---

## Siehe auch

- [Landing-Page-Plan.md](../Landing-Page-Plan.md)
- [Vergleich-DocsOps-Docmost.md](../../platform/Vergleich-DocsOps-Docmost.md) (intern, ausführlich)
