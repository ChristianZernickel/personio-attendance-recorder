# Changelog - Personio Attendance Recorder

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

## [0.2.1] - 2025-12-01

### Added
- 🌟 **Multi-Month Import Support**: Das Plugin lädt automatisch mehrere Monate, wenn der JSON-Import Daten aus verschiedenen Monaten enthält
  - Intelligente Erkennung ob Daten aus dem vorherigen Monat vorhanden sind
  - Automatisches Laden von vorherigem + aktuellem Monat
  - Kombiniertes Timesheet für nahtlose Verarbeitung
  - Unterstützung für Jahreswechsel (z.B. Dezember 2025 + Januar 2026)

### Changed
- 🔧 **Code Modularisierung**: Komplettes Refactoring der popup.js
  - Von 574 auf 465 Zeilen reduziert (109 Zeilen redundanter Code entfernt)
  - Alle duplizierten Funktionen entfernt
  - Services werden konsequent verwendet
  - Klare Code-Struktur mit kommentierten Sektionen
  - Bessere Trennung von UI und Business-Logik
- `handleStartImport()` in `popup/popup.js` erweitert mit Multi-Month-Logik
- Benutzer-Feedback verbessert: Zeigt an wenn Daten aus mehreren Monaten geladen werden

### Fixed
- 🐛 **Import am Monatsanfang**: Tage aus dem vorherigen Monat können jetzt importiert werden
  - Beispiel: Am 1. Dezember können nun Tage vom 28.-30. November importiert werden
  - Zuvor wurden diese Tage als "nicht im Timesheet gefunden" abgelehnt
- 🐛 **Duplicate Functions**: Alle duplizierten Funktionen entfernt
- 🐛 **Linter Errors**: Alle JavaScript Linter-Fehler behoben

### Documentation
- Neue Dokumentation: `MULTI_MONTH_IMPORT.md` - Detaillierte Beschreibung des Features
- Neue Dokumentation: `CODE_STRUCTURE.md` - Vollständige Architektur-Dokumentation
- Neue Dokumentation: `REFACTORING_SUMMARY.md` - Zusammenfassung der Modularisierung
- `README.md` aktualisiert mit Link zur neuen Dokumentation
- Version in `manifest.json` auf 0.2.1 erhöht

---

## [0.2.0] - 2025-11-14

### Added
- 🎉 **JSON Time Import Feature**: Import von Arbeitszeiten aus JSON-Dateien
  - Unterstützung für kompaktes ISO-Format (z.B. `20251114T080000Z`)
  - Automatische Pause-Erkennung zwischen Einträgen
  - Intelligente Mikro-Pausen-Zusammenführung (<1 Minute)
  - Datei-Upload und Text-Eingabe Methoden
- **Per-Day Schedule**: Flexible Arbeitszeiten pro Wochentag
  - Individuelle Zeiten für jeden Wochentag (Mo-So)
  - Beispiel: 4 Tage á 9 Stunden, 1 Tag á 4 Stunden
- **Text Import Method**: JSON direkt in Textfeld einfügen statt Datei hochladen

### Changed
- UI überarbeitet mit Tabs: "Profil" und "Import"
- Profil-Editor als ausklappbare Sektion implementiert
- Storage-Struktur erweitert um `schedule` Objekt pro Wochentag

### Documentation
- `TIME_IMPORT_FEATURE.md` - Feature-Spezifikation
- `TIME_IMPORT_IMPLEMENTATION.md` - Implementierungsdetails
- `TIME_IMPORT_QUICKSTART.md` - Schnelleinstieg
- `PER_DAY_SCHEDULE_FEATURE.md` - Per-Day Schedule Dokumentation
- `TEXT_IMPORT_FEATURE.md` - Text Import Methode

---

## [0.1.0] - 2025-11-04

### Added
- ✨ **Initiales Release**: Basis-Funktionalität des Plugins
- **Profil-basierte Zeiterfassung**: 
  - Konfiguration von Arbeitstagen (Mo-Fr)
  - Feste Arbeitszeiten (Start, Ende, Pausenzeiten)
  - Automatische Eintragung für konfigurierte Tage
- **Authentifizierung**:
  - Cookie-basierte Auth mit Personio
  - Extraktion von XSRF-Token und Session-Cookies
  - Session-Refresh über `/api/v1/projects` Endpoint
- **Content Script Solution**: 
  - Umgehung von CORS-Problemen
  - Direct Cookie Access im Page Context
- **Retry-Mechanismus**: 
  - Exponential Backoff (1s, 2s, 4s)
  - Automatischer Session-Refresh bei Fehlern
- **UI/UX**:
  - Popup mit Profil-Konfiguration
  - Progress-Tracking während der Eintragung
  - Detaillierte Ergebnis-Anzeige

### Technical
- Service-Architecture:
  - `AuthManager` - Cookie-Management
  - `PersonioAPIClient` - API-Kommunikation
  - `TimesheetService` - Timesheet-Verwaltung
  - `AttendanceService` - Eintragungslogik
  - `StorageManager` - Chrome Storage API
- Content Script für Cookie-Access
- Background Service Worker für Extension Lifecycle

### Documentation
- `knowledge-base.md` - Technisches Wissen und API-Details
- `anforderungskatalog.md` - Funktionale Anforderungen
- `api-reference.md` - Personio API Dokumentation
- `architecture.md` - System-Architektur
- `CONTENT_SCRIPT_SOLUTION.md` - Cookie Access Lösung
- `SESSION_REFRESH_DISCOVERY.md` - Session Refresh Erkenntnisse

---

## Version Format

Format: `[MAJOR.MINOR.PATCH]` nach [Semantic Versioning](https://semver.org/)

- **MAJOR**: Breaking Changes, Inkompatible API-Änderungen
- **MINOR**: Neue Features, abwärtskompatibel
- **PATCH**: Bug Fixes, abwärtskompatibel

### Kategorien

- **Added**: Neue Features
- **Changed**: Änderungen an bestehenden Features
- **Deprecated**: Bald zu entfernende Features
- **Removed**: Entfernte Features
- **Fixed**: Bug Fixes
- **Security**: Sicherheits-Updates
- **Documentation**: Dokumentations-Änderungen
- **Technical**: Technische Verbesserungen ohne User Impact

