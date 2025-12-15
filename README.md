# Personio Attendance Recorder - Chrome Extension

> **Automatische Zeiterfassung für Personio** | Version 0.3.0

Automatische Zeiterfassung für Personio mit zwei Modi: **Profil-basiert** oder **Import aus JSON-Datei**.

## 🚀 Quick Start

**Neu hier?** → [Quick Start Guide](./docs/01-QUICK-START.md) - In 5 Minuten einsatzbereit!

## 📦 Installation (Entwicklermodus)

1. Chrome öffnen und zu `chrome://extensions/` navigieren
2. "Entwicklermodus" oben rechts aktivieren
3. "Entpackte Erweiterung laden" klicken
4. Diesen Ordner (`personio-attendance-recorder`) auswählen

## 📁 Projektstruktur

```
personio-attendance-recorder/
├── manifest.json              # Extension Configuration
├── background/
│   └── service-worker.js     # Background Service Worker
├── content/
│   └── content-script.js     # Content Script für Personio Seiten
├── popup/
│   ├── popup.html            # Popup UI (mit Tab-Navigation)
│   ├── popup.css             # Popup Styling
│   └── popup.js              # Popup Logic
├── services/
│   ├── auth-manager.js       # Authentifizierungs-Service
│   ├── api-client.js         # Personio API Client
│   ├── timesheet-service.js  # Timesheet Service
│   ├── attendance-service.js # Attendance Service
│   └── time-import-service.js # Time Import Service (NEU v0.2.0)
├── storage/
│   └── storage-manager.js    # Storage Management
├── utils/
│   └── helpers.js            # Hilfsfunktionen
├── icons/
│   └── icon*.svg             # Extension Icons
└── docs/                     # Dokumentation
```

## 🎯 Verwendung

### 📅 Modus 1: Profil-basierte Zeiterfassung

1. Auf einer Personio-Seite einloggen (z.B. `https://aoe-gmbh.app.personio.com`)
2. Extension-Icon klicken
3. **Profil-Tab** auswählen
4. Arbeitszeitprofil konfigurieren:
   - Personio Instanz (z.B. `aoe-gmbh.app.personio.com`)
   - Mitarbeiter-ID
   - **Pro Wochentag individuell:**
     - Arbeitstag aktivieren (Mo-So)
     - Arbeitszeiten (Start/Ende)
     - Pausenzeiten (Start/Ende)
5. "Profil speichern" klicken
6. "Zeiterfassung starten" klicken
7. Warten bis Prozess abgeschlossen ist

### 📥 Modus 2: Import aus JSON-Datei (NEU v0.2.0)

1. Auf einer Personio-Seite einloggen
2. Extension-Icon klicken
3. **Import-Tab** auswählen
4. JSON-Datei mit Arbeitszeiten hochladen
5. Vorschau prüfen
6. "Zeiten importieren" klicken

**JSON-Format:**
```json
[
  {
    "start": "20251114T080000Z",
    "end": "20251114T120000Z"
  },
  {
    "start": "20251114T130000Z",
    "end": "20251114T170000Z"
  }
]
```

**Features:**
- ✅ Automatische UTC → Lokale Zeit Konvertierung
- ✅ Intelligente Pausen-Erkennung (Lücken >= 1 Min)
- ✅ Mehrere Tage in einer Datei
- ✅ Bereits eingetragene Tage werden übersprungen

👉 **[Quick Start Guide](./docs/TIME_IMPORT_QUICKSTART.md)**

## ⚙️ Funktionen

### Core Features
- ✅ Cookie-basierte Authentifizierung
- ✅ Automatische Session-Refresh
- ✅ Automatische Timesheet-Abfrage
- ✅ Intelligente Filterung (nur trackbare, nicht eingetragene Arbeitstage)
- ✅ Fortschrittsanzeige mit Live-Log
- ✅ Fehlerbehandlung mit 3x Retry-Logik
- ✅ Rate Limiting (1 Request/Sekunde)
- ✅ Detaillierte Ergebnisübersicht

### 📅 Profil-basiert (v0.1.0)
- ✅ Arbeitszeitprofil-Verwaltung
- ✅ **Pro-Tag-Konfiguration** (individuelle Zeiten für jeden Wochentag)
- ✅ Kompakte Profil-Übersicht
- ✅ Ausklappbarer Editor

### 📥 Time Import (v0.2.0)
- ✅ JSON-Datei Import
- ✅ ISO-Timestamp-Parsing (kompakt & standard)
- ✅ UTC → Zeitzone Konvertierung
- ✅ Automatische Pausen-Erkennung
  - Lücken < 1 Min → zusammengefasst
  - Lücken >= 1 Min → als Pause eingetragen
- ✅ Multi-Tag Support
- ✅ Validierung & Fehlerbehandlung

## 🔒 Sicherheit

- Cookies werden nur für Personio-Domains verwendet
- Keine Daten werden extern gespeichert
- Lokale Speicherung in Chrome Storage API

## 📚 Dokumentation

### 🎯 Für Benutzer
- **[📖 Quick Start](./docs/01-QUICK-START.md)** - In 5 Minuten einsatzbereit
- **[📘 User Guide](./docs/02-USER-GUIDE.md)** - Vollständige Bedienungsanleitung
- **[📋 Feature Overview](./docs/03-FEATURE-OVERVIEW.md)** - Alle Features im Überblick
- **[🔍 Troubleshooting](./docs/troubleshooting/COMMON-ISSUES.md)** - Problemlösungen

### 🛠️ Für Entwickler
- **[🏗️ Architecture](./docs/10-ARCHITECTURE.md)** - System-Architektur
- **[📁 Code Structure](./docs/11-CODE-STRUCTURE.md)** - Dateistruktur
- **[🔧 Service Layer](./docs/12-SERVICE-LAYER.md)** - Service APIs
- **[🧪 Testing](./docs/31-TESTING.md)** - Test-Strategien

### 📚 Vollständiger Index
→ **[Dokumentations-Index](./docs/00-INDEX.md)** - Alle Dokumentationen auf einen Blick

## 🐛 Debugging

1. `chrome://extensions/` öffnen
2. "Service Worker" bei der Extension klicken für Background-Logs
3. Popup mit Rechtsklick → "Untersuchen" für Popup-Logs
4. Personio-Tab: DevTools Console für Content-Script-Logs

**Console Logs:**
```javascript
// Profile Mode
✅ Auth-Daten extrahiert
📅 Fetching timesheet...
📝 Starting to record X days...
📅 Generated Y periods from profile

// Import Mode
✅ Datei geladen: X Tag(e) gefunden
📥 Using Y imported periods
✅ Validation successful
✅ Attendance saved successfully!
```

## 📝 Version & Changelog

### **v0.3.0** - Documentation & Refactoring (2025-12-15)
**Improvements:**
- 📚 Komplett überarbeitete Dokumentation
- 🗂️ Neue hierarchische Dokumentationsstruktur
- 📖 Quick Start Guide + User Guide
- 🏗️ Detaillierte Architektur-Dokumentation
- 🧹 Code-Refactoring und Bereinigung

**Documentation:**
- [00-INDEX.md](./docs/00-INDEX.md) - Dokumentations-Index
- [01-QUICK-START.md](./docs/01-QUICK-START.md) - Quick Start Guide
- [02-USER-GUIDE.md](./docs/02-USER-GUIDE.md) - User Guide
- [10-ARCHITECTURE.md](./docs/10-ARCHITECTURE.md) - Architecture Overview

### **v0.2.1** - Multi-Month Import (2025-12-01)
**New Features:**
- ✨ Multi-Month Import Support
- 🔧 Code Modularisierung (574 → 465 LOC)

**Improvements:**
- Automatisches Laden mehrerer Monate
- Kombiniertes Timesheet für nahtlose Verarbeitung
- Unterstützung für Jahreswechsel

**Documentation:**
- [MULTI_MONTH_IMPORT.md](./docs/MULTI_MONTH_IMPORT.md)
- [CODE_STRUCTURE.md](./docs/CODE_STRUCTURE.md)

### **v0.2.0** - Time Import Feature (2025-11-14)
**New Features:**
- ✨ JSON-Datei Import für Arbeitszeiten
- ✨ Tab-Navigation (Profil / Import)
- ✨ Automatische Pausen-Erkennung

**Improvements:**
- Per-Day Schedule (individuelle Zeiten pro Wochentag)
- Text-Eingabe Methode
- Intelligente Perioden-Generierung

**Documentation:**
- [TIME_IMPORT_FEATURE.md](./docs/TIME_IMPORT_FEATURE.md)
- [PER_DAY_SCHEDULE_FEATURE.md](./docs/PER_DAY_SCHEDULE_FEATURE.md)

### **v0.1.0** - Initial Release (2025-11-10)
- ✅ Profil-basierte Zeiterfassung
- ✅ Cookie-basierte Authentifizierung
- ✅ Automatische Timesheet-Integration

**Siehe:** [CHANGELOG.md](./CHANGELOG.md) für vollständige Versionshistorie

## ⚠️ Hinweise

- Extension funktioniert nur auf Personio-Domains
- Benutzer muss bei Personio eingeloggt sein
- Zeiterfassung erfolgt für den aktuellen Monat
- Bereits eingetragene Tage werden automatisch übersprungen
- **Import-Modus:** JSON-Dateien müssen gültiges ISO-Format verwenden
- **Import-Modus:** Sekunden in Zeitstempeln werden ignoriert (auf :00 gerundet)

## 🧪 Testing

Test-Dateien im Root-Verzeichnis:
- `test-import-2025-11-14.json` - Einzelner Tag mit 11 Einträgen
- `test-import-week.json` - Ganze Woche (Mo-Fr) mit 27 Einträgen
- `test-import-edge-cases.json` - Edge Cases für Lücken-Erkennung

Siehe [TEST_IMPORT_FILES.md](./TEST_IMPORT_FILES.md) für Details.

## 🛠️ Entwicklung

Für weitere Entwicklung siehe Dokumentation unter `/docs`:
- Code-Struktur folgt Service-Pattern
- Alle Services sind modular und testbar
- Content Script für Cookie-Access in Page-Context
- Chrome Storage API für persistente Daten

## 📄 Lizenz

Private Use Only

---

**Entwickelt für AOE GmbH** | Version 0.2.0 | November 2025

