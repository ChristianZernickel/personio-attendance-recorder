// filepath: /Users/czern/IdeaProjects/personio-attendance-recorder/services/recording-workflow-service.js
// RecordingWorkflowService - Orchestriert Profil-basierte und Import-basierte Eintragung
class RecordingWorkflowService {
  constructor(authManager, uiLogService) {
    this.authManager = authManager;
    this.uiLog = uiLogService;
  }

  async recordProfileDays(profile, services) {
    const { timesheetService, attendanceService, storageManager } = services;

    this.uiLog.clear('progressLog');
    this.uiLog.addLog('progressLog', '🔑 Prüfe Authentifizierung...');

    const testAuth = await this.authManager.extractAuthData(profile.personioInstance);
    if (!testAuth?.xsrfToken) {
      throw new Error('Authentifizierung fehlgeschlagen. Bitte bei Personio einloggen.');
    }
    this.uiLog.addLog('progressLog', '✅ Authentifizierung OK');

    this.uiLog.addLog('progressLog', '📅 Rufe Timesheet ab...');
    const timesheet = await timesheetService.getCurrentMonthTimesheet(profile.employeeId, profile.timezone);
    this.uiLog.addLog('progressLog', `✅ Timesheet abgerufen: ${timesheet.timecards.length} Tage gefunden`);

    const recordableDays = timesheetService.getRecordableDays(timesheet, profile);
    if (recordableDays.length === 0) {
      this.uiLog.addLog('progressLog', 'ℹ️ Keine Tage zum Eintragen gefunden');
      this.uiLog.showResults('profile', { total: 0, successful: 0, failed: 0, details: [] });
      return;
    }
    this.uiLog.addLog('progressLog', `📝 ${recordableDays.length} Tage zum Eintragen gefunden`);

    const results = await attendanceService.recordMultipleDays(recordableDays, profile.employeeId, profile, (c, t, date, success) => {
      const status = success ? '✅' : '❌';
      this.uiLog.addLog('progressLog', `${status} ${date}`, !success);
      document.getElementById('progressFill').style.width = (c / t) * 100 + '%';
      document.getElementById('progressText').textContent = `${c} / ${t}`;
    });

    this.uiLog.showResults('profile', results);
    await storageManager.saveLastSync(Date.now());
  }

  async recordImportedDays(profile, importedData, services) {
    const { timesheetService, attendanceService, storageManager, timeImportService } = services;

    this.uiLog.clear('importProgressLog');
    this.uiLog.addLog('importProgressLog', '🔑 Prüfe Authentifizierung...');
    const testAuth = await this.authManager.extractAuthData(profile.personioInstance);
    if (!testAuth?.xsrfToken) throw new Error('Authentifizierung fehlgeschlagen. Bitte bei Personio einloggen.');
    this.uiLog.addLog('importProgressLog', '✅ Authentifizierung OK');

    // Timesheet Bereich bestimmen
    const importDates = importedData.dates;
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const hasPrev = importDates.some(d => {
      const dt = new Date(d);
      return dt.getMonth() !== currentMonth || dt.getFullYear() !== currentYear;
    });

    let timesheet;
    if (hasPrev) {
      this.uiLog.addLog('importProgressLog', '📆 Import enthält Daten aus mehreren Monaten...');
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const prevStart = formatDate(new Date(prevYear, prevMonth, 1));
      const prevEnd = formatDate(new Date(prevYear, prevMonth + 1, 0));
      const currStart = formatDate(new Date(currentYear, currentMonth, 1));
      const currEnd = formatDate(new Date(currentYear, currentMonth + 1, 0));
      this.uiLog.addLog('importProgressLog', `📅 Lade Timesheet: ${prevStart} bis ${currEnd}`);
      const prevTs = await timesheetService.getTimesheet(profile.employeeId, prevStart, prevEnd, profile.timezone);
      const currTs = await timesheetService.getTimesheet(profile.employeeId, currStart, currEnd, profile.timezone);
      timesheet = { timecards: [...prevTs.timecards, ...currTs.timecards], widgets: currTs.widgets };
      this.uiLog.addLog('importProgressLog', `✅ Timesheet geladen: ${timesheet.timecards.length} Tage`);
    } else {
      timesheet = await timesheetService.getCurrentMonthTimesheet(profile.employeeId, profile.timezone);
      this.uiLog.addLog('importProgressLog', `✅ Timesheet abgerufen: ${timesheet.timecards.length} Tage`);
    }

    const recordableDays = [];
    for (const dateStr of importDates) {
      const card = timesheet.timecards.find(c => c.date === dateStr);
      if (!card) { this.uiLog.addLog('importProgressLog', `⚠️ ${dateStr}: Nicht im Timesheet gefunden (übersprungen)`, true); continue; }
      if (card.state !== 'trackable') { this.uiLog.addLog('importProgressLog', `⚠️ ${dateStr}: Nicht trackbar (${card.state})`, true); continue; }
      if (card.periods?.length) { this.uiLog.addLog('importProgressLog', `ℹ️ ${dateStr}: Bereits eingetragen (übersprungen)`); continue; }
      const periods = timeImportService.convertToPeriods(dateStr, profile.timezone);
      if (!periods.length) { this.uiLog.addLog('importProgressLog', `⚠️ ${dateStr}: Keine Perioden generiert`, true); continue; }
      recordableDays.push({ date: dateStr, day_id: card.day_id || generateUUID(), periods });
    }

    if (!recordableDays.length) {
      this.uiLog.addLog('importProgressLog', 'ℹ️ Keine Tage zum Importieren gefunden');
      this.uiLog.showResults('import', { total: 0, successful: 0, failed: 0, details: [] });
      return;
    }

    this.uiLog.addLog('importProgressLog', `📝 ${recordableDays.length} Tage zum Importieren bereit`);

    const results = await attendanceService.recordMultipleDays(recordableDays, profile.employeeId, null, (c, t, date, success) => {
      const status = success ? '✅' : '❌';
      this.uiLog.addLog('importProgressLog', `${status} ${date}`, !success);
      document.getElementById('importProgressFill').style.width = (c / t) * 100 + '%';
      document.getElementById('importProgressText').textContent = `${c} / ${t}`;
    });

    this.uiLog.showResults('import', results);
    await storageManager.saveLastSync(Date.now());
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RecordingWorkflowService;
}
