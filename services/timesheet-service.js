// Timesheet Service - Handles timesheet operations
class TimesheetService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get timesheet for current month
   * @param {string|number} employeeId
   * @param {string} timezone
   * @returns {Promise<Object>}
   */
  async getCurrentMonthTimesheet(employeeId, timezone = 'Europe/Berlin') {
    const { start, end } = getCurrentMonthRange();
    return await this.apiClient.fetchTimesheet(employeeId, start, end, timezone);
  }

  /**
   * Filter timecards to get recordable days
   * @param {Object} timesheet - Timesheet response from API
   * @param {Object} workProfile - User's work profile
   * @returns {Array} Array of timecards that should be recorded
   */
  getRecordableDays(timesheet, workProfile) {
    if (!timesheet.timecards || !Array.isArray(timesheet.timecards)) {
      return [];
    }

    return timesheet.timecards.filter(card => {
      // Check 1: Must be trackable
      if (card.state !== 'trackable') {
        return false;
      }

      // Check 2: Must not be an off-day
      if (card.is_off_day) {
        return false;
      }

      // Check 3: Must not have periods already
      if (card.periods && card.periods.length > 0) {
        return false;
      }

      // Check 4: Must be a configured working day
      const date = new Date(card.date);
      const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to ISO (1=Monday, 7=Sunday)

      if (!workProfile.workingDays.includes(isoDayOfWeek)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Generate periods for a day based on work profile
   * @param {string} date - YYYY-MM-DD
   * @param {Object} workProfile
   * @returns {Array} Array of period objects
   */
  generatePeriodsForDay(date, workProfile) {
    const periods = [];

    // Period 1: Work from start to break start
    periods.push({
      attendance_period_id: generateUUID(),
      start: `${date} ${workProfile.workStart}:00`,
      end: `${date} ${workProfile.breakStart}:00`,
      period_type: 'work',
      comment: null,
      project_id: null
    });

    // Period 2: Break
    periods.push({
      attendance_period_id: generateUUID(),
      start: `${date} ${workProfile.breakStart}:00`,
      end: `${date} ${workProfile.breakEnd}:00`,
      period_type: 'break',
      comment: null,
      project_id: null
    });

    // Period 3: Work from break end to work end
    periods.push({
      attendance_period_id: generateUUID(),
      start: `${date} ${workProfile.breakEnd}:00`,
      end: `${date} ${workProfile.workEnd}:00`,
      period_type: 'work',
      comment: null,
      project_id: null
    });

    return periods;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TimesheetService;
}

