# Multi-Month Import Feature

## Übersicht

Das Plugin unterstützt jetzt den Import von Zeiterfassungsdaten aus mehreren Monaten. Dies ist besonders wichtig am Anfang eines neuen Monats, wenn noch Tage aus dem vorherigen Monat nachgetragen werden müssen.

## Problem

**Szenario:** Es ist der 1. Dezember 2025. Ein Benutzer möchte Zeitdaten vom 28.-30. November importieren.

**Vorheriges Verhalten:**
- Das Plugin fragte nur den aktuellen Monat (Dezember) ab
- Tage aus November wurden als "nicht im Timesheet gefunden" markiert
- Import schlug fehl für alle November-Tage

## Lösung

Das Plugin erkennt automatisch, ob die zu importierenden Daten Tage aus dem vorherigen Monat enthalten und lädt dann beide Monate:

1. **Analyse der Import-Daten:** Prüft, ob Daten aus einem anderen Monat als dem aktuellen enthalten sind
2. **Intelligentes Timesheet-Abruf:** 
   - Nur aktueller Monat wenn alle Daten aus dem aktuellen Monat sind
   - Vorheriger + aktueller Monat wenn Daten aus mehreren Monaten vorhanden sind
3. **Kombiniertes Timesheet:** Beide Timesheets werden kombiniert für die Verarbeitung

## Technische Details

### Implementierung

**Datei:** `popup/popup.js` → Funktion `handleStartImport()`

```javascript
// Determine date range: Check if import contains dates from previous month
const importDates = importedData.dates;
const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

// Check if any import dates are from previous month
const hasPreviousMonthDates = importDates.some(dateStr => {
  const date = new Date(dateStr);
  return date.getMonth() !== currentMonth || date.getFullYear() !== currentYear;
});

let timesheet;

if (hasPreviousMonthDates) {
  // Fetch timesheet for both current and previous month
  addImportProgressLog('📆 Import enthält Daten aus mehreren Monaten...');
  
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  // Previous month range
  const prevStartDate = formatDate(new Date(prevYear, prevMonth, 1));
  const prevEndDate = formatDate(new Date(prevYear, prevMonth + 1, 0));
  
  // Current month range
  const currStartDate = formatDate(new Date(currentYear, currentMonth, 1));
  const currEndDate = formatDate(new Date(currentYear, currentMonth + 1, 0));
  
  // Fetch both months
  const prevTimesheet = await timesheetService.getTimesheet(...);
  const currTimesheet = await timesheetService.getTimesheet(...);
  
  // Combine timecards
  timesheet = {
    timecards: [...prevTimesheet.timecards, ...currTimesheet.timecards],
    widgets: currTimesheet.widgets,
    supervisor_person_id: currTimesheet.supervisor_person_id,
    owner_has_propose_rights: currTimesheet.owner_has_propose_rights
  };
}
```

### Edge Cases

#### Jahreswechsel
**Szenario:** 1. Januar 2026, Import von Daten aus Dezember 2025

**Handling:**
```javascript
const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
```

#### Mehrere Monate im Import
**Szenario:** Import enthält Daten von November, Dezember und Januar

**Aktuelles Verhalten:**
- Lädt nur vorherigen und aktuellen Monat
- Tage außerhalb dieser Range werden als "nicht im Timesheet gefunden" markiert

**Zukünftige Erweiterung:**
- Könnte erweitert werden um alle betroffenen Monate zu laden
- Derzeit deckt Vorheriger + Aktueller Monat die meisten Use Cases ab

## UI-Feedback

Benutzer werden informiert wenn Daten aus mehreren Monaten geladen werden:

```
📅 Rufe Timesheet ab...
📆 Import enthält Daten aus mehreren Monaten...
📅 Lade Timesheet: 2025-11-01 bis 2025-12-31
✅ Timesheet geladen: 61 Tage
```

## Profil-basierte Eintragung

**Hinweis:** Die profil-basierte Eintragung (ohne JSON-Import) verwendet weiterhin nur den aktuellen Monat:

```javascript
// In handleStartRecording()
const timesheet = await timesheetService.getCurrentMonthTimesheet(
  currentWorkProfile.employeeId,
  currentWorkProfile.timezone
);
```

**Grund:** Bei der Profil-Eintragung werden nur Tage eingetragen, die:
- Im aktuellen Monat liegen
- Trackbar sind
- Noch keine Einträge haben

Es macht keinen Sinn, vergangene Monate automatisch einzutragen.

## Testing

### Test-Szenarien

1. **Import nur aktueller Monat:**
   - JSON mit Daten nur von Dezember 2025
   - Erwartung: Nur Dezember-Timesheet wird geladen

2. **Import vorheriger + aktueller Monat:**
   - JSON mit Daten von 28.-30. November und 1.-3. Dezember
   - Erwartung: November + Dezember Timesheet wird geladen

3. **Import am Jahreswechsel:**
   - JSON mit Daten von 28.-31. Dezember 2025 und 1.-3. Januar 2026
   - Erwartung: Dezember 2025 + Januar 2026 Timesheet wird geladen

4. **Bereits eingetragene Tage:**
   - JSON mit Daten die teilweise bereits eingetragen sind
   - Erwartung: Bereits eingetragene Tage werden übersprungen

### Test-JSON für Jahreswechsel

```json
[
  {"id": 1, "start": "20251228T080000Z", "end": "20251228T120000Z"},
  {"id": 2, "start": "20251228T130000Z", "end": "20251228T170000Z"},
  {"id": 3, "start": "20251229T080000Z", "end": "20251229T120000Z"},
  {"id": 4, "start": "20251229T130000Z", "end": "20251229T170000Z"},
  {"id": 5, "start": "20260102T080000Z", "end": "20260102T120000Z"},
  {"id": 6, "start": "20260102T130000Z", "end": "20260102T170000Z"}
]
```

## Limitierungen

1. **Nur 2 Monate:** Aktuell werden maximal 2 Monate geladen (vorheriger + aktueller)
2. **Performance:** Bei großen Timesheets kann das Laden von 2 Monaten länger dauern
3. **API Rate Limits:** 2 Timesheet-Abrufe statt 1 pro Import

## Zukünftige Erweiterungen

### Automatische Erkennung aller betroffenen Monate

```javascript
// Group import dates by month
const monthsMap = new Map();
for (const dateStr of importDates) {
  const date = new Date(dateStr);
  const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
  if (!monthsMap.has(monthKey)) {
    monthsMap.set(monthKey, { year: date.getFullYear(), month: date.getMonth() });
  }
}

// Fetch all required months
const timesheets = [];
for (const [, {year, month}] of monthsMap) {
  const startDate = formatDate(new Date(year, month, 1));
  const endDate = formatDate(new Date(year, month + 1, 0));
  const ts = await timesheetService.getTimesheet(employeeId, startDate, endDate);
  timesheets.push(ts);
}

// Combine all timecards
const allTimecards = timesheets.flatMap(ts => ts.timecards);
```

### Caching von Timesheets

Um Performance zu verbessern und API-Aufrufe zu reduzieren:

```javascript
// Cache timesheet data
const timesheetCache = {
  data: null,
  monthKey: null,
  timestamp: null
};

function getCachedTimesheet(monthKey) {
  if (timesheetCache.monthKey === monthKey) {
    const age = Date.now() - timesheetCache.timestamp;
    if (age < 5 * 60 * 1000) { // 5 minutes
      return timesheetCache.data;
    }
  }
  return null;
}
```

## Verwandte Dokumentation

- [Time Import Feature](./TIME_IMPORT_FEATURE.md) - Grundlegende Import-Funktionalität
- [Time Import Implementation](./TIME_IMPORT_IMPLEMENTATION.md) - Technische Details
- [API Reference](./api-reference.md) - Personio API Dokumentation

## Version History

- **v0.2.1** (Dezember 2025): Multi-Month Import Feature implementiert
- **v0.2.0** (November 2025): Basis Import Feature

