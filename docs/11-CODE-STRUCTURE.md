# Code Structure - Personio Attendance Recorder

> **Detaillierte Dateistruktur & Organisation** | Version 0.3.0

## 📋 Inhaltsverzeichnis

1. [Projektübersicht](#projektübersicht)
2. [Verzeichnisstruktur](#verzeichnisstruktur)
3. [Haupt-Komponenten](#haupt-komponenten)
4. [Service Layer](#service-layer)
5. [Dateigrößen & LOC](#dateigrößen--loc)
6. [Dependencies](#dependencies)

---

## 🗂️ Projektübersicht

```
personio-attendance-recorder/
├── 📄 manifest.json              (39 lines)
├── 📄 README.md                   
├── 📄 CHANGELOG.md               
├── 📄 INSTALL.md                 
│
├── 📁 background/                # Background Service Worker
│   └── service-worker.js         (40 lines)
│
├── 📁 content/                   # Content Scripts
│   └── content-script.js         (34 lines, LEGACY)
│
├── 📁 popup/                     # User Interface
│   ├── popup.html                (UI Structure)
│   ├── popup.css                 (Styling)
│   └── popup.js                  (466 lines)
│
├── 📁 services/                  # Business Logic (Service Layer)
│   ├── auth-manager.js           (~80 lines)
│   ├── api-client.js             (~250 lines)
│   ├── timesheet-service.js      (~100 lines)
│   ├── attendance-service.js     (~150 lines)
│   ├── time-import-service.js    (434 lines)
│   ├── profile-service.js        (134 lines)
│   ├── ui-log-service.js         (~50 lines)
│   └── recording-workflow-service.js (116 lines)
│
├── 📁 storage/                   # Data Persistence
│   └── storage-manager.js        (~100 lines)
│
├── 📁 utils/                     # Utility Functions
│   └── helpers.js                (~50 lines)
│
├── 📁 icons/                     # Extension Icons
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── icon128.svg
│
├── 📁 examples/                  # Test Data
│   ├── test-import-2025-11-14.json
│   ├── test-import-2025-12-01.json
│   ├── test-import-2025-12-04.json
│   ├── test-import-week.json
│   └── test-import-edge-cases.json
│
└── 📁 docs/                      # Documentation
    ├── 00-INDEX.md
    ├── 01-QUICK-START.md
    ├── 02-USER-GUIDE.md
    ├── 03-FEATURE-OVERVIEW.md
    ├── 10-ARCHITECTURE.md
    ├── REFACTORING_v0.3.0.md
    └── legacy/                   # Archived Docs
```

**Gesamt LOC (Code only):** ~1,800 Zeilen
**Gesamt LOC (inkl. Docs):** ~15,000+ Zeilen

---

## 📂 Verzeichnisstruktur

### /background

**Purpose:** Chrome Extension Background Service Worker

```javascript
// service-worker.js
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});
```

**Verantwortung:**
- Extension Lifecycle Management
- Event Handling (minimal)
- Installation & Update Logic

**LOC:** 40
**Dependencies:** None

---

### /content

**Purpose:** Content Scripts für Personio-Seiten

```javascript
// content-script.js (LEGACY - nicht mehr verwendet)
console.log('Content script loaded');
```

**Status:** ⚠️ LEGACY
- Ursprünglich für CORS-Umgehung
- Jetzt: Direct fetch() in Popup Context
- Kann in v0.4.0 entfernt werden

**LOC:** 34
**Dependencies:** None

---

### /popup

**Purpose:** User Interface (Popup)

#### popup.html (Structure)
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <!-- Tab Navigation -->
  <div class="tabs">
    <button id="tabProfile">Profil</button>
    <button id="tabImport">Import</button>
  </div>
  
  <!-- Tab Content -->
  <div id="profileTab" class="tab-content">...</div>
  <div id="importTab" class="tab-content">...</div>
  
  <script src="../services/auth-manager.js"></script>
  <script src="../services/api-client.js"></script>
  <!-- ... more services ... -->
  <script src="popup.js"></script>
</body>
</html>
```

#### popup.css (Styling)
```css
/* Tab Navigation */
.tabs { ... }
.tab-btn { ... }
.tab-content { ... }

/* Profile Section */
.profile-summary { ... }
.profile-editor { ... }

/* Import Section */
.import-methods { ... }
```

#### popup.js (Logic)
```javascript
// 466 lines, well-structured

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize services
  authManager = new AuthManager();
  storageManager = new StorageManager();
  timeImportService = new TimeImportService();
  profileService = new ProfileService(storageManager);
  uiLogService = new UILogService();
  workflowService = new RecordingWorkflowService(authManager, uiLogService);
  
  await initProfile();
  await checkAuthentication();
  setupEventListeners();
});

// Profile Management
async function handleSaveProfile() { ... }
async function handleStartRecording() { ... }

// Import Management
function handleFileSelect(event) { ... }
function handleParseImportText() { ... }
async function handleStartImport() { ... }
```

**LOC:** 466
**Dependencies:** Alle Services

---

### /services (Service Layer)

#### auth-manager.js

**Purpose:** Cookie-basierte Authentifizierung

```javascript
class AuthManager {
  async extractAuthData(personioInstance) {
    const cookies = await chrome.cookies.getAll({
      domain: personioInstance
    });
    
    const xsrfToken = cookies.find(c => c.name === 'ATHENA-XSRF-TOKEN');
    const sessionCookie = cookies.find(c => c.name === 'personio_session');
    
    return {
      xsrfToken: xsrfToken?.value,
      sessionCookie: sessionCookie?.value,
      // ...
    };
  }
}
```

**Verantwortung:**
- Cookie Extraction
- XSRF Token Management
- Session Validation

**LOC:** ~80
**Dependencies:** Chrome API

---

#### api-client.js

**Purpose:** Personio API Client

```javascript
class PersonioAPIClient {
  constructor(personioInstance, authManager) {
    this.baseUrl = `https://${personioInstance}`;
    this.authManager = authManager;
  }
  
  async refreshSession() {
    // GET /api/v1/projects → erneuert personio_session
  }
  
  async getTimesheet(employeeId, startDate, endDate, timezone) {
    // GET /svc/attendance-bff/v1/timesheet/{employeeId}
  }
  
  async recordAttendance(dayId, employeeId, periods) {
    // POST /svc/attendance-api/validate-and-calculate-full-day
    // PUT /svc/attendance-api/v1/days/{dayId}
  }
}
```

**Verantwortung:**
- HTTP Requests
- Session Refresh
- Error Handling
- Rate Limiting

**LOC:** ~250
**Dependencies:** AuthManager

---

#### timesheet-service.js

**Purpose:** Timesheet Management

```javascript
class TimesheetService {
  async getCurrentMonthTimesheet(employeeId, timezone) { ... }
  async getTimesheet(employeeId, startDate, endDate, timezone) { ... }
  
  getRecordableDays(timesheet, profile) {
    return timesheet.timecards.filter(card => {
      return card.state === 'trackable' 
        && !card.is_off_day
        && (!card.periods || card.periods.length === 0)
        && profile.workingDays.includes(getDayOfWeek(card.date));
    });
  }
  
  generatePeriodsForDay(date, schedule, timezone) { ... }
}
```

**Verantwortung:**
- Timesheet Abfrage
- Filterung trackbarer Tage
- Perioden-Generierung aus Profil

**LOC:** ~100
**Dependencies:** APIClient

---

#### attendance-service.js

**Purpose:** Zeiterfassungs-Logik

```javascript
class AttendanceService {
  async recordMultipleDays(days, employeeId, profile, progressCallback) {
    const results = {
      total: days.length,
      successful: 0,
      failed: 0,
      details: []
    };
    
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      try {
        await this.recordDay(day, employeeId, day.periods);
        results.successful++;
        progressCallback?.(i + 1, days.length, day.date, true);
      } catch (error) {
        results.failed++;
        progressCallback?.(i + 1, days.length, day.date, false);
      }
      await sleep(1000); // Rate limiting
    }
    
    return results;
  }
  
  async recordDay(day, employeeId, periods) { ... }
}
```

**Verantwortung:**
- Batch-Processing
- Retry-Logik
- Progress Tracking

**LOC:** ~150
**Dependencies:** APIClient, TimesheetService

---

#### time-import-service.js

**Purpose:** JSON-Import & Parsing

```javascript
class TimeImportService {
  parseImportData(data) {
    // Validate JSON structure
    // Parse ISO timestamps
    // Group by date
    // Return summary
  }
  
  _parseISOTimestamp(timestamp) {
    // Support: 20251204T080000Z
    // Support: 2025-12-04T08:00:00Z
  }
  
  _groupByDate() {
    // Group entries by date
  }
  
  convertToPeriods(dateStr, timezone) {
    // Convert import entries to Personio periods
    // Detect breaks (gaps >= 1 min)
    // Merge micro-gaps (< 1 min)
  }
}
```

**Verantwortung:**
- JSON Parsing
- Timestamp Conversion
- Break Detection
- Period Generation

**LOC:** 434 ⚠️ (könnte refactored werden)
**Dependencies:** None

---

#### profile-service.js

**Purpose:** Profil-Verwaltung

```javascript
class ProfileService {
  async loadProfile() { ... }
  async saveProfile(profile) { ... }
  
  validateProfile(profile) {
    const errors = [];
    if (!profile.personioInstance) errors.push('...');
    if (!profile.employeeId) errors.push('...');
    // ...
    return { isValid: errors.length === 0, errors };
  }
  
  migrateLegacyProfile(profile) {
    // Convert old format to new per-day schedule
  }
  
  populateForm(profile) { ... }
  updateSummary(profile) { ... }
}
```

**Verantwortung:**
- Profil CRUD
- Validierung
- UI-Helfer
- Migration

**LOC:** 134
**Dependencies:** StorageManager

---

#### ui-log-service.js

**Purpose:** UI Logging

```javascript
class UILogService {
  addLog(containerId, message, isError = false) {
    const container = document.getElementById(containerId);
    const entry = document.createElement('div');
    entry.className = 'log-entry' + (isError ? ' error' : '');
    entry.textContent = message;
    container.appendChild(entry);
  }
  
  clear(containerId) { ... }
  
  showResults(mode, results) {
    // Display summary (successful/failed)
  }
}
```

**Verantwortung:**
- Progress Logging
- Error Display
- Result Summary

**LOC:** ~50
**Dependencies:** None

---

#### recording-workflow-service.js

**Purpose:** Workflow-Orchestrierung

```javascript
class RecordingWorkflowService {
  async recordProfileDays(profile, services) {
    // 1. Check auth
    // 2. Load timesheet
    // 3. Filter recordable days
    // 4. Generate periods from profile
    // 5. Record all days
    // 6. Show results
  }
  
  async recordImportedDays(profile, importedData, services) {
    // 1. Check auth
    // 2. Load timesheet (multi-month if needed)
    // 3. Convert import data to periods
    // 4. Record all days
    // 5. Show results
  }
}
```

**Verantwortung:**
- End-to-End Orchestrierung
- Service Koordination
- Error Handling
- Progress Updates

**LOC:** 116
**Dependencies:** AuthManager, UILogService

---

### /storage

#### storage-manager.js

**Purpose:** Chrome Storage API Wrapper

```javascript
class StorageManager {
  async saveWorkProfile(profile) {
    await chrome.storage.local.set({ workProfile: profile });
  }
  
  async loadWorkProfile() {
    const result = await chrome.storage.local.get('workProfile');
    return result.workProfile || null;
  }
  
  async saveLastSync(timestamp) { ... }
  async getLastSync() { ... }
}
```

**Verantwortung:**
- Data Persistence
- Chrome Storage API
- Profile Management

**LOC:** ~100
**Dependencies:** Chrome API

---

### /utils

#### helpers.js

**Purpose:** Utility Functions

```javascript
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function generateUUID() {
  return crypto.randomUUID();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getDayOfWeek(dateStr) {
  const date = new Date(dateStr);
  return date.getDay() === 0 ? 7 : date.getDay();
}
```

**LOC:** ~50
**Dependencies:** None

---

## 📊 Dateigrößen & LOC

### Code (Production)

| Kategorie | Dateien | LOC | Anteil |
|-----------|---------|-----|--------|
| **Services** | 8 | ~1,300 | 72% |
| **Popup** | 3 | ~466 | 26% |
| **Storage/Utils** | 2 | ~150 | 8% |
| **Background** | 1 | 40 | 2% |
| **Total** | 14 | **~1,800** | 100% |

### Dokumentation

| Kategorie | Dateien | LOC |
|-----------|---------|-----|
| **Neue Docs** | 5 | ~2,500 |
| **Legacy Docs** | 20+ | ~12,000 |
| **Total** | 25+ | **~15,000** |

---

## 🔗 Dependencies

### External (Chrome APIs)

```javascript
chrome.cookies.*        // Cookie Management
chrome.storage.*        // Data Persistence
chrome.runtime.*        // Extension Lifecycle
chrome.tabs.*           // Tab Management
```

### Internal (Service Dependencies)

```
WorkflowService
  ├── AuthManager
  └── UILogService

AttendanceService
  ├── APIClient
  └── TimesheetService

TimesheetService
  └── APIClient

APIClient
  └── AuthManager

ProfileService
  └── StorageManager

TimeImportService
  └── (keine)

UILogService
  └── (keine)
```

**Dependency Graph:**
```
          ┌─────────────┐
          │ WorkflowSvc │
          └──────┬──────┘
                 │
      ┌──────────┼───────────┐
      ▼          ▼           ▼
┌──────────┐ ┌────────┐ ┌─────────┐
│ AuthMgr  │ │ UISvc  │ │ AttSvc  │
└──────────┘ └────────┘ └────┬────┘
                             │
                   ┌─────────┼────────┐
                   ▼         ▼        ▼
             ┌──────────┐ ┌──────────┐
             │ APISvc   │ │ TimeSvc  │
             └────┬─────┘ └──────────┘
                  │
                  ▼
             ┌──────────┐
             │ AuthMgr  │
             └──────────┘
```

---

## 🎯 Code Quality

### Metrics (v0.3.0)

```
✅ No Linter Errors
✅ No Duplicates
✅ Modular Services
✅ Clear Separation of Concerns
✅ Documented (JSDoc partial)

⚠️ Areas for Improvement:
- TimeImportService (434 LOC → split)
- Unit Tests (0% coverage)
- JSDoc (50% coverage)
```

### Best Practices

**✅ Followed:**
- Service Layer Pattern
- Dependency Injection
- Single Responsibility
- Error Handling
- Progress Tracking

**⚠️ Todo:**
- Unit Testing
- JSDoc Comments
- Type Definitions (JSDoc)
- Error Codes
- Performance Monitoring

---

## 📚 Weiterführende Dokumentation

- **[Architecture Overview](./10-ARCHITECTURE.md)** - System-Architektur
- **[Service Layer](./12-SERVICE-LAYER.md)** - Service APIs (geplant)
- **[Refactoring Summary](./REFACTORING_v0.3.0.md)** - Refactoring Details

---

**Personio Attendance Recorder** | Code Structure | v0.3.0

