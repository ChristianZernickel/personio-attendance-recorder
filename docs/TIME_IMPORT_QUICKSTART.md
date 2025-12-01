# 🚀 Time Import Feature - Quick Start

## Schnellstart

Das Time Import Feature ermöglicht es, Arbeitszeiten aus JSON-Dateien zu importieren.

### 1. JSON-Datei vorbereiten

Erstelle eine JSON-Datei mit diesem Format:

```json
[
  {
    "id": 1,
    "start": "20251113T070000Z",
    "end": "20251113T110000Z",
    "tags": ["optional"]
  },
  {
    "id": 2,
    "start": "20251113T120000Z",
    "end": "20251113T160000Z",
    "tags": ["optional"]
  }
]
```

**Wichtig:**
- `start` und `end` sind Pflichtfelder im ISO-Format (UTC)
- `id` und `tags` werden ignoriert
- Zeiten werden automatisch in deine Zeitzone konvertiert
- Pausen werden automatisch aus Lücken zwischen Einträgen erkannt

### 2. Import durchführen

#### Option A: Datei hochladen

3. **Wähle deine JSON-Datei**
4. **Prüfe die Vorschau** - zeigt:
3. **Wähle "📁 Datei"** als Import-Methode
4. **Wähle deine JSON-Datei**
5. **Prüfe die Vorschau** - zeigt:
   - Gesamtarbeitszeit
5. **Klicke auf "Zeiten importieren"**

6. **Klicke auf "Zeiten importieren"**

#### Option B: Text einfügen (NEU ✨)

1. **Öffne das Plugin** auf einer Personio-Seite
2. **Wechsle zum "Import" Tab**
3. **Wähle "📝 Text"** als Import-Methode
4. **Füge deine JSON-Daten ein** (Copy & Paste)
5. **Klicke auf "JSON validieren"**
6. **Prüfe die Vorschau**
7. **Klicke auf "Zeiten importieren"**

Lücken zwischen Einträgen werden als Pausen erkannt:

```json
[
  {"start": "20251113T070000Z", "end": "20251113T110000Z"},  // 07:00-11:00 UTC
  {"start": "20251113T120000Z", "end": "20251113T160000Z"}   // 12:00-16:00 UTC
]
```

**Resultat:**
- 08:00-12:00 Berlin (Work)
- 12:00-13:00 Berlin (Break) ← Automatisch erkannt!
- 13:00-17:00 Berlin (Work)

### Micro-Gaps werden ignoriert

Lücken unter 1 Minute werden zusammengefasst:

```json
[
  {"start": "20251113T070000Z", "end": "20251113T110030Z"},  // Endet bei :00:30
  {"start": "20251113T110045Z", "end": "20251113T160000Z"}   // Startet bei :00:45
]
```

**Resultat:** Keine Pause (nur 15 Sekunden Lücke)

## Beispiele

### Beispiel 1: Einfacher Tag mit Pause

**Input:**
```json
[
  {"start": "20251113T070000Z", "end": "20251113T110000Z"},
  {"start": "20251113T120000Z", "end": "20251113T160000Z"}
]
```

**Output in Personio:**
- 13.11.2025: 08:00-12:00, Pause 12:00-13:00, 13:00-17:00
- Gesamt: 8h Arbeit, 1h Pause

### Beispiel 2: Mehrere Tage

**Input:**
```json
[
  {"start": "20251113T070000Z", "end": "20251113T110000Z"},
  {"start": "20251113T120000Z", "end": "20251113T160000Z"},
  {"start": "20251114T070000Z", "end": "20251114T110000Z"},
  {"start": "20251114T120000Z", "end": "20251114T160000Z"}
]
```

**Output in Personio:**
- 13.11.2025: 08:00-12:00, Pause 12:00-13:00, 13:00-17:00
- 14.11.2025: 08:00-12:00, Pause 12:00-13:00, 13:00-17:00
- Gesamt: 16h Arbeit über 2 Tage

### Beispiel 3: Tag ohne Pause

**Input:**
```json
[
  {"start": "20251113T070000Z", "end": "20251113T150000Z"}
]
```

**Output in Personio:**
- 13.11.2025: 08:00-16:00 (durchgehend)
- Gesamt: 8h Arbeit, keine Pause

## Wichtige Hinweise

### ✅ Was funktioniert
- Import mehrerer Tage in einer Datei
- Automatische Pause-Erkennung
- Zeitzone-Konvertierung
- Überspringen bereits eingetragener Tage
- Standard- und Compact-ISO-Format

### ⚠️ Einschränkungen
- Nur leere Tage werden befüllt
- Bereits eingetragene Tage werden übersprungen (kein Überschreiben!)
- Nur "trackable" Tage können importiert werden
- Zukünftige Tage (non_trackable) werden abgelehnt

### 📝 Format-Unterstützung

**Beide Formate werden unterstützt:**

1. **Compact:** `20251113T070000Z`
2. **Standard:** `2025-11-13T07:00:00Z`

## Fehlerbehandlung

### Validierungs-Fehler

❌ **JSON ungültig**
- Lösung: Prüfe JSON-Syntax (z.B. mit jsonlint.com)

❌ **Keine Einträge gefunden**
- Lösung: Datei muss mindestens einen Eintrag haben

❌ **Ungültiges Zeitformat**
- Lösung: Verwende ISO 8601 Format (siehe oben)

❌ **End vor Start**
- Lösung: `end` muss nach `start` liegen

### Import-Fehler

❌ **Tag bereits eingetragen**
- Info: Tag wird automatisch übersprungen
- Kein Fehler, nur Info-Meldung

❌ **Tag nicht trackbar**
- Ursache: Tag liegt in der Zukunft oder ist gesperrt
- Lösung: Warte bis Tag trackbar ist

❌ **Authentifizierung fehlgeschlagen**
- Lösung: Logge dich bei Personio ein und versuche es erneut

## Workflow-Tipps

### 1. Export aus anderem Tool

Wenn dein Time-Tracker JSON exportiert, achte darauf:
- Zeiten müssen in UTC sein (oder werden als UTC interpretiert)
- Format sollte ISO 8601 sein
- `start` und `end` Felder müssen vorhanden sein

### 2. Bulk-Import

Für viele Tage:
1. Exportiere alle Tage in eine Datei
2. Import einmal ausführen
3. Plugin zeigt Fortschritt für jeden Tag

### 3. Regelmäßiger Import

Für täglichen Import:
1. Exportiere nur neue Tage
2. Import automatisch überspringt bereits eingetragene Tage
3. Keine Duplikate möglich!

## Test-Datei

Im Repository findest du `test-import.json` mit Beispiel-Daten zum Testen.

## Support

Bei Problemen:
1. Prüfe Browser-Konsole für detaillierte Logs
2. Prüfe JSON-Format mit Validator
3. Stelle sicher, dass du bei Personio eingeloggt bist
4. Prüfe, ob Tage bereits eingetragen sind

## Technische Details

Siehe: [TIME_IMPORT_FEATURE.md](TIME_IMPORT_FEATURE.md) für vollständige technische Dokumentation.

