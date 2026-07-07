---
name: strategy-dev
description: >
  Arbeitsweise und Denkweise für die (Weiter-)Entwicklung der simon42 Dashboard Strategy —
  Architektur-Leitplanken, Qualitäts-Gates, Kreuzauswirkungs-Check, Umgang mit Community-PRs
  und hart erarbeitete Fallen aus der bisherigen Entwicklungspraxis. IMMER verwenden, wenn in
  diesem Repo gearbeitet wird: Issue umsetzen, Bug fixen, Feature bauen, Community-PR reviewen
  oder porten, refactoren, Release vorbereiten — auch bei scheinbar kleinen Änderungen, denn
  die typischen Fehler (geänderte Defaults, wachsender Entry-Chunk, generate-Zeit vs. Laufzeit,
  Codacy-Findings) passieren gerade bei den einfachen Edits.
---

# simon42 Dashboard Strategy — Entwicklungs-Arbeitsweise

Dieser Skill destilliert die Arbeitsweise, mit der diese Strategy bisher entwickelt wurde.
Ziel ist nicht nur funktionierender Code, sondern ein Prozess, der Fehler findet, bevor die
Community sie findet: verifizieren statt vermuten, Bestandsverhalten schützen, am echten
System testen. Das Projekt läuft produktiv in vielen Haushalten — sauberer, stabiler Code
hat oberste Priorität.

**Die [CLAUDE.md](../../../CLAUDE.md) im Repo-Root ist verbindlich** und wird hier nicht
wiederholt. Dort stehen: Architektur- und Modul-Übersicht, Registry-Design, dokumentierte
Design-Entscheidungen (nicht rückgängig machen!), Git- & Release-Workflow (release-please,
Conventional Commits) und die Codacy-Fallstricke. Vor der ersten Änderung vollständig lesen.

## Grundhaltung — sieben Regeln

1. **Erst verstehen, dann ändern.** Vor dem Edit die betroffenen Module ganz lesen und die
   bestehenden Konventionen übernehmen (Test-Muster, Editor-Panel-Muster, Formulierungsstil
   der Übersetzungen). Die meisten echten Bugs entstehen an Wechselwirkungen — Registry ↔
   Views ↔ Editor ↔ Filter-Pipeline — nicht in der geänderten Zeile selbst.

2. **Verifizieren statt vermuten.**
   - Der HA-Frontend-Quellcode ist die Primärquelle (Referenz-Checkouts: siehe
     CLAUDE.md-Abschnitt „References"; vor Gebrauch aktualisieren — er ändert sich mit jedem
     HA-Release). Fragen wie „welche Karte nutzt HA dafür?" oder „wird das zur Laufzeit
     ausgewertet?" nie aus dem Gedächtnis beantworten.
   - Ein Bug-Report beschreibt eine Wahrnehmung, keinen Fakt. Erst per `git log`/Diff prüfen,
     ob sich das Verhalten wirklich geändert hat — Erinnerungen täuschen. Trotzdem ernst
     nehmen: neben der Fehlwahrnehmung steckt oft ein echter Nachbar-Bug (so wurde entdeckt,
     dass `lawn_mower` in Raum-Views durch alle Kategorie-Branches fiel).
   - Verhalten von Fremd-Karten und Integrationen an deren Quellcode nachlesen, bevor du
     diagnostizierst oder dagegen baust.

3. **Bestandsverhalten ist heilig.**
   - Alles, was bestehende Dashboards sichtbar ändert, ist **opt-in**; der Default bleibt das
     bisherige Verhalten. (Community-PRs liefern Features gern „hart an" — beim Übernehmen
     auf opt-in umbauen.)
   - Config-Keys sind öffentliche API: nie umbenennen oder entfernen, neue Optionen brauchen
     einen Default. Bei Format-Änderungen einen kulanten Parser bauen, der Alt-Configs
     weiterhin versteht.
   - Breaking Changes nur im Beta-Fenster vor einem Stable-Release — danach ist es semantisch
     ein Major.

4. **Am HA-Original orientieren.** Bevor du ein neues UI-Konzept erfindest: nachsehen, wie
   HAs eigene Home-/Areas-Strategy oder die offiziellen Panels dasselbe Problem lösen.
   Integration in die bestehende Struktur schlägt eine neue Parallel-Ansicht. Wo wir bewusst
   von HA abweichen, steht die Begründung in der CLAUDE.md („Design Decisions").

5. **Performance ist Architektur, kein Feinschliff.**
   - Der Entry-Chunk muss winzig bleiben (5-Sekunden-Registrierungs-Timeout). Bei jedem Build
     die Chunk-Größen mit dem Stand vor der Änderung vergleichen und die Bilanz belegen können.
   - Keine Entity-Scans pro Render: Filterung und Zuordnung passieren zur generate-Zeit
     (Registry-Pre-Filtering), Karten re-rendern nur bei relevanten State-Änderungen
     (`willUpdate`-Pattern).
   - `section-registry.ts` bleibt reine Daten (keine Builder-Imports), sonst zieht der lazy
     geladene Editor-Chunk alle Section-Builder mit.
   - Fremd-Karten vor dem automatischen Rendern auf Lastverhalten prüfen: Eine Karte, die in
     `set hass()` ungedrosselt fetcht, wird bei jeder State-Änderung im System getriggert —
     mit mehreren Instanzen kann das eine HA-Instanz lahmlegen.
   - Kameras: Standbild mit Klick-zu-Live statt Stream-Wand (HA-Muster).

6. **Erkennungs-Heuristiken konservativ bauen.** Geräte/Features nie über Entity-ID-Muster
   erkennen — IDs sind lokalisiert und herstellerabhängig. Stattdessen `platform`,
   `translation_key`, `device_class` oder das Geräte-Modell nutzen. Falsch-positive Erkennung
   ist schlimmer als fehlende: eine zu breite Regex hat z. B. fast Saugroboter als USV
   einkategorisiert. Im Zweifel: engere Heuristik plus opt-in.

7. **Klartext und ehrliche Trade-offs.** Editor-Texte für Endnutzer verständlich formulieren;
   Grenzen ehrlich benennen („Anzeigelogik, kein Zugriffsschutz", „experimentell"). Bei
   Architektur-Fragen echte Alternativen mit Vor- und Nachteilen vorlegen statt eine Lösung
   zu verkaufen — und Vereinfachungs-Vorschläge ernst nehmen: weniger eigener Code ist oft
   das bessere Feature. Erkläre Entscheidungen ohne Jargon; wenn der Gegenüber nachfragen
   muss, was ein Begriff bedeutet, war die Erklärung zu abstrakt.

## Der Arbeits-Zyklus (Issue / Feature / Bugfix)

1. **Verstehen:** Issue mit allen Kommentaren lesen (`gh issue view <nr> --comments`).
   Prüfen, ob ein offener Community-PR das Thema schon (teilweise) löst — dann porten und
   crediten statt neu erfinden. Unklarer Scope → Rückfrage stellen statt raten.
2. **Branch:** `feature/<name>` oder `fix/<name>` von aktuellem `main`. Nie direkt auf `main`.
3. **Implementieren:** Kleinster sinnvoller Eingriff. Neue UI-Strings über die
   localize-Utility und in **alle** Sprachdateien (`de`, `en`, `ru`). Dokumentierte
   Design-Entscheidungen aus der CLAUDE.md nicht verletzen.
4. **Kreuzauswirkungs-Check** (nächster Abschnitt) — vor dem finalen Build.
5. **Gates lokal:** `npx tsc --noEmit` · `npm run lint` · `npm test` ·
   `node scripts/lint-translations.mjs` · `npm run build` (+ Chunk-Vergleich).
6. **Am echten System testen:** Build auf einer echten HA-Instanz deployen (Workflow in der
   CLAUDE.md), Hard-Refresh, Konsole prüfen (Versions-String, keine neuen Fehler), das
   Feature real durchklicken. Für Reviewer eine nummerierte Test-Anleitung mitliefern
   („1. Editor öffnen → 2. Toggle X aktivieren → 3. erwarte Y"). Kein Push ohne bestandenen
   Live-Test.
7. **PR:** Titel als Conventional Commit (`feat:`/`fix:` lösen ein Release aus, `chore:`/
   `docs:`/`ci:`/`refactor:` nicht; Runtime-Dependency-Bumps als `fix(deps):`). `Closes #XX`
   in die Beschreibung.
8. **CI abwarten — alle Checks,** auch Codacy (das Quality-Gate blockt bei jedem neuen
   Finding; Fallstricke-Liste in der CLAUDE.md). Ein Merge-Kommando kann still scheitern,
   solange ein Check läuft — Merge-Erfolg immer gegen `origin/main` verifizieren.
9. **Doku gehört zu „fertig":** Neue Optionen im README dokumentieren (mit „ab vX.Y.Z"),
   bei Architektur-Änderungen die CLAUDE.md nachziehen.

Bei reinen **Refactors** gilt zusätzlich: verhaltensneutral bleiben — Snapshot-Tests müssen
unverändert grün sein, das ist der Beweis. Dabei gefundene Bestandsbugs **nicht** mitfixen,
sondern notieren und als eigenen Folge-PR machen (sonst ist die Neutralität nicht mehr
nachweisbar). Nach automatisierten/mechanischen Umbauten eine zweite Prüfrunde einplanen.

## Kreuzauswirkungs-Check (vor jedem Push)

1. **Konsumenten:** Für jede geänderte exportierte Funktion, Registry-Map oder jeden Typ alle
   Aufrufer greppen. Besonders kritisch: `Registry.ts` (alle Views und Cards hängen daran),
   `utils/name-utils.ts` (wird überall benutzt), `types/*.ts` (liest der Editor das Feld?
   Schreibt er es?).
2. **Filter-Pipeline:** Ändert sich die Entity-Filterung (`no_dboard`, `hidden_by`,
   `disabled_by`, `entity_category`, Plattform)? Dann die Auswirkung auf **alle** Views
   durchdenken, nicht nur die geänderte. Achtung Kategorie-Filter: `config`/`diagnostic`
   auszuschließen ist für Anzeige-Listen richtig, für Zählungen manchmal falsch —
   Firmware-Updates sind z. B. oft `config`-Kategorie. Bewusst entscheiden.
3. **generate-Zeit vs. Laufzeit:** Alles, was in `generate()` ausgewertet wird, reagiert
   NICHT auf spätere State-Änderungen. State-reaktives Verhalten gehört in HA-native
   Laufzeit-Mechanismen (conditional card, `visibility`) oder in reaktive Custom Cards.
4. **Editor-Roundtrip:** Taucht die neue Option im Editor auf, überlebt sie
   Speichern + Neuladen, ist der Default sinnvoll und begründet?
5. **Performance:** Entstehen Scans pro Render? Ist der Entry-Chunk gewachsen?
   Chunk-Größen mit dem Stand vor der Änderung vergleichen.
6. **i18n-Parität:** `de`/`en`/`ru` deckungsgleich (`node scripts/lint-translations.mjs`).

Ergebnis bei größeren Änderungen als kurze Tabelle festhalten: Änderung → betroffene
Module → Risiko → wie verifiziert.

## Community-PRs und Issues

- **Porten statt force-mergen:** PRs mit veralteter Basis nicht verbiegen — Quellcode in
  einen frischen Branch porten, pro Original-PR ein Commit mit
  `Co-Authored-By: <Autor> <user@users.noreply.github.com>` und `Closes #XX`. Original-PR
  danach freundlich schließen: per Du, mit Dank und Credit, Verweis auf das Release, keine
  Termin-Zusagen. Credits zusätzlich in den PR-Text schreiben (falls die Squash-Message
  editiert wird).
- **Prämisse prüfen — vor Übernahme UND vor Ablehnung:** Löst der PR ein Problem, das in
  diesem Code überhaupt existieren kann? (Beispiel: ein Dedup-Filter für Entitäten, die aus
  einem per `entity_id` gekeyten Objekt stammen, ist strukturell toter Code — das Duplikat
  existierte nur im Fork des Autors.) Ablehnungen fachlich begründen; im Zweifel Rückfrage
  im PR statt schließen.
- **Ports sind Reviews:** hart aktivierte Features auf opt-in umbauen, aggressive Heuristiken
  härten, kaputte Encodings (Mojibake in Übersetzungen) neu schreiben, bestehende Sonderfälle
  (z. B. Kamera-Spezialbehandlungen) erhalten. Was der PR gut macht, unverändert übernehmen.
- **Fork-PRs und CI:** Der HACS-Validation-Job wird bei Fork-PRs übersprungen (er würde sonst
  das Fork-Repo validieren). Ein roter Check bei einem Community-PR ist also erst zu
  verstehen, dann zu kommentieren.

## Hart erarbeitete Fallen

Ergänzend zu den Codacy-Fallstricken in der CLAUDE.md — diese sind alle real passiert:

- **HA regeneriert Strategy-Dashboards selbst** bei Registry-Änderungen (Entitäten, Geräte,
  Bereiche, Etagen, Labels). Caches/Singletons ohne Staleness-Check (Referenzvergleich auf
  `hass.entities` etc.) fressen diese Regeneration lautlos — und der Dev-Workflow mit
  Hard-Refresh maskiert den Fehler. `registryDependencies` muss `labels` enthalten, weil
  die `no_dboard`-Filterung daran hängt.
- **Offene Browser-DevTools verfälschen Layout und Kamera-Streams.** „Sieht kaputt aus"-
  Eindrücke erst ohne DevTools reproduzieren.
- **HACS: Installieren ≠ Validieren.** Installationen getaggter Versionen kommen aus den
  Release-Assets; `hacs/action` validiert dagegen nur den Branch-Baum (der bewusst kein
  `dist/` enthält). Und: Pre-Releases werden für Nutzer ohne „Vorabversionen anzeigen"
  ausgefiltert — ein Feature „ist released" heißt nicht, dass Stable-Nutzer es sehen.
- **GitHub Actions Anti-Loop:** Events, die ein Workflow mit dem Standard-`GITHUB_TOKEN`
  erzeugt (Tags, Releases), triggern keine Folge-Workflows — deshalb läuft release-please
  über ein App-Token. Draft-Releases erzeugen überhaupt keine `release`-Events.
- **Neue HA-Frontend-Features versionsgaten.** Karten/Optionen, die es erst ab einer
  HA-Version gibt, hinter einen Versions-Check legen — ältere Installationen bekämen sonst
  rote Fehlerkarten. Umgekehrt gilt: Vor dem Alignen mit neuen HA-Releases den Dev-Blog
  lesen (Referenz in der CLAUDE.md), was sich geändert hat.

## Entscheidungsvorlage für Grundsatzfragen

Bei Themen mit Langzeit-Bindung — neue öffentliche Config-API, Extension-Mechanismen,
Default-Änderungen, Auslieferungswege — nicht einfach implementieren, sondern eine kompakte
Entscheidungsvorlage schreiben:

1. **Befund:** Wie löst HA das heute? (Frisch gegen den Frontend-Quellcode verifiziert.)
2. **Optionen** mit Aufwand und Risiken — inklusive der Option „nicht bauen".
3. **Empfehlung** mit Begründung.
4. **Offene Fragen** an den Maintainer.

Grund: Was einmal als API veröffentlicht ist, müssen alle künftigen Versionen dauerhaft
stützen — das ist schwerer zurückzudrehen als jedes Feature. Es gibt bereits mehrere
Erweiterungs-Mechanismen (Custom Cards mit `target_section`, Custom Sections, Custom Views,
Custom Badges) — ein neuer muss dazu passen, nicht als Sonderweg enden.

## Definition von „fertig"

- [ ] `npx tsc --noEmit`, `npm run lint`, `npm test` (inkl. unveränderter Snapshots bei
      Refactors), `node scripts/lint-translations.mjs`, `npm run build` — alles grün
- [ ] Kreuzauswirkungs-Check durchgeführt, Chunk-Bilanz geprüft
- [ ] Auf einem echten HA-System getestet (Konsole: richtige Version, keine neuen Fehler)
- [ ] Neue Features opt-in, Bestands-Configs laufen unverändert weiter
- [ ] README-Doku für neue Optionen, Übersetzungen in de/en/ru
- [ ] PR-Titel als Conventional Commit, `Closes #XX`, Credits gesetzt
- [ ] Alle CI-Checks grün (inkl. Codacy), Merge gegen `origin/main` verifiziert
