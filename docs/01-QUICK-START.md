# Quick Start Guide - Personio Attendance Recorder

> **Ziel:** In 5 Minuten einsatzbereit

## 🎯 Was macht diese Extension?

Der **Personio Attendance Recorder** automatisiert die Zeiterfassung in Personio mit zwei Modi:

1. **Profil-Modus** → Wiederholende Arbeitszeiten automatisch eintragen
2. **Import-Modus** → Zeiterfassung aus JSON-Dateien importieren

---

## ⚡ Installation (2 Minuten)

### Voraussetzungen
- Google Chrome Browser
- Zugang zu Personio (z.B. `aoe-gmbh.app.personio.com`)

### Installation

1. **Extension laden:**
   ```
   Chrome → chrome://extensions/
   → "Entwicklermodus" aktivieren (oben rechts)
   → "Entpackte Erweiterung laden"
   → Ordner auswählen: personio-attendance-recorder/
   ```

2. **Fertig!** Das Extension-Icon erscheint in der Chrome-Toolbar

---

## 🚀 Erste Schritte (3 Minuten)

### Option A: Profil-Modus (Empfohlen für regelmäßige Arbeitszeiten)

**Schritt 1:** Bei Personio einloggen
```
https://ihre-firma.app.personio.com
```

**Schritt 2:** Extension öffnen (Icon klicken)

**Schritt 3:** Profil konfigurieren

1. Tab **"Profil"** auswählen
2. **"Arbeitszeitprofil bearbeiten"** klicken
3. Daten eingeben:
   ```
   Personio Instanz: aoe-gmbh.app.personio.com
   Mitarbeiter-ID: [Ihre ID]
   ```

4. **Pro Wochentag** konfigurieren (z.B. Montag):
   ```
   ☑ Arbeitstag
   Arbeitszeit: 08:00 - 17:00
   Pause: 12:00 - 13:00
   ```

5. **"Profil speichern"** klicken

**Schritt 4:** Zeiten eintragen
- **"Zeiterfassung starten"** klicken
- Warten (ca. 10-30 Sekunden)
- ✅ Fertig!

---

### Option B: Import-Modus (Für flexible Arbeitszeiten)

**Schritt 1:** JSON-Datei vorbereiten

```json
[
  {
    "start": "20251204T080000Z",
    "end": "20251204T120000Z"
  },
  {
    "start": "20251204T130000Z",
    "end": "20251204T170000Z"
  }
]
```

**Schritt 2:** Extension öffnen

1. Tab **"Import"** auswählen
2. **Datei hochladen** ODER **Text einfügen**
3. Vorschau prüfen
4. **"Zeiten importieren"** klicken

---

## ✅ Erfolg prüfen

Nach der Eintragung:

1. **In Personio:** Attendance-Seite öffnen
2. **Prüfen:** Einträge für die konfigurierten Tage vorhanden?
3. **✅ Ja:** Alles funktioniert!
4. **❌ Nein:** Siehe [Troubleshooting](#troubleshooting)

---

## 🎯 Typische Anwendungsfälle

### Fall 1: Regelmäßige Arbeitszeiten (Mo-Fr, 8-17 Uhr)
→ **Profil-Modus** verwenden
- Einmal konfigurieren
- Jeden Monat: "Zeiterfassung starten" klicken
- Fertig!

### Fall 2: Flexible Arbeitszeiten
→ **Import-Modus** verwenden
- Zeiterfassung aus anderem Tool exportieren
- JSON-Datei hochladen
- Automatisch importieren

### Fall 3: Mixed (meist regelmäßig, manchmal flexibel)
→ **Profil + Import kombinieren**
- Profil für normale Tage
- Import für Ausnahmen (Homeoffice, Gleitzeit, etc.)

---

## 📊 Was passiert beim Eintragen?

```
1. 🔐 Authentifizierung → Cookies von Personio lesen
2. 📅 Timesheet laden → Welche Tage sind trackbar?
3. ✅ Filtern → Nur noch nicht eingetragene Tage
4. 📝 Eintragen → Für jeden Tag:
   - Validation Request (prüfen)
   - Save Request (speichern)
5. ✅ Fertig → Zusammenfassung anzeigen
```

**Dauer:** ca. 2-3 Sekunden pro Tag (Rate Limiting)

---

## 🔍 Troubleshooting

### Problem: "Nicht authentifiziert"
**Lösung:**
1. Bei Personio einloggen
2. Extension neu öffnen
3. Refresh-Button klicken

### Problem: "403 Forbidden" beim Eintragen
**Lösung:**
1. Personio-Tab aktualisieren (F5)
2. Extension neu öffnen
3. Erneut versuchen

### Problem: "Tage nicht gefunden"
**Ursache:** Tage liegen außerhalb des geladenen Monats

**Lösung:**
- Import-Modus lädt automatisch mehrere Monate
- Bei Bedarf: Manuell in Personio nachtragen

### Problem: "Bereits eingetragen"
**Normal!** Extension überspringt automatisch bereits vorhandene Einträge.

---

## 📚 Nächste Schritte

Jetzt wo Sie die Basics kennen:

1. **[User Guide](./02-USER-GUIDE.md)** → Detaillierte Bedienungsanleitung
2. **[Feature Overview](./03-FEATURE-OVERVIEW.md)** → Alle Features im Detail
3. **[Profile Mode](./04-PROFILE-MODE.md)** → Profil-Modus Expertenwissen
4. **[Import Mode](./05-IMPORT-MODE.md)** → Import-Modus Best Practices

---

## 💡 Tipps & Tricks

### Tipp 1: Profil pro Wochentag
Sie arbeiten nicht immer gleich? Konfigurieren Sie **jeden Wochentag separat**:
- Mo-Do: 9 Stunden
- Fr: 4 Stunden

### Tipp 2: Multi-Month Import
JSON-Dateien können **mehrere Monate** enthalten - die Extension lädt automatisch alle benötigten Monate!

### Tipp 3: Batch-Processing
Extension kann **mehrere Tage gleichzeitig** verarbeiten. Einfach warten, nicht unterbrechen!

### Tipp 4: Bereits eingetragen? Kein Problem!
Die Extension überspringt **automatisch** bereits eingetragene Tage. Sie können bedenkenlos mehrfach starten.

---

## ⏱️ Performance

- **Profil-Modus:** ~2-3 Sekunden pro Tag
- **Import-Modus:** ~2-3 Sekunden pro Tag
- **20 Arbeitstage:** ~1 Minute Gesamtdauer

**Wichtig:** Nicht unterbrechen während der Verarbeitung!

---

## 🔒 Sicherheit

✅ **Alle Daten bleiben lokal**
- Cookies nur für Personio-Domains
- Keine externe Datenübertragung
- Chrome Storage API für Profil

✅ **Keine Speicherung sensibler Daten**
- Cookies werden nur temporär gelesen
- Kein Passwort-Zugriff
- Nur API-Kommunikation mit Personio

---

## 📞 Support

**Problem nicht gelöst?**
- [Common Issues](./troubleshooting/COMMON-ISSUES.md) → Häufige Probleme
- [FAQ](./troubleshooting/FAQ.md) → Oft gestellte Fragen
- [Debugging](./32-DEBUGGING.md) → Technisches Debugging

**Feature-Request?**
- GitHub Issues erstellen
- [Feature Specs](./specs/FEATURE-SPECS.md) → Geplante Features

---

**Ready?** → [User Guide](./02-USER-GUIDE.md) für detaillierte Anleitung

---

**Personio Attendance Recorder** | Quick Start | v0.3.0

