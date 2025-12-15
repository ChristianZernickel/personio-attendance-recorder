# Feature Overview - Personio Attendance Recorder

> **Alle Features im Überblick** | Version 0.3.0

## 📋 Inhaltsverzeichnis

1. [Core Features](#core-features)
2. [Profil-Modus](#profil-modus)
3. [Import-Modus](#import-modus)
4. [Technische Features](#technische-features)
5. [Roadmap](#roadmap)

---

## 🎯 Core Features

### Authentifizierung

**Cookie-basierte Authentifizierung**
- ✅ Automatisches Lesen von Personio-Cookies
- ✅ XSRF-Token Extraktion
- ✅ Session-Management
- ✅ Auto-Refresh vor jedem Recording

**Benötigte Cookies:**
- `ATHENA-XSRF-TOKEN` → CSRF Protection
- `personio_session` → Session Token
- `ATHENA_SESSION` → Session ID
- `product_language` → Sprach-Einstellung

### Timesheet Integration

**Intelligente Timesheet-Abfrage:**
- ✅ Automatisches Laden des aktuellen Monats
- ✅ Multi-Month Support (vorheriger + aktueller Monat)
- ✅ Filterung nach Status (`trackable`, `non_trackable`)
- ✅ Erkennung bereits eingetragener Tage

**Timesheet-Status:**
| Status | Bedeutung | Verarbeitung |
|--------|-----------|--------------|
| `trackable` | Kann eingetragen werden | ✅ Ja |
| `non_trackable` | Noch nicht verfügbar (Zukunft) | ❌ Nein |
| `is_off_day: true` | Freier Tag / Feiertag | ❌ Nein |
| `periods.length > 0` | Bereits eingetragen | ❌ Überspringen |

### Zeiterfassung

**3-Schritt-Prozess:**
```
1. Validation → POST /validate-and-calculate-full-day
2. Save → PUT /days/{dayId}
3. Verify → Check response status
```

**Features:**
- ✅ Batch-Processing mehrerer Tage
- ✅ Retry-Mechanismus (3x mit Backoff)
- ✅ Rate Limiting (1 Request/Sekunde)
- ✅ Progress Tracking mit Live-Updates
- ✅ Detaillierte Fehlerbehandlung

---

## 📅 Profil-Modus

### Per-Day Schedule

**Individuelle Konfiguration pro Wochentag:**

```javascript
schedule: {
  1: { // Montag
    enabled: true,
    workStart: "08:00",
    workEnd: "17:00",
    breakStart: "12:00",
    breakEnd: "13:00"
  },
  // ... Tag 2-7
}
```

**Vorteile:**
- ✅ Flexible Arbeitszeiten pro Tag
- ✅ Beispiel: 4 Tage á 9h + 1 Tag á 4h
- ✅ Individuelle Pausen pro Tag
- ✅ Wochenend-Konfiguration möglich

### Profil-Verwaltung

**Storage:**
```javascript
{
  personioInstance: "firma.app.personio.com",
  employeeId: "13011272",
  timezone: "Europe/Berlin",
  schedule: { ... },
  workingDays: [1, 2, 3, 4, 5]
}
```

**Features:**
- ✅ Persistente Speicherung (Chrome Storage API)
- ✅ Migration von Legacy-Profilen
- ✅ Validierung vor dem Speichern
- ✅ Live-Vorschau im UI

### Perioden-Generierung

**Aus Profil → API Perioden:**

```javascript
// Profil
workStart: "08:00"
workEnd: "17:00"
breakStart: "12:00"
breakEnd: "13:00"

// → API Payload
periods: [
  {
    id: "uuid-1",
    start: "2025-12-04T08:00:00",
    end: "2025-12-04T12:00:00",
    period_type: "work"
  },
  {
    id: "uuid-2",
    start: "2025-12-04T12:00:00",
    end: "2025-12-04T13:00:00",
    period_type: "break"
  },
  {
    id: "uuid-3",
    start: "2025-12-04T13:00:00",
    end: "2025-12-04T17:00:00",
    period_type: "work"
  }
]
```

---

## 📥 Import-Modus

### JSON-Import

**Zwei Eingabe-Methoden:**

1. **Datei hochladen:**
   - File Input
   - JSON-Parsing
   - Vorschau & Validierung

2. **Text-Eingabe:**
   - Textarea
   - Direktes Einfügen
   - Live-Validierung

### Zeitstempel-Parsing

**Unterstützte Formate:**

1. **Kompakt (empfohlen):**
   ```
   20251204T080000Z
   ```

2. **ISO 8601:**
   ```
   2025-12-04T08:00:00Z
   2025-12-04T08:00:00+01:00
   ```

**Parsing-Logik:**
```javascript
// 1. Versuche Standard-ISO
date = new Date(timestamp)

// 2. Fallback: Kompakt-Format
match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/
date = new Date(Date.UTC(year, month-1, day, hour, min, sec))
```

### Pausen-Erkennung

**Automatische Lücken-Analyse:**

```javascript
Entry 1: 08:00 - 12:00  // 4h Arbeit
  ↓ Gap: 1h
Entry 2: 13:00 - 17:00  // 4h Arbeit

→ Ergebnis:
  08:00-12:00: work
  12:00-13:00: break  ← Automatisch
  13:00-17:00: work
```

**Regeln:**
- Gap < 1 Minute → Zusammenfassen (ignorieren)
- Gap ≥ 1 Minute → Als Pause eintragen

**Micro-Gap Handling:**
```javascript
Entry 1: 08:00:00 - 12:00:30
Entry 2: 12:00:45 - 17:00:00
         ↑ 15 Sekunden Gap

→ Zusammengefasst:
  08:00:00 - 12:00:45  (als eine Work-Period)
```

### Multi-Day Import

**Automatische Gruppierung:**

```javascript
// Input: Gemischte Tage
[
  {start: "20251202T08:00:00Z", end: "..."},
  {start: "20251202T13:00:00Z", end: "..."},
  {start: "20251203T08:00:00Z", end: "..."}
]

// → Gruppiert nach Datum
{
  "2025-12-02": [entry1, entry2],
  "2025-12-03": [entry3]
}
```

**Vorteile:**
- ✅ Eine Datei für ganze Woche
- ✅ Batch-Import mehrerer Tage
- ✅ Automatische Sortierung

### Multi-Month Import

**Automatische Monats-Erkennung:**

```javascript
// Import enthält November + Dezember
dates: ["2025-11-30", "2025-12-01", "2025-12-02"]

// → Lädt 2 Timesheets
timesheet1 = load("2025-11-01", "2025-11-30")
timesheet2 = load("2025-12-01", "2025-12-31")

// → Kombiniert
combined = [...timesheet1.timecards, ...timesheet2.timecards]
```

**Features:**
- ✅ Unterstützt vorheriger + aktueller Monat
- ✅ Jahreswechsel (Dez → Jan)
- ✅ Automatische Erkennung
- ❌ Limitierung: Max 2 Monate

---

## 🔧 Technische Features

### Service-Architektur

**8 Modulare Services:**

| Service | Verantwortung | LOC |
|---------|---------------|-----|
| WorkflowService | Orchestrierung | 116 |
| AttendanceService | Zeiterfassung | ~150 |
| TimesheetService | Timesheet-Management | ~100 |
| APIClient | Personio API | ~250 |
| AuthManager | Authentifizierung | ~80 |
| ProfileService | Profil-Verwaltung | 134 |
| TimeImportService | JSON-Import | 434 |
| UILogService | UI-Logging | ~50 |

**Gesamt:** ~1300 LOC (Services only)

### Error Handling

**Retry-Mechanismus:**
```javascript
// Exponential Backoff
attempt 1: Fehler → Warte 1s
attempt 2: Fehler → Warte 2s
attempt 3: Fehler → Abbruch
```

**Error-Kategorien:**
- `401 Unauthorized` → Session abgelaufen
- `403 Forbidden` → CSRF Token ungültig
- `404 Not Found` → Day ID nicht vorhanden
- `5xx Server Error` → Personio-Problem

### Progress Tracking

**Live-Updates:**
```javascript
// Callback-Pattern
onProgress(current, total, date, success) => {
  updateUI(current, total);
  logEntry(date, success);
}
```

**UI-Elemente:**
- Progress Bar (0-100%)
- Log-Einträge (scrollbar)
- Status-Icons (✅ ❌ ⚠️)
- Zusammenfassung (erfolgreiche/fehlgeschlagene)

### Rate Limiting

**1 Request pro Sekunde:**
```javascript
for (const day of days) {
  await recordDay(day);
  await sleep(1000);  // Rate Limit
}
```

**Warum?**
- Vermeidet API Throttling
- Schont Personio-Server
- Verhindert 429 Too Many Requests

---

## 🔮 Roadmap

### Geplante Features (v0.4.0)

**UI Improvements:**
- [ ] Dark Mode Support
- [ ] Keyboard Shortcuts
- [ ] Drag & Drop für JSON-Import
- [ ] Profil-Templates

**Import Enhancements:**
- [ ] CSV-Import Support
- [ ] Excel-Import Support
- [ ] Import von anderen Time-Tracking Tools
  - [ ] Toggl Export
  - [ ] Clockify Export
  - [ ] Harvest Export

**Profil Features:**
- [ ] Multiple Profile (Arbeit, Urlaub, etc.)
- [ ] Profil-Switching
- [ ] Auto-Detect Feiertage

**Technical:**
- [ ] Offline Support (Service Worker Caching)
- [ ] Unit Tests (Jest)
- [ ] E2E Tests (Puppeteer)
- [ ] Performance Monitoring

### Zukünftige Features (v0.5.0+)

**Advanced:**
- [ ] Batch-Edit bereits eingetragener Tage
- [ ] Zeit-Korrektur (Adjust existing entries)
- [ ] Export-Funktion (Personio → JSON)
- [ ] Statistiken & Reports

**Integration:**
- [ ] Slack-Benachrichtigungen
- [ ] Google Calendar Sync
- [ ] JIRA Time-Tracking Import

**Enterprise:**
- [ ] Team-Profile (Admin verteilt Profile)
- [ ] Compliance-Reports
- [ ] Audit-Log

---

## 📊 Feature-Matrix

| Feature | Profil-Modus | Import-Modus | Status |
|---------|--------------|--------------|--------|
| Zeiterfassung | ✅ | ✅ | Verfügbar |
| Multi-Day | ✅ | ✅ | Verfügbar |
| Multi-Month | ❌ | ✅ | Verfügbar (v0.2.1) |
| Per-Day Schedule | ✅ | ❌ | Verfügbar (v0.2.0) |
| Pause-Erkennung | ✅ (fix) | ✅ (automatisch) | Verfügbar |
| Retry-Logic | ✅ | ✅ | Verfügbar |
| Progress Tracking | ✅ | ✅ | Verfügbar |
| Validierung | ✅ | ✅ | Verfügbar |
| Text-Import | ❌ | ✅ | Verfügbar (v0.2.0) |
| File-Import | ❌ | ✅ | Verfügbar (v0.2.0) |

---

## 💡 Best Practices

### Profil-Modus
✅ **DO:**
- Profil einmalig sorgfältig konfigurieren
- Wöchentlich auf korrekte Einträge prüfen
- Bei Änderungen: Profil anpassen

❌ **DON'T:**
- Profil nicht für flexible Zeiten verwenden
- Nicht mehrere Profile gleichzeitig

### Import-Modus
✅ **DO:**
- JSON vor Import validieren
- Mehrere Tage auf einmal importieren
- Bereits eingetragene Tage sind kein Problem

❌ **DON'T:**
- Nicht manuell UUID generieren
- Nicht Sekunden-Genauigkeit erwarten
- Nicht > 2 Monate in einer Datei

---

**Personio Attendance Recorder** | Feature Overview | v0.3.0

