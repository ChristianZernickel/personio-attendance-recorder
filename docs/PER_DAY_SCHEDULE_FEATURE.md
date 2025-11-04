# 🎨 UI Verbesserungen - Per-Day Schedule

**Datum:** 4. November 2025  
**Feature:** Flexible Arbeitszeiten pro Wochentag

---

## 📋 Änderungen

### 1. Kompakte UI mit Profil-Zusammenfassung

**Vorher:**
- Profil-Editor immer sichtbar
- Viel Platz in der UI

**Nachher:**
- Profil-Zusammenfassung zeigt nur wichtigste Infos
- Edit-Button (✏️) zum Bearbeiten
- Editor nur bei Bedarf sichtbar
- **Platzsparend!**

### 2. Individuelle Zeiten pro Wochentag

**Vorher:**
```javascript
profile = {
  workingDays: [1, 2, 3, 4, 5],
  workStart: '08:00',    // Gleich für alle Tage
  workEnd: '17:00',
  breakStart: '12:00',
  breakEnd: '13:00'
}
```

**Nachher:**
```javascript
profile = {
  schedule: {
    1: { // Montag
      enabled: true,
      workStart: '08:00',
      workEnd: '17:00',
      breakStart: '12:00',
      breakEnd: '13:00'
    },
    2: { // Dienstag
      enabled: true,
      workStart: '08:00',
      workEnd: '17:00',
      breakStart: '12:00',
      breakEnd: '13:00'
    },
    // ... bis Sonntag (7)
    5: { // Freitag
      enabled: true,
      workStart: '08:00',
      workEnd: '13:00',  // Kürzerer Tag!
      breakStart: '12:00',
      breakEnd: '12:30'   // Kürzere Pause!
    }
  }
}
```

### 3. Neue UI-Komponenten

#### Profil-Zusammenfassung
```
┌─────────────────────────────┐
│ Arbeitszeitprofil        ✏️ │
├─────────────────────────────┤
│ Instanz: aoe-gmbh...        │
│ Mitarbeiter-ID: 13011272    │
│ Arbeitstage: Mo, Di, Mi...  │
├─────────────────────────────┤
│ Montag    08:00-17:00       │
│           (Pause: 12:00-13) │
│ Dienstag  08:00-17:00       │
│ ...                         │
│ Freitag   08:00-13:00       │
│           (Pause: 12:00-12) │
└─────────────────────────────┘
```

#### Profil-Editor (bei Klick auf ✏️)
```
┌─────────────────────────────┐
│ [×] Montag                  │
│     08:00 - 17:00           │
│     Pause: 12:00 - 13:00    │
├─────────────────────────────┤
│ [×] Dienstag                │
│     08:00 - 17:00           │
│     Pause: 12:00 - 13:00    │
├─────────────────────────────┤
│ ...                         │
├─────────────────────────────┤
│ [Speichern] [Abbrechen]     │
└─────────────────────────────┘
```

---

## 🔧 Implementierte Features

### 1. Toggle zwischen Summary und Editor
- Button ✏️ öffnet Editor
- Button ✖️ schließt Editor
- "Abbrechen" Button schließt Editor
- Nach Speichern wird automatisch zur Summary gewechselt

### 2. Per-Day Configuration
- Jeder Wochentag hat eigene Felder
- Checkbox aktiviert/deaktiviert Tag
- Deaktivierte Tage werden ausgegraut
- Zeitfelder sind nur bei aktiviertem Tag bearbeitbar

### 3. Validierung
- Prüft Zeiten pro Tag
- Stellt sicher, dass Pausen innerhalb der Arbeitszeit liegen
- Mindestens ein Tag muss aktiviert sein
- Genaue Fehlermeldungen mit Tag-Nummer

### 4. Backwards Compatibility
- Alte Profile (ohne `schedule`) werden migriert
- `workingDays` Array wird weiterhin gesetzt
- Kann mit alten und neuen Profilen umgehen

---

## 📁 Geänderte Dateien

### 1. `popup/popup.html`
- Profile Summary Section
- Profile Editor mit 7 Day-Schedule Inputs
- Toggle Button und Cancel Button

### 2. `popup/popup.css`
- `.profile-summary` Styles
- `.day-schedule` Styles
- `.day-times` mit disabled State
- `.button-group` für Button-Layout
- Animation für Editor-Anzeige

### 3. `popup/popup.js`
- `toggleProfileEditor()` - Toggle zwischen Summary/Editor
- `hideProfileEditor()` - Editor schließen
- `updateDayTimesState()` - Tag aktivieren/deaktivieren
- `updateProfileSummary()` - Summary befüllen
- `setDefaultSchedule()` - Default Mo-Fr Schedule
- `handleSaveProfile()` - Neues Schedule-Format speichern
- `loadWorkProfile()` - Schedule laden und migrieren

### 4. `services/timesheet-service.js`
- `generatePeriodsForDay()` - Verwendet Schedule pro Tag
- Parameter `dayOfWeek` hinzugefügt

### 5. `services/attendance-service.js`
- Berechnet `isoDayOfWeek` für jeden Tag
- Übergibt `dayOfWeek` an `generatePeriodsForDay()`

### 6. `utils/helpers.js`
- `validateWorkProfile()` - Validiert neues Schedule-Format
- Prüft jeden Tag einzeln
- Fallback für altes Format

---

## 🎯 Use Cases

### Use Case 1: Standard Mo-Fr (8h/Tag)
```javascript
Mo-Do: 08:00-17:00 (Pause: 12:00-13:00) = 8h
Fr:    08:00-17:00 (Pause: 12:00-13:00) = 8h
Gesamt: 40h/Woche
```

### Use Case 2: 4x9h + 1x4h
```javascript
Mo:    08:00-18:00 (Pause: 12:00-13:00) = 9h
Di:    08:00-18:00 (Pause: 12:00-13:00) = 9h
Mi:    08:00-18:00 (Pause: 12:00-13:00) = 9h
Do:    08:00-18:00 (Pause: 12:00-13:00) = 9h
Fr:    08:00-12:30 (Pause: -         ) = 4.5h
Gesamt: 40.5h/Woche
```

### Use Case 3: Teilzeit mit unterschiedlichen Tagen
```javascript
Mo:    09:00-15:00 (Pause: 12:00-12:30) = 5.5h
Mi:    09:00-15:00 (Pause: 12:00-12:30) = 5.5h
Fr:    09:00-13:00 (Pause: -         ) = 4h
Gesamt: 15h/Woche
```

---

## ✅ Vorteile

1. **Flexibilität:** Jeder Tag kann individuelle Zeiten haben
2. **Übersichtlich:** Kompakte Summary spart Platz
3. **Einfach:** Toggle zwischen Anzeige und Bearbeitung
4. **Kompatibel:** Alte Profile funktionieren weiterhin
5. **Validiert:** Präzise Fehlerprüfung pro Tag

---

## 🧪 Testing

1. **Neues Profil anlegen:**
   - ✏️ klicken
   - Tage aktivieren und Zeiten eintragen
   - Speichern
   - Summary prüfen

2. **Verschiedene Zeiten testen:**
   - Mo-Do: 08:00-17:00
   - Fr: 08:00-13:00
   - Speichern und Zeiterfassung starten

3. **Migration testen:**
   - Altes Profil laden
   - Sollte automatisch migriert werden
   - Zeiten sollten für alle Tage gleich sein

4. **Validierung testen:**
   - Ungültige Zeiten eingeben
   - Pause außerhalb Arbeitszeit
   - Alle Tage deaktivieren
   - Sollte entsprechende Fehler anzeigen

---

## 📝 Beispiel-Konfiguration

**4 Tage á 9 Stunden + 1 Tag á 4 Stunden:**

| Tag | Aktiv | Arbeit | Pause |
|-----|-------|--------|-------|
| Mo  | ✅ | 08:00-18:00 | 12:00-13:00 |
| Di  | ✅ | 08:00-18:00 | 12:00-13:00 |
| Mi  | ✅ | 08:00-18:00 | 12:00-13:00 |
| Do  | ✅ | 08:00-18:00 | 12:00-13:00 |
| Fr  | ✅ | 08:00-12:30 | - |
| Sa  | ❌ | - | - |
| So  | ❌ | - | - |

**Gesamt:** 40.5 Stunden/Woche

---

**STATUS: Implementiert und bereit zum Testen!** 🎉

