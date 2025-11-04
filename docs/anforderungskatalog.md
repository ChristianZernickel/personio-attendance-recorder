# Anforderungskatalog - Personio Attendance Recorder

**Projekt:** Personio Attendance Recorder Chrome Plugin  
**Version:** 0.1.0  
**Datum:** 04. November 2025  
**Status:** Initial Draft

---

## 1. Einleitung

### 1.1 Zweck
Dieses Dokument beschreibt alle funktionalen und nicht-funktionalen Anforderungen an das Personio Attendance Recorder Chrome Plugin.

### 1.2 Geltungsbereich
Das Plugin wird als Chrome Extension entwickelt und ermöglicht die automatisierte Zeiterfassung in Personio.

### 1.3 Zielgruppe
- Entwickler
- Product Owner
- Tester
- Endbenutzer (Personio-Nutzer)

---

## 2. Funktionale Anforderungen

### FR-01: Authentifizierung über Cookie-Extraktion

**Priorität:** HOCH  
**Status:** Offen

#### Beschreibung
Das Plugin muss die Authentifizierungs-Cookies von der Personio-Website extrahieren können.

#### Detaillierte Anforderungen

**FR-01.1** Das Plugin soll nur aktiviert werden, wenn der Benutzer auf einer Personio-Seite eingeloggt ist.

**FR-01.2** Das Plugin muss alle Session-Cookies von der Domain `https://aoe-gmbh.app.personio.com` extrahieren, insbesondere:
- `ATHENA-XSRF-TOKEN` (wird auch als X-Xsrf-Token Header benötigt)
- `ATHENA_SESSION`
- `personio_session`
- `product_language` (optional)

**FR-01.3** Das Plugin muss den vollständigen Cookie-String als `Cookie`-Header und den `ATHENA-XSRF-TOKEN`-Wert als `X-Xsrf-Token`-Header in allen API-Requests senden.

**FR-01.4** Das Plugin muss überprüfen, ob die erforderlichen Cookies vorhanden sind, bevor API-Calls durchgeführt werden.

**FR-01.5** Wenn Cookies fehlen oder ungültig sind, muss der Benutzer darüber informiert werden mit einer klaren Fehlermeldung.

**FR-01.6** Die Domain muss konfigurierbar sein für verschiedene Personio-Instanzen (z.B. `aoe-gmbh.app.personio.com`).

#### Akzeptanzkriterien
- [ ] Plugin ist nur auf Personio-Seiten aktiv
- [ ] Alle erforderlichen Cookies werden korrekt extrahiert
- [ ] Cookie-String wird korrekt formatiert (Format: `name1=value1; name2=value2; ...`)
- [ ] X-Xsrf-Token Header wird mit ATHENA-XSRF-TOKEN Wert gesetzt
- [ ] Bei fehlenden Cookies wird eine Fehlermeldung angezeigt
- [ ] Cookies werden für API-Requests verwendet

---

### FR-02: Arbeitszeitprofil-Verwaltung

**Priorität:** HOCH  
**Status:** Offen

#### Beschreibung
Benutzer müssen ihr persönliches Arbeitszeitprofil im Plugin hinterlegen können.

#### Detaillierte Anforderungen

**FR-02.1** Das Plugin muss eine Konfigurationsoberfläche bereitstellen zur Eingabe folgender Daten:
- Arbeitstage (Montag bis Sonntag, Multi-Select)
- Arbeitszeit Beginn (HH:MM Format)
- Arbeitszeit Ende (HH:MM Format)
- Pausenbeginn (HH:MM Format)
- Pausenende (HH:MM Format)

**FR-02.2** Die Employee ID muss vom Benutzer eingegeben oder automatisch extrahiert werden können.

**FR-02.3** Das Arbeitszeitprofil muss persistent gespeichert werden (Chrome Storage API).

**FR-02.4** Das Plugin muss Validierungen durchführen:
- Arbeitsende muss nach Arbeitsbeginn liegen
- Pausenende muss nach Pausenbeginn liegen
- Pause muss innerhalb der Arbeitszeit liegen
- Mindestens ein Arbeitstag muss ausgewählt sein

**FR-02.5** Das Profil muss bearbeitbar sein.

**FR-02.6** Es muss eine Vorschau geben, wie die Zeiterfassung aussehen wird.

#### Akzeptanzkriterien
- [ ] Benutzer kann Arbeitszeitprofil eingeben
- [ ] Eingaben werden validiert
- [ ] Profil wird persistent gespeichert
- [ ] Profil kann bearbeitet werden
- [ ] Vorschau-Funktion zeigt geplante Zeiterfassung

#### Datenmodell
```json
{
  "employeeId": "13011272",
  "personioInstance": "aoe-gmbh.app.personio.com",
  "workingDays": [1, 2, 3, 4, 5],  // 1=Montag, 7=Sonntag
  "workStart": "08:00",
  "workEnd": "17:00",
  "breakStart": "12:00",
  "breakEnd": "13:00",
  "timezone": "Europe/Berlin"
}
```

---

### FR-03: Timesheet-Abfrage

**Priorität:** HOCH  
**Status:** Offen

#### Beschreibung
Das Plugin muss den aktuellen Monat des Timesheets von Personio abfragen können.

#### Detaillierte Anforderungen

**FR-03.1** Vor dem Eintragen muss das Plugin die Timesheet-Daten für den aktuellen Monat abrufen.

**FR-03.2** Der API-Endpunkt lautet:
```
GET https://{instance}.app.personio.com/svc/attendance-bff/v1/timesheet/{employeeId}?start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}&timezone={timezone}
```

**FR-03.3** Parameter werden automatisch berechnet:
- `start_date`: Erster Tag des aktuellen Monats
- `end_date`: Letzter Tag des aktuellen Monats
- `timezone`: Aus Arbeitszeitprofil (Standard: Europe/Berlin)

**FR-03.4** Das Plugin muss die Response validieren und folgende Indikatoren auswerten:
- `is_off_day` (boolean): `true` = kein Arbeitstag
- `state` (string): 
  - `"trackable"` = Tag kann getrackt werden
  - `"non_trackable"` = Tag liegt in der Zukunft

**FR-03.5** Das Plugin muss bereits eingetragene Tage (`periods.length > 0`) von der Eintragung ausschließen.

**FR-03.6** Das Plugin muss Fehler bei der API-Abfrage behandeln und dem Benutzer anzeigen.

#### Akzeptanzkriterien
- [ ] Timesheet für aktuellen Monat wird korrekt abgerufen
- [ ] Trackbare Tage werden identifiziert
- [ ] Bereits eingetragene Tage werden erkannt
- [ ] Off-Days werden übersprungen
- [ ] Fehlerbehandlung funktioniert

#### Filterlogik
Ein Tag wird eingetragen, wenn:
- ✅ `state === "trackable"`
- ✅ `is_off_day === false`
- ✅ `periods.length === 0` (noch nicht eingetragen)
- ✅ Tag ist ein konfigurierter Arbeitstag im Profil

---

### FR-04: Automatische Zeiterfassung

**Priorität:** HOCH  
**Status:** Offen

#### Beschreibung
Das Plugin muss Arbeitszeiten basierend auf dem Arbeitszeitprofil automatisch in Personio eintragen.

#### Detaillierte Anforderungen

**FR-04.1** Nach dem Abruf des Timesheets soll das Plugin für jeden relevanten Tag einen Eintrag erstellen.

**FR-04.2** Der API-Endpunkt lautet:
```
POST https://{instance}.app.personio.com/svc/attendance-api/validate-and-calculate-full-day?propose-fix=false
```

**FR-04.3** Das Request-Format muss folgendem Schema entsprechen:
```json
{
  "attendance_day_id": "UUID-vom-Timesheet",
  "employee_id": 13011272,
  "periods": [
    {
      "attendance_period_id": "neue-UUID",
      "start": "YYYY-MM-DD HH:MM:SS",
      "end": "YYYY-MM-DD HH:MM:SS",
      "period_type": "work",
      "comment": null,
      "project_id": null
    },
    {
      "attendance_period_id": "neue-UUID",
      "start": "YYYY-MM-DD HH:MM:SS",
      "end": "YYYY-MM-DD HH:MM:SS",
      "period_type": "break",
      "comment": null,
      "project_id": null
    }
  ]
}
```

**FR-04.4** Für neue Einträge werden `attendance_day_id` und `attendance_period_id` als UUIDs generiert.

**FR-04.5** Das Plugin muss zwei Periods erstellen:
1. **Erste Work-Period**: Von Arbeitsbeginn bis Pausenbeginn
2. **Break-Period**: Von Pausenbeginn bis Pausenende
3. **Zweite Work-Period**: Von Pausenende bis Arbeitsende

**FR-04.6** Die Zeitstempel müssen im Format `YYYY-MM-DD HH:MM:SS` sein.

**FR-04.7** Das Plugin muss die Einträge sequenziell (Tag für Tag) erstellen, um Rate-Limiting zu vermeiden.

**FR-04.8** Bei Fehlern in einem Eintrag soll das Plugin mit dem nächsten Tag fortfahren.

**FR-04.9** Der Benutzer muss über den Fortschritt informiert werden (z.B. "Tag 3 von 10 eingetragen").

**FR-04.10** Nach Abschluss muss eine Zusammenfassung angezeigt werden:
- Anzahl erfolgreich eingetragener Tage
- Anzahl fehlgeschlagener Einträge
- Liste der fehlgeschlagenen Tage mit Fehlermeldungen

#### Akzeptanzkriterien
- [ ] Arbeitszeiten werden korrekt berechnet
- [ ] Work- und Break-Periods werden korrekt erstellt
- [ ] Einträge werden erfolgreich an Personio gesendet
- [ ] Fortschrittsanzeige funktioniert
- [ ] Fehlerbehandlung pro Tag funktioniert
- [ ] Zusammenfassung wird angezeigt

---

### FR-05: Benutzeroberfläche

**Priorität:** MITTEL  
**Status:** Offen

#### Beschreibung
Das Plugin muss eine intuitive Benutzeroberfläche als Browser-Popup bereitstellen.

#### Detaillierte Anforderungen

**FR-05.1** Das Popup muss folgende Bereiche enthalten:
1. **Status-Bereich**: Zeigt an, ob Authentifizierung erfolgreich ist
2. **Profil-Bereich**: Anzeige und Bearbeitung des Arbeitszeitprofils
3. **Aktions-Bereich**: Button zum Starten der Zeiterfassung
4. **Fortschritts-Bereich**: Zeigt den Fortschritt während der Eintragung
5. **Log-Bereich**: Zeigt Erfolge und Fehler

**FR-05.2** Das Design muss responsive sein und in das Standard-Chrome-Extension-Format passen.

**FR-05.3** Buttons müssen während der Ausführung deaktiviert werden.

**FR-05.4** Fehlermeldungen müssen klar und verständlich sein.

**FR-05.5** Erfolgsmeldungen müssen positives Feedback geben.

#### Akzeptanzkriterien
- [ ] UI ist intuitiv bedienbar
- [ ] Alle Bereiche sind vorhanden
- [ ] Responsive Design funktioniert
- [ ] Feedback ist klar und verständlich

---

### FR-06: Vorschau-Modus

**Priorität:** NIEDRIG  
**Status:** Optional

#### Beschreibung
Benutzer sollen vor der Eintragung eine Vorschau sehen können.

#### Detaillierte Anforderungen

**FR-06.1** Ein "Vorschau"-Button zeigt an, welche Tage eingetragen würden.

**FR-06.2** Die Vorschau zeigt:
- Datum
- Berechnete Arbeitszeiten
- Pausen

**FR-06.3** Aus der Vorschau heraus kann die Eintragung gestartet werden.

#### Akzeptanzkriterien
- [ ] Vorschau zeigt korrekte Daten
- [ ] Keine API-Calls werden durchgeführt
- [ ] Eintragung kann aus Vorschau gestartet werden

---

## 3. Nicht-funktionale Anforderungen

### NFR-01: Sicherheit

**Priorität:** HOCH

**NFR-01.1** Cookies und Tokens dürfen nicht im Klartext geloggt werden.

**NFR-01.2** Alle API-Calls müssen über HTTPS erfolgen.

**NFR-01.3** Sensible Daten müssen verschlüsselt in der Chrome Storage API gespeichert werden.

**NFR-01.4** Das Plugin darf nur auf Personio-Domains aktiv sein.

**NFR-01.5** Content Security Policy muss implementiert sein.

---

### NFR-02: Performance

**Priorität:** MITTEL

**NFR-02.1** Das Plugin-Popup muss innerhalb von 500ms laden.

**NFR-02.2** API-Calls sollen mit angemessenen Timeouts (z.B. 10s) versehen sein.

**NFR-02.3** Rate-Limiting: Maximal 1 Request pro Sekunde.

**NFR-02.4** Das Plugin darf die Browser-Performance nicht merklich beeinträchtigen.

---

### NFR-03: Zuverlässigkeit

**Priorität:** HOCH

**NFR-03.1** Fehler bei einzelnen Tagen dürfen nicht den gesamten Prozess abbrechen.

**NFR-03.2** Bei Netzwerkfehlern soll automatisch ein Retry (max. 3x) durchgeführt werden.

**NFR-03.3** Bei kritischen Fehlern muss der Benutzer informiert werden.

**NFR-03.4** Das Plugin muss mit verschiedenen Personio-Versionen kompatibel sein.

---

### NFR-04: Usability

**Priorität:** MITTEL

**NFR-04.1** Die Ersteinrichtung soll maximal 2 Minuten dauern.

**NFR-04.2** Die UI muss selbsterklärend sein.

**NFR-04.3** Fehlermeldungen müssen Lösungsvorschläge enthalten.

**NFR-04.4** Die Extension muss in Deutsch verfügbar sein.

---

### NFR-05: Wartbarkeit

**Priorität:** MITTEL

**NFR-05.1** Der Code muss nach Chrome Extension Best Practices strukturiert sein.

**NFR-05.2** API-Endpunkte müssen zentral konfigurierbar sein.

**NFR-05.3** Logging muss implementiert sein (mit verschiedenen Log-Levels).

**NFR-05.4** Der Code muss ausreichend dokumentiert sein (JSDoc).

---

### NFR-06: Kompatibilität

**Priorität:** HOCH

**NFR-06.1** Das Plugin muss mit Chrome ab Version 110+ kompatibel sein.

**NFR-06.2** Das Plugin muss mit Chromium-basierten Browsern (Edge, Brave) kompatibel sein.

**NFR-06.3** Manifest V3 muss verwendet werden.

**NFR-06.4** Das Plugin muss mit verschiedenen Personio-Instanzen funktionieren.

---

## 4. Randbedingungen

### 4.1 Technische Randbedingungen

- **TB-01:** Chrome Extension Manifest V3
- **TB-02:** Keine externen Server (alles client-side)
- **TB-03:** Personio API v1 (attendance-bff, attendance-api)
- **TB-04:** JavaScript/TypeScript
- **TB-05:** Chrome Storage API für Persistenz

### 4.2 Organisatorische Randbedingungen

- **OB-01:** Open-Source Projekt
- **OB-02:** Dokumentation in Deutsch
- **OB-03:** Code-Kommentare in Deutsch oder Englisch

---

## 5. Daten- und Schnittstellen

### 5.1 Personio API Endpunkte

| Endpunkt | Methode | Zweck |
|----------|---------|-------|
| `/svc/attendance-bff/v1/timesheet/{employeeId}` | GET | Timesheet abrufen |
| `/svc/attendance-api/validate-and-calculate-full-day` | POST | Zeiterfassung eintragen |

### 5.2 Benötigte Permissions

```json
{
  "permissions": [
    "cookies",
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://*.app.personio.com/*"
  ]
}
```

---

## 6. Abnahmekriterien

Das Projekt gilt als abgeschlossen, wenn:

1. ✅ Alle Anforderungen mit Priorität HOCH umgesetzt sind
2. ✅ Die Extension erfolgreich im Chrome Store veröffentlicht werden kann
3. ✅ Ein vollständiger Test-Durchlauf erfolgreich ist
4. ✅ Die Dokumentation vollständig ist
5. ✅ Code-Review durchgeführt wurde

---

## 7. Offene Punkte & Fragen

| ID | Frage | Status | Verantwortlich |
|----|-------|--------|---------------|
| Q-01 | Soll es einen "Dry-Run" Modus geben? | Offen | - |
| Q-02 | Sollen historische Monate nachgetragen werden können? | Offen | - |
| Q-03 | Wie sollen Feiertage behandelt werden? | Offen | - |
| Q-04 | Soll es mehrere Arbeitsprofile geben (z.B. Teilzeit-Wochen)? | Offen | - |
| Q-05 | Soll es eine automatische tägliche/wöchentliche Eintragung geben? | Offen | - |

---

## 8. Änderungshistorie

| Version | Datum | Autor | Änderungen |
|---------|-------|-------|------------|
| 0.1.0 | 2025-11-04 | Initial | Erste Version des Anforderungskatalogs |

---

## Anhänge

- [API-Referenz](./api-reference.md)
- [Knowledge Base](./knowledge-base.md)
- [Architektur](./architecture.md)

