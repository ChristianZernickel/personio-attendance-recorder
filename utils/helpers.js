// Utility: UUID Generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Utility: Date Formatting
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get current month range
function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  return {
    start: formatDate(startDate),
    end: formatDate(endDate)
  };
}

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Validate work profile
function validateWorkProfile(profile) {
  const errors = [];

  // Employee ID
  if (!profile.employeeId || typeof profile.employeeId !== 'string') {
    errors.push('Employee ID ist erforderlich');
  }

  // Personio Instance
  if (!profile.personioInstance || typeof profile.personioInstance !== 'string') {
    errors.push('Personio Instanz ist erforderlich');
  }

  // Time format validation (HH:MM)
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

  // Validate per-day schedule
  if (profile.schedule) {
    let hasAtLeastOneDay = false;

    for (let day = 1; day <= 7; day++) {
      const daySchedule = profile.schedule[day];

      if (daySchedule && daySchedule.enabled) {
        hasAtLeastOneDay = true;

        if (!timeRegex.test(daySchedule.workStart)) {
          errors.push(`Tag ${day}: Arbeitsbeginn muss im Format HH:MM sein`);
        }

        if (!timeRegex.test(daySchedule.workEnd)) {
          errors.push(`Tag ${day}: Arbeitsende muss im Format HH:MM sein`);
        }

        if (!timeRegex.test(daySchedule.breakStart)) {
          errors.push(`Tag ${day}: Pausenbeginn muss im Format HH:MM sein`);
        }

        if (!timeRegex.test(daySchedule.breakEnd)) {
          errors.push(`Tag ${day}: Pausenende muss im Format HH:MM sein`);
        }

        // Logical validations
        if (daySchedule.workStart >= daySchedule.workEnd) {
          errors.push(`Tag ${day}: Arbeitsende muss nach Arbeitsbeginn liegen`);
        }

        if (daySchedule.breakStart >= daySchedule.breakEnd) {
          errors.push(`Tag ${day}: Pausenende muss nach Pausenbeginn liegen`);
        }

        if (daySchedule.breakStart < daySchedule.workStart || daySchedule.breakEnd > daySchedule.workEnd) {
          errors.push(`Tag ${day}: Pause muss innerhalb der Arbeitszeit liegen`);
        }
      }
    }

    if (!hasAtLeastOneDay) {
      errors.push('Mindestens ein Arbeitstag muss aktiviert sein');
    }
  } else {
    // Fallback validation for old format
    if (!Array.isArray(profile.workingDays) || profile.workingDays.length === 0) {
      errors.push('Mindestens ein Arbeitstag muss ausgewählt sein');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

