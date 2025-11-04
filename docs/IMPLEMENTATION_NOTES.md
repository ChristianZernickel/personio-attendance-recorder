# Implementierungshinweise - Authentifizierung

**Datum:** 04. November 2025  
**Status:** Wichtig - Vor Implementierung lesen!

---

## ⚠️ Wichtige Erkenntnisse zur Personio API Authentifizierung

### 1. Cookie-basierte Authentifizierung

Die Personio API verwendet **vollständige Cookie-Authentifizierung**, nicht einzelne CSRF-Token-Header.

**KRITISCH:** Die Cookies (besonders `personio_session`) ändern sich bei jedem Request! 

### 2. Session-Refresh-Mechanismus (WICHTIG!)

**Entdeckung:** Der `personio_session` Cookie wird gesetzt, wenn man `/api/v1/projects` aufruft!

### 3. 3-Schritt-Prozess zum Speichern (KRITISCH!)

**Wichtige Entdeckung:** Das Speichern einer Zeiterfassung ist ein **3-Schritt-Prozess**:

```
Schritt 1: GET /api/v1/projects 
          → Setzt frischen personio_session Cookie
          → Warte 100ms

Schritt 2: POST /validate-and-calculate-full-day 
          → Validiert die Daten (speichert NICHT!)
          → Payload: { attendance_day_id, employee_id, periods[] }
          → Format: "YYYY-MM-DD HH:MM:SS"
          → Response: { success: true, work_duration_in_min: 480, ... }

Schritt 3: PUT /v1/days/{day_id}
          → Speichert tatsächlich die Zeiterfassung!
          → Payload: { employee_id, periods[], original_periods, ... }
          → Format: "YYYY-MM-DDTHH:MM:SS" (ISO-8601 mit T!)
          → Response: Gespeicherter Day
```

**Ohne Schritt 3:** Daten werden nur validiert, aber NICHT gespeichert! ❌  
**Mit allen 3 Schritten:** Zeiterfassung wird gespeichert ✅

### 2. Erforderliche Header

Jeder API-Request benötigt:

```http
Cookie: ATHENA-XSRF-TOKEN=...; ATHENA_SESSION=...; personio_session=...; product_language=...
X-Xsrf-Token: {wert-von-ATHENA-XSRF-TOKEN}
Content-Type: application/json
```

**Ohne diese Header:** `401 Unauthenticated`

### 3. Benötigte Cookies

| Cookie | Erforderlich | Beschreibung |
|--------|--------------|--------------|
| `ATHENA-XSRF-TOKEN` | ✅ | CSRF-Token (auch als X-Xsrf-Token Header) |
| `ATHENA_SESSION` | ✅ | Session-ID |
| `personio_session` | ✅ | Hauptsession |
| `product_language` | ❌ | Spracheinstellung (z.B. `de\|13011272`) |
| `_dd_s` | ❌ | DataDog Session |

**Beispiel Cookie-String:**
```
ATHENA-XSRF-TOKEN=d9700a00-c3a4-4a70-a10a-166ab945f6dd.73TpF0Pd3qFll1-PdajCqg5uOKyqytz3oPvr2-Z3LTA; product_language=de|13011272; ATHENA_SESSION=40f67768-0dcb-42a7-9a2c-f72116ea30b8; _dd_s=aid=olvza22jdh&rum=2&id=3c63f955-e2ce-4a40-938f-ddfacca5d710&created=1762237681106&expire=1762244302510; personio_session=eyJpdiI6IlFPdUthbCswTTdOTTJiOEhvZHk1NlE9PSIsInZhbHVlIjoiYThTQlRlKzFJV2FZcVNiTmdTN3BsZlpkWjFGemgxQklGOVFrOElqWGhEakRkSUgrQ3BLN1NacFNrVlhQbG44djBYWUVoUi9aZlhVTjVra09OQnEzU29vTzJHSFhTcXAxNnlqb3pvTUtUYUVPaXYvRDZKUmZKdlFnU056c2szT0YiLCJtYWMiOiJhZTQ4ZDUzN2IzNjcyNzAyNzgzNDEwMjYxMjlhNTdiODI5MTMzYjY2ZmZkOTIyNjI1YjY3MDhmMzIwNDY5MTNiIiwidGFnIjoiIn0%3D
```

---

## 🔧 Chrome Extension Implementierung

### Problem: Cookie-Header in fetch()

Chrome Extensions können **keine** `Cookie`-Header manuell in `fetch()` setzen - dies ist aus Sicherheitsgründen blockiert.

### Lösung: 3-Schritt-Prozess mit Session Refresh

**WICHTIG:** Jeder Eintrag benötigt 3 API-Calls:

```javascript
class PersonioAPIClient {
  async refreshSession() {
    // SCHRITT 1: /api/v1/projects aufrufen → Setzt personio_session
    const response = await fetch(`${this.baseUrl}/api/v1/projects`, {
      method: 'GET',
      headers: { 'X-Xsrf-Token': currentXsrfToken },
      credentials: 'include'
    });
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async recordAttendance(attendanceDayRequest) {
    // SCHRITT 1: Session refresh
    await this.refreshSession();
    
    // SCHRITT 2: Frische Auth-Daten holen
    const authData = await this.authManager.extractAuthData();
    
    // SCHRITT 3: Validierung (POST)
    const validateResponse = await fetch(
      `${this.baseUrl}/svc/attendance-api/validate-and-calculate-full-day?propose-fix=false`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Xsrf-Token': authData.xsrfToken
        },
        credentials: 'include',
        body: JSON.stringify(attendanceDayRequest)
      }
    );
    
    const validation = await validateResponse.json();
    console.log('Validated:', validation);
    
    // SCHRITT 4: Speichern (PUT) - KRITISCH!
    const savePeriods = attendanceDayRequest.periods.map(p => ({
      id: p.attendance_period_id,
      comment: p.comment,
      period_type: p.period_type,
      project_id: p.project_id,
      start: p.start.replace(' ', 'T'), // "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DDTHH:MM:SS"
      end: p.end.replace(' ', 'T'),
      auto_generated: false
    }));
    
    const saveResponse = await fetch(
      `${this.baseUrl}/svc/attendance-api/v1/days/${attendanceDayRequest.attendance_day_id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Xsrf-Token': authData.xsrfToken
        },
        credentials: 'include',
        body: JSON.stringify({
          employee_id: attendanceDayRequest.employee_id,
          periods: savePeriods,
          original_periods: null,
          geolocation: null,
          is_from_clock_out: false
        })
      }
    );
    
    return await saveResponse.json();
  }
}
```

---

## 📋 Vollständiges Beispiel

```javascript
// 1. Initialize AuthManager
const authManager = new AuthManager();

// 2. API Service mit AuthManager
const apiClient = new PersonioAPIClient('aoe-gmbh.app.personio.com', authManager);

// 3. Jeder API Call macht automatisch:
//    a) refreshSession() → /api/v1/projects → Setzt personio_session
//    b) extractAuthData() → Holt frischen XSRF-Token
//    c) POST /validate-and-calculate-full-day → Validiert
//    d) PUT /v1/days/{day_id} → Speichert tatsächlich!

// Timesheet abrufen
const timesheet = await apiClient.fetchTimesheet(13011272, '2025-11-01', '2025-11-30');
// Intern: refreshSession() → extractAuthData() → GET /timesheet

// Attendance eintragen
const result = await apiClient.recordAttendance({
  attendance_day_id: "9c1f7025-7145-4deb-97fd-63b2a3365c52",
  employee_id: 13011272,
  periods: [
    {
      attendance_period_id: "f55e0de3-58ec-42c1-a234-c300e8e56a8a",
      start: "2025-11-03 08:00:00",
      end: "2025-11-03 17:00:00",
      period_type: "work",
      comment: null,
      project_id: null
    },
    {
      attendance_period_id: "e24b0f56-2fcb-48c6-a074-1693dfaa9e09",
      start: "2025-11-03 12:00:00",
      end: "2025-11-03 13:00:00",
      period_type: "break",
      comment: null,
      project_id: null
    }
  ]
});
// Intern: 
// 1. refreshSession() 
// 2. POST /validate-and-calculate-full-day (validiert)
// 3. PUT /v1/days/{day_id} (speichert!)
```

**Wichtig:** `recordAttendance()` führt 2 API-Calls durch (validate + save)!

---

## ⚡ Manifest Permissions

Stellen Sie sicher, dass folgende Permissions gesetzt sind:

```json
{
  "permissions": [
    "cookies",
    "storage"
  ],
  "host_permissions": [
    "https://*.app.personio.com/*"
  ]
}
```

---

## 🐛 Troubleshooting

### Problem: 401 Unauthenticated

**Mögliche Ursachen:**
1. ❌ `credentials: 'include'` fehlt
2. ❌ `X-Xsrf-Token` Header fehlt oder falsch
3. ❌ Cookies sind abgelaufen → Neu einloggen
4. ❌ Falscher Domain/URL

**Lösung:**
```javascript
// Prüfe ob Cookies vorhanden sind
const cookies = await chrome.cookies.getAll({
  domain: '.app.personio.com'
});
console.log('Gefundene Cookies:', cookies.map(c => c.name));

// Prüfe ATHENA-XSRF-TOKEN
const xsrf = cookies.find(c => c.name === 'ATHENA-XSRF-TOKEN');
console.log('XSRF Token vorhanden:', !!xsrf);
```

### Problem: 403 Invalid CSRF Token

**Ursache:** Der `personio_session` Cookie ist veraltet oder fehlt!

**Lösung:**
- ✅ VOR jedem Request `/api/v1/projects` aufrufen
- ✅ Dies setzt einen frischen `personio_session` Cookie
- ✅ Dann erst den eigentlichen Request machen

**Code-Beispiel:**
```javascript
// ❌ FALSCH - Direkt API aufrufen
const response = await fetch('/svc/attendance-api/...', {...});
// → 403 Invalid CSRF Token

// ✅ RICHTIG - Erst Session refresh
await fetch('/api/v1/projects', { credentials: 'include' });
await sleep(100); // Cookie propagieren lassen
const response = await fetch('/svc/attendance-api/...', {...});
// → 200 OK
```

**Debug-Check:**
```javascript
// Nach refreshSession() sollte personio_session neu sein:
const cookies = await chrome.cookies.getAll({ domain: '.app.personio.com' });
const sessionCookie = cookies.find(c => c.name === 'personio_session');
console.log('Session Cookie Alter:', Date.now() - (sessionCookie.expirationDate * 1000));
```

### Problem: Cookie wird nicht gesendet

**Ursache:** `credentials` fehlt oder Host Permissions nicht gesetzt

**Lösung:**
1. Füge `credentials: 'include'` hinzu
2. Prüfe `host_permissions` im Manifest
3. Extension neu laden

---

## 📚 Weitere Dokumentation

- [Knowledge Base](./knowledge-base.md#4-authentifizierung)
- [API-Referenz](./api-reference.md#2-authentifizierung)
- [Anforderungskatalog](./anforderungskatalog.md#fr-01-authentifizierung-über-cookie-extraktion)

---

**Wichtig:** Diese Implementierungshinweise basieren auf realen Tests und sollten vor der Entwicklung berücksichtigt werden!

