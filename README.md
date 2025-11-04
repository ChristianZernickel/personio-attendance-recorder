# Personio Attendance Recorder - Chrome Extension

Automatische Zeiterfassung für Personio.

## 🚀 Installation (Entwicklermodus)

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
│   ├── popup.html            # Popup UI
│   ├── popup.css             # Popup Styling
│   └── popup.js              # Popup Logic
├── services/
│   ├── auth-manager.js       # Authentifizierungs-Service
│   ├── api-client.js         # Personio API Client
│   ├── timesheet-service.js  # Timesheet Service
│   └── attendance-service.js # Attendance Service
├── storage/
│   └── storage-manager.js    # Storage Management
├── utils/
│   └── helpers.js            # Hilfsfunktionen
├── icons/
│   └── icon*.svg             # Extension Icons
└── docs/                     # Dokumentation
```

## 🎯 Verwendung

1. Auf einer Personio-Seite einloggen (z.B. `https://aoe-gmbh.app.personio.com`)
2. Extension-Icon klicken
3. Arbeitszeitprofil konfigurieren:
   - Personio Instanz (z.B. `aoe-gmbh.app.personio.com`)
   - Mitarbeiter-ID
   - Arbeitstage (Mo-So)
   - Arbeitszeiten (Start/Ende)
   - Pausenzeiten (Start/Ende)
4. "Profil speichern" klicken
5. "Zeiterfassung starten" klicken
6. Warten bis Prozess abgeschlossen ist

## ⚙️ Funktionen

- ✅ Cookie-basierte Authentifizierung
- ✅ Arbeitszeitprofil-Verwaltung
- ✅ Automatische Timesheet-Abfrage
- ✅ Automatische Zeiterfassung für trackbare Tage
- ✅ Fortschrittsanzeige
- ✅ Fehlerbehandlung mit Retry-Logik
- ✅ Rate Limiting (1 Request/Sekunde)
- ✅ Detaillierte Ergebnisübersicht

## 🔒 Sicherheit

- Cookies werden nur für Personio-Domains verwendet
- Keine Daten werden extern gespeichert
- Lokale Speicherung in Chrome Storage API

## 📚 Dokumentation

Siehe `/docs` Ordner für detaillierte Dokumentation:
- [Knowledge Base](./docs/knowledge-base.md)
- [API-Referenz](./docs/api-reference.md)
- [Anforderungskatalog](./docs/anforderungskatalog.md)
- [Architektur](./docs/architecture.md)
- [Implementierungshinweise](./docs/IMPLEMENTATION_NOTES.md)

## 🐛 Debugging

1. `chrome://extensions/` öffnen
2. "Service Worker" bei der Extension klicken für Background-Logs
3. Popup mit Rechtsklick → "Untersuchen" für Popup-Logs

## 📝 Version

**v0.1.0** - Initial Release

## ⚠️ Hinweise

- Extension funktioniert nur auf Personio-Domains
- Benutzer muss bei Personio eingeloggt sein
- Zeiterfassung erfolgt für den aktuellen Monat
- Bereits eingetragene Tage werden übersprungen

## 🛠️ Entwicklung

Für weitere Entwicklung siehe Dokumentation unter `/docs`.

## 📄 Lizenz

Private Use Only

