// Popup Script - Main UI Logic
let authManager;
let storageManager;
let timeImportService;
let currentWorkProfile;
let importedData = null;

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Popup initialized');

  authManager = new AuthManager();
  storageManager = new StorageManager();
  timeImportService = new TimeImportService();

  await loadWorkProfile();
  await checkAuthentication();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Profile editor
  document.getElementById('toggleProfileEdit').addEventListener('click', toggleProfileEditor);
  document.getElementById('saveProfile').addEventListener('click', handleSaveProfile);
  document.getElementById('startRecording').addEventListener('click', handleStartRecording);

  // Enable/disable day times when checkbox changes
  for (let day = 1; day <= 7; day++) {
    const checkbox = document.getElementById(`day${day}Enabled`);
    checkbox.addEventListener('change', () => updateDayTimesState(day));
  }

  // Tab events
  document.getElementById('tabProfile').addEventListener('click', () => switchTab('profile'));
  document.getElementById('tabImport').addEventListener('click', () => switchTab('import'));

  // Import method tabs
  document.getElementById('importMethodFile').addEventListener('click', () => switchImportMethod('file'));
  document.getElementById('importMethodText').addEventListener('click', () => switchImportMethod('text'));

  // Import events
  document.getElementById('importFile').addEventListener('change', handleFileSelect);
  document.getElementById('parseImportText').addEventListener('click', handleParseImportText);
  document.getElementById('startImport').addEventListener('click', handleStartImport);
}

// Switch between tabs
function switchTab(tab) {
  // Update tab buttons
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(`${tab}Tab`).classList.add('active');
}

// Switch between import methods (file vs text)
function switchImportMethod(method) {
  // Update method buttons
  document.querySelectorAll('.import-method-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`importMethod${method.charAt(0).toUpperCase() + method.slice(1)}`).classList.add('active');

  // Update method content
  const fileMethod = document.getElementById('importFileMethod');
  const textMethod = document.getElementById('importTextMethod');

  if (method === 'file') {
    fileMethod.style.display = 'block';
    textMethod.style.display = 'none';
  } else {
    fileMethod.style.display = 'none';
    textMethod.style.display = 'block';
  }

  // Reset import data and buttons
  importedData = null;
  document.getElementById('startImport').disabled = true;
  document.getElementById('fileInfo').classList.remove('visible', 'error');
  document.getElementById('textInfo').classList.remove('visible', 'error');
}

// Toggle profile editor visibility
function toggleProfileEditor() {
  const summary = document.getElementById('profileSummary');
  const editor = document.getElementById('profileEditor');
  const button = document.getElementById('toggleProfileEdit');

  if (editor.style.display === 'none') {
    summary.style.display = 'none';
    editor.style.display = 'block';
    button.textContent = '✖️';
    button.title = 'Bearbeitung abbrechen';
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
  button.textContent = '✏️';
  button.title = 'Profil bearbeiten';
}

// Update day times input state based on checkbox
function updateDayTimesState(day) {
  const checkbox = document.getElementById(`day${day}Enabled`);
  const times = checkbox.closest('.day-schedule').querySelector('.day-times');

  if (checkbox.checked) {
    times.style.opacity = '1';
    times.style.pointerEvents = 'auto';
  } else {
    times.style.opacity = '0.4';
    times.style.pointerEvents = 'none';
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
    // Get personio instance from profile or default
    const profile = await storageManager.loadWorkProfile();
    const personioInstance = profile?.personioInstance || 'aoe-gmbh.app.personio.com';

    // Try to extract auth data
    const authData = await authManager.extractAuthData(personioInstance);

    if (authData && authData.xsrfToken) {
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

// Load work profile from storage
async function loadWorkProfile() {
  try {
    const profile = await storageManager.loadWorkProfile();

    if (profile) {
      currentWorkProfile = profile;
      populateFormWithProfile(profile);
      updateProfileSummary(profile);
      updateProfileStatus(true);
      document.getElementById('startRecording').disabled = false;
    } else {
      updateProfileStatus(false);
      setDefaultSchedule();
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
    setDefaultSchedule();
  }
}

// Populate form with profile data
function populateFormWithProfile(profile) {
  document.getElementById('personioInstance').value = profile.personioInstance || '';
  document.getElementById('employeeId').value = profile.employeeId || '';
  document.getElementById('timezone').value = profile.timezone || 'Europe/Berlin';

  // Populate per-day schedule
  if (profile.schedule) {
    for (let day = 1; day <= 7; day++) {
      const daySchedule = profile.schedule[day];
      const checkbox = document.getElementById(`day${day}Enabled`);

      if (daySchedule) {
        checkbox.checked = daySchedule.enabled;
        document.getElementById(`day${day}WorkStart`).value = daySchedule.workStart || '08:00';
        document.getElementById(`day${day}WorkEnd`).value = daySchedule.workEnd || '17:00';
        document.getElementById(`day${day}BreakStart`).value = daySchedule.breakStart || '12:00';
        document.getElementById(`day${day}BreakEnd`).value = daySchedule.breakEnd || '13:00';
        updateDayTimesState(day);
      }
    }
  } else {
    // Migrate old profile format
    setDefaultSchedule();
    if (profile.workingDays) {
      profile.workingDays.forEach(day => {
        document.getElementById(`day${day}Enabled`).checked = true;
        updateDayTimesState(day);
      });
    }
  }
}

// Update profile summary display
function updateProfileSummary(profile) {
  document.getElementById('summaryInstance').textContent = profile.personioInstance || '-';
  document.getElementById('summaryEmployeeId').textContent = profile.employeeId || '-';

  // Build workdays summary
  const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const workdays = [];

  if (profile.schedule) {
    for (let day = 1; day <= 7; day++) {
      if (profile.schedule[day]?.enabled) {
        workdays.push(dayNames[day === 7 ? 0 : day]);
      }
    }
  }

  document.getElementById('summaryWorkdays').textContent = workdays.join(', ') || '-';

  // Build schedule details
  const scheduleContainer = document.getElementById('summarySchedule');
  scheduleContainer.innerHTML = '';

  if (profile.schedule) {
    const fullDayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

    for (let day = 1; day <= 7; day++) {
      const daySchedule = profile.schedule[day];
      if (daySchedule?.enabled) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'summary-day';

        const dayName = document.createElement('span');
        dayName.className = 'summary-day-name';
        dayName.textContent = fullDayNames[day === 7 ? 0 : day];

        const dayTimes = document.createElement('span');
        dayTimes.className = 'summary-day-times';
        dayTimes.textContent = `${daySchedule.workStart}-${daySchedule.workEnd} (Pause: ${daySchedule.breakStart}-${daySchedule.breakEnd})`;

        dayDiv.appendChild(dayName);
        dayDiv.appendChild(dayTimes);
        scheduleContainer.appendChild(dayDiv);
      }
    }
  }
}

// Set default schedule (Monday-Friday)
function setDefaultSchedule() {
  for (let day = 1; day <= 7; day++) {
    const checkbox = document.getElementById(`day${day}Enabled`);
    checkbox.checked = day >= 1 && day <= 5; // Monday-Friday

    // Default times
    document.getElementById(`day${day}WorkStart`).value = '08:00';
    document.getElementById(`day${day}WorkEnd`).value = day === 5 ? '13:00' : '17:00'; // Friday shorter
    document.getElementById(`day${day}BreakStart`).value = '12:00';
    document.getElementById(`day${day}BreakEnd`).value = day === 5 ? '12:30' : '13:00';

    updateDayTimesState(day);
  }
}

// Update profile status display
function updateProfileStatus(hasProfile) {
  const statusBox = document.getElementById('profileStatus');

  if (hasProfile) {
    statusBox.className = 'info-box success';
    statusBox.innerHTML = '<p>✅ Profil konfiguriert und bereit</p>';
  } else {
    statusBox.className = 'info-box';
    statusBox.innerHTML = '<p>Bitte zuerst Profil konfigurieren und speichern.</p>';
  }
}

// Handle save profile
async function handleSaveProfile() {
  const saveBtn = document.getElementById('saveProfile');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Speichern...';

  try {
    // Collect form data with per-day schedule
    const schedule = {};
    const workingDays = [];

    for (let day = 1; day <= 7; day++) {
      const enabled = document.getElementById(`day${day}Enabled`).checked;

      if (enabled) {
        workingDays.push(day);
      }

      schedule[day] = {
        enabled: enabled,
        workStart: document.getElementById(`day${day}WorkStart`).value,
        workEnd: document.getElementById(`day${day}WorkEnd`).value,
        breakStart: document.getElementById(`day${day}BreakStart`).value,
        breakEnd: document.getElementById(`day${day}BreakEnd`).value
      };
    }

    const profile = {
      personioInstance: document.getElementById('personioInstance').value.trim(),
      employeeId: document.getElementById('employeeId').value.trim(),
      timezone: document.getElementById('timezone').value,
      schedule: schedule,
      workingDays: workingDays // Keep for backwards compatibility
    };

    // Validate profile
    const validation = validateWorkProfile(profile);
    if (!validation.isValid) {
      alert('Validierungsfehler:\n\n' + validation.errors.join('\n'));
      return;
    }

    // Save to storage
    await storageManager.saveWorkProfile(profile);
    currentWorkProfile = profile;

    // Update UI
    updateProfileSummary(profile);
    updateProfileStatus(true);
    hideProfileEditor();
    document.getElementById('startRecording').disabled = false;

    // Re-check authentication with new instance
    await checkAuthentication();

    // Show success message
    saveBtn.textContent = '✅ Gespeichert!';
    setTimeout(() => {
      saveBtn.textContent = 'Profil speichern';
    }, 2000);

  } catch (error) {
    console.error('Failed to save profile:', error);
    alert('Fehler beim Speichern: ' + error.message);
  } finally {
    saveBtn.disabled = false;
  }
}

// Validate work profile
function validateWorkProfile(profile) {
  const errors = [];

  if (!profile.personioInstance) {
    errors.push('Personio Instanz fehlt');
  }

  if (!profile.employeeId) {
    errors.push('Employee ID fehlt');
  }

  // Check if at least one day is enabled
  const hasEnabledDay = Object.values(profile.schedule).some(day => day.enabled);
  if (!hasEnabledDay) {
    errors.push('Mindestens ein Arbeitstag muss aktiviert sein');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Handle start recording (Profile-based)
async function handleStartRecording() {
  if (!currentWorkProfile) {
    alert('Bitte zuerst Profil speichern!');
    return;
  }

  const startBtn = document.getElementById('startRecording');
  startBtn.disabled = true;
  startBtn.textContent = 'Starte...';

  // Hide result section, show progress
  document.getElementById('resultSection').style.display = 'none';
  document.getElementById('progressSection').style.display = 'block';
  document.getElementById('progressLog').innerHTML = '';

  try {
    // Verify auth works
    addProgressLog('🔑 Prüfe Authentifizierung...');
    const testAuth = await authManager.extractAuthData(currentWorkProfile.personioInstance);

    if (!testAuth || !testAuth.xsrfToken) {
      throw new Error('Authentifizierung fehlgeschlagen. Bitte bei Personio einloggen.');
    }

    addProgressLog('✅ Authentifizierung OK');

    // Initialize services
    const apiClient = new PersonioAPIClient(currentWorkProfile.personioInstance, authManager);
    const timesheetService = new TimesheetService(apiClient);
    const attendanceService = new AttendanceService(apiClient, timesheetService);

    addProgressLog('📅 Rufe Timesheet ab...');

    // Fetch timesheet
    const timesheet = await timesheetService.getCurrentMonthTimesheet(
      currentWorkProfile.employeeId,
      currentWorkProfile.timezone
    );

    addProgressLog(`✅ Timesheet abgerufen: ${timesheet.timecards.length} Tage gefunden`);

    // Get recordable days
    const recordableDays = timesheetService.getRecordableDays(timesheet, currentWorkProfile);

    if (recordableDays.length === 0) {
      addProgressLog('ℹ️ Keine Tage zum Eintragen gefunden');
      showResults({
        total: 0,
        successful: 0,
        failed: 0,
        details: []
      });
      return;
    }

    addProgressLog(`📝 ${recordableDays.length} Tage zum Eintragen gefunden`);

    // Record attendance
    const results = await attendanceService.recordMultipleDays(
      recordableDays,
      currentWorkProfile.employeeId,
      currentWorkProfile,
      updateProgress
    );

    // Show results
    showResults(results);

    // Save last sync timestamp
    await storageManager.saveLastSync(Date.now());

  } catch (error) {
    console.error('Recording failed:', error);
    addProgressLog(`❌ Fehler: ${error.message}`, true);
    alert('Fehler bei der Zeiterfassung:\n\n' + error.message);
  } finally {
    startBtn.disabled = false;
    startBtn.textContent = 'Zeiterfassung starten';
  }
}

// Handle file selection for import
async function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const fileInfo = document.getElementById('fileInfo');
  const startImportBtn = document.getElementById('startImport');

  try {
    // Read and parse JSON file
    const text = await file.text();
    const data = JSON.parse(text);

    // Parse the import data
    const parsed = timeImportService.parseImportData(data);

    importedData = parsed;

    // Show file info
    fileInfo.classList.add('visible');
    fileInfo.classList.remove('error');
    fileInfo.innerHTML = `
      <p><strong>✅ Datei geladen:</strong> ${file.name}</p>
      <p>${parsed.totalDays} Tag(e) gefunden</p>
      <p>Zeitraum: ${parsed.dateRange.start} bis ${parsed.dateRange.end}</p>
    `;

    startImportBtn.disabled = false;

  } catch (error) {
    console.error('File parse error:', error);
    fileInfo.classList.add('visible', 'error');
    fileInfo.innerHTML = `
      <p><strong>❌ Fehler beim Lesen der Datei:</strong></p>
      <p>${error.message}</p>
    `;
    importedData = null;
    startImportBtn.disabled = true;
  }
}

// Handle text import parsing
function handleParseImportText() {
  const textArea = document.getElementById('importText');
  const textInfo = document.getElementById('textInfo');
  const startImportBtn = document.getElementById('startImport');

  const text = textArea.value.trim();

  if (!text) {
    textInfo.classList.add('visible', 'error');
    textInfo.innerHTML = `
      <p><strong>❌ Keine Daten vorhanden</strong></p>
      <p>Bitte JSON-Daten einfügen</p>
    `;
    importedData = null;
    startImportBtn.disabled = true;
    return;
  }

  try {
    // Parse JSON
    const data = JSON.parse(text);

    // Parse the import data
    const parsed = timeImportService.parseImportData(data);

    importedData = parsed;

    // Show text info
    textInfo.classList.add('visible');
    textInfo.classList.remove('error');
    textInfo.innerHTML = `
      <p><strong>✅ JSON erfolgreich geparst</strong></p>
      <p>${parsed.totalDays} Tag(e) gefunden</p>
      <p>Zeitraum: ${parsed.dateRange.start} bis ${parsed.dateRange.end}</p>
    `;

    startImportBtn.disabled = false;

  } catch (error) {
    console.error('❌ Fehler beim Parsen der Daten:', error);
    textInfo.classList.add('visible', 'error');
    textInfo.innerHTML = `
      <p><strong>❌ Fehler beim Parsen:</strong></p>
      <p>${error.message}</p>
    `;
    importedData = null;
    startImportBtn.disabled = true;
  }
}

// Handle start import
async function handleStartImport() {
  if (!importedData) {
    alert('Bitte zuerst eine Datei auswählen!');
    return;
  }

  if (!currentWorkProfile) {
    alert('Bitte zuerst Profil speichern (für Personio-Zugangsdaten)!');
    return;
  }

  const startBtn = document.getElementById('startImport');
  startBtn.disabled = true;
  startBtn.textContent = 'Importiere...';

  // Hide result section, show progress
  document.getElementById('importResultSection').style.display = 'none';
  document.getElementById('importProgressSection').style.display = 'block';
  document.getElementById('importProgressLog').innerHTML = '';

  try {
    // Verify auth
    addImportProgressLog('🔑 Prüfe Authentifizierung...');
    const testAuth = await authManager.extractAuthData(currentWorkProfile.personioInstance);

    if (!testAuth || !testAuth.xsrfToken) {
      throw new Error('Authentifizierung fehlgeschlagen. Bitte bei Personio einloggen.');
    }

    addImportProgressLog('✅ Authentifizierung OK');

    // Initialize services
    const apiClient = new PersonioAPIClient(currentWorkProfile.personioInstance, authManager);
    const timesheetService = new TimesheetService(apiClient);
    const attendanceService = new AttendanceService(apiClient, timesheetService);

    addImportProgressLog('📅 Rufe Timesheet ab...');

    // Fetch timesheet for the date range
    const timesheet = await timesheetService.getCurrentMonthTimesheet(
      currentWorkProfile.employeeId,
      currentWorkProfile.timezone
    );

    addImportProgressLog(`✅ Timesheet abgerufen: ${timesheet.timecards.length} Tage gefunden`);

    // Match import data with timesheet
    const recordableDays = timeImportService.matchWithTimesheet(importedData, timesheet);

    if (recordableDays.length === 0) {
      addImportProgressLog('ℹ️ Keine Tage zum Eintragen gefunden (alle bereits eingetragen oder nicht trackbar)');
      showImportResults({
        total: 0,
        successful: 0,
        failed: 0,
        details: []
      });
      return;
    }

    addImportProgressLog(`📝 ${recordableDays.length} Tage zum Eintragen gefunden`);

    // Record attendance from import
    const results = await attendanceService.recordMultipleDays(
      recordableDays,
      currentWorkProfile.employeeId,
      null, // No profile schedule needed for import
      updateImportProgress
    );

    // Show results
    showImportResults(results);

    // Save last sync timestamp
    await storageManager.saveLastSync(Date.now());

  } catch (error) {
    console.error('Import failed:', error);
    addImportProgressLog(`❌ Fehler: ${error.message}`, true);
    alert('Fehler beim Import:\n\n' + error.message);
  } finally {
    startBtn.disabled = false;
    startBtn.textContent = 'Import starten';
  }
}

// Update progress display
function updateProgress(current, total, date, success) {
  const percentage = (current / total) * 100;
  document.getElementById('progressFill').style.width = percentage + '%';
  document.getElementById('progressText').textContent = `${current} / ${total}`;

  const status = success ? '✅' : '❌';
  addProgressLog(`${status} ${date}`, !success);
}

// Update import progress display
function updateImportProgress(current, total, date, success) {
  const percentage = (current / total) * 100;
  document.getElementById('importProgressFill').style.width = percentage + '%';
  document.getElementById('importProgressText').textContent = `${current} / ${total}`;

  const status = success ? '✅' : '❌';
  addImportProgressLog(`${status} ${date}`, !success);
}

// Add entry to progress log
function addProgressLog(message, isError = false) {
  const log = document.getElementById('progressLog');
  const entry = document.createElement('div');
  entry.className = 'progress-log-entry' + (isError ? ' error' : ' success');
  entry.textContent = message;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

// Add entry to import progress log
function addImportProgressLog(message, isError = false) {
  const log = document.getElementById('importProgressLog');
  const entry = document.createElement('div');
  entry.className = 'progress-log-entry' + (isError ? ' error' : ' success');
  entry.textContent = message;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

// Show results
function showResults(results) {
  document.getElementById('progressSection').style.display = 'none';
  document.getElementById('resultSection').style.display = 'block';

  const summary = document.getElementById('resultSummary');
  const details = document.getElementById('resultDetails');

  const hasErrors = results.failed > 0;
  summary.className = 'result-summary' + (hasErrors ? ' has-errors' : '');

  summary.innerHTML = `
    <h4>${results.successful} / ${results.total} erfolgreich</h4>
    <p>${results.failed > 0 ? `${results.failed} fehlgeschlagen` : 'Alle Tage erfolgreich eingetragen!'}</p>
  `;

  // Show details
  details.innerHTML = '';
  results.details.forEach(item => {
    const div = document.createElement('div');
    div.className = 'result-item' + (item.success ? '' : ' error');
    div.innerHTML = `
      <div class="result-item-date">${item.success ? '✅' : '❌'} ${item.date}</div>
      <div class="result-item-message">${item.success ? item.message : item.error}</div>
    `;
    details.appendChild(div);
  });
}

// Show import results
function showImportResults(results) {
  document.getElementById('importProgressSection').style.display = 'none';
  document.getElementById('importResultSection').style.display = 'block';

  const summary = document.getElementById('importResultSummary');
  const details = document.getElementById('importResultDetails');

  const hasErrors = results.failed > 0;
  summary.className = 'result-summary' + (hasErrors ? ' has-errors' : '');

  summary.innerHTML = `
    <h4>${results.successful} / ${results.total} erfolgreich</h4>
    <p>${results.failed > 0 ? `${results.failed} fehlgeschlagen` : 'Alle Tage erfolgreich importiert!'}</p>
  `;

  // Show details
  details.innerHTML = '';
  results.details.forEach(item => {
    const div = document.createElement('div');
    div.className = 'result-item' + (item.success ? '' : ' error');
    div.innerHTML = `
      <div class="result-item-date">${item.success ? '✅' : '❌'} ${item.date}</div>
      <div class="result-item-message">${item.success ? item.message : item.error}</div>
    `;
    details.appendChild(div);
  });
}

