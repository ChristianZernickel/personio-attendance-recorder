# Personio Attendance Recorder - Chrome Plugin

## Übersicht

Das Personio Attendance Recorder Chrome Plugin ermöglicht die automatisierte Zeiterfassung in Personio basierend auf einem vordefinierten Arbeitszeitprofil.

## Dokumentationsstruktur

### Core Dokumentation
- **[Knowledge Base](./knowledge-base.md)** - Technische Dokumentation, API-Details und Implementierungswissen
- **[Anforderungskatalog](./anforderungskatalog.md)** - Detaillierte funktionale und nicht-funktionale Anforderungen
- **[API-Referenz](./api-reference.md)** - Personio API Endpunkte und Datenstrukturen
- **[Architektur](./architecture.md)** - Systemarchitektur und Komponenten

## Quick Start
- **[✅ Test Checklist](./TEST_CHECKLIST.md)** - Komplette Test-Checkliste für alle Features
- **[🚀 Time Import Quick Start](./TIME_IMPORT_QUICKSTART.md)** - Schnelleinstieg für Time Import Feature

### Features
- **[📋 Feature Summary](./FEATURE_SUMMARY.md)** - Übersicht aller implementierten Features (Stand: 2025-11-14)
- **[📅 Per-Day Schedule](./PER_DAY_SCHEDULE_FEATURE.md)** - Flexible Arbeitszeiten pro Wochentag
- **[📥 Time Import](./TIME_IMPORT_FEATURE.md)** - Import von Arbeitszeiten aus JSON-Dateien
- **[🔧 Time Import Implementation](./TIME_IMPORT_IMPLEMENTATION.md)** - Technische Implementierungsdetails

### Implementation Notes
6. Automatische Zeiterfassung implementieren

## Technologie-Stack

- **Chrome Extension API** (Manifest V3)
- **Personio API** (REST)
- **JavaScript/TypeScript**
- **HTML/CSS** für Popup UI

## Sicherheitshinweise

- Cookies und Tokens werden sensibel behandelt
- Keine Speicherung von Credentials im Klartext
- Verwendung von Chrome Storage API für sensible Daten
- Validierung aller API-Responses

## Version

**v0.1.0** - Initial Documentation

