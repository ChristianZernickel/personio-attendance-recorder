# Personio Attendance Recorder - Chrome Plugin

## Übersicht

Das Personio Attendance Recorder Chrome Plugin ermöglicht die automatisierte Zeiterfassung in Personio mit zwei Modi:
1. **Profil-basiert**: Automatische Eintragung basierend auf Arbeitszeitprofil
2. **JSON-Import**: Import von Arbeitszeiten aus JSON-Dateien

**Aktuelle Version:** v0.2.0 (November 2025)

## Dokumentationsstruktur

### 🚀 Quick Start
- **[✅ Test Checklist](./TEST_CHECKLIST.md)** - Komplette Test-Checkliste für alle Features
- **[🚀 Time Import Quick Start](./TIME_IMPORT_QUICKSTART.md)** - Schnelleinstieg für JSON-Import

### 📋 Features (v0.2.0)
- **[📋 Feature Summary](./FEATURE_SUMMARY.md)** - Übersicht aller implementierten Features
- **[📅 Per-Day Schedule](./PER_DAY_SCHEDULE_FEATURE.md)** - Flexible Arbeitszeiten pro Wochentag
- **[📥 Time Import Feature](./TIME_IMPORT_FEATURE.md)** - Import von Arbeitszeiten aus JSON-Dateien
- **[🔧 Time Import Implementation](./TIME_IMPORT_IMPLEMENTATION.md)** - Technische Implementierungsdetails

### 📚 Core Dokumentation
- **[Knowledge Base](./knowledge-base.md)** - Technische Dokumentation, API-Details und Implementierungswissen
- **[Anforderungskatalog](./anforderungskatalog.md)** - Detaillierte funktionale und nicht-funktionale Anforderungen
- **[API-Referenz](./api-reference.md)** - Personio API Endpunkte und Datenstrukturen
- **[Architektur](./architecture.md)** - Systemarchitektur und Komponenten

### 🔧 Implementation & Troubleshooting
- **[Implementation Notes](./IMPLEMENTATION_NOTES.md)** - Allgemeine Implementierungsnotizen
- **[Content Script Solution](./CONTENT_SCRIPT_SOLUTION.md)** - Content Script für Cookie-Access
- **[Session Refresh Discovery](./SESSION_REFRESH_DISCOVERY.md)** - Session-Refresh Lösung
- **[Header Name Fix](./HEADER_NAME_FIX.md)** - Header-Name Problembehebung
- **[3-Step Process](./3_STEP_PROCESS.md)** - 3-Schritte-Prozess

## 🎯 Was ist neu in v0.2.0?

### Time Import Feature
- **JSON-Datei Import**: Importiere Arbeitszeiten aus JSON-Dateien
- **Tab-Navigation**: Wechsle zwischen Profil-Modus und Import-Modus
- **Intelligente Pausen**: Automatische Erkennung von Pausen aus Zeitlücken
- **UTC Konvertierung**: Automatische Umwandlung von UTC in lokale Zeit
- **Multi-Tag Support**: Mehrere Tage in einer Datei

### Verbesserungen
- Neue Tab-basierte UI
- Separate Progress/Result Sections für beide Modi
- Erweiterte Validierung & Fehlerbehandlung
- Intelligente Perioden-Generierung

## Technologie-Stack

- **Chrome Extension API** (Manifest V3)
- **Personio API** (REST)
- **JavaScript ES6+**
- **HTML5/CSS3** für Popup UI
- **Chrome Storage API** für Datenpersistenz
- **Chrome Cookies API** für Authentifizierung

## Sicherheitshinweise

- Cookies und Tokens werden sensibel behandelt
- Keine Speicherung von Credentials im Klartext
- Verwendung von Chrome Storage API für sensible Daten
- Validierung aller API-Responses
- Content Script läuft in Page-Context für Cookie-Zugriff

## Version History

**v0.2.0** (2025-11-14) - Time Import Feature
- ✨ JSON-Import hinzugefügt
- ✨ Tab-Navigation implementiert
- ✨ Automatische Pausen-Erkennung
- ✨ UTC → Zeitzone Konvertierung
- 🎨 UI-Verbesserungen

**v0.1.0** (2025-11-10) - Initial Release
- ✅ Profil-basierte Zeiterfassung
- ✅ Pro-Tag Konfiguration
- ✅ Cookie-basierte Auth
- ✅ Retry-Logik

