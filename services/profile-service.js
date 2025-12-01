// filepath: /Users/czern/IdeaProjects/personio-attendance-recorder/services/profile-service.js
// ProfileService - Kapselt Logik rund um Arbeitszeitprofil
class ProfileService {
  constructor(storageManager) {
    this.storageManager = storageManager;
  }

  async loadProfile() {
    const profile = await this.storageManager.loadWorkProfile();
    return profile || null;
  }

  async saveProfile(profile) {
    await this.storageManager.saveWorkProfile(profile);
  }

  validateProfile(profile) {
    const errors = [];
    if (!profile.personioInstance) errors.push('Personio Instanz fehlt');
    if (!profile.employeeId) errors.push('Employee ID fehlt');
    const hasEnabledDay = Object.values(profile.schedule).some(d => d.enabled);
    if (!hasEnabledDay) errors.push('Mindestens ein Arbeitstag muss aktiviert sein');
    return { isValid: errors.length === 0, errors };
  }

  setDefaultSchedule() {
    const schedule = {};
    for (let day = 1; day <= 7; day++) {
      schedule[day] = {
        enabled: day >= 1 && day <= 5,
        workStart: '08:00',
        workEnd: day === 5 ? '13:00' : '17:00',
        breakStart: '12:00',
        breakEnd: day === 5 ? '12:30' : '13:00'
      };
    }
    return schedule;
  }

  migrateLegacyProfile(profile) {
    if (!profile.schedule && profile.workingDays) {
      const schedule = this.setDefaultSchedule();
      // Aktivieren nur definierter Tage
      for (let d = 1; d <= 7; d++) {
        schedule[d].enabled = profile.workingDays.includes(d);
      }
      profile.schedule = schedule;
    }
    return profile;
  }

  // UI-Helfer extrahiert, um DOM-Manipulation zentral zu halten
  populateForm(profile) {
    document.getElementById('personioInstance').value = profile.personioInstance || '';
    document.getElementById('employeeId').value = profile.employeeId || '';
    document.getElementById('timezone').value = profile.timezone || 'Europe/Berlin';

    if (profile.schedule) {
      for (let day = 1; day <= 7; day++) {
        const daySchedule = profile.schedule[day];
        const checkbox = document.getElementById(`day${day}Enabled`);
        if (!checkbox) continue;
        if (daySchedule) {
          checkbox.checked = daySchedule.enabled;
          document.getElementById(`day${day}WorkStart`).value = daySchedule.workStart;
          document.getElementById(`day${day}WorkEnd`).value = daySchedule.workEnd;
          document.getElementById(`day${day}BreakStart`).value = daySchedule.breakStart;
          document.getElementById(`day${day}BreakEnd`).value = daySchedule.breakEnd;
        }
      }
    }
  }

  populateDefaultSchedule() {
    const schedule = this.setDefaultSchedule();
    for (let day = 1; day <= 7; day++) {
      const cfg = schedule[day];
      const enabledEl = document.getElementById(`day${day}Enabled`);
      if (enabledEl) enabledEl.checked = cfg.enabled;
      const ws = document.getElementById(`day${day}WorkStart`);
      const we = document.getElementById(`day${day}WorkEnd`);
      const bs = document.getElementById(`day${day}BreakStart`);
      const be = document.getElementById(`day${day}BreakEnd`);
      if (ws) ws.value = cfg.workStart;
      if (we) we.value = cfg.workEnd;
      if (bs) bs.value = cfg.breakStart;
      if (be) be.value = cfg.breakEnd;
    }
  }

  updateSummary(profile) {
    document.getElementById('summaryInstance').textContent = profile.personioInstance || '-';
    document.getElementById('summaryEmployeeId').textContent = profile.employeeId || '-';

    const dayNamesShort = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const workdays = [];
    for (let day = 1; day <= 7; day++) {
      if (profile.schedule?.[day]?.enabled) {
        workdays.push(dayNamesShort[day === 7 ? 0 : day]);
      }
    }
    document.getElementById('summaryWorkdays').textContent = workdays.join(', ') || '-';

    const scheduleContainer = document.getElementById('summarySchedule');
    scheduleContainer.innerHTML = '';
    const fullNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    for (let day = 1; day <= 7; day++) {
      const ds = profile.schedule?.[day];
      if (ds?.enabled) {
        const row = document.createElement('div');
        row.className = 'summary-day';
        row.innerHTML = `<span class="summary-day-name">${fullNames[day === 7 ? 0 : day]}</span>` +
          `<span class="summary-day-times">${ds.workStart}-${ds.workEnd} (Pause: ${ds.breakStart}-${ds.breakEnd})</span>`;
        scheduleContainer.appendChild(row);
      }
    }
  }

  updateStatus(hasProfile) {
    const box = document.getElementById('profileStatus');
    if (hasProfile) {
      box.className = 'info-box success';
      box.innerHTML = '<p>✅ Profil konfiguriert und bereit</p>';
    } else {
      box.className = 'info-box';
      box.innerHTML = '<p>Bitte zuerst Profil konfigurieren und speichern.</p>';
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProfileService;
}
