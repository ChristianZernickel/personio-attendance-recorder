# ✅ Test-Checkliste

## Vor dem Testen

- [ ] Chrome Extension neu laden
- [ ] Auf Personio-Seite einloggen
- [ ] Extension-Popup öffnen

## Profil-Tab Tests

### Profil-Editor
- [ ] Editor öffnen/schließen mit ✏️ Button
- [ ] Personio-Instanz eingeben (z.B. `aoe-gmbh.app.personio.com`)
- [ ] Employee-ID eingeben
- [ ] Arbeitstage per Checkbox aktivieren/deaktivieren
- [ ] Zeiten für jeden Tag individuell einstellen
- [ ] "Profil speichern" klicken → ✅ Erfolgsmeldung
- [ ] Profil-Zusammenfassung wird angezeigt

### Authentifizierung
- [ ] Status zeigt "✅ Authentifiziert"
- [ ] Falls ❌: Personio-Tab neu laden und einloggen

### Zeiterfassung starten
- [ ] Button "Zeiterfassung starten" ist aktiviert
- [ ] Klick → Fortschrittsbalken erscheint
- [ ] Progress-Log zeigt jeden Tag
- [ ] Ergebnis-Zusammenfassung wird angezeigt
- [ ] Erfolgreiche Tage: ✅
- [ ] Fehlgeschlagene Tage: ❌

### Edge Cases
- [ ] Bereits eingetragene Tage werden übersprungen
- [ ] Off-Days werden übersprungen
- [ ] Non-trackable Tage werden übersprungen
- [ ] Nur konfigurierte Arbeitstage werden eingetragen

## Import-Tab Tests

### Datei-Upload
- [ ] Tab "📥 Import" öffnen
- [ ] "📁 Datei auswählen" klicken
- [ ] JSON-Datei auswählen
- [ ] Datei-Info wird angezeigt:
  - Anzahl der Tage
  - Zeitraum
  - ✅ Validierung erfolgreich

### Import durchführen
- [ ] Button "Zeiten importieren" ist aktiviert
- [ ] Klick → Import-Fortschrittsbalken erscheint
- [ ] Import-Progress-Log zeigt jeden Tag
- [ ] Import-Ergebnis-Zusammenfassung wird angezeigt

### Import-Logik
- [ ] UTC-Zeiten werden korrekt nach Europe/Berlin konvertiert
- [ ] Pausen werden aus Lücken erkannt
- [ ] Lücken < 1 Min werden ignoriert
- [ ] Bereits eingetragene Tage werden übersprungen
- [ ] Mehrere Tage in einer Datei funktionieren

### Edge Cases
- [ ] Ungültige JSON-Datei → Fehlermeldung
- [ ] Fehlende Pflichtfelder → Fehlermeldung
- [ ] Leere Datei → Fehlermeldung
- [ ] Sehr große Datei (>100 Einträge) → Performance OK

## JSON-Format Tests

### Valide Formate
```json
✅ Minimal:
[
  {"start": "20251113T080000Z", "end": "20251113T170000Z"}
]

✅ Mit optionalen Feldern:
[
  {
    "id": 1,
    "start": "20251113T080000Z",
    "end": "20251113T170000Z",
    "tags": ["test"]
  }
]

✅ Mehrere Tage:
[
  {"start": "20251113T080000Z", "end": "20251113T120000Z"},
  {"start": "20251113T130000Z", "end": "20251113T170000Z"},
  {"start": "20251114T080000Z", "end": "20251114T170000Z"}
]
```

### Invalide Formate
```json
❌ Kein Array:
{"start": "...", "end": "..."}

❌ Fehlende Felder:
[{"start": "20251113T080000Z"}]

❌ Falsches Zeitformat:
[{"start": "2025-11-13 08:00:00", "end": "..."}]
```

## Browser-Konsole Checks

### Erwartete Logs
```
✅ 🚀 Popup initialized
✅ ✅ Authentifiziert
✅ 📅 Fetching timesheet: 2025-11-01 to 2025-11-30
✅ ✅ Timesheet abgerufen: XX Tage gefunden
✅ 📝 Starting to record X days...
✅ ✅ Attendance recorded successfully
```

### Keine Fehler
- [ ] Keine roten Fehlermeldungen in Console
- [ ] Keine 403 Forbidden Errors
- [ ] Keine CORS Errors
- [ ] Keine "undefined" Errors

## Regression Tests

### Nach Code-Änderungen
- [ ] Alle JavaScript-Dateien: `node --check *.js`
- [ ] Extension neu laden
- [ ] Profil-Tab durchführen
- [ ] Import-Tab durchführen
- [ ] Beide Modi funktionieren unabhängig

---

## Test-Daten

### Beispiel JSON für Tests
```json
[
  {"id": 1, "start": "20251113T070000Z", "end": "20251113T110000Z", "tags": ["test"]},
  {"id": 2, "start": "20251113T120000Z", "end": "20251113T160000Z", "tags": ["test"]},
  {"id": 3, "start": "20251114T070000Z", "end": "20251114T110000Z", "tags": ["test"]},
  {"id": 4, "start": "20251114T120000Z", "end": "20251114T160000Z", "tags": ["test"]}
]
```

Speichern als: `test-import.json`
