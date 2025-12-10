// Popup Script - Main UI Logic
let authManager;
let storageManager;
let timeImportService;
let profileService;
let uiLogService;
let workflowService;
let currentWorkProfile;
let importedData = null;

// ============================================================================
// Initialization
// ============================================================================

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Popup initialized');

  // Initialize all services
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

// Setup event listeners
function setupEventListeners() {
  // Profile editor
  const toggleProfileEdit = document.getElementById('toggleProfileEdit');
  const saveProfile = document.getElementById('saveProfile');
  const startRecording = document.getElementById('startRecording');

  if (toggleProfileEdit) toggleProfileEdit.addEventListener('click', toggleProfileEditor);
  if (saveProfile) saveProfile.addEventListener('click', handleSaveProfile);
  if (startRecording) startRecording.addEventListener('click', handleStartRecording);

  // Enable/disable day times when checkbox changes
  for (let day = 1; day <= 7; day++) {
    const checkbox = document.getElementById(`day${day}Enabled`);
    if (checkbox) {
      checkbox.addEventListener('change', () => updateDayTimesState(day));
    }
  }

  // Tab events
  const tabProfile = document.getElementById('tabProfile');
  const tabImport = document.getElementById('tabImport');

  if (tabProfile) tabProfile.addEventListener('click', () => switchTab('profile'));
  if (tabImport) tabImport.addEventListener('click', () => switchTab('import'));

  // Import method tabs
  const importMethodFile = document.getElementById('importMethodFile');
  const importMethodText = document.getElementById('importMethodText');

  if (importMethodFile) importMethodFile.addEventListener('click', () => switchImportMethod('file'));
  if (importMethodText) importMethodText.addEventListener('click', () => switchImportMethod('text'));

  // Import events
  const importFile = document.getElementById('importFile');
  const parseImportText = document.getElementById('parseImportText');
  const startImport = document.getElementById('startImport');

  if (importFile) importFile.addEventListener('change', handleFileSelect);
  if (parseImportText) parseImportText.addEventListener('click', handleParseImportText);
  if (startImport) startImport.addEventListener('click', handleStartImport);
}

// ============================================================================
// Profile Management
// ============================================================================

// Load work profile from storage
async function initProfile() {
  try {
    const loaded = await profileService.loadProfile();
    if (loaded) {
      currentWorkProfile = profileService.migrateLegacyProfile(loaded);
      profileService.populateForm(currentWorkProfile);
      profileService.updateSummary(currentWorkProfile);
      profileService.updateStatus(true);
      const startBtn = document.getElementById('startRecording');
      if (startBtn) startBtn.disabled = false;
    } else {
      profileService.populateDefaultSchedule();
      profileService.updateStatus(false);
    }
  } catch (e) {
    console.error('Profil Initialisierung fehlgeschlagen:', e);
  }
}

// Check authentication status
async function checkAuthentication() {
  const authStatusIcon = document.getElementById('authStatusIcon');
  const authStatusText = document.getElementById('authStatusText');
  const authStatus = document.getElementById('authStatus');

  authStatus.classList.remove('success', 'error');
  authStatus.classList.add('loading');
  authStatusIcon.textContent = '⏳';
  authStatusText.textContent = 'Prüfe Authentifizierung...';

  try {
    const profile = await storageManager.loadWorkProfile();
    const personioInstance = profile?.personioInstance || 'aoe-gmbh.app.personio.com';
    const authData = await authManager.extractAuthData(personioInstance);

    if (authData?.xsrfToken) {
      authStatus.classList.remove('loading', 'error');
      authStatus.classList.add('success');
      authStatusIcon.textContent = '✅';
      authStatusText.textContent = 'Authentifiziert';
    }
  } catch (error) {
    authStatus.classList.remove('loading', 'success');
    authStatus.classList.add('error');
    authStatusIcon.textContent = '❌';
    authStatusText.textContent = `Nicht authentifiziert: ${error.message}`;
    console.error('Auth check failed:', error);
  }
}

// ============================================================================
// UI State Management
// ============================================================================

// Switch between tabs
function switchTab(tab) {
  // Update tab buttons
  for (const btn of document.querySelectorAll('.tab-btn')) {
    btn.classList.remove('active');
  }
  const activeBtn = document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Update tab content
  for (const content of document.querySelectorAll('.tab-content')) {
    content.classList.remove('active');
  }
  const activeContent = document.getElementById(`${tab}Tab`);
  if (activeContent) activeContent.classList.add('active');
}

// Toggle profile editor visibility
function toggleProfileEditor() {
  const summary = document.getElementById('profileSummary');
  const editor = document.getElementById('profileEditor');
  const button = document.getElementById('toggleProfileEdit');

  if (editor.style.display === 'none' || !editor.style.display) {
    summary.style.display = 'none';
    editor.style.display = 'block';
    button.textContent = '✖ Abbrechen';
  } else {
    hideProfileEditor();
  }
}

// Hide profile editor
function hideProfileEditor() {
  const summary = document.getElementById('profileSummary');
  const editor = document.getElementById('profileEditor');
  const button = document.getElementById('toggleProfileEdit');

  summary.style.display = 'block';
  editor.style.display = 'none';
  button.textContent = '✏️ Profil bearbeiten';
}

// Switch between import methods (file vs text)
function switchImportMethod(method) {
  // Update method buttons
  document.querySelectorAll('.import-method-btn').forEach(btn => btn.classList.remove('active'));
  const methodBtn = document.getElementById(`importMethod${method.charAt(0).toUpperCase() + method.slice(1)}`);
  if (methodBtn) methodBtn.classList.add('active');

  // Update method content
  const fileMethod = document.getElementById('importFileMethod');
  const textMethod = document.getElementById('importTextMethod');

  if (fileMethod && textMethod) {
    if (method === 'file') {
      fileMethod.style.display = 'block';
      textMethod.style.display = 'none';
    } else {
      fileMethod.style.display = 'none';
      textMethod.style.display = 'block';
    }
  }

  // Reset import data and buttons
  importedData = null;
  const startImportBtn = document.getElementById('startImport');
  const fileInfo = document.getElementById('fileInfo');
  const textInfo = document.getElementById('textInfo');

  if (startImportBtn) startImportBtn.disabled = true;
  if (fileInfo) fileInfo.classList.remove('visible', 'error');
  if (textInfo) textInfo.classList.remove('visible', 'error');
}

// Update day times state
function updateDayTimesState(day) {
  const checkbox = document.getElementById(`day${day}Enabled`);
  if (!checkbox) return;

  const times = checkbox.closest('.day-schedule')?.querySelector('.day-times');
  if (!times) return;

  if (checkbox.checked) {
    times.style.opacity = '1';
    times.style.pointerEvents = 'auto';
  } else {
    times.style.opacity = '0.4';
    times.style.pointerEvents = 'none';
  }
}

// ============================================================================
// Event Handlers - Profile
// ============================================================================

// Handle save profile
async function handleSaveProfile() {
  const saveBtn = document.getElementById('saveProfile');
  if (!saveBtn) return;

  saveBtn.disabled = true;
  saveBtn.textContent = 'Speichern...';

  try {
    // Collect schedule data from form
    const schedule = {};
    const workingDays = [];

    for (let day = 1; day <= 7; day++) {
      const enabled = document.getElementById(`day${day}Enabled`)?.checked || false;
      if (enabled) workingDays.push(day);

      schedule[day] = {
        enabled,
        workStart: document.getElementById(`day${day}WorkStart`)?.value || '08:00',
        workEnd: document.getElementById(`day${day}WorkEnd`)?.value || '17:00',
        breakStart: document.getElementById(`day${day}BreakStart`)?.value || '12:00',
        breakEnd: document.getElementById(`day${day}BreakEnd`)?.value || '13:00'
      };
    }

    // Build profile object
    const profile = {
      personioInstance: document.getElementById('personioInstance')?.value.trim() || '',
      employeeId: document.getElementById('employeeId')?.value.trim() || '',
      timezone: document.getElementById('timezone')?.value || 'Europe/Berlin',
      schedule,
      workingDays
    };

    // Validate using ProfileService
    const validation = profileService.validateProfile(profile);
    if (!validation.isValid) {
      alert('Validierungsfehler:\n\n' + validation.errors.join('\n'));
      return;
    }

    // Save and update UI
    await profileService.saveProfile(profile);
    currentWorkProfile = profile;
    profileService.updateSummary(profile);
    profileService.updateStatus(true);
    hideProfileEditor();

    const startBtn = document.getElementById('startRecording');
    if (startBtn) startBtn.disabled = false;

    await checkAuthentication();

    saveBtn.textContent = '✅ Gespeichert!';
    setTimeout(() => {
      if (saveBtn) saveBtn.textContent = 'Profil speichern';
    }, 2000);
  } catch (err) {
    console.error('Profil speichern fehlgeschlagen:', err);
    alert('Fehler beim Speichern: ' + err.message);
  } finally {
    saveBtn.disabled = false;
  }
}

// Handle start recording (Profile-based)
async function handleStartRecording() {
  if (!currentWorkProfile) {
    alert('Bitte zuerst Profil speichern!');
    return;
  }

  const startBtn = document.getElementById('startRecording');
  if (!startBtn) return;

  startBtn.disabled = true;
  startBtn.textContent = 'Starte...';

  // Hide result section, show progress
  const resultSection = document.getElementById('resultSection');
  const progressSection = document.getElementById('progressSection');
  if (resultSection) resultSection.style.display = 'none';
  if (progressSection) progressSection.style.display = 'block';

  uiLogService.clear('progressLog');

  try {
    // Initialize services for recording
    const apiClient = new PersonioAPIClient(currentWorkProfile.personioInstance, authManager);
    const timesheetService = new TimesheetService(apiClient);
    const attendanceService = new AttendanceService(apiClient, timesheetService);

    // Use workflow service for the recording process
    await workflowService.recordProfileDays(currentWorkProfile, {
      apiClient,
      timesheetService,
      attendanceService,
      storageManager
    });
  } catch (e) {
    uiLogService.addLog('progressLog', `❌ Fehler: ${e.message}`, true);
    alert('Fehler bei der Zeiterfassung:\n\n' + e.message);
  } finally {
    startBtn.disabled = false;
    startBtn.textContent = 'Zeiterfassung starten';
  }
}

// ============================================================================
// Event Handlers - Import
// ============================================================================

// Handle file selection for import
function handleFileSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const fileInfo = document.getElementById('fileInfo');
  const startImportBtn = document.getElementById('startImport');

  file.text().then(text => {
    try {
      const data = JSON.parse(text);
      const parsed = timeImportService.parseImportData(data);

      importedData = parsed;

      if (fileInfo) {
        fileInfo.classList.add('visible');
        fileInfo.classList.remove('error');
        fileInfo.innerHTML = `<p><strong>✅ Datei geladen:</strong> ${file.name}</p><p>${parsed.totalDays} Tag(e) gefunden</p><p>Zeitraum: ${parsed.dateRange.start} bis ${parsed.dateRange.end}</p>`;
      }
      if (startImportBtn) startImportBtn.disabled = false;
    } catch (err) {
      if (fileInfo) {
        fileInfo.classList.add('visible', 'error');
        fileInfo.innerHTML = `<p><strong>❌ Fehler beim Lesen:</strong></p><p>${err.message}</p>`;
      }
      importedData = null;
      if (startImportBtn) startImportBtn.disabled = true;
    }
  }).catch(err => {
    if (fileInfo) {
      fileInfo.classList.add('visible', 'error');
      fileInfo.innerHTML = `<p><strong>❌ Fehler beim Lesen der Datei:</strong></p><p>${err.message}</p>`;
    }
    importedData = null;
    if (startImportBtn) startImportBtn.disabled = true;
  });
}

// Handle text import parsing
function handleParseImportText() {
  const textArea = document.getElementById('importText');
  const textInfo = document.getElementById('textInfo');
  const startImportBtn = document.getElementById('startImport');

  if (!textArea || !textInfo || !startImportBtn) return;

  const raw = textArea.value.trim();

  if (!raw) {
    textInfo.classList.add('visible', 'error');
    textInfo.innerHTML = `<p><strong>❌ Keine Daten vorhanden</strong></p><p>Bitte JSON-Daten einfügen</p>`;
    importedData = null;
    startImportBtn.disabled = true;
    return;
  }

  try {
    const data = JSON.parse(raw);
    const parsed = timeImportService.parseImportData(data);

    importedData = parsed;

    textInfo.classList.add('visible');
    textInfo.classList.remove('error');
    textInfo.innerHTML = `<p><strong>✅ JSON erfolgreich geparst</strong></p><p>${parsed.totalDays} Tag(e) gefunden</p><p>Zeitraum: ${parsed.dateRange.start} bis ${parsed.dateRange.end}</p>`;
    startImportBtn.disabled = false;
  } catch (err) {
    textInfo.classList.add('visible', 'error');
    textInfo.innerHTML = `<p><strong>❌ Fehler beim Parsen:</strong></p><p>${err.message}</p>`;
    importedData = null;
    startImportBtn.disabled = true;
  }
}

// Handle start import
async function handleStartImport() {
  if (!importedData) {
    alert('Bitte zuerst eine Datei auswählen oder Text validieren!');
    return;
  }

  if (!currentWorkProfile) {
    alert('Bitte zuerst Profil speichern!');
    return;
  }

  const startBtn = document.getElementById('startImport');
  if (!startBtn) return;

  startBtn.disabled = true;
  startBtn.textContent = 'Importiere...';

  const resultSection = document.getElementById('importResultSection');
  const progressSection = document.getElementById('importProgressSection');
  if (resultSection) resultSection.style.display = 'none';
  if (progressSection) progressSection.style.display = 'block';

  uiLogService.clear('importProgressLog');

  try {
    // Initialize services for import
    const apiClient = new PersonioAPIClient(currentWorkProfile.personioInstance, authManager);
    const timesheetService = new TimesheetService(apiClient);
    const attendanceService = new AttendanceService(apiClient, timesheetService);

    // Use workflow service for the import process
    await workflowService.recordImportedDays(currentWorkProfile, importedData, {
      apiClient,
      timesheetService,
      attendanceService,
      storageManager,
      timeImportService
    });
  } catch (e) {
    uiLogService.addLog('importProgressLog', `❌ Fehler: ${e.message}`, true);
    alert('Fehler beim Import:\n\n' + e.message);
  } finally {
    startBtn.disabled = false;
    startBtn.textContent = 'Import starten';
  }
}

