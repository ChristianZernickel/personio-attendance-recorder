# API-Referenz - Personio Attendance API

**Projekt:** Personio Attendance Recorder  
**API Version:** v1  
**Base URL:** `https://{company}.app.personio.com`  
**Letzte Aktualisierung:** 04. November 2025

---

## Inhaltsverzeichnis

1. [Übersicht](#1-übersicht)
2. [Authentifizierung](#2-authentifizierung)
3. [Endpunkte](#3-endpunkte)
4. [Datenstrukturen](#4-datenstrukturen)
5. [Fehlerbehandlung](#5-fehlerbehandlung)
6. [Beispiele](#6-beispiele)

---

## 1. Übersicht

Die Personio Attendance API ermöglicht die Verwaltung von Arbeitszeiterfassungen. Diese Dokumentation beschreibt die für das Plugin relevanten Endpunkte.

### 1.1 Base URLs

```
https://aoe-gmbh.app.personio.com
https://{company}.app.personio.com
```

### 1.2 Content-Type

Alle Requests verwenden:
```
Content-Type: application/json
```

### 1.3 Zeitzone

Standard-Zeitzone: `Europe/Berlin`

---

## 2. Authentifizierung

### 2.1 Authentifizierungsmethode

Cookie-basierte Authentifizierung mit vollständigem Cookie-String.

**WICHTIG - Session Refresh erforderlich:**

Vor jedem API-Call zu `/svc/attendance-*` Endpunkten muss `/api/v1/projects` aufgerufen werden, um einen frischen `personio_session` Cookie zu erhalten.

```
Schritt 1: GET /api/v1/projects → Setzt personio_session
Schritt 2: Warte 100ms
Schritt 3: GET/POST zum Ziel-Endpunkt → Verwendet frische Session
```

### 2.2 Benötigte Header

Jeder Request benötigt folgende Header:

```http
Content-Type: application/json
Cookie: ATHENA-XSRF-TOKEN=...; product_language=...; ATHENA_SESSION=...; personio_session=...
X-Xsrf-Token: {ATHENA-XSRF-TOKEN-value}
```

**Wichtig:** Ohne den vollständigen `Cookie`-Header liefert die API `401 Unauthenticated`.

### 2.3 Cookie-Extraktion

Die Cookies werden aus dem Browser extrahiert. Folgende Cookies sind essentiell:

| Cookie-Name | Erforderlich | Beschreibung |
|-------------|--------------|--------------|
| `ATHENA-XSRF-TOKEN` | ✅ | CSRF-Token, wird auch als X-Xsrf-Token Header gesendet |
| `ATHENA_SESSION` | ✅ | Session-ID für Athena Service |
| `personio_session` | ✅ | Hauptsession-Cookie von Personio |
| `product_language` | ❌ | Spracheinstellung (z.B. `de\|13011272`) |
| `_dd_s` | ❌ | DataDog Session (optional) |

**Domain:** `.app.personio.com`

---

## 3. Endpunkte

### 3.1 Timesheet abrufen

Ruft die Arbeitszeitübersicht für einen Zeitraum ab.

#### Request

```http
GET /svc/attendance-bff/v1/timesheet/{employeeId}
Host: {company}.app.personio.com
Cookie: ATHENA-XSRF-TOKEN=...; ATHENA_SESSION=...; personio_session=...
X-Xsrf-Token: {ATHENA-XSRF-TOKEN-value}
```

**Parameter:**

| Parameter | Typ | Location | Required | Beschreibung |
|-----------|-----|----------|----------|--------------|
| `employeeId` | integer | path | ✅ | Mitarbeiter-ID (z.B. 13011272) |
| `start_date` | string | query | ✅ | Startdatum im Format YYYY-MM-DD |
| `end_date` | string | query | ✅ | Enddatum im Format YYYY-MM-DD |
| `timezone` | string | query | ✅ | Zeitzone (URL-encoded, z.B. Europe%2FBerlin) |

**Beispiel-URL:**
```
https://aoe-gmbh.app.personio.com/svc/attendance-bff/v1/timesheet/13011272?start_date=2025-11-01&end_date=2025-11-30&timezone=Europe%2FBerlin
```

#### Response

**Status:** `200 OK`

```json
{
  "timecards": [
    {
      "day_id": "f2245f74-1f7f-4cab-a4c5-41cdafc700ab",
      "date": "2025-11-04",
      "state": "trackable",
      "is_off_day": false,
      "assigned_working_schedule_id": "1433807584885358592",
      "periods": [
        {
          "id": "7a13b320-1740-477e-ab4e-f66d3092722e",
          "start": "2025-11-04T08:00:00",
          "end": "2025-11-04T12:00:00",
          "project_id": null,
          "comment": null,
          "type": "work",
          "origin": "web",
          "is_auto_generated": false,
          "geolocation": null
        },
        {
          "id": "6730b0a8-1820-4a31-9734-18b4e5b503e3",
          "start": "2025-11-04T12:00:00",
          "end": "2025-11-04T13:00:00",
          "project_id": null,
          "comment": null,
          "type": "break",
          "origin": "web",
          "is_auto_generated": false,
          "geolocation": null
        }
      ],
      "break_duration_minutes": 60,
      "legacy_break_duration_minutes": 0,
      "target_hours": {
        "effective_work_duration_minutes": 480,
        "effective_break_duration_minutes": 60,
        "contractual_work_duration_minutes": 480,
        "contractual_break_duration_minutes": 60,
        "start_time": "08:00",
        "end_time": "17:00"
      },
      "overtime": {
        "amount_minutes": 60,
        "type": "daily_overtime"
      },
      "time_off": null,
      "approval": {
        "status": "confirmed",
        "rejection_reason": null
      },
      "alerts": [],
      "metadata": {
        "created_at": "2025-11-04T06:08:43.124Z",
        "updated_at": "2025-11-04T06:40:52.632Z"
      },
      "can_create_time_off_in_lieu": true
    }
  ],
  "widgets": {
    "tracked_hours": {
      "tracked_minutes": 1020,
      "confirmed_minutes": 1020,
      "target_minutes": 9600,
      "pending_minutes": 0
    },
    "overtime": {
      "overtime_minutes": 60,
      "pending_minutes": null,
      "cliff_minutes": 0,
      "total_overtime_minutes": 60
    },
    "time_off": {
      "confirmed_minutes": 0,
      "pending_minutes": 0
    },
    "working_schedule_weeks": [
      {
        "weekly_work_minutes": 2400,
        "weekly_hour_mismatch": false,
        "week_number": 1,
        "is_current_active_week": true,
        "days": [
          {
            "day_of_week": 1,
            "target_work_minutes": 480
          }
        ]
      }
    ]
  },
  "supervisor_person_id": "",
  "owner_has_propose_rights": true
}
```

**Wichtige Felder:**

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `timecards[].day_id` | string/null | UUID des Tages (null wenn noch nicht angelegt) |
| `timecards[].date` | string | Datum im Format YYYY-MM-DD |
| `timecards[].state` | string | `"trackable"` oder `"non_trackable"` |
| `timecards[].is_off_day` | boolean | `true` wenn freier Tag (Wochenende/Feiertag) |
| `timecards[].periods` | array | Liste der bereits eingetragenen Zeitabschnitte |

---

### 3.2 Arbeitstag validieren und speichern

Validiert und speichert die Arbeitszeiterfassung für einen Tag.

#### Request

```http
POST /svc/attendance-api/validate-and-calculate-full-day?propose-fix=false
Host: {company}.app.personio.com
Content-Type: application/json
Cookie: ATHENA-XSRF-TOKEN=...; ATHENA_SESSION=...; personio_session=...
X-Xsrf-Token: {ATHENA-XSRF-TOKEN-value}
```

**Query Parameter:**

| Parameter | Typ | Required | Beschreibung |
|-----------|-----|----------|--------------|
| `propose-fix` | boolean | ❌ | Standard: `false`. Bei `true` werden Korrekturvorschläge gemacht |

**Body:**
```json
{
  "attendance_day_id": "f2245f74-1f7f-4cab-a4c5-41cdafc700ab",
  "employee_id": 13011272,
  "periods": [
    {
      "attendance_period_id": "7a13b320-1740-477e-ab4e-f66d3092722e",
      "start": "2025-11-04 08:00:00",
      "end": "2025-11-04 12:00:00",
      "period_type": "work",
      "comment": null,
      "project_id": null
    },
    {
      "attendance_period_id": "6730b0a8-1820-4a31-9734-18b4e5b503e3",
      "start": "2025-11-04 12:00:00",
      "end": "2025-11-04 13:00:00",
      "period_type": "break",
      "comment": null,
      "project_id": null
    },
    {
      "attendance_period_id": "8b24c431-2931-5b42-ad6e-g851f6c614f4",
      "start": "2025-11-04 13:00:00",
      "end": "2025-11-04 17:00:00",
      "period_type": "work",
      "comment": null,
      "project_id": null
    }
  ]
}
```

**Body-Parameter:**

| Parameter | Typ | Required | Beschreibung |
|-----------|-----|----------|--------------|
| `attendance_day_id` | string (UUID) | ✅ | Tag-ID aus Timesheet oder neu generiert |
| `employee_id` | integer | ✅ | Mitarbeiter-ID |
| `periods` | array | ✅ | Liste der Zeitabschnitte (mindestens 1) |
| `periods[].attendance_period_id` | string (UUID) | ✅ | Eindeutige ID für den Zeitabschnitt |
| `periods[].start` | string | ✅ | Startzeit im Format `YYYY-MM-DD HH:MM:SS` |
| `periods[].end` | string | ✅ | Endzeit im Format `YYYY-MM-DD HH:MM:SS` |
| `periods[].period_type` | string | ✅ | `"work"` oder `"break"` |
| `periods[].comment` | string/null | ❌ | Optionaler Kommentar |
| `periods[].project_id` | string/null | ❌ | Optionale Projekt-ID |

#### Response

**Status:** `200 OK`

```json
{
  "day": {
    "id": "f2245f74-1f7f-4cab-a4c5-41cdafc700ab",
    "date": "2025-11-04",
    "employee_id": 13011272,
    "periods": [
      {
        "id": "7a13b320-1740-477e-ab4e-f66d3092722e",
        "start": "2025-11-04T08:00:00",
        "end": "2025-11-04T12:00:00",
        "type": "work"
      }
    ],
    "total_work_minutes": 480,
    "total_break_minutes": 60,
    "overtime_minutes": 0
  },
  "validation": {
    "is_valid": true,
    "errors": [],
    "warnings": []
  }
}
```

**Wichtige Response-Felder:**

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `validation.is_valid` | boolean | `true` wenn Validierung erfolgreich |
| `validation.errors` | array | Liste von Validierungsfehlern |
| `validation.warnings` | array | Liste von Warnungen |
| `day.total_work_minutes` | integer | Gesamte Arbeitszeit in Minuten |
| `day.overtime_minutes` | integer | Überstunden in Minuten |

---

## 4. Datenstrukturen

### 4.1 Timecard

Repräsentiert einen Tag im Timesheet.

```typescript
interface Timecard {
  day_id: string | null;              // UUID oder null bei neuem Tag
  date: string;                       // Format: YYYY-MM-DD
  state: "trackable" | "non_trackable";
  is_off_day: boolean;                // true = freier Tag
  assigned_working_schedule_id: string;
  periods: Period[];
  break_duration_minutes: number;
  legacy_break_duration_minutes: number;
  target_hours: TargetHours;
  overtime: Overtime | null;
  time_off: any | null;
  approval: Approval | null;
  alerts: Alert[];
  metadata: Metadata | null;
  can_create_time_off_in_lieu: boolean;
}
```

**State-Werte:**
- `"trackable"` - Tag kann bearbeitet werden
- `"non_trackable"` - Tag liegt in der Zukunft oder kann nicht bearbeitet werden

### 4.2 Period

Repräsentiert einen Zeitabschnitt (Arbeit oder Pause).

```typescript
interface Period {
  id: string;                         // UUID
  start: string;                      // ISO-8601: YYYY-MM-DDTHH:MM:SS
  end: string;                        // ISO-8601: YYYY-MM-DDTHH:MM:SS
  project_id: string | null;
  comment: string | null;
  type: "work" | "break";
  origin: string;                     // "web", "mobile", "api"
  is_auto_generated: boolean;
  geolocation: any | null;
}
```

### 4.3 AttendanceDayRequest

Request-Struktur für das Speichern eines Arbeitstags.

```typescript
interface AttendanceDayRequest {
  attendance_day_id: string;          // UUID
  employee_id: number;
  periods: AttendancePeriod[];
}

interface AttendancePeriod {
  attendance_period_id: string;       // UUID
  start: string;                      // Format: YYYY-MM-DD HH:MM:SS
  end: string;                        // Format: YYYY-MM-DD HH:MM:SS
  period_type: "work" | "break";
  comment: string | null;
  project_id: string | null;
}
```

**Wichtige Unterschiede Period vs. AttendancePeriod:**

| Feld | Period (Response) | AttendancePeriod (Request) |
|------|-------------------|----------------------------|
| ID-Feld | `id` | `attendance_period_id` |
| Typ-Feld | `type` | `period_type` |
| Zeit-Format | ISO-8601 mit `T` | Leerzeichen statt `T` |

### 4.4 TargetHours

Soll-Arbeitszeiten für einen Tag.

```typescript
interface TargetHours {
  effective_work_duration_minutes: number;
  effective_break_duration_minutes: number | null;
  contractual_work_duration_minutes: number;
  contractual_break_duration_minutes: number;
  start_time: string | null;          // Format: HH:MM
  end_time: string | null;            // Format: HH:MM
}
```

### 4.5 Approval

Status der Genehmigung.

```typescript
interface Approval {
  status: "confirmed" | "pending" | "rejected";
  rejection_reason: string | null;
}
```

**Status-Werte:**
- `"confirmed"` - Bestätigt
- `"pending"` - Ausstehend
- `"rejected"` - Abgelehnt

---

## 5. Fehlerbehandlung

### 5.1 HTTP Status Codes

| Code | Bedeutung | Mögliche Ursache |
|------|-----------|------------------|
| 200 | OK | Request erfolgreich |
| 400 | Bad Request | Ungültige Eingabedaten |
| 401 | Unauthorized | Authentifizierung fehlgeschlagen / Session abgelaufen |
| 403 | Forbidden | Keine Berechtigung |
| 404 | Not Found | Ressource nicht gefunden |
| 422 | Unprocessable Entity | Validierungsfehler |
| 429 | Too Many Requests | Rate Limit überschritten |
| 500 | Internal Server Error | Serverfehler |

### 5.2 Fehler-Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "periods[0].start",
        "message": "Start time must be before end time"
      }
    ]
  }
}
```

### 5.3 Häufige Fehler

#### 401 Unauthorized

**Ursache:** CSRF-Tokens fehlen oder sind ungültig

**Lösung:**
- Tokens neu aus Cookies extrahieren
- Benutzer neu einloggen lassen

#### 422 Validation Error

**Ursache:** Ungültige Zeitangaben oder Periods

**Häufige Validierungsfehler:**
- Start-Zeit nach End-Zeit
- Überlappende Periods
- Pause außerhalb der Arbeitszeit
- Ungültiges Zeitformat

**Lösung:**
- Zeitangaben validieren
- Sicherstellen dass Periods sich nicht überlappen
- Korrektes Format verwenden: `YYYY-MM-DD HH:MM:SS`

#### 429 Too Many Requests

**Ursache:** Rate Limit überschritten

**Lösung:**
- Wartezeit zwischen Requests einbauen (min. 1 Sekunde)
- Exponential Backoff implementieren

---

## 6. Beispiele

### 6.1 Vollständiges Beispiel: Timesheet abrufen

**Request:**
```bash
curl -X GET \
  'https://aoe-gmbh.app.personio.com/svc/attendance-bff/v1/timesheet/13011272?start_date=2025-11-01&end_date=2025-11-30&timezone=Europe%2FBerlin' \
  -H 'X-ATHENA-XSRF-TOKEN: abc123...' \
  -H 'X-XSRF-TOKEN: xyz789...' \
  -H 'X-CSRF-TOKEN: mno345...' \
  -H 'Cookie: ...'
```

**Response (gekürzt):**
```json
{
  "timecards": [
    {
      "day_id": null,
      "date": "2025-11-01",
      "state": "trackable",
      "is_off_day": true,
      "periods": []
    },
    {
      "day_id": "f2245f74-1f7f-4cab-a4c5-41cdafc700ab",
      "date": "2025-11-04",
      "state": "trackable",
      "is_off_day": false,
      "periods": []
    }
  ]
}
```

### 6.2 Vollständiges Beispiel: Arbeitstag eintragen

**Request:**
```bash
curl -X POST \
  'https://aoe-gmbh.app.personio.com/svc/attendance-api/validate-and-calculate-full-day?propose-fix=false' \
  -H 'Content-Type: application/json' \
  -H 'X-ATHENA-XSRF-TOKEN: abc123...' \
  -H 'X-XSRF-TOKEN: xyz789...' \
  -H 'X-CSRF-TOKEN: mno345...' \
  -H 'Cookie: ...' \
  -d '{
    "attendance_day_id": "f2245f74-1f7f-4cab-a4c5-41cdafc700ab",
    "employee_id": 13011272,
    "periods": [
      {
        "attendance_period_id": "7a13b320-1740-477e-ab4e-f66d3092722e",
        "start": "2025-11-04 08:00:00",
        "end": "2025-11-04 12:00:00",
        "period_type": "work",
        "comment": null,
        "project_id": null
      },
      {
        "attendance_period_id": "6730b0a8-1820-4a31-9734-18b4e5b503e3",
        "start": "2025-11-04 12:00:00",
        "end": "2025-11-04 13:00:00",
        "period_type": "break",
        "comment": null,
        "project_id": null
      },
      {
        "attendance_period_id": "8b24c431-2931-5b42-ad6e-g851f6c614f4",
        "start": "2025-11-04 13:00:00",
        "end": "2025-11-04 17:00:00",
        "period_type": "work",
        "comment": null,
        "project_id": null
      }
    ]
  }'
```

**Response:**
```json
{
  "day": {
    "id": "f2245f74-1f7f-4cab-a4c5-41cdafc700ab",
    "date": "2025-11-04",
    "employee_id": 13011272,
    "total_work_minutes": 480,
    "total_break_minutes": 60,
    "overtime_minutes": 0
  },
  "validation": {
    "is_valid": true,
    "errors": [],
    "warnings": []
  }
}
```

### 6.3 JavaScript Beispiel

```javascript
// Cookies extrahieren
async function extractAuthData(personioInstance) {
  const allCookies = await chrome.cookies.getAll({
    domain: '.app.personio.com'
  });
  
  const cookieString = allCookies
    .map(c => `${c.name}=${c.value}`)
    .join('; ');
  
  const athenaXsrf = allCookies.find(c => c.name === 'ATHENA-XSRF-TOKEN');
  
  return {
    cookieString,
    xsrfToken: athenaXsrf?.value
  };
}

// Timesheet abrufen
async function fetchTimesheet(employeeId, startDate, endDate, authData) {
  const url = `https://aoe-gmbh.app.personio.com/svc/attendance-bff/v1/timesheet/${employeeId}` +
              `?start_date=${startDate}&end_date=${endDate}&timezone=Europe%2FBerlin`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authData.cookieString,
      'X-Xsrf-Token': authData.xsrfToken
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

// Arbeitstag eintragen
async function recordDay(dayId, employeeId, periods, authData) {
  const url = 'https://aoe-gmbh.app.personio.com/svc/attendance-api/validate-and-calculate-full-day?propose-fix=false';
  
  const body = {
    attendance_day_id: dayId,
    employee_id: employeeId,
    periods: periods
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': authData.cookieString,
      'X-Xsrf-Token': authData.xsrfToken
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Validation failed: ${error.error?.message}`);
  }
  
  return await response.json();
}
```

### 6.4 Typisches Workflow-Beispiel

```javascript
// 1. Auth-Daten extrahieren
const authData = await extractAuthData('aoe-gmbh.app.personio.com');

// 2. Timesheet für November 2025 abrufen
const timesheet = await fetchTimesheet(13011272, '2025-11-01', '2025-11-30', authData);

// 3. Trackable Tage filtern
const recordableDays = timesheet.timecards.filter(card => 
  card.state === 'trackable' && 
  !card.is_off_day && 
  card.periods.length === 0
);

// 4. Für jeden Tag Periods generieren
for (const day of recordableDays) {
  const dayId = day.day_id || generateUUID();
  
  const periods = [
    {
      attendance_period_id: generateUUID(),
      start: `${day.date} 08:00:00`,
      end: `${day.date} 12:00:00`,
      period_type: 'work',
      comment: null,
      project_id: null
    },
    {
      attendance_period_id: generateUUID(),
      start: `${day.date} 12:00:00`,
      end: `${day.date} 13:00:00`,
      period_type: 'break',
      comment: null,
      project_id: null
    },
    {
      attendance_period_id: generateUUID(),
      start: `${day.date} 13:00:00`,
      end: `${day.date} 17:00:00`,
      period_type: 'work',
      comment: null,
      project_id: null
    }
  ];
  
  // 5. Tag eintragen
  try {
    const result = await recordDay(dayId, 13011272, periods, authData);
    console.log(`✅ ${day.date} erfolgreich eingetragen`);
    
    // Rate limiting
    await sleep(1000);
  } catch (error) {
    console.error(`❌ ${day.date} fehlgeschlagen:`, error.message);
  }
}
```

---

## 7. Rate Limiting

### 7.1 Limits

Genaue Limits sind nicht öffentlich dokumentiert, aber aus Best Practices:

- **Empfehlung:** Max. 1 Request pro Sekunde
- **Burst:** Vermeiden Sie burst requests
- **Timeout:** 10 Sekunden pro Request

### 7.2 Implementierung

```javascript
async function recordAllDaysWithRateLimit(days, employeeId) {
  const DELAY_MS = 1000; // 1 Sekunde
  
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    
    try {
      await recordDay(day.day_id, employeeId, day.periods);
      console.log(`Progress: ${i + 1}/${days.length}`);
      
      // Warte nur wenn nicht der letzte Tag
      if (i < days.length - 1) {
        await sleep(DELAY_MS);
      }
    } catch (error) {
      console.error(`Failed to record ${day.date}:`, error);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## 8. Versionshinweise

### Version 1.0 (Current)

**Endpoints:**
- `GET /svc/attendance-bff/v1/timesheet/{employeeId}`
- `POST /svc/attendance-api/validate-and-calculate-full-day`

**Status:** Stabil

**Breaking Changes:** Keine bekannten

---

## 9. Support & Feedback

**Offizielle Personio API Dokumentation:**  
https://developer.personio.de/reference

**API Status:**  
(Keine öffentliche Status-Seite bekannt)

---

## Änderungshistorie

| Version | Datum | Änderungen |
|---------|-------|------------|
| 1.0.0 | 2025-11-04 | Initiale API-Referenz erstellt |

---

**Ende der API-Referenz**

