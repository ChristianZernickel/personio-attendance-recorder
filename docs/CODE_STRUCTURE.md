# Code-Struktur und Modularisierung

## Übersicht

Die Extension wurde vollständig modularisiert, um eine bessere Wartbarkeit und Testbarkeit zu gewährleisten.

## Architektur

```
personio-attendance-recorder/
├── popup/
│   ├── popup.html          # UI Definition
│   ├── popup.css           # Styling
│   └── popup.js            # UI Controller (465 Zeilen)
├── services/
│   ├── api-client.js       # Personio API Kommunikation
│   ├── attendance-service.js   # Zeiterfassung
│   ├── auth-manager.js     # Authentifizierung
│   ├── profile-service.js  # Profilverwaltung
│   ├── recording-workflow-service.js   # Workflow-Orchestrierung
│   ├── time-import-service.js   # JSON Import
│   ├── timesheet-service.js    # Timesheet Abruf
│   └── ui-log-service.js   # UI Logging
├── storage/
│   └── storage-manager.js  # Datenspeicherung
├── background/
│   └── service-worker.js   # Background Tasks
└── content/
    └── content-script.js   # Content Script
```

## Service-Layer

### 1. **AuthManager** (`services/auth-manager.js`)
- **Verantwortung**: Cookie-basierte Authentifizierung
- **Methoden**:
  - `extractAuthData(personioInstance)` - Extrahiert Auth-Cookies
- **Verwendet von**: PersonioAPIClient, RecordingWorkflowService

### 2. **StorageManager** (`storage/storage-manager.js`)
- **Verantwortung**: Persistierung von Profil und Sync-Status
- **Methoden**:
  - `loadWorkProfile()` - Lädt gespeichertes Profil
  - `saveWorkProfile(profile)` - Speichert Profil
  - `saveLastSync(timestamp)` - Speichert letzten Sync
- **Verwendet von**: ProfileService, RecordingWorkflowService

### 3. **ProfileService** (`services/profile-service.js`)
- **Verantwortung**: Profilverwaltung und -validierung
- **Methoden**:
  - `loadProfile()` - Lädt Profil
  - `saveProfile(profile)` - Speichert Profil
  - `validateProfile(profile)` - Validiert Profil
  - `populateForm(profile)` - Befüllt UI-Formular
  - `updateSummary(profile)` - Aktualisiert UI-Zusammenfassung
  - `migrateLegacyProfile(profile)` - Migriert alte Profile
- **Verwendet von**: popup.js

### 4. **TimeImportService** (`services/time-import-service.js`)
- **Verantwortung**: JSON Import Parsing und Validierung
- **Methoden**:
  - `parseImportData(data)` - Parsed JSON-Daten
  - `convertToPeriods(dateStr, timezone)` - Konvertiert zu Personio-Perioden
  - `getImportableDates()` - Gibt importierbare Tage zurück
- **Verwendet von**: RecordingWorkflowService, popup.js

### 5. **UILogService** (`services/ui-log-service.js`)
- **Verantwortung**: UI Logging und Fortschrittsanzeige
- **Methoden**:
  - `addLog(containerId, message, isError)` - Fügt Log-Eintrag hinzu
  - `clear(containerId)` - Löscht Logs
  - `showResults(type, results)` - Zeigt Ergebnisse an
- **Verwendet von**: RecordingWorkflowService, popup.js

### 6. **RecordingWorkflowService** (`services/recording-workflow-service.js`)
- **Verantwortung**: Orchestrierung von Profil- und Import-Workflows
- **Methoden**:
  - `recordProfileDays(profile, services)` - Führt Profil-basierte Eintragung durch
  - `recordImportedDays(profile, importedData, services)` - Führt Import-basierte Eintragung durch
- **Verwendet von**: popup.js

### 7. **TimesheetService** (`services/timesheet-service.js`)
- **Verantwortung**: Timesheet-Abruf und -Filterung
- **Methoden**:
  - `getCurrentMonthTimesheet(employeeId, timezone)` - Aktueller Monat
  - `getTimesheet(employeeId, startDate, endDate, timezone)` - Beliebiger Zeitraum
  - `getRecordableDays(timesheet, profile)` - Filtert eintragbare Tage
- **Verwendet von**: RecordingWorkflowService, AttendanceService

### 8. **AttendanceService** (`services/attendance-service.js`)
- **Verantwortung**: Zeiterfassung durchführen
- **Methoden**:
  - `recordMultipleDays(days, employeeId, profile, progressCallback)` - Erfasst mehrere Tage
- **Verwendet von**: RecordingWorkflowService

### 9. **PersonioAPIClient** (`services/api-client.js`)
- **Verantwortung**: API-Kommunikation mit Personio
- **Methoden**:
  - `getTimesheet(employeeId, startDate, endDate, timezone)` - Timesheet abrufen
  - `recordAttendance(dayId, employeeId, periods)` - Zeiterfassung
  - `refreshSession()` - Session aktualisieren
- **Verwendet von**: TimesheetService, AttendanceService

## UI Controller (popup.js)

### Struktur

```javascript
// ============================================================================
// Initialization
// ============================================================================
// - Service-Initialisierung
// - Event Listener Setup

// ============================================================================
// Profile Management
// ============================================================================
// - initProfile() - Profil laden und UI initialisieren
// - checkAuthentication() - Auth-Status prüfen

// ============================================================================
// UI State Management
// ============================================================================
// - switchTab() - Tab-Wechsel
// - toggleProfileEditor() - Editor ein/ausblenden
// - switchImportMethod() - Import-Methode wechseln
// - updateDayTimesState() - Tages-Input aktivieren/deaktivieren

// ============================================================================
// Event Handlers - Profile
// ============================================================================
// - handleSaveProfile() - Profil speichern
// - handleStartRecording() - Profil-basierte Erfassung starten

// ============================================================================
// Event Handlers - Import
// ============================================================================
// - handleFileSelect() - Datei-Import
// - handleParseImportText() - Text-Import
// - handleStartImport() - Import starten
```

### Verantwortungen

**popup.js ist NUR verantwortlich für:**
1. UI-Event-Handling
2. DOM-Manipulation
3. Service-Orchestrierung
4. Fehlerbehandlung und User-Feedback

**popup.js ist NICHT verantwortlich für:**
1. Business-Logik (→ Services)
2. API-Kommunikation (→ PersonioAPIClient)
3. Datenpersistierung (→ StorageManager)
4. Datenvalidierung (→ ProfileService, TimeImportService)

## Datenfluss

### Profil-basierte Zeiterfassung

```
popup.js (handleStartRecording)
  ↓
RecordingWorkflowService.recordProfileDays()
  ↓
TimesheetService.getCurrentMonthTimesheet()
  ↓
PersonioAPIClient.getTimesheet()
  ↓
TimesheetService.getRecordableDays()
  ↓
AttendanceService.recordMultipleDays()
  ↓
PersonioAPIClient.recordAttendance()
  ↓
UILogService.showResults()
```

### Import-basierte Zeiterfassung

```
popup.js (handleParseImportText/handleFileSelect)
  ↓
TimeImportService.parseImportData()
  ↓
popup.js (handleStartImport)
  ↓
RecordingWorkflowService.recordImportedDays()
  ↓
TimesheetService.getTimesheet() (Multi-Month)
  ↓
TimeImportService.convertToPeriods()
  ↓
AttendanceService.recordMultipleDays()
  ↓
PersonioAPIClient.recordAttendance()
  ↓
UILogService.showResults()
```

## Best Practices

### 1. Service-Nutzung
- ✅ Alle Business-Logik in Services auslagern
- ✅ popup.js nur für UI-Interaktionen
- ✅ Services sind unabhängig testbar

### 2. Fehlerbehandlung
- ✅ Try-Catch in allen async Funktionen
- ✅ User-freundliche Fehlermeldungen
- ✅ Logging für Debugging

### 3. UI-Updates
- ✅ Defensive Programmierung (null-checks)
- ✅ Disabled-States während Operationen
- ✅ Loading-Indikatoren

### 4. Code-Organisation
- ✅ Klare Kommentare und Sektionen
- ✅ Aussagekräftige Funktionsnamen
- ✅ Single Responsibility Principle

## Wartung

### Neue Funktionen hinzufügen

1. **Business-Logik**: Neuen Service erstellen oder bestehenden erweitern
2. **UI**: Event-Handler in popup.js hinzufügen
3. **HTML**: UI-Elemente in popup.html definieren
4. **Styling**: CSS in popup.css

### Beispiel: Neue Feature "Automatische Zeiterfassung"

```javascript
// 1. Neuer Service: services/auto-record-service.js
class AutoRecordService {
  async enableAutoRecord() { ... }
}

// 2. In popup.js
async function handleEnableAutoRecord() {
  const autoRecordService = new AutoRecordService();
  await autoRecordService.enableAutoRecord();
}

// 3. Event Listener registrieren
document.getElementById('enableAutoRecord')
  .addEventListener('click', handleEnableAutoRecord);
```

## Testing

### Unit Tests (geplant)
- Services können unabhängig getestet werden
- Mocking von Dependencies möglich
- Test-Framework: Jest (empfohlen)

### Integration Tests (geplant)
- End-to-End Tests mit Puppeteer
- Test gegen Mock-API

## Changelog

### v0.2.1 - Code Modularisierung (01.12.2025)
- ✅ popup.js vollständig refactored (465 Zeilen)
- ✅ Alle duplizierten Funktionen entfernt
- ✅ Services werden konsequent verwendet
- ✅ Klare Code-Struktur mit Kommentaren
- ✅ Keine Linter-Fehler mehr

### v0.2.0 - Multi-Month Import
- Import-Feature für JSON-Daten
- Multi-Month Support

### v0.1.0 - Initial Release
- Profil-basierte Zeiterfassung

