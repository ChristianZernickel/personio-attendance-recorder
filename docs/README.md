# Personio Attendance Recorder - Chrome Plugin

## Übersicht

Das Personio Attendance Recorder Chrome Plugin ermöglicht die automatisierte Zeiterfassung in Personio basierend auf einem vordefinierten Arbeitszeitprofil.

## Dokumentationsstruktur

- **[⚠️ Implementierungshinweise](./IMPLEMENTATION_NOTES.md)** - Wichtige Hinweise zur Authentifizierung (Vor Implementierung lesen!)
- **[Knowledge Base](./knowledge-base.md)** - Technische Dokumentation, API-Details und Implementierungswissen
- **[Anforderungskatalog](./anforderungskatalog.md)** - Detaillierte funktionale und nicht-funktionale Anforderungen
- **[API-Referenz](./api-reference.md)** - Personio API Endpunkte und Datenstrukturen
- **[Architektur](./architecture.md)** - Systemarchitektur und Komponenten

## Quick Start

1. Dokumentation lesen (insbesondere Anforderungskatalog)
2. Chrome Extension Manifest V3 Setup
3. Authentifizierung über Cookie-Extraktion implementieren
4. Arbeitszeitprofil-Management entwickeln
5. Timesheet-Integration umsetzen
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

