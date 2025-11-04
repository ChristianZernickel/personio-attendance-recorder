// Popup Script - Main UI Logic
let authManager;
let storageManager;
let currentWorkProfile = null;

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Popup initialized');

  authManager = new AuthManager();
  storageManager = new StorageManager();

  await loadWorkProfile();
  await checkAuthentication();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById('saveProfile').addEventListener('click', handleSaveProfile);
  document.getElementById('startRecording').addEventListener('click', handleStartRecording);
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
      updateProfileStatus(true);
      document.getElementById('startRecording').disabled = false;
    } else {
      updateProfileStatus(false);
      // Set default values
      setDefaultWorkDays();
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
    setDefaultWorkDays();
  }
}

// Populate form with profile data
function populateFormWithProfile(profile) {
  document.getElementById('personioInstance').value = profile.personioInstance || '';
  document.getElementById('employeeId').value = profile.employeeId || '';
  document.getElementById('workStart').value = profile.workStart || '08:00';
  document.getElementById('workEnd').value = profile.workEnd || '17:00';
  document.getElementById('breakStart').value = profile.breakStart || '12:00';
  document.getElementById('breakEnd').value = profile.breakEnd || '13:00';
  document.getElementById('timezone').value = profile.timezone || 'Europe/Berlin';

  // Set working days
  const checkboxes = document.querySelectorAll('.workday-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = profile.workingDays.includes(parseInt(cb.value));
  });
}

// Set default work days (Monday to Friday)
function setDefaultWorkDays() {
  const checkboxes = document.querySelectorAll('.workday-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = parseInt(cb.value) >= 1 && parseInt(cb.value) <= 5;
  });
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
    // Collect form data
    const profile = {
      personioInstance: document.getElementById('personioInstance').value.trim(),
      employeeId: document.getElementById('employeeId').value.trim(),
      workingDays: Array.from(document.querySelectorAll('.workday-checkbox:checked'))
        .map(cb => parseInt(cb.value)),
      workStart: document.getElementById('workStart').value,
      workEnd: document.getElementById('workEnd').value,
      breakStart: document.getElementById('breakStart').value,
      breakEnd: document.getElementById('breakEnd').value,
      timezone: document.getElementById('timezone').value
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
    updateProfileStatus(true);
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

// Handle start recording
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
    // Verify auth works (will throw if not logged in)
    addProgressLog('🔑 Prüfe Authentifizierung...');
    const testAuth = await authManager.extractAuthData(currentWorkProfile.personioInstance);

    if (!testAuth || !testAuth.xsrfToken) {
      throw new Error('Authentifizierung fehlgeschlagen. Bitte bei Personio einloggen.');
    }

    addProgressLog('✅ Authentifizierung OK');

    // Initialize services - Pass authManager so it can get fresh cookies!
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

// Update progress display
function updateProgress(current, total, date, success) {
  const percentage = (current / total) * 100;
  document.getElementById('progressFill').style.width = percentage + '%';
  document.getElementById('progressText').textContent = `${current} / ${total}`;

  const status = success ? '✅' : '❌';
  addProgressLog(`${status} ${date}`, !success);
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

