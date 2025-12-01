# 📥 Time Import Feature

**Datum:** 14. November 2025  
**Feature:** Import von Arbeitszeiten aus JSON-Datei

---

## 📋 Übersicht

Zusätzlich zum Profil-basierten Zeiterfassungssystem kann man jetzt Arbeitszeiten aus einer JSON-Datei importieren. Dies ermöglicht die Integration mit anderen Time-Tracking-Tools.

---

## 🎯 Use Cases

### Use Case 1: Integration mit externem Time-Tracker
Ein Benutzer trackt seine Zeit mit einem externen Tool (z.B. Toggl, Clockify, etc.) und möchte diese Daten automatisch in Personio übertragen.

### Use Case 2: Bulk-Import
Ein Benutzer möchte mehrere Tage auf einmal erfassen, die bereits in einem anderen System erfasst wurden.

### Use Case 3: Backup & Restore
Ein Benutzer möchte seine getrackte Zeit als Backup exportieren und später wieder importieren.

---

## 📝 JSON Format

### Struktur
```json
[
  {
    "id": 11,
    "start": "20251113T075824Z",
    "end": "20251113T080900Z",
    "tags": ["hrvst:2795306542"]
  },
  {
    "id": 10,
    "start": "20251113T080900Z",
    "end": "20251113T081342Z",
    "tags": ["hrvst:2795311414", "kloudease daily"]
  }
]
```

### Wichtige Felder

| Feld | Typ | Beschreibung | Verwendet |
|------|-----|--------------|-----------|
| `id` | Number | Eindeutige ID des Eintrags | ❌ Nein |
| `start` | String (ISO) | Startzeit (UTC) | ✅ Ja |
| `end` | String (ISO) | Endzeit (UTC) | ✅ Ja |
| `tags` | Array | Tags/Kategorien | ❌ Nein |

### Zeitformat
- **Format:** ISO 8601 mit UTC-Zeitzone (`YYYYMMDDTHHMMSSZ`)
- **Beispiel:** `20251113T075824Z` = 13. November 2025, 07:58:24 UTC
- **Sekunden:** Werden ignoriert (auf Minute gerundet)
- **Timezone:** Wird nach `Europe/Berlin` (oder konfigurierte Timezone) konvertiert

---

## 🔧 Funktionsweise

### 1. Daten-Import
1. Benutzer wählt "Import" Tab
2. Lädt JSON-Datei hoch
3. System validiert Format
4. System gruppiert Einträge nach Datum

### 2. Zeit-Konvertierung
```javascript
// UTC -> Europe/Berlin
"20251113T080000Z" -> "2025-11-13 09:00:00" (Berlin)
```

### 3. Pause-Erkennung
**Regel:** Lücken zwischen Einträgen werden als Pausen interpretiert

```javascript
Entry 1: 08:00 - 12:00  // Work (4h)
Entry 2: 13:00 - 17:00  // Work (4h)
// -> Pause: 12:00 - 13:00 (1h)
```

**Ausnahme:** Lücken < 1 Minute werden ignoriert

```javascript
Entry 1: 08:00:00 - 12:00:30  // Work
Entry 2: 12:00:45 - 17:00:00  // Work
// -> Keine Pause (nur 15 Sekunden Lücke)
```

### 4. Tag-Filterung
**Wichtig:** Bereits eingetragene Tage werden übersprungen!

1. System lädt Timesheet für gewählten Zeitraum
2. Filtert Tage mit `state: "trackable"` und `periods.length === 0`
3. Importiert nur Tage, die noch leer sind

---

## 🎨 UI Design

### Tab-Navigation
```
┌─────────────────────────────────┐
│ [Profil] [Import]               │
├─────────────────────────────────┤
│ ... Tab Content ...             │
└─────────────────────────────────┘
```

### Import Tab Content
```
┌─────────────────────────────────┐
│ 📥 Zeiten aus Datei importieren │
├─────────────────────────────────┤
│ [Datei auswählen...]            │
│ └─ time-entries.json            │
│                                 │
│ ✅ Datei validiert!             │
│ 📊 5 Tage gefunden              │
│ 📅 2025-11-13 bis 2025-11-17    │
│                                 │
│ [Zeiten importieren]            │
└─────────────────────────────────┘
```

---

## 🔄 Import-Prozess

### Schritt 1: Datei-Upload
```javascript
User -> [Select File] -> Validate JSON -> Show Preview
```

### Schritt 2: Validierung
- ✅ JSON parsebar?
- ✅ Array vorhanden?
- ✅ Einträge haben `start` und `end`?
- ✅ Timestamps valide?

### Schritt 3: Gruppierung nach Datum
```javascript
{
  "2025-11-13": [
    { start: "08:00", end: "12:00" },
    { start: "13:00", end: "17:00" }
  ],
  "2025-11-14": [
    { start: "08:00", end: "12:00" },
    { start: "13:00", end: "17:00" }
  ]
}
```

### Schritt 4: Personio-Format konvertieren
```javascript
// Für jeden Tag:
{
  attendance_day_id: "uuid-from-timesheet",
  employee_id: 13011272,
  periods: [
    {
      attendance_period_id: "new-uuid",
      start: "2025-11-13 08:00:00",
      end: "2025-11-13 12:00:00",
      period_type: "work"
    },
    {
      attendance_period_id: "new-uuid",
      start: "2025-11-13 12:00:00",
      end: "2025-11-13 13:00:00",
      period_type: "break"
    },
    {
      attendance_period_id: "new-uuid",
      start: "2025-11-13 13:00:00",
      end: "2025-11-13 17:00:00",
      period_type: "work"
    }
  ]
}
```

### Schritt 5: Upload zu Personio
- Lädt Timesheet für Zeitraum
- Filtert bereits eingetragene Tage
- Ruft für jeden leeren Tag die Attendance-API auf

---

## 📊 Beispiel-Import

### Input JSON
```json
[
  {
    "id": 1,
    "start": "20251113T070000Z",
    "end": "20251113T110000Z",
    "tags": ["project-a"]
  },
  {
    "id": 2,
    "start": "20251113T120000Z",
    "end": "20251113T160000Z",
    "tags": ["project-b"]
  }
]
```

### Verarbeitung
1. **Parse:** 2 Einträge gefunden
2. **Convert Timezone:** 
   - 07:00 UTC -> 08:00 Berlin
   - 11:00 UTC -> 12:00 Berlin
   - 12:00 UTC -> 13:00 Berlin
   - 16:00 UTC -> 17:00 Berlin
3. **Detect Break:** 12:00-13:00 (1h Lücke)
4. **Group by Date:** 1 Tag (2025-11-13)

### Output (Personio API)
```json
{
  "attendance_day_id": "...",
  "employee_id": 13011272,
  "periods": [
    {
      "attendance_period_id": "...",
      "start": "2025-11-13 08:00:00",
      "end": "2025-11-13 12:00:00",
      "period_type": "work"
    },
    {
      "attendance_period_id": "...",
      "start": "2025-11-13 12:00:00",
      "end": "2025-11-13 13:00:00",
      "period_type": "break"
    },
    {
      "attendance_period_id": "...",
      "start": "2025-11-13 13:00:00",
      "end": "2025-11-13 17:00:00",
      "period_type": "work"
    }
  ]
}
```

### Resultat in Personio
- 13.11.2025: 08:00-12:00, Pause 12:00-13:00, 13:00-17:00 ✅
- Gesamt: 8h Arbeit, 1h Pause

---

## ⚠️ Edge Cases

### 1. Bereits eingetragene Tage
```javascript
// Timesheet zeigt:
"2025-11-13": { periods: [...] } // Bereits eingetragen!

// Import-File enthält:
"2025-11-13": [...] // Wird übersprungen ⚠️
```

### 2. Mehrere Tage in einer Datei
```javascript
[
  { start: "20251113T080000Z", end: "20251113T120000Z" }, // Tag 1
  { start: "20251113T130000Z", end: "20251113T170000Z" }, // Tag 1
  { start: "20251114T080000Z", end: "20251114T120000Z" }, // Tag 2
  { start: "20251114T130000Z", end: "20251114T170000Z" }  // Tag 2
]
// -> Wird in 2 Tage gruppiert ✅
```

### 3. Sehr kleine Lücken (< 1 Min)
```javascript
[
  { start: "20251113T080000Z", end: "20251113T120030Z" },
  { start: "20251113T120045Z", end: "20251113T170000Z" }
]
// -> 15 Sekunden Lücke -> Zusammengefasst zu einem Work-Period
```

### 4. Einträge ohne Lücke
```javascript
[
  { start: "20251113T080000Z", end: "20251113T120000Z" },
  { start: "20251113T120000Z", end: "20251113T170000Z" }
]
// -> Keine Pause (0 Sekunden Lücke) -> 2 Work-Periods direkt hintereinander
```

### 5. Nicht-trackable Tage
```javascript
// Timesheet zeigt:
"2025-11-16": { state: "non_trackable" } // Zukünftiger Tag

// Import wird abgelehnt ❌
```

---

## 🔒 Validierung

### Datei-Validierung
- ✅ Datei ist JSON
- ✅ Root ist Array
- ✅ Mindestens 1 Eintrag

### Eintrags-Validierung
- ✅ `start` und `end` vorhanden
- ✅ Timestamps im ISO-Format
- ✅ `end` > `start`
- ✅ Datum nicht in der Zukunft

### Import-Validierung
- ✅ Profil konfiguriert (Employee ID + Instance)
- ✅ Authentifiziert
- ✅ Mindestens 1 importierbarer Tag

---

## 📁 Geänderte/Neue Dateien

### Neue Dateien
1. `services/time-import-service.js` - Import-Logik
2. `docs/TIME_IMPORT_FEATURE.md` - Diese Dokumentation

### Geänderte Dateien
1. `popup/popup.html` - Tab-Navigation + Import UI
2. `popup/popup.css` - Tab-Styles
3. `popup/popup.js` - Import-Handler
4. `services/timesheet-service.js` - Export `generatePeriodsFromImport()`

---

## 🧪 Testing

### Test 1: Single Day Import
```json
[
  {"start":"20251113T070000Z","end":"20251113T110000Z"},
  {"start":"20251113T120000Z","end":"20251113T160000Z"}
]
```
**Erwartung:** 1 Tag, 2 Work-Periods, 1 Break

### Test 2: Multi Day Import
```json
[
  {"start":"20251113T070000Z","end":"20251113T110000Z"},
  {"start":"20251114T070000Z","end":"20251114T110000Z"}
]
```
**Erwartung:** 2 Tage, je 1 Work-Period

### Test 3: No Break
```json
[
  {"start":"20251113T070000Z","end":"20251113T150000Z"}
]
```
**Erwartung:** 1 Tag, 1 Work-Period, 0 Breaks

### Test 4: Already Recorded Day
```json
[
  {"start":"20251103T070000Z","end":"20251103T150000Z"}
]
```
**Erwartung:** Tag wird übersprungen (bereits eingetragen)

### Test 5: Micro Gaps
```json
[
  {"start":"20251113T080000Z","end":"20251113T120030Z"},
  {"start":"20251113T120045Z","end":"20251113T160000Z"}
]
```
**Erwartung:** 2 Work-Periods direkt hintereinander (keine Pause)

---

## ✅ Vorteile

1. **Flexibilität:** Unterstützt externe Time-Tracker
2. **Effizienz:** Bulk-Import mehrerer Tage
3. **Kompatibilität:** Arbeitet mit Profil-System zusammen
4. **Sicherheit:** Überschreibt keine bestehenden Einträge
5. **One-Time:** Kein Speichern sensibler Daten

---

## 🚀 Workflow

```
┌─────────────┐
│ External    │
│ Time Tracker│
└──────┬──────┘
       │ Export JSON
       v
┌─────────────┐
│ Import Tab  │
│ [Upload]    │
└──────┬──────┘
       │ Parse & Validate
       v
┌─────────────┐
│ Group by    │
│ Date        │
└──────┬──────┘
       │ Convert to Personio Format
       v
┌─────────────┐
│ Filter      │
│ already     │
│ recorded    │
└──────┬──────┘
       │ Upload
       v
┌─────────────┐
│ Personio    │
│ API         │
└─────────────┘
```

---

**STATUS: Bereit zur Implementierung!** 🚀

