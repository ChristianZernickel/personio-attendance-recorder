# Architektur - Personio Attendance Recorder

**Projekt:** Personio Attendance Recorder Chrome Plugin  
**Version:** 0.1.0  
**Datum:** 04. November 2025  
**Status:** Design Phase

---

## Inhaltsverzeichnis

1. [Systemübersicht](#1-systemübersicht)
2. [Komponentenarchitektur](#2-komponentenarchitektur)
3. [Datenfluss](#3-datenfluss)
4. [Technologie-Stack](#4-technologie-stack)
5. [Sicherheitsarchitektur](#5-sicherheitsarchitektur)
6. [Deployment](#6-deployment)

---

## 1. Systemübersicht

### 1.1 High-Level Architektur

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Chrome)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │      Personio Attendance Recorder Extension       │  │
│  ├───────────────────────────────────────────────────┤  │
│  │                                                   │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │  │
│  │  │  Popup   │  │ Content  │  │  Background  │   │  │
│  │  │   UI     │  │  Script  │  │   Service    │   │  │
│  │  │          │  │          │  │   Worker     │   │  │
│  │  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │  │
│  │       │             │               │           │  │
│  │       └─────────────┼───────────────┘           │  │
│  │                     │                           │  │
│  │       ┌─────────────▼────────────┐              │  │
│  │       │   API Service Layer      │              │  │
│  │       │   - Auth Manager         │              │  │
│  │       │   - Timesheet Service    │              │  │
│  │       │   - Attendance Service   │              │  │
│  │       └─────────────┬────────────┘              │  │
│  │                     │                           │  │
│  │       ┌─────────────▼────────────┐              │  │
│  │       │   Storage Manager        │              │  │
│  │       │   - Work Profile         │              │  │
│  │       │   - Settings             │              │  │
│  │       └──────────────────────────┘              │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │            Chrome APIs                            │  │
│  │  - Cookies API                                    │  │
│  │  - Storage API                                    │  │
│  │  - Runtime API                                    │  │
│  └─────────────┬─────────────────────────────────────┘  │
│                │                                        │
└────────────────┼────────────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────┐
    │   Personio Platform    │
    │  - Attendance BFF API  │
    │  - Attendance API      │
    └────────────────────────┘
```

### 1.2 Systemkontext

**Externe Systeme:**
- **Personio Web Application** - Quelle für Authentifizierungs-Cookies
- **Personio API** - REST API für Zeiterfassung

**Benutzer:**
- **End User** - Personio-Nutzer der Zeiterfassung automatisieren möchte

---

## 2. Komponentenarchitektur

### 2.1 Komponenten-Übersicht

#### 2.1.1 Popup UI

**Zweck:** Benutzeroberfläche für Interaktion mit dem Plugin

**Verantwortlichkeiten:**
- Anzeige des Authentifizierungs-Status
- Eingabe und Verwaltung des Arbeitszeitprofils
- Start der Zeiterfassung
- Anzeige von Fortschritt und Ergebnissen
- Fehlerbehandlung und User-Feedback

**Technologien:**
- HTML5
- CSS3
- Vanilla JavaScript / TypeScript

**Dateien:**
```
popup/
├── popup.html
├── popup.js
├── popup.css
└── components/
    ├── auth-status.js
    ├── work-profile-form.js
    ├── progress-bar.js
    └── result-summary.js
```

#### 2.1.2 Content Script

**Zweck:** Interaktion mit der Personio-Webseite

**Verantwortlichkeiten:**
- Erkennung ob Benutzer auf Personio-Seite ist
- Optionale DOM-Manipulation (falls nötig)
- Kommunikation zwischen Page und Extension

**Technologien:**
- JavaScript / TypeScript

**Dateien:**
```
content/
└── content-script.js
```

**Hinweis:** Aktuell minimal, da hauptsächlich Cookie-Extraktion über Chrome API erfolgt.

#### 2.1.3 Background Service Worker

**Zweck:** Hintergrundprozesse und zentrale Logik

**Verantwortlichkeiten:**
- Lifecycle Management der Extension
- Message Passing Koordination
- API-Calls orchestrieren
- Fehler-Logging
- Event Handling

**Technologien:**
- JavaScript / TypeScript (Manifest V3 Service Worker)

**Dateien:**
```
background/
├── service-worker.js
└── event-handlers.js
```

#### 2.1.4 API Service Layer

**Zweck:** Abstraktion der Personio API Kommunikation

**Komponenten:**

##### Auth Manager
```javascript
class AuthManager {
  async extractTokens(personioInstance)
  async validateTokens(tokens)
  async isAuthenticated()
}
```

##### Timesheet Service
```javascript
class TimesheetService {
  async fetchTimesheet(employeeId, startDate, endDate, timezone)
  async getRecordableDays(timesheet, workProfile)
}
```

##### Attendance Service
```javascript
class AttendanceService {
  async recordDay(dayId, employeeId, periods)
  async recordMultipleDays(days, employeeId)
}
```

**Dateien:**
```
services/
├── auth-manager.js
├── timesheet-service.js
├── attendance-service.js
└── api-client.js
```

#### 2.1.5 Storage Manager

**Zweck:** Datenpersistenz und -verwaltung

**Verantwortlichkeiten:**
- Speichern/Laden von Arbeitszeitprofilen
- Speichern/Laden von Einstellungen
- Cache-Management
- Datenmigration bei Updates

**API:**
```javascript
class StorageManager {
  async saveWorkProfile(profile)
  async loadWorkProfile()
  async saveSettings(settings)
  async loadSettings()
  async clearAll()
}
```

**Dateien:**
```
storage/
├── storage-manager.js
└── migrations.js
```

---

### 2.2 Datenschichten

```
┌─────────────────────────────────────┐
│      Presentation Layer             │
│      (Popup UI)                     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Business Logic Layer           │
│      (Services)                     │
│  - AuthManager                      │
│  - TimesheetService                 │
│  - AttendanceService                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Data Access Layer              │
│  - API Client                       │
│  - Storage Manager                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      External Systems               │
│  - Personio API                     │
│  - Chrome APIs                      │
└─────────────────────────────────────┘
```

---

## 3. Datenfluss

### 3.1 Zeiterfassungs-Workflow

```
User                Popup UI        Background          Services            Personio API
  │                   │               │                   │                      │
  │  Click "Start"    │               │                   │                      │
  ├──────────────────>│               │                   │                      │
  │                   │               │                   │                      │
  │                   │  Extract Auth │                   │                      │
  │                   ├──────────────>│                   │                      │
  │                   │               │  Get Tokens       │                      │
  │                   │               ├──────────────────>│                      │
  │                   │               │  (AuthManager)    │                      │
  │                   │               │                   │                      │
  │                   │               │<──────────────────┤                      │
  │                   │               │  Tokens           │                      │
  │                   │               │                   │                      │
  │                   │               │  Fetch Timesheet  │                      │
  │                   │               ├──────────────────>│                      │
  │                   │               │  (TimesheetSvc)   │                      │
  │                   │               │                   │  GET /timesheet      │
  │                   │               │                   ├─────────────────────>│
  │                   │               │                   │                      │
  │                   │               │                   │<─────────────────────┤
  │                   │               │                   │  Timesheet Data      │
  │                   │               │                   │                      │
  │                   │               │<──────────────────┤                      │
  │                   │               │  Timesheet        │                      │
  │                   │               │                   │                      │
  │  Show Progress    │               │                   │                      │
  │<──────────────────┤               │                   │                      │
  │  "Processing..."  │               │                   │                      │
  │                   │               │                   │                      │
  │                   │               │  For each day:    │                      │
  │                   │               │  Record Day       │                      │
  │                   │               ├──────────────────>│                      │
  │                   │               │ (AttendanceSvc)   │                      │
  │                   │               │                   │  POST /validate...   │
  │                   │               │                   ├─────────────────────>│
  │                   │               │                   │                      │
  │                   │               │                   │<─────────────────────┤
  │                   │               │                   │  Success/Error       │
  │                   │               │                   │                      │
  │  Update Progress  │               │<──────────────────┤                      │
  │<──────────────────┤               │  Result           │                      │
  │  "Day 1/5 done"   │               │                   │                      │
  │                   │               │                   │                      │
  │                   │               │  [Repeat]         │                      │
  │                   │               │                   │                      │
  │  Show Summary     │               │                   │                      │
  │<──────────────────┤               │                   │                      │
  │  "5/5 success"    │               │                   │                      │
  │                   │               │                   │                      │
```

### 3.2 Authentifizierungs-Flow

```
1. User öffnet Extension auf Personio-Seite
   │
   ├─> AuthManager.extractTokens()
   │   │
   │   ├─> chrome.cookies.get("X-ATHENA-XSRF-TOKEN")
   │   ├─> chrome.cookies.get("X-XSRF-TOKEN")
   │   └─> chrome.cookies.get("X-CSRF-TOKEN")
   │
   └─> AuthManager.validateTokens()
       │
       └─> Alle Tokens vorhanden? → Success
           └─> Fehlt ein Token? → Error
```

### 3.3 Daten-Persistenz

```
Storage Structure:

chrome.storage.local
├── workProfile
│   ├── employeeId: "13011272"
│   ├── personioInstance: "aoe-gmbh.app.personio.com"
│   ├── workingDays: [1,2,3,4,5]
│   ├── workStart: "08:00"
│   ├── workEnd: "17:00"
│   ├── breakStart: "12:00"
│   ├── breakEnd: "13:00"
│   └── timezone: "Europe/Berlin"
│
├── settings
│   ├── language: "de"
│   ├── autoRecordEnabled: false
│   └── theme: "light"
│
└── cache
    └── lastTimesheet
        ├── data: {...}
        └── timestamp: 1699104000000
```

---

## 4. Technologie-Stack

### 4.1 Frontend

| Technologie | Version | Zweck |
|------------|---------|-------|
| HTML5 | - | UI Struktur |
| CSS3 | - | Styling |
| JavaScript / TypeScript | ES2020+ | Programmierung |
| Chrome Extension API | Manifest V3 | Extension Framework |

### 4.2 APIs

| API | Zweck |
|-----|-------|
| Chrome Cookies API | Cookie-Extraktion |
| Chrome Storage API | Datenpersistenz |
| Chrome Runtime API | Message Passing |
| Chrome Tabs API | Tab-Management |
| Fetch API | HTTP Requests |

### 4.3 Build Tools (Optional)

| Tool | Zweck |
|------|-------|
| Webpack / Vite | Bundling |
| TypeScript Compiler | Transpilation |
| ESLint | Code Quality |
| Prettier | Code Formatting |

---

## 5. Sicherheitsarchitektur

### 5.1 Sicherheitsprinzipien

1. **Least Privilege** - Nur notwendige Permissions
2. **Defense in Depth** - Multiple Sicherheitsschichten
3. **Secure by Default** - Sichere Standardkonfiguration
4. **Input Validation** - Alle Eingaben validieren

### 5.2 Sicherheitsmaßnahmen

#### 5.2.1 Content Security Policy

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

**Effekt:**
- Nur eigene Skripte werden ausgeführt
- Keine Inline-Scripts
- Keine externen Ressourcen

#### 5.2.2 Permissions

**Minimal Required:**
```json
{
  "permissions": [
    "cookies",
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://*.app.personio.com/*"
  ]
}
```

**Begründung:**
- `cookies` - Für Token-Extraktion
- `storage` - Für Profile-Speicherung
- `activeTab` - Für Tab-Informationen
- `host_permissions` - Nur für Personio-Domains

#### 5.2.3 Token-Handling

```javascript
// ✅ Richtig
class SecureAuthManager {
  async extractTokens() {
    const tokens = {/* ... */};
    
    // Niemals loggen!
    console.log('Tokens extracted:', tokens ? 'Yes' : 'No');
    
    // Nur im memory halten, nicht in sync storage
    await chrome.storage.local.set({ tokens });
    
    return tokens;
  }
}

// ❌ Falsch
console.log('Token:', token); // Niemals!
localStorage.setItem('token', token); // Nicht web-accessible!
chrome.storage.sync.set({ token }); // Nicht synchronisieren!
```

#### 5.2.4 Input Validation

```javascript
class Validator {
  static validateWorkProfile(profile) {
    // Employee ID
    if (!profile.employeeId || typeof profile.employeeId !== 'string') {
      throw new Error('Invalid employee ID');
    }
    
    // Time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(profile.workStart)) {
      throw new Error('Invalid work start time');
    }
    
    // Working days (1-7)
    if (!Array.isArray(profile.workingDays) || 
        profile.workingDays.some(d => d < 1 || d > 7)) {
      throw new Error('Invalid working days');
    }
    
    return true;
  }
}
```

### 5.3 Threat Model

| Bedrohung | Risiko | Gegenmaßnahme |
|-----------|--------|---------------|
| Token-Diebstahl | HOCH | Tokens nur in local storage, CSP |
| XSS | MITTEL | CSP, Input Validation |
| CSRF | NIEDRIG | Tokens werden von Personio bereitgestellt |
| Man-in-the-Middle | NIEDRIG | HTTPS enforced |
| Privilege Escalation | NIEDRIG | Minimal Permissions |

---

## 6. Deployment

### 6.1 Build-Prozess

```bash
# Development
npm install
npm run build:dev

# Production
npm run build:prod
npm run package
```

### 6.2 Verzeichnisstruktur (Production)

```
dist/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── background/
│   └── service-worker.js
├── content/
│   └── content-script.js
├── services/
│   ├── auth-manager.js
│   ├── timesheet-service.js
│   └── attendance-service.js
├── utils/
│   ├── validator.js
│   └── uuid-generator.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 6.3 Distribution

**Option 1: Chrome Web Store**
- Öffentliche Veröffentlichung
- Automatische Updates
- Vertrauenswürdige Quelle

**Option 2: Enterprise Distribution**
- Private Verteilung
- Firmen-internes Tool
- Manuelle Installation

### 6.4 Update-Strategie

**Versionierung:** Semantic Versioning (MAJOR.MINOR.PATCH)

**Update-Typen:**
- **PATCH (0.0.X)** - Bugfixes, keine neuen Features
- **MINOR (0.X.0)** - Neue Features, backwards compatible
- **MAJOR (X.0.0)** - Breaking Changes

**Chrome Web Store Updates:**
- Automatisch bei Veröffentlichung neuer Version
- User erhält Update innerhalb von 24h

---

## 7. Monitoring & Logging

### 7.1 Logging-Strategie

```javascript
const Logger = {
  level: 'INFO', // DEBUG, INFO, WARN, ERROR
  
  debug: (message, data) => {
    if (Logger.level === 'DEBUG') {
      console.debug(`[DEBUG] ${message}`, data);
    }
  },
  
  info: (message, data) => {
    console.log(`[INFO] ${message}`, data || '');
  },
  
  warn: (message, data) => {
    console.warn(`[WARN] ${message}`, data || '');
  },
  
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, {
      message: error?.message,
      stack: error?.stack
    });
  }
};
```

### 7.2 Error Tracking

```javascript
class ErrorTracker {
  static track(error, context) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context: context
    };
    
    // Speichern für Debugging
    chrome.storage.local.get(['errorLogs'], (result) => {
      const logs = result.errorLogs || [];
      logs.push(errorLog);
      
      // Maximal 50 Logs behalten
      if (logs.length > 50) {
        logs.shift();
      }
      
      chrome.storage.local.set({ errorLogs: logs });
    });
  }
}
```

### 7.3 Performance Monitoring

```javascript
class PerformanceMonitor {
  static async measureAsyncOperation(name, operation) {
    const start = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - start;
      
      console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`[PERF] ${name} failed after ${duration.toFixed(2)}ms`);
      throw error;
    }
  }
}

// Usage
const timesheet = await PerformanceMonitor.measureAsyncOperation(
  'Fetch Timesheet',
  () => timesheetService.fetchTimesheet(employeeId, start, end)
);
```

---

## 8. Testing-Strategie

### 8.1 Test-Pyramide

```
       ┌───────┐
      ╱ E2E    ╲    5% - User Flows
     ╱─────────╲
    ╱Integration╲   25% - Service Integration
   ╱─────────────╲
  ╱   Unit Tests  ╲  70% - Funktionen, Utils
 ╱─────────────────╲
```

### 8.2 Test-Typen

**Unit Tests:**
- Validator
- UUID Generator
- Date Utils
- Storage Manager

**Integration Tests:**
- API Service Layer
- Auth Flow
- Storage Operations

**E2E Tests:**
- Complete Recording Workflow
- Error Scenarios
- UI Interactions

---

## 9. Erweiterbarkeit

### 9.1 Plugin-Architektur (Future)

```javascript
// Erweiterbar für zukünftige Features
class PluginSystem {
  constructor() {
    this.plugins = [];
  }
  
  register(plugin) {
    this.plugins.push(plugin);
  }
  
  async executeHook(hookName, data) {
    for (const plugin of this.plugins) {
      if (plugin[hookName]) {
        data = await plugin[hookName](data);
      }
    }
    return data;
  }
}

// Beispiel Plugin: Feiertags-Filter
class HolidayPlugin {
  async beforeRecordDay(day) {
    if (this.isHoliday(day.date)) {
      day.skip = true;
    }
    return day;
  }
}
```

### 9.2 Feature-Flags

```javascript
const Features = {
  AUTO_RECORD: false,
  MULTI_PROFILE: false,
  HOLIDAY_DETECTION: false,
  OVERTIME_TRACKING: false
};

if (Features.AUTO_RECORD) {
  // Implementierung
}
```

---

## 10. Glossar

| Begriff | Beschreibung |
|---------|--------------|
| **Service Worker** | Background Script in Manifest V3 |
| **Content Script** | Script das auf Webseiten läuft |
| **Message Passing** | Kommunikation zwischen Extension-Komponenten |
| **Storage API** | Chrome API für Datenpersistenz |
| **CSP** | Content Security Policy |

---

## Änderungshistorie

| Version | Datum | Änderungen |
|---------|-------|------------|
| 0.1.0 | 2025-11-04 | Initiale Architektur-Dokumentation |

---

**Ende der Architektur-Dokumentation**

