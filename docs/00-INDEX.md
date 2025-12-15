# Dokumentations-Index - Personio Attendance Recorder

> **Version:** 0.3.0 | **Letzte Aktualisierung:** Dezember 2025

## 📚 Dokumentations-Übersicht

Diese Dokumentation ist hierarchisch strukturiert und deckt alle Aspekte des Personio Attendance Recorder Chrome Extensions ab.

---

## 🚀 Quick Start

Für den schnellen Einstieg:

1. **[Quick Start Guide](./01-QUICK-START.md)** - Installation und erste Schritte in 5 Minuten
2. **[User Guide](./02-USER-GUIDE.md)** - Vollständige Bedienungsanleitung

---

## 📖 Benutzer-Dokumentation

### Grundlagen
- **[01 - Quick Start Guide](./01-QUICK-START.md)** - Schnelleinstieg für neue Benutzer
- **[02 - User Guide](./02-USER-GUIDE.md)** - Detaillierte Bedienungsanleitung
- **[03 - Feature Overview](./03-FEATURE-OVERVIEW.md)** - Übersicht aller Features

### Anwendungsfälle
- **[04 - Profile Mode Guide](./04-PROFILE-MODE.md)** - Profil-basierte Zeiterfassung
- **[05 - Import Mode Guide](./05-IMPORT-MODE.md)** - JSON-Import von Arbeitszeiten
- **[06 - Advanced Usage](./06-ADVANCED-USAGE.md)** - Fortgeschrittene Funktionen

---

## 🛠️ Entwickler-Dokumentation

### Architektur & Design
- **[10 - Architecture Overview](./10-ARCHITECTURE.md)** - System-Architektur und Komponenten
- **[11 - Code Structure](./11-CODE-STRUCTURE.md)** - Dateistruktur und Organisation
- **[12 - Service Layer](./12-SERVICE-LAYER.md)** - Service-Architektur und APIs

### API & Integration
- **[20 - Personio API Reference](./20-PERSONIO-API.md)** - Personio API Endpoints und Daten
- **[21 - Authentication Flow](./21-AUTHENTICATION.md)** - Cookie-basierte Authentifizierung
- **[22 - Data Models](./22-DATA-MODELS.md)** - Datenstrukturen und Schemas

### Implementierung
- **[30 - Development Setup](./30-DEVELOPMENT-SETUP.md)** - Entwicklungsumgebung einrichten
- **[31 - Testing Guide](./31-TESTING.md)** - Testing-Strategien und Testfälle
- **[32 - Debugging](./32-DEBUGGING.md)** - Debugging-Techniken und Tools

---

## 🔧 Technische Referenz

### Services
- **[Service: Auth Manager](./services/auth-manager.md)** - Authentifizierungs-Service
- **[Service: API Client](./services/api-client.md)** - Personio API Client
- **[Service: Timesheet Service](./services/timesheet-service.md)** - Timesheet-Verwaltung
- **[Service: Attendance Service](./services/attendance-service.md)** - Zeiterfassungs-Logik
- **[Service: Time Import Service](./services/time-import-service.md)** - JSON-Import-Service
- **[Service: Profile Service](./services/profile-service.md)** - Profil-Verwaltung
- **[Service: UI Log Service](./services/ui-log-service.md)** - UI-Logging
- **[Service: Workflow Service](./services/workflow-service.md)** - Workflow-Orchestrierung

### Utilities
- **[Storage Manager](./utils/storage-manager.md)** - Chrome Storage API Wrapper
- **[Helpers](./utils/helpers.md)** - Hilfsfunktionen

---

## 📋 Spezifikationen

- **[Requirements](./specs/REQUIREMENTS.md)** - Funktionale Anforderungen
- **[Feature Specs](./specs/FEATURE-SPECS.md)** - Detaillierte Feature-Spezifikationen
- **[API Specification](./specs/API-SPECIFICATION.md)** - API-Spezifikation

---

## 🐛 Troubleshooting & FAQs

- **[Common Issues](./troubleshooting/COMMON-ISSUES.md)** - Häufige Probleme und Lösungen
- **[FAQ](./troubleshooting/FAQ.md)** - Häufig gestellte Fragen
- **[Error Codes](./troubleshooting/ERROR-CODES.md)** - Fehlercodes und deren Bedeutung

---

## 📝 Changelog & Migration

- **[Changelog](../CHANGELOG.md)** - Versionshistorie
- **[Migration Guides](./migration/)** - Migrations-Anleitungen zwischen Versionen
  - [v0.1.0 → v0.2.0](./migration/v0.1-to-v0.2.md)
  - [v0.2.0 → v0.3.0](./migration/v0.2-to-v0.3.md)

---

## 🎯 Best Practices

- **[Best Practices](./best-practices/BEST-PRACTICES.md)** - Empfohlene Vorgehensweisen
- **[Security](./best-practices/SECURITY.md)** - Sicherheitsrichtlinien
- **[Performance](./best-practices/PERFORMANCE.md)** - Performance-Optimierung

---

## 📦 Anhänge

- **[Glossar](./appendix/GLOSSARY.md)** - Begriffsdefinitionen
- **[Resources](./appendix/RESOURCES.md)** - Weiterführende Ressourcen
- **[Contributors](./appendix/CONTRIBUTORS.md)** - Mitwirkende

---

## 🔍 Dokumentations-Navigation

### Nach Zielgruppe

**👤 Endbenutzer:**
- Start: [Quick Start Guide](./01-QUICK-START.md)
- Detaillierte Anleitung: [User Guide](./02-USER-GUIDE.md)
- Problemlösung: [Common Issues](./troubleshooting/COMMON-ISSUES.md)

**👨‍💻 Entwickler:**
- Start: [Development Setup](./30-DEVELOPMENT-SETUP.md)
- Architektur: [Architecture Overview](./10-ARCHITECTURE.md)
- Services: [Service Layer](./12-SERVICE-LAYER.md)

**🏢 Administratoren:**
- Installation: [Installation Guide](../INSTALL.md)
- Konfiguration: [Advanced Usage](./06-ADVANCED-USAGE.md)
- Sicherheit: [Security](./best-practices/SECURITY.md)

### Nach Thema

**🔐 Authentifizierung:**
- [Authentication Flow](./21-AUTHENTICATION.md)
- [Auth Manager Service](./services/auth-manager.md)

**📊 Zeiterfassung:**
- [Attendance Service](./services/attendance-service.md)
- [Timesheet Service](./services/timesheet-service.md)
- [Profile Mode](./04-PROFILE-MODE.md)

**📥 Import:**
- [Import Mode Guide](./05-IMPORT-MODE.md)
- [Time Import Service](./services/time-import-service.md)

**🔧 API:**
- [Personio API Reference](./20-PERSONIO-API.md)
- [API Client Service](./services/api-client.md)

---

## 📊 Dokumentations-Status

| Dokument | Status | Letzte Aktualisierung |
|----------|--------|----------------------|
| Quick Start | ✅ Aktuell | 2025-12-15 |
| User Guide | ✅ Aktuell | 2025-12-15 |
| Architecture | ✅ Aktuell | 2025-12-15 |
| API Reference | ✅ Aktuell | 2025-12-15 |
| Testing Guide | ✅ Aktuell | 2025-12-15 |

---

## 📞 Support & Kontakt

- **Issues:** GitHub Issues
- **Dokumentation:** `/docs` Verzeichnis
- **Version:** Siehe [CHANGELOG.md](../CHANGELOG.md)

---

**Entwickelt für AOE GmbH** | Personio Attendance Recorder v0.3.0

