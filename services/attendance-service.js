// Attendance Service - Handles attendance recording operations
class AttendanceService {
  constructor(apiClient, timesheetService) {
    this.apiClient = apiClient;
    this.timesheetService = timesheetService;
  }

  /**
   * Record attendance for a single day with retry logic
   * @param {string} dayId - UUID of the day
   * @param {string|number} employeeId
   * @param {Array} periods - Array of period objects
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<Object>}
   */
  async recordDayWithRetry(dayId, employeeId, periods, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const attendanceRequest = {
          attendance_day_id: dayId,
          employee_id: parseInt(employeeId),
          periods: periods
        };

        const result = await this.apiClient.recordAttendance(attendanceRequest);
        return { success: true, result };

      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, error.message);

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const waitTime = 1000 * Math.pow(2, attempt - 1);
          console.log(`Waiting ${waitTime}ms before retry...`);
          await sleep(waitTime);
        }
      }
    }

    return {
      success: false,
      error: lastError.message || 'Unknown error'
    };
  }

  /**
   * Record attendance for multiple days
   * @param {Array} recordableDays - Array of timecard objects
   * @param {string|number} employeeId
   * @param {Object} workProfile
   * @param {Function} progressCallback - Called with (current, total, day, success)
   * @returns {Promise<Object>} Summary of recording results
   */
  async recordMultipleDays(recordableDays, employeeId, workProfile, progressCallback) {
    const results = {
      total: recordableDays.length,
      successful: 0,
      failed: 0,
      details: []
    };

    console.log(`📝 Starting to record ${recordableDays.length} days...`);

    for (let i = 0; i < recordableDays.length; i++) {
      const day = recordableDays[i];
      const dayId = day.day_id || generateUUID();

      console.log(`\n[${i + 1}/${recordableDays.length}] Processing ${day.date}...`);

      try {
        let periods;

        // Check if periods are already provided (e.g., from import)
        if (day.periods && day.periods.length > 0) {
          // Use provided periods (Import mode)
          periods = day.periods;
          console.log(`📥 Using ${periods.length} imported periods`);
        } else if (workProfile) {
          // Generate periods from work profile (Profile mode)
          const date = new Date(day.date);
          const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
          const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to ISO (1=Monday, 7=Sunday)

          periods = this.timesheetService.generatePeriodsForDay(day.date, workProfile, isoDayOfWeek);
          console.log(`📅 Generated ${periods.length} periods from profile`);
        } else {
          throw new Error('Keine Perioden vorhanden und kein Profil zum Generieren');
        }

        // Record the day
        const result = await this.recordDayWithRetry(dayId, employeeId, periods);

        if (result.success) {
          results.successful++;
          results.details.push({
            date: day.date,
            success: true,
            message: 'Erfolgreich eingetragen'
          });
          console.log(`✅ ${day.date} erfolgreich eingetragen`);
        } else {
          results.failed++;
          results.details.push({
            date: day.date,
            success: false,
            error: result.error
          });
          console.error(`❌ ${day.date} fehlgeschlagen: ${result.error}`);
        }

        // Progress callback
        if (progressCallback) {
          progressCallback(i + 1, recordableDays.length, day.date, result.success);
        }

        // Rate limiting: Wait 1 second between requests (except for last one)
        if (i < recordableDays.length - 1) {
          await sleep(1000);
        }

      } catch (error) {
        results.failed++;
        results.details.push({
          date: day.date,
          success: false,
          error: error.message
        });
        console.error(`❌ ${day.date} fehlgeschlagen:`, error);

        // Continue with next day even if this one failed
      }
    }

    console.log(`\n📊 Zusammenfassung: ${results.successful}/${results.total} erfolgreich, ${results.failed} fehlgeschlagen`);
    return results;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AttendanceService;
}

