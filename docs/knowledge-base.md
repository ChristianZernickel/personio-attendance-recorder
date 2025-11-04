# Knowledge Base - Personio Attendance Recorder

**Projekt:** Personio Attendance Recorder Chrome Plugin  
**Zielgruppe:** Entwickler  
**Letzte Aktualisierung:** 04. November 2025

---

## Inhaltsverzeichnis

1. [Übersicht](#1-übersicht)
2. [Chrome Extension Grundlagen](#2-chrome-extension-grundlagen)
3. [Personio API Details](#3-personio-api-details)
4. [Authentifizierung](#4-authentifizierung)
5. [Datenmodelle](#5-datenmodelle)
6. [Implementierungsdetails](#6-implementierungsdetails)
7. [Best Practices](#7-best-practices)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Übersicht

### 1.1 Projektziel

Automatisierung der Zeiterfassung in Personio durch ein Chrome Extension Plugin, das basierend auf einem vordefinierten Arbeitszeitprofil automatisch Arbeitszeiten einträgt.

### 1.2 Technologie-Stack

- **Chrome Extension API** (Manifest V3)
- **JavaScript/TypeScript** 
- **Personio REST API**
- **HTML/CSS** für UI
- **Chrome Storage API** für Datenpersistenz

### 1.3 Architektur-Übersicht

```
┌─────────────────────────────────────────────────────┐
│           Chrome Extension (Manifest V3)            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │   Popup UI   │  │   Content    │  │Background│ │
│  │  (HTML/CSS)  │  │    Script    │  │  Service │ │
│  └──────┬───────┘  └──────┬───────┘  └────┬─────┘ │
│         │                 │               │        │
│         └─────────┬───────┴───────┬───────┘        │
│                   │               │                │
│         ┌─────────▼───────────────▼─────────┐      │
│         │   API Service Layer               │      │
│         │  - Cookie Extraction               │      │
│         │  - Timesheet Fetching              │      │
│         │  - Attendance Posting              │      │
│         └─────────┬───────────────┬─────────┘      │
│                   │               │                │
└───────────────────┼───────────────┼────────────────┘
                    │               │
                    ▼               ▼
          ┌──────────────┐  ┌──────────────┐
          │ Chrome       │  │   Personio   │
          │ Cookies      │  │     API      │
          └──────────────┘  └──────────────┘
```

---

## 2. Chrome Extension Grundlagen

### 2.1 Manifest V3

Chrome Extensions verwenden Manifest V3 (seit 2021 der Standard).

**Wichtige Unterschiede zu Manifest V2:**
- Service Workers statt Background Pages
- Promises statt Callbacks
- Deklarative Permissions

**Grundlegendes Manifest:**

```json
{
  "manifest_version": 3,
  "name": "Personio Attendance Recorder",
  "version": "1.0.0",
  "description": "Automatische Zeiterfassung für Personio",
  "permissions": [
    "cookies",
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://*.app.personio.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["https://*.app.personio.com/*"],
      "js": ["content.js"]
    }
  ]
}
```

### 2.2 Chrome APIs

#### 2.2.1 Cookies API

Zugriff auf Browser-Cookies:

```javascript
// Cookie abrufen
const cookie = await chrome.cookies.get({
  url: 'https://aoe-gmbh.app.personio.com',
  name: 'X-XSRF-TOKEN'
});

// Alle Cookies für eine Domain
const allCookies = await chrome.cookies.getAll({
  domain: '.app.personio.com'
});
```

**Wichtig:** Benötigt Permission `"cookies"` und `host_permissions` für die Domain.

#### 2.2.2 Storage API

Persistente Datenspeicherung:

```javascript
// Daten speichern
await chrome.storage.sync.set({ 
  workProfile: {
    workDays: [1,2,3,4,5],
    workStart: '08:00'
  }
});

// Daten laden
const result = await chrome.storage.sync.get(['workProfile']);
console.log(result.workProfile);

// Daten löschen
await chrome.storage.sync.remove(['workProfile']);
```

**Storage-Typen:**
- `chrome.storage.sync` - Synchronisiert zwischen Geräten (max. 100KB)
- `chrome.storage.local` - Nur lokal (max. 5MB)
- `chrome.storage.session` - Nur für aktuelle Session

#### 2.2.3 Message Passing

Kommunikation zwischen Extension-Komponenten:

```javascript
// Von Popup zu Background Script
chrome.runtime.sendMessage({
  action: 'recordAttendance',
  data: { month: '2025-11' }
}, (response) => {
  console.log('Response:', response);
});

// Im Background Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'recordAttendance') {
    // Verarbeitung
    sendResponse({ success: true });
  }
  return true; // Für asynchrone Response
});
```

---

## 3. Personio API Details

### 3.1 Base URL

Die Personio API läuft auf instanzspezifischen Subdomains:

```
https://{company}.app.personio.com
```

Beispiel: `https://aoe-gmbh.app.personio.com`

### 3.2 API Endpunkte

#### 3.2.1 Timesheet Endpoint

**Zweck:** Abrufen des monatlichen Timesheets mit allen Arbeitstagen

**Request:**
```http
GET /svc/attendance-bff/v1/timesheet/{employeeId}?start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}&timezone={timezone}
Host: {company}.app.personio.com
Cookie: [Auth Cookies]
X-XSRF-TOKEN: [Token]
```

**Parameter:**
- `employeeId` (path): Mitarbeiter-ID (z.B. `13011272`)
- `start_date` (query): Startdatum (z.B. `2025-11-01`)
- `end_date` (query): Enddatum (z.B. `2025-11-30`)
- `timezone` (query): Zeitzone (z.B. `Europe/Berlin`, URL-encoded: `Europe%2FBerlin`)

**Response:** Siehe [Datenmodelle - Timesheet Response](#521-timesheet-response)

#### 3.2.2 Attendance Validation Endpoint

**Zweck:** Validierung und Speicherung eines Arbeitstages

**Request:**
```http
POST /svc/attendance-api/validate-and-calculate-full-day?propose-fix=false
Host: {company}.app.personio.com
Cookie: [Auth Cookies]
X-XSRF-TOKEN: [Token]
Content-Type: application/json

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

**Query Parameter:**
- `propose-fix`: Boolean, wenn `false` werden Einträge direkt gespeichert

**Response:** Validierungsresultat mit berechneten Werten

---

## 4. Authentifizierung

### 4.1 Cookie-basierte Authentifizierung

Personio verwendet Cookie-basierte Authentifizierung. Das Plugin extrahiert diese Cookies aus dem Browser.

**KRITISCH - Session Refresh Mechanismus:**

Der `personio_session` Cookie wird durch Aufruf von `/api/v1/projects` gesetzt und ist für alle API-Calls erforderlich.

**Workflow für JEDEN API-Call:**
```
1. GET https://{instance}.app.personio.com/api/v1/projects
   → Setzt frischen personio_session Cookie
   
2. Warte 100ms (Cookie-Propagation)

3. GET/POST zum eigentlichen Endpunkt
   → Verwendet frische Session + XSRF-Token
```

**Ohne Schritt 1:** `403 Invalid CSRF Token` ❌  
**Mit Schritt 1:** Authentifizierung funktioniert ✅

### 4.2 Benötigte Cookies & Tokens

**Wichtig:** Die Authentifizierung erfolgt über den vollständigen Cookie-String, der alle Session-Cookies enthält.

**Benötigte Cookies in der Domain `.app.personio.com`:**

| Cookie-Name | Zweck | Beispielwert |
|-------------|-------|--------------|
| `ATHENA-XSRF-TOKEN` | CSRF-Schutz (Athena Service) | `d9700a00-c3a4-4a70-a10a-166ab945f6dd.73TpF0Pd3q...` |
| `product_language` | Spracheinstellung | `de\|13011272` |
| `ATHENA_SESSION` | Session-ID | `40f67768-0dcb-42a7-9a2c-f72116ea30b8` |
| `personio_session` | Hauptsession-Cookie | `eyJpdiI6IlFPdUthbCswTTdOTTJiOEhvZHk1NlE9PSI...` |
| `_dd_s` | DataDog Session (optional) | `aid=olvza22jdh&rum=2&id=3c63f955...` |

**Domain:** `.app.personio.com` (mit führendem Punkt für alle Subdomains)

### 4.3 Token-Extraktion

```javascript
async function extractAuthCookies(personioInstance) {
  const url = `https://${personioInstance}`;
  
  try {
    // Alle Cookies für die Domain abrufen
    const allCookies = await chrome.cookies.getAll({
      domain: '.app.personio.com'
    });

    if (!allCookies || allCookies.length === 0) {
      throw new Error('Keine Cookies gefunden. Bitte bei Personio einloggen.');
    }

    // Cookie-String zusammenbauen (wie Browser es sendet)
    const cookieString = allCookies
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');

    // Wichtige Cookies validieren
    const requiredCookies = ['ATHENA-XSRF-TOKEN', 'ATHENA_SESSION', 'personio_session'];
    const foundCookies = allCookies.map(c => c.name);
    const missingCookies = requiredCookies.filter(name => !foundCookies.includes(name));

    if (missingCookies.length > 0) {
      console.warn('Fehlende Cookies:', missingCookies);
    }

    // ATHENA-XSRF-TOKEN für X-Xsrf-Token Header extrahieren
    const athenaXsrfCookie = allCookies.find(c => c.name === 'ATHENA-XSRF-TOKEN');
    const xsrfToken = athenaXsrfCookie ? athenaXsrfCookie.value : null;

    return {
      cookieString,
      xsrfToken, // Wird auch als X-Xsrf-Token Header benötigt
      allCookies
    };
  } catch (error) {
    console.error('Cookie extraction failed:', error);
    throw new Error('Authentifizierungs-Cookies konnten nicht extrahiert werden.');
  }
}
```

### 4.4 API Request Headers

```javascript
const headers = {
  'Content-Type': 'application/json',
  'Cookie': authData.cookieString,  // Vollständiger Cookie-String
  'X-Xsrf-Token': authData.xsrfToken // ATHENA-XSRF-TOKEN Wert
};
```

**Wichtig:** 
- Der `Cookie`-Header enthält alle Cookies als String (Format: `name1=value1; name2=value2; ...`)
- Der `X-Xsrf-Token` Header enthält den Wert des `ATHENA-XSRF-TOKEN` Cookies
- Ohne diese Header liefert die API `401 Unauthenticated`

---

## 5. Datenmodelle

### 5.1 Arbeitszeitprofil (Work Profile)

```typescript
interface WorkProfile {
  employeeId: string;           // z.B. "13011272"
  personioInstance: string;     // z.B. "aoe-gmbh.app.personio.com"
  workingDays: number[];        // [1,2,3,4,5] = Mo-Fr (1=Mo, 7=So)
  workStart: string;            // HH:MM Format, z.B. "08:00"
  workEnd: string;              // HH:MM Format, z.B. "17:00"
  breakStart: string;           // HH:MM Format, z.B. "12:00"
  breakEnd: string;             // HH:MM Format, z.B. "13:00"
  timezone: string;             // z.B. "Europe/Berlin"
}
```

**Validierungsregeln:**
- `workEnd > workStart`
- `breakEnd > breakStart`
- `breakStart >= workStart && breakEnd <= workEnd`
- `workingDays.length > 0`

### 5.2 Personio API Modelle

#### 5.2.1 Timesheet Response

```typescript
interface TimesheetResponse {
  timecards: Timecard[];
  widgets: Widgets;
  supervisor_person_id: string;
  owner_has_propose_rights: boolean;
}

interface Timecard {
  day_id: string | null;                    // UUID oder null
  date: string;                             // "YYYY-MM-DD"
  state: "trackable" | "non_trackable";     // Wichtig für Filterung
  is_off_day: boolean;                      // true = kein Arbeitstag
  assigned_working_schedule_id: string;
  periods: Period[];                        // Bereits eingetragene Zeiten
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

interface Period {
  id: string;                               // UUID
  start: string;                            // ISO-8601: "YYYY-MM-DDTHH:MM:SS"
  end: string;                              // ISO-8601: "YYYY-MM-DDTHH:MM:SS"
  project_id: string | null;
  comment: string | null;
  type: "work" | "break";                   // Periodentyp
  origin: string;                           // "web", "mobile"
  is_auto_generated: boolean;
  geolocation: any | null;
}

interface TargetHours {
  effective_work_duration_minutes: number;
  effective_break_duration_minutes: number | null;
  contractual_work_duration_minutes: number;
  contractual_break_duration_minutes: number;
  start_time: string | null;                // "HH:MM"
  end_time: string | null;                  // "HH:MM"
}

interface Approval {
  status: "confirmed" | "pending" | "rejected";
  rejection_reason: string | null;
}

interface Metadata {
  created_at: string;                       // ISO-8601
  updated_at: string;                       // ISO-8601
}

interface Widgets {
  tracked_hours: {
    tracked_minutes: number;
    confirmed_minutes: number;
    target_minutes: number;
    pending_minutes: number;
  };
  overtime: {
    overtime_minutes: number;
    pending_minutes: number | null;
    cliff_minutes: number;
    total_overtime_minutes: number;
  };
  time_off: {
    confirmed_minutes: number;
    pending_minutes: number;
  };
  working_schedule_weeks: WorkingScheduleWeek[];
}
```

#### 5.2.2 Attendance Day Request

```typescript
interface AttendanceDayRequest {
  attendance_day_id: string;                // UUID (von Timesheet oder neu generiert)
  employee_id: number;                      // z.B. 13011272
  periods: AttendancePeriod[];
}

interface AttendancePeriod {
  attendance_period_id: string;             // UUID (neu generiert)
  start: string;                            // "YYYY-MM-DD HH:MM:SS"
  end: string;                              // "YYYY-MM-DD HH:MM:SS"
  period_type: "work" | "break";
  comment: string | null;
  project_id: string | null;
}
```

**Beispiel:**
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

---

## 6. Implementierungsdetails

### 6.1 Workflow Overview

```
1. Plugin öffnen
   ↓
2. Auth-Tokens extrahieren
   ↓
3. Arbeitszeitprofil laden/eingeben
   ↓
4. "Zeiterfassung starten" Button klicken
   ↓
5. Timesheet für aktuellen Monat abrufen
   ↓
6. Tage filtern (trackable, nicht off_day, nicht bereits eingetragen)
   ↓
7. Für jeden Tag:
   a. Arbeitszeiten berechnen (basierend auf Profil)
   b. Periods erstellen (Work-Break-Work)
   c. POST Request an validate-and-calculate-full-day
   d. Response verarbeiten
   e. Fortschritt anzeigen
   ↓
8. Zusammenfassung anzeigen
```

### 6.2 Tag-Filterung

Ein Tag wird eingetragen, wenn ALLE Bedingungen erfüllt sind:

```javascript
function shouldRecordDay(timecard, workProfile) {
  // Prüfung 1: Muss trackable sein
  if (timecard.state !== 'trackable') {
    return false;
  }
  
  // Prüfung 2: Darf kein Off-Day sein
  if (timecard.is_off_day) {
    return false;
  }
  
  // Prüfung 3: Darf noch keine Periods haben
  if (timecard.periods && timecard.periods.length > 0) {
    return false;
  }
  
  // Prüfung 4: Muss ein konfigurierter Arbeitstag sein
  const date = new Date(timecard.date);
  const dayOfWeek = date.getDay(); // 0=So, 1=Mo, ..., 6=Sa
  // Umrechnung auf ISO (1=Mo, 7=So)
  const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
  
  if (!workProfile.workingDays.includes(isoDayOfWeek)) {
    return false;
  }
  
  return true;
}
```

### 6.3 Periods-Generierung

Basierend auf dem Arbeitszeitprofil müssen 3 Periods erstellt werden:

```javascript
function generatePeriods(date, workProfile) {
  const periods = [];
  
  // Period 1: Arbeit von Start bis Pausenbeginn
  periods.push({
    attendance_period_id: generateUUID(),
    start: `${date} ${workProfile.workStart}:00`,
    end: `${date} ${workProfile.breakStart}:00`,
    period_type: 'work',
    comment: null,
    project_id: null
  });
  
  // Period 2: Pause
  periods.push({
    attendance_period_id: generateUUID(),
    start: `${date} ${workProfile.breakStart}:00`,
    end: `${date} ${workProfile.breakEnd}:00`,
    period_type: 'break',
    comment: null,
    project_id: null
  });
  
  // Period 3: Arbeit von Pausenende bis Arbeitsende
  periods.push({
    attendance_period_id: generateUUID(),
    start: `${date} ${workProfile.breakEnd}:00`,
    end: `${date} ${workProfile.workEnd}:00`,
    period_type: 'work',
    comment: null,
    project_id: null
  });
  
  return periods;
}
```

### 6.4 UUID-Generierung

```javascript
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

### 6.5 Datum-Berechnung

```javascript
// Erster und letzter Tag des aktuellen Monats
function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // 0 = letzter Tag des Vormonats
  
  return {
    start: formatDate(startDate),  // "YYYY-MM-DD"
    end: formatDate(endDate)       // "YYYY-MM-DD"
  };
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

### 6.6 API Service Implementation

```javascript
class PersonioAPIService {
  constructor(personioInstance, authData) {
    this.baseUrl = `https://${personioInstance}`;
    this.authData = authData; // { cookieString, xsrfToken }
  }

  async fetchTimesheet(employeeId, startDate, endDate, timezone = 'Europe/Berlin') {
    const url = `${this.baseUrl}/svc/attendance-bff/v1/timesheet/${employeeId}` +
                `?start_date=${startDate}&end_date=${endDate}&timezone=${encodeURIComponent(timezone)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this._getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Timesheet fetch failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  async recordAttendance(attendanceDayRequest) {
    const url = `${this.baseUrl}/svc/attendance-api/validate-and-calculate-full-day?propose-fix=false`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify(attendanceDayRequest)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Attendance record failed: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  }

  _getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Cookie': this.authData.cookieString,
      'X-Xsrf-Token': this.authData.xsrfToken
    };
  }
}
```

**Wichtiger Hinweis:** 
- Chrome Extensions können standardmäßig keine `Cookie`-Header in `fetch()` setzen
- Lösung: Verwenden Sie `chrome.cookies` API und lassen Sie Chrome die Cookies automatisch senden
- Alternative: Nutzen Sie einen Background Service Worker mit entsprechenden Permissions

### 6.6.1 Chrome Extension Implementierung

Da Chrome Extensions keine `Cookie`-Header manuell setzen können, gibt es zwei Ansätze:

**Ansatz 1: Automatische Cookies mit credentials (Empfohlen)**
```javascript
class PersonioAPIService {
  constructor(personioInstance, xsrfToken) {
    this.baseUrl = `https://${personioInstance}`;
    this.xsrfToken = xsrfToken; // Nur ATHENA-XSRF-TOKEN Wert
  }

  async fetchTimesheet(employeeId, startDate, endDate, timezone = 'Europe/Berlin') {
    const url = `${this.baseUrl}/svc/attendance-bff/v1/timesheet/${employeeId}` +
                `?start_date=${startDate}&end_date=${endDate}&timezone=${encodeURIComponent(timezone)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Xsrf-Token': this.xsrfToken
      },
      credentials: 'include' // Chrome sendet automatisch alle Cookies
    });
    
    if (!response.ok) {
      throw new Error(`Timesheet fetch failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  async recordAttendance(attendanceDayRequest) {
    const url = `${this.baseUrl}/svc/attendance-api/validate-and-calculate-full-day?propose-fix=false`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Xsrf-Token': this.xsrfToken
      },
      credentials: 'include', // Chrome sendet automatisch alle Cookies
      body: JSON.stringify(attendanceDayRequest)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Attendance record failed: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  }
}

// Verwendung
const authData = await extractAuthCookies('aoe-gmbh.app.personio.com');
const apiService = new PersonioAPIService('aoe-gmbh.app.personio.com', authData.xsrfToken);
```

**Ansatz 2: XMLHttpRequest (Falls fetch nicht funktioniert)**
```javascript
function makeAuthenticatedRequest(url, method, body, xsrfToken) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-Xsrf-Token', xsrfToken);
    xhr.withCredentials = true; // Sendet Cookies automatisch
    
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    };
    
    xhr.onerror = function() {
      reject(new Error('Network error'));
    };
    
    if (body) {
      xhr.send(JSON.stringify(body));
    } else {
      xhr.send();
    }
  });
}
```

**Wichtig:** Mit `credentials: 'include'` oder `xhr.withCredentials = true` sendet Chrome automatisch alle passenden Cookies für die Domain. Der `Cookie`-Header muss nicht manuell gesetzt werden!

### 6.7 Fehlerbehandlung

```javascript
async function recordDayWithRetry(apiService, dayRequest, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiService.recordAttendance(dayRequest);
      return { success: true, result };
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await sleep(1000 * Math.pow(2, attempt - 1));
      }
    }
  }
  
  return { 
    success: false, 
    error: lastError.message 
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## 7. Best Practices

### 7.1 Sicherheit

1. **Niemals Tokens loggen**
   ```javascript
   // FALSCH
   console.log('Token:', token);
   
   // RICHTIG
   console.log('Token verfügbar:', !!token);
   ```

2. **Sichere Storage-Nutzung**
   ```javascript
   // Sensible Daten nur in chrome.storage.local
   await chrome.storage.local.set({ 
     tokens: tokens  // Nicht sync!
   });
   ```

3. **Content Security Policy im Manifest**
   ```json
   {
     "content_security_policy": {
       "extension_pages": "script-src 'self'; object-src 'self'"
     }
   }
   ```

### 7.2 Performance

1. **Rate Limiting**
   ```javascript
   async function recordAllDays(days, apiService) {
     for (const day of days) {
       await recordDay(day, apiService);
       await sleep(1000); // 1 Sekunde zwischen Requests
     }
   }
   ```

2. **Lazy Loading**
   - Timesheet nur bei Bedarf laden
   - UI sofort anzeigen, Daten asynchron laden

3. **Caching**
   ```javascript
   // Timesheet für 5 Minuten cachen
   const CACHE_TTL = 5 * 60 * 1000;
   ```

### 7.3 Fehlerbehandlung

1. **Benutzerfreundliche Fehlermeldungen**
   ```javascript
   function getErrorMessage(error) {
     if (error.status === 401) {
       return 'Sitzung abgelaufen. Bitte neu einloggen.';
     } else if (error.status === 429) {
       return 'Zu viele Anfragen. Bitte später versuchen.';
     } else {
       return 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
     }
   }
   ```

2. **Graceful Degradation**
   - Bei Fehler in einem Tag: Weitermachen mit nächstem Tag
   - Teilweise Erfolge anzeigen

### 7.4 Code-Organisation

```
extension/
├── manifest.json
├── background/
│   ├── service-worker.js
│   └── api-service.js
├── content/
│   └── content-script.js
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── utils/
│   ├── date-utils.js
│   ├── uuid-utils.js
│   └── validation.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 8. Troubleshooting

### 8.1 Häufige Probleme

#### Problem: Cookies können nicht extrahiert werden

**Symptome:** `chrome.cookies.get()` liefert `null`

**Lösungen:**
1. Prüfen ob `cookies` Permission im Manifest vorhanden
2. Prüfen ob `host_permissions` für Domain gesetzt
3. Prüfen ob Benutzer eingeloggt ist
4. Browser-Cache leeren und neu einloggen

#### Problem: API Calls schlagen fehl (401 Unauthorized)

**Symptome:** API liefert 401 Status

**Lösungen:**
1. Tokens neu extrahieren
2. Prüfen ob alle 3 Tokens vorhanden
3. Session könnte abgelaufen sein → Neu einloggen
4. Prüfen ob Header korrekt gesetzt

#### Problem: UUIDs werden nicht akzeptiert

**Symptome:** API liefert Validierungsfehler

**Lösungen:**
1. UUID Format prüfen (muss Version 4 sein)
2. Für neue Tage: `day_id` muss neu generiert werden
3. Für existierende Tage: `day_id` aus Timesheet verwenden

#### Problem: Zeitformat wird abgelehnt

**Symptome:** API liefert "Invalid time format"

**Lösungen:**
1. Format muss exakt sein: `YYYY-MM-DD HH:MM:SS`
2. Keine ISO-8601 Timestamps (kein `T`, kein `Z`)
3. Sekunden immer auf `:00` setzen

### 8.2 Debugging

```javascript
// Debug Mode aktivieren
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.log('[Personio Recorder]', ...args);
  }
}

// Verwendung
debugLog('Fetching timesheet for employee:', employeeId);
debugLog('Tokens available:', {
  athena: !!tokens.xAthenaXsrfToken,
  xsrf: !!tokens.xXsrfToken,
  csrf: !!tokens.xCsrfToken
});
```

### 8.3 Chrome DevTools

**Extension Debugging:**
1. `chrome://extensions/` öffnen
2. "Entwicklermodus" aktivieren
3. "Hintergrund-Seite" oder "Service Worker" inspizieren
4. Popup mit Rechtsklick → "Untersuchen"

**Network Requests überwachen:**
1. DevTools öffnen (F12)
2. Network Tab
3. Filter auf "XHR" oder "Fetch"
4. Requests zu `personio.com` beobachten

### 8.4 Logging Best Practices

```javascript
// Strukturiertes Logging
const logger = {
  info: (message, data) => {
    console.log(`[INFO] ${message}`, data ? data : '');
  },
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, {
      message: error.message,
      stack: error.stack
    });
  },
  success: (message, data) => {
    console.log(`[SUCCESS] ${message}`, data ? data : '');
  }
};

// Verwendung
logger.info('Starting attendance recording');
logger.error('API call failed', error);
logger.success('Recorded 5 days successfully');
```

---

## 9. Referenzen & Links

### 9.1 Offizielle Dokumentation

- **Chrome Extensions:** https://developer.chrome.com/docs/extensions/
- **Manifest V3:** https://developer.chrome.com/docs/extensions/mv3/intro/
- **Chrome APIs:** https://developer.chrome.com/docs/extensions/reference/
- **Personio API:** https://developer.personio.de/reference

### 9.2 Tools & Libraries

- **UUID Generator:** Eingebaut in moderne Browser (crypto.randomUUID())
- **Date Libraries:** Native JavaScript Date oder date-fns
- **Storage:** Chrome Storage API (eingebaut)

### 9.3 Testing

- **Manual Testing:** Chrome Extension laden und testen
- **Automated Testing:** Jest mit chrome-mock
- **E2E Testing:** Puppeteer oder Playwright

---

## 10. Glossar

| Begriff | Erklärung |
|---------|-----------|
| **Timecard** | Ein Tag im Timesheet mit allen Informationen |
| **Period** | Ein Zeitabschnitt (work oder break) innerhalb eines Tages |
| **Trackable** | Tag kann bearbeitet werden |
| **Off-Day** | Freier Tag (Wochenende, Feiertag) |
| **Attendance Day** | Ein kompletter Arbeitstag mit allen Periods |
| **CSRF Token** | Cross-Site Request Forgery Token zur Sicherheit |
| **UUID** | Universally Unique Identifier (Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx) |
| **BFF** | Backend-For-Frontend (API-Pattern) |

---

## Änderungshistorie

| Version | Datum | Änderungen |
|---------|-------|------------|
| 1.0.0 | 2025-11-04 | Initiale Knowledge Base erstellt |

---

**Ende der Knowledge Base**

