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
   * Get timesheet for custom date range
   * @param {string|number} employeeId
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   * @param {string} timezone
   * @returns {Promise<Object>}
   */
  async getTimesheet(employeeId, startDate, endDate, timezone = 'Europe/Berlin') {
    return await this.apiClient.fetchTimesheet(employeeId, startDate, endDate, timezone);
  }

  /**
   * Filter timesheet to get recordable days based on work profile
   * @param {Object} timesheet - Full timesheet response
   * @param {Object} workProfile - User's work profile
   * @returns {Array} Array of recordable day objects
   */
  getRecordableDays(timesheet, workProfile) {
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
   * @param {number} dayOfWeek - ISO day of week (1=Monday, 7=Sunday)
   * @returns {Array} Array of period objects
   */
  generatePeriodsForDay(date, workProfile, dayOfWeek) {
    const periods = [];

    // Get schedule for this specific day
    let daySchedule;
    if (workProfile.schedule && workProfile.schedule[dayOfWeek]) {
      daySchedule = workProfile.schedule[dayOfWeek];
    } else {
      // Fallback to old format
      daySchedule = {
        workStart: workProfile.workStart || '08:00',
        workEnd: workProfile.workEnd || '17:00',
        breakStart: workProfile.breakStart || '12:00',
        breakEnd: workProfile.breakEnd || '13:00'
      };
    }

    // Period 1: Work from start to break start
    periods.push({
      attendance_period_id: generateUUID(),
      start: `${date} ${daySchedule.workStart}:00`,
      end: `${date} ${daySchedule.breakStart}:00`,
      period_type: 'work',
      comment: null,
      project_id: null
    });

    // Period 2: Break
    periods.push({
      attendance_period_id: generateUUID(),
      start: `${date} ${daySchedule.breakStart}:00`,
      end: `${date} ${daySchedule.breakEnd}:00`,
      period_type: 'break',
      comment: null,
      project_id: null
    });

    // Period 3: Work from break end to work end
    periods.push({
      attendance_period_id: generateUUID(),
      start: `${date} ${daySchedule.breakEnd}:00`,
      end: `${date} ${daySchedule.workEnd}:00`,
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

