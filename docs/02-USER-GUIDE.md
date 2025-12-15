# User Guide - Personio Attendance Recorder

> **Vollständige Bedienungsanleitung** | Version 0.3.0

## 📋 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Modi im Detail](#modi-im-detail)
3. [Profil-Modus](#profil-modus)
4. [Import-Modus](#import-modus)
5. [Best Practices](#best-practices)
6. [Häufige Fragen](#häufige-fragen)

---

## 🎯 Übersicht

Der Personio Attendance Recorder bietet **zwei Arbeitsmodi** für verschiedene Anwendungsfälle:

### 📅 Profil-Modus
Für **regelmäßige, wiederkehrende** Arbeitszeiten:
- Einmal Profil konfigurieren
- Jeden Monat: Button klicken → Fertig
- Ideal für feste Arbeitszeiten (z.B. Mo-Fr 9-17 Uhr)

### 📥 Import-Modus
Für **flexible, variable** Arbeitszeiten:
- Zeiten aus JSON-Datei importieren
- Ideal für: Gleitzeit, Homeoffice, Time-Tracking-Tools
- Unterstützt mehrere Tage gleichzeitig

---

## 📅 Profil-Modus

### Wann verwenden?

✅ **Gut geeignet für:**
- Feste Arbeitszeiten (z.B. 8-17 Uhr)
- Regelmäßige Wochenstruktur
- Konstante Pausenzeiten
- Unterschiedliche Zeiten pro Wochentag möglich

❌ **Nicht geeignet für:**
- Täglich wechselnde Zeiten
- Gleitzeit ohne feste Struktur
- Projektbasierte Zeiterfassung

### Profil einrichten

#### Schritt 1: Grunddaten
```
Personio Instanz: ihre-firma.app.personio.com
Mitarbeiter-ID: [Ihre Employee ID]
Zeitzone: Europe/Berlin
```

**Wie finde ich meine Employee ID?**
1. In Personio einloggen
2. URL ansehen bei "Attendance": `/attendance/employee/[ID]`
3. Die Zahl ist Ihre Employee ID

#### Schritt 2: Wochentage konfigurieren

**Für jeden Wochentag (Mo-So):**

1. **Arbeitstag aktivieren** (Checkbox)
2. **Arbeitszeiten** definieren:
   - Beginn (z.B. 08:00)
   - Ende (z.B. 17:00)
3. **Pausenzeiten** definieren:
   - Pausenbeginn (z.B. 12:00)
   - Pausenende (z.B. 13:00)

**Beispiel-Konfigurationen:**

**Standard 40-Stunden-Woche:**
```
Mo-Fr:
  Arbeitstag: ✅
  Arbeitszeit: 08:00 - 17:00
  Pause: 12:00 - 13:00
Sa-So:
  Arbeitstag: ❌
```

**4-Tage-Woche (4x9h + 1x4h):**
```
Mo-Do:
  Arbeitstag: ✅
  Arbeitszeit: 08:00 - 18:00
  Pause: 12:00 - 13:00

Fr:
  Arbeitstag: ✅
  Arbeitszeit: 08:00 - 13:00
  Pause: 12:00 - 12:30

Sa-So:
  Arbeitstag: ❌
```

#### Schritt 3: Speichern & Testen

1. **"Profil speichern"** klicken
2. **Profil-Übersicht** prüfen
3. **"Zeiterfassung starten"** klicken
4. Warten (ca. 2-3 Sekunden pro Tag)
5. ✅ Erfolg prüfen in Personio

### Profil bearbeiten

**Profil ändern:**
1. Button **"✏️ Profil bearbeiten"** klicken
2. Änderungen vornehmen
3. **"Profil speichern"** klicken

**Profil löschen:**
1. Browser: `chrome://extensions/`
2. Extension: "Daten löschen"
3. Neu konfigurieren

---

## 📥 Import-Modus

### Wann verwenden?

✅ **Gut geeignet für:**
- Flexible Arbeitszeiten
- Time-Tracking aus anderen Tools
- Projektbasierte Zeiterfassung
- Mehrere Tage auf einmal

❌ **Nicht geeignet für:**
- Sehr komplexe Projekte mit vielen Kategorien (Personio unterstützt max. 1 Projekt pro Period)

### Import-Methoden

#### Methode 1: Datei hochladen

1. **Tab "Import"** öffnen
2. **"Datei hochladen"** wählen
3. JSON-Datei auswählen
4. **Vorschau prüfen:**
   - Anzahl Tage
   - Zeitraum
   - Gültigkeit
5. **"Zeiten importieren"** klicken

#### Methode 2: Text einfügen

1. **Tab "Import"** öffnen
2. **"Text eingeben"** wählen
3. JSON in Textfeld einfügen
4. **"Validieren"** klicken
5. **Vorschau prüfen**
6. **"Zeiten importieren"** klicken

### JSON-Format

#### Minimale Struktur
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

#### Vollständige Struktur (mit IDs & Tags)
```json
[
  {
    "id": 1,
    "start": "20251204T080000Z",
    "end": "20251204T120000Z",
    "tags": ["projekt-alpha", "entwicklung"]
  }
]
```

**Wichtig:**
- `start` und `end` sind **Pflichtfelder**
- `id` und `tags` sind optional (werden ignoriert)
- Zeitformat: `YYYYMMDDTHHMMSSZoder ISO 8601
- Sekunden werden auf `:00` gerundet

### Zeitformat-Details

**Unterstützte Formate:**

1. **Kompakt (empfohlen):**
   ```
   20251204T080000Z
   ```

2. **ISO 8601:**
   ```
   2025-12-04T08:00:00Z
   ```

3. **Mit Zeitzone:**
   ```
   2025-12-04T08:00:00+01:00
   ```

**Konvertierung:**
- Alle Zeiten werden in **lokale Zeit** (Profil-Zeitzone) konvertiert
- UTC-Zeiten werden automatisch umgerechnet

### Pausen-Erkennung

**Automatische Pausen:**
Die Extension erkennt **Lücken zwischen Einträgen** automatisch:

```json
[
  {"start": "08:00", "end": "12:00"},  // ← 4h Arbeit
  // Lücke von 1 Stunde = Pause
  {"start": "13:00", "end": "17:00"}   // ← 4h Arbeit
]
```

**Ergebnis:**
```
08:00-12:00: Arbeitszeit (4h)
12:00-13:00: Pause (1h)
13:00-17:00: Arbeitszeit (4h)
```

**Regeln:**
- Lücken **< 1 Minute:** werden zusammengefasst (ignoriert)
- Lücken **≥ 1 Minute:** werden als Pause eingetragen

### Multi-Day Import

**Mehrere Tage in einer Datei:**

```json
[
  // Montag
  {"start": "20251202T080000Z", "end": "20251202T120000Z"},
  {"start": "20251202T130000Z", "end": "20251202T170000Z"},
  
  // Dienstag
  {"start": "20251203T080000Z", "end": "20251203T120000Z"},
  {"start": "20251203T130000Z", "end": "20251203T170000Z"},
  
  // Mittwoch
  {"start": "20251204T080000Z", "end": "20251204T120000Z"},
  {"start": "20251204T130000Z", "end": "20251204T170000Z"}
]
```

**Die Extension:**
- Gruppiert automatisch nach Datum
- Verarbeitet jeden Tag einzeln
- Zeigt Fortschritt pro Tag an

### Multi-Month Import

**Automatische Monats-Erkennung:**

Wenn Ihre JSON-Datei Daten aus **mehreren Monaten** enthält:

```json
[
  {"start": "20251130T080000Z", ...},  // November
  {"start": "20251201T080000Z", ...},  // Dezember
  {"start": "20251202T080000Z", ...}   // Dezember
]
```

**Die Extension lädt automatisch:**
1. Timesheet für November
2. Timesheet für Dezember
3. Kombiniert beide Timesheets
4. Verarbeitet alle Tage

**Unterstützt:**
- ✅ Vorheriger + Aktueller Monat
- ✅ Jahreswechsel (Dez 2025 → Jan 2026)
- ❌ Mehr als 2 Monate (nur aktuell + 1 vorheriger)

---

## ✅ Best Practices

### Profil-Modus

1. **Wöchentlich überprüfen:**
   - Profil einmal pro Woche checken
   - Bei Änderungen: Profil anpassen

2. **Kombination mit Import:**
   - Profil für normale Tage
   - Import für Ausnahmen (Gleitzeit, Überstunden)

3. **Zeitzone beachten:**
   - Profil-Zeitzone muss mit Personio übereinstimmen
   - Standard: `Europe/Berlin`

### Import-Modus

1. **JSON validieren:**
   - Vor dem Import: Vorschau prüfen
   - Fehlerhafte Einträge korrigieren

2. **Batch-Import:**
   - Mehrere Tage auf einmal importieren
   - Nicht Tag für Tag einzeln

3. **Bereits eingetragen?**
   - Kein Problem! Extension überspringt automatisch
   - Sie können bedenkenlos mehrfach importieren

### Allgemein

1. **Nicht unterbrechen:**
   - Während der Verarbeitung nicht schließen
   - Bei 20 Tagen: ~1 Minute warten

2. **Authentifizierung:**
   - Bei Personio eingeloggt bleiben
   - Bei 403-Fehler: Personio-Tab refreshen

3. **Ergebnis prüfen:**
   - Nach Import: In Personio kontrollieren
   - Zusammenfassung anzeigen lassen

---

## 🔍 Häufige Fragen

### Allgemein

**Q: Welchen Modus soll ich verwenden?**
A: 
- Feste Zeiten → Profil-Modus
- Flexible Zeiten → Import-Modus
- Mixed → Profil + Import kombinieren

**Q: Kann ich beide Modi kombinieren?**
A: Ja! Profil für normale Tage, Import für Ausnahmen.

**Q: Werden bereits eingetragene Tage überschrieben?**
A: Nein, die Extension überspringt automatisch bereits eingetragene Tage.

### Profil-Modus

**Q: Ich arbeite nicht jeden Tag gleich lang?**
A: Kein Problem! Konfigurieren Sie jeden Wochentag individuell.

**Q: Kann ich Feiertage ausschließen?**
A: Feiertage werden automatisch erkannt (is_off_day in Personio).

**Q: Muss ich das Profil jeden Monat neu anlegen?**
A: Nein, einmal angelegt gilt das Profil dauerhaft.

### Import-Modus

**Q: Welches Zeitformat muss ich verwenden?**
A: Kompakt (`20251204T080000Z`) oder ISO 8601 (`2025-12-04T08:00:00Z`).

**Q: Werden Pausen automatisch erkannt?**
A: Ja! Lücken ≥ 1 Minute werden als Pause eingetragen.

**Q: Kann ich mehrere Tage auf einmal importieren?**
A: Ja, die Extension gruppiert automatisch nach Datum.

**Q: Was passiert bei Tagen aus dem letzten Monat?**
A: Die Extension lädt automatisch mehrere Monate (Multi-Month Support).

### Troubleshooting

**Q: "403 Forbidden" Fehler**
A: 
1. Personio-Tab refreshen (F5)
2. Extension neu öffnen
3. Erneut versuchen

**Q: "Nicht authentifiziert"**
A:
1. Bei Personio einloggen
2. Extension neu öffnen
3. Ggf. Browser-Cache leeren

**Q: "Tage nicht gefunden"**
A: Tage liegen außerhalb des Timesheets (> 2 Monate zurück).

---

## 📚 Weiterführende Dokumentation

- **[Profile Mode Guide](./04-PROFILE-MODE.md)** - Profil-Modus im Detail
- **[Import Mode Guide](./05-IMPORT-MODE.md)** - Import-Modus Best Practices
- **[Advanced Usage](./06-ADVANCED-USAGE.md)** - Fortgeschrittene Funktionen
- **[Troubleshooting](./troubleshooting/COMMON-ISSUES.md)** - Problemlösungen

---

**Personio Attendance Recorder** | User Guide | v0.3.0

