# Architecture Overview - Personio Attendance Recorder

> **System-Architektur & Design** | Version 0.3.0

## 📋 Inhaltsverzeichnis

1. [Architektur-Übersicht](#architektur-übersicht)
2. [Komponenten](#komponenten)
3. [Service Layer](#service-layer)
4. [Datenfluss](#datenfluss)
5. [Design Patterns](#design-patterns)
6. [Security](#security)

---

## 🏗️ Architektur-Übersicht

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Chrome Extension                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────────┐      ┌──────────────┐                   │
│  │   Popup    │◄─────│   Service    │                   │
│  │    UI      │      │   Worker     │                   │
│  └─────┬──────┘      └──────────────┘                   │
│        │                                                │
│        ▼                                                │
│  ┌──────────────────────────────────────┐               │
│  │       Service Layer (8 Services)     │               │
│  ├──────────────────────────────────────┤               │
│  │ - Auth Manager                       │               │
│  │ - API Client                         │               │
│  │ - Timesheet Service                  │               │
│  │ - Attendance Service                 │               │
│  │ - Time Import Service                │               │
│  │ - Profile Service                    │               │
│  │ - UI Log Service                     │               │
│  │ - Workflow Service                   │               │
│  └──────────────────────────────────────┘               │
│        │                                                │
│        ▼                                                │
│  ┌──────────────────────────────────────┐               │
│  │       Storage & Utilities            │               │
│  ├──────────────────────────────────────┤               │
│  │ - Storage Manager                    │               │
│  │ - Helpers                            │               │
│  └──────────────────────────────────────┘               │
│        │                                                │
└────────┼────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              Personio API (External)                    │
├─────────────────────────────────────────────────────────┤
│ - Authentication (Cookies)                              │
│ - Timesheet API                                         │
│ - Attendance API                                        │
│ - Projects API (Session Refresh)                        │
└─────────────────────────────────────────────────────────┘
```

### Architecture Layers

| Layer | Verantwortung | Komponenten |
|-------|---------------|-------------|
| **Presentation** | UI & User Interaction | Popup (HTML/CSS/JS) |
| **Service** | Business Logic | 8 Service Classes |
| **Data Access** | Storage & API Communication | Storage Manager, API Client |
| **Integration** | External APIs | Personio API Wrapper |

---

## 🧩 Komponenten

### 1. Popup (UI Layer)

**Datei:** `popup/popup.js`, `popup/popup.html`, `popup/popup.css`

**Verantwortung:**
- User Interface Rendering
- Event Handling
- Service Orchestrierung
- UI State Management

**Abhängigkeiten:**
```javascript
- ProfileService
- TimeImportService
- UILogService
- RecordingWorkflowService
- AuthManager
- StorageManager
```

**Design:**
- Tab-basierte Navigation (Profile / Import)
- Reactive UI Updates
- Progress Tracking
- Result Display

### 2. Background Service Worker

**Datei:** `background/service-worker.js`

**Verantwortung:**
- Extension Lifecycle Management
- Installation & Updates
- Event Listening (minimal)

**Features:**
- Manifest V3 compliant
- Lightweight (keine Business Logic)
- Event-driven

### 3. Content Script

**Datei:** `content/content-script.js`

**Verantwortung:**
- Cookie Access auf Personio Seiten
- Wird aktuell **nicht verwendet** (Legacy)

**Hinweis:**
- Ursprünglich für CORS-Umgehung
- Jetzt: Direct fetch() in Service Worker Context
- Kann in zukünftigen Versionen entfernt werden

---

## 🔧 Service Layer

### Service Architecture

```
┌────────────────────────────────────────────────────────┐
│                  Service Layer                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌─────────────────┐         ┌───────────────────┐     │
│  │ WorkflowService │◄────────│  AttendanceService│     │
│  │  (Orchestrator) │         └─────────┬─────────┘     │
│  └────────┬────────┘                   │               │
│           │                            │               │
│           ▼                            ▼               │
│  ┌──────────────┐            ┌──────────────────┐      │
│  │ProfileService│            │TimesheetService  │      │
│  └──────────────┘            └─────────┬────────┘      │
│                                        │               │
│  ┌──────────────┐                      │               │
│  │TimeImport    │                      │               │
│  │Service       │                      │               │
│  └──────────────┘                      │               │
│           │                            │               │
│           └────────────┬───────────────┘               │
│                        ▼                               │
│              ┌──────────────────┐                      │
│              │   API Client     │                      │
│              └─────────┬────────┘                      │
│                        │                               │
│                        ▼                               │
│              ┌──────────────────┐                      │
│              │   Auth Manager   │                      │
│              └──────────────────┘                      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Service Übersicht

| Service | Verantwortung | Dependencies |
|---------|---------------|--------------|
| **WorkflowService** | Orchestriert Recording-Workflows | AuthManager, UILogService |
| **AttendanceService** | Zeiterfassungs-Logik | APIClient, TimesheetService |
| **TimesheetService** | Timesheet-Verwaltung | APIClient |
| **APIClient** | Personio API Kommunikation | AuthManager |
| **AuthManager** | Authentifizierung & Cookies | - |
| **ProfileService** | Profil-Verwaltung | StorageManager |
| **TimeImportService** | JSON-Import & Parsing | - |
| **UILogService** | UI-Logging & Feedback | - |

### Service Details

#### WorkflowService (Orchestrator)

```javascript
class RecordingWorkflowService {
  // Orchestriert komplette Workflows
  async recordProfileDays(profile, services) { }
  async recordImportedDays(profile, importedData, services) { }
}
```

**Verantwortung:**
- End-to-End Workflow-Orchestrierung
- Service-Koordination
- Progress Tracking
- Error Handling auf höchster Ebene

#### APIClient (Personio Integration)

```javascript
class PersonioAPIClient {
  async getTimesheet(employeeId, startDate, endDate, timezone) { }
  async recordAttendance(dayId, employeeId, periods) { }
  async refreshSession() { }
}
```

**Verantwortung:**
- HTTP Requests zu Personio API
- Session Management
- Cookie Handling
- Retry Logic
- Rate Limiting

#### AttendanceService (Business Logic)

```javascript
class AttendanceService {
  async recordMultipleDays(days, employeeId, profile, progressCallback) { }
  async recordDay(day, employeeId, periods) { }
}
```

**Verantwortung:**
- Batch-Processing von Tagen
- Einzeln-Tag Eintragung
- Retry-Mechanismus
- Progress Callbacks

---

## 🔄 Datenfluss

### Profil-basierter Workflow

```
User Action: "Zeiterfassung starten"
         │
         ▼
┌────────────────────┐
│  Popup.js          │
│  handleStartRecording()
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ WorkflowService    │
│ recordProfileDays()│
└────────┬───────────┘
         │
         ├──► AuthManager.extractAuthData()
         │    └─► ✅ Check Cookies
         │
         ├──► TimesheetService.getCurrentMonthTimesheet()
         │    └─► APIClient.getTimesheet()
         │        └─► Personio API GET /timesheet
         │
         ├──► TimesheetService.getRecordableDays()
         │    └─► Filter: trackable, no periods, is working day
         │
         └──► AttendanceService.recordMultipleDays()
              │
              └─► For each day:
                  │
                  ├──► TimesheetService.generatePeriodsForDay()
                  │    └─► Profile → Periods (work + break)
                  │
                  └──► APIClient.recordAttendance()
                       │
                       ├──► POST /validate-and-calculate-full-day
                       │    └─► ✅ Validation
                       │
                       └──► PUT /days/{dayId}
                            └─► ✅ Save
```

### Import-basierter Workflow

```
User Action: "Import starten"
         │
         ▼
┌────────────────────┐
│  Popup.js          │
│  handleStartImport()
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ TimeImportService  │
│ parseImportData()  │
└────────┬───────────┘
         │
         ├──► Parse JSON
         ├──► Convert ISO Timestamps
         ├──► Group by Date
         └──► Detect Breaks (gaps ≥ 1 min)
         │
         ▼
┌────────────────────┐
│ WorkflowService    │
│ recordImportedDays()
└────────┬───────────┘
         │
         ├──► AuthManager.extractAuthData()
         │
         ├──► TimesheetService (Multi-Month)
         │    ├─► Detect months in import data
         │    ├─► Load prev + current month if needed
         │    └─► Combine timesheets
         │
         ├──► TimeImportService.convertToPeriods()
         │    └─► Date → Periods
         │
         └──► AttendanceService.recordMultipleDays()
              └─► Same as Profile Workflow
```

---

## 🎨 Design Patterns

### 1. Service Layer Pattern

**Motivation:**
- Trennung von UI und Business Logic
- Wiederverwendbarkeit
- Testbarkeit

**Implementation:**
```javascript
// Statt direktem API-Call in UI:
const response = await fetch('...')

// Service Layer:
const apiClient = new PersonioAPIClient()
const timesheet = await apiClient.getTimesheet()
```

### 2. Dependency Injection

**Motivation:**
- Loose Coupling
- Einfaches Mocking für Tests
- Flexible Konfiguration

**Implementation:**
```javascript
class RecordingWorkflowService {
  constructor(authManager, uiLogService) {
    this.authManager = authManager;
    this.uiLog = uiLogService;
  }
}

// Usage:
const workflow = new RecordingWorkflowService(
  new AuthManager(),
  new UILogService()
);
```

### 3. Strategy Pattern (Workflow)

**Motivation:**
- Zwei verschiedene Workflows (Profile vs Import)
- Gemeinsame Schnittstelle
- Austauschbare Strategien

**Implementation:**
```javascript
// Profile Strategy
await workflowService.recordProfileDays(profile, services);

// Import Strategy
await workflowService.recordImportedDays(profile, importData, services);
```

### 4. Observer Pattern (Progress Tracking)

**Motivation:**
- UI-Updates während laufender Verarbeitung
- Entkopplung von Business Logic und UI

**Implementation:**
```javascript
await attendanceService.recordMultipleDays(
  days, 
  employeeId, 
  profile,
  (current, total, date, success) => {
    // Progress Callback
    updateUI(current, total);
  }
);
```

### 5. Factory Pattern (UUID Generation)

**Motivation:**
- Konsistente UUID-Generierung
- Zentralisierte Logik

**Implementation:**
```javascript
function generateUUID() {
  return crypto.randomUUID();
}
```

---

## 🔒 Security

### Authentication

**Cookie-based Authentication:**
```
1. User loggt sich bei Personio ein
2. Extension liest Cookies via Chrome API
3. Cookies werden für API-Requests verwendet
4. Kein Passwort-Handling in Extension
```

**Kritische Cookies:**
- `ATHENA-XSRF-TOKEN` → CSRF Protection
- `personio_session` → Session Token
- `ATHENA_SESSION` → Session ID

### Data Privacy

**Lokale Speicherung:**
```javascript
// Chrome Storage API (encrypted by Chrome)
chrome.storage.local.set({ workProfile: profile })
```

**Keine externe Übertragung:**
- ✅ Alle Daten bleiben lokal
- ✅ Nur Kommunikation mit Personio API
- ✅ Kein Tracking, keine Analytics

### API Security

**XSRF Protection:**
```javascript
headers: {
  'X-ATHENA-XSRF-TOKEN': token,
  'Cookie': cookies
}
```

**Session Refresh:**
```javascript
// Vor jedem Recording: Session auffrischen
await apiClient.refreshSession();
```

**Rate Limiting:**
```javascript
// 1 Sekunde Pause zwischen Requests
await sleep(1000);
```

### Permissions

**Minimal Required:**
```json
{
  "permissions": ["cookies", "storage", "activeTab", "tabs"],
  "host_permissions": ["https://*.app.personio.com/*"]
}
```

**Warum?**
- `cookies` → Authentifizierung
- `storage` → Profil speichern
- `activeTab` → Aktuelle Personio-Seite
- `tabs` → Tab-Zugriff für Cookie-Lesen

---

## 📊 Performance

### Optimierungen

1. **Batch Processing:**
   - Mehrere Tage in einem Workflow
   - Parallele Validierung möglich (aktuell sequenziell)

2. **Session Caching:**
   - Session-Cookies werden gecacht
   - Refresh nur bei Bedarf

3. **Lazy Loading:**
   - Services werden erst bei Bedarf initialisiert
   - UI-Komponenten dynamisch geladen

4. **Rate Limiting:**
   - 1 Request/Sekunde → Vermeidet API Throttling
   - Konfigurierbar pro Service

### Performance Metrics

| Metrik | Wert |
|--------|------|
| Timesheet Load | ~500ms |
| Validation per Day | ~200ms |
| Save per Day | ~300ms |
| **Total per Day** | **~2-3s** |
| 20 Arbeitstage | ~40-60s |

---

## 🧪 Testability

### Unit Testing

**Services sind testbar:**
```javascript
// Mock Dependencies
const mockAuth = { extractAuthData: jest.fn() };
const mockUI = { addLog: jest.fn() };

// Test Service
const workflow = new RecordingWorkflowService(mockAuth, mockUI);
await workflow.recordProfileDays(profile, mockServices);

expect(mockAuth.extractAuthData).toHaveBeenCalled();
```

### Integration Testing

**Browser Extension Testing:**
```bash
# Puppeteer für E2E Tests
npm install puppeteer
```

---

## 📚 Weiterführende Dokumentation

- **[Code Structure](./11-CODE-STRUCTURE.md)** - Dateistruktur im Detail
- **[Service Layer](./12-SERVICE-LAYER.md)** - Service APIs und Implementation
- **[Data Models](./22-DATA-MODELS.md)** - Datenstrukturen
- **[API Reference](./20-PERSONIO-API.md)** - Personio API Endpoints

---

**Personio Attendance Recorder** | Architecture | v0.3.0

