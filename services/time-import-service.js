// Time Import Service - Handles importing time entries from JSON files
class TimeImportService {
  constructor() {
    this.entries = [];
    this.groupedByDate = {};
  }

  /**
   * Parse and validate JSON file
   * @param {File} file - The uploaded JSON file
   * @returns {Promise<Object>} - Validation result with entries
   */
  async parseFile(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        throw new Error('JSON muss ein Array sein');
      }

      if (data.length === 0) {
        throw new Error('Keine Einträge in der Datei gefunden');
      }

      // Validate entries
      const validEntries = [];
      const errors = [];

      for (let i = 0; i < data.length; i++) {
        const entry = data[i];

        if (!entry.start || !entry.end) {
          errors.push(`Eintrag ${i + 1}: 'start' und 'end' sind erforderlich`);
          continue;
        }

        try {
          const startDate = this._parseISOTimestamp(entry.start);
          const endDate = this._parseISOTimestamp(entry.end);

          if (endDate <= startDate) {
            errors.push(`Eintrag ${i + 1}: 'end' muss nach 'start' liegen`);
            continue;
          }

          validEntries.push({
            start: startDate,
            end: endDate,
            originalStart: entry.start,
            originalEnd: entry.end
          });
        } catch (error) {
          errors.push(`Eintrag ${i + 1}: Ungültiges Zeitformat - ${error.message}`);
        }
      }

      if (validEntries.length === 0) {
        throw new Error('Keine gültigen Einträge gefunden:\n' + errors.join('\n'));
      }

      this.entries = validEntries;
      this._groupByDate();

      return {
        success: true,
        totalEntries: data.length,
        validEntries: validEntries.length,
        invalidEntries: errors.length,
        errors: errors,
        dateRange: this._getDateRange(),
        daysCount: Object.keys(this.groupedByDate).length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse ISO timestamp (e.g., "20251113T075824Z")
   * @param {string} timestamp - ISO timestamp string
   * @returns {Date} - Parsed date
   */
  _parseISOTimestamp(timestamp) {
    // Format: YYYYMMDDTHHMMSSZ or standard ISO

    // Try standard ISO first
    let date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Try compact format: 20251113T075824Z
    const match = timestamp.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
    if (match) {
      const [, year, month, day, hour, minute, second] = match;
      date = new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second)
      ));

      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    throw new Error(`Ungültiges Zeitformat: ${timestamp}`);
  }

  /**
   * Group entries by date
   */
  _groupByDate() {
    this.groupedByDate = {};

    for (const entry of this.entries) {
      const dateStr = entry.start.toISOString().split('T')[0];

      if (!this.groupedByDate[dateStr]) {
        this.groupedByDate[dateStr] = [];
      }

      this.groupedByDate[dateStr].push(entry);
    }

    // Sort entries within each day
    for (const dateStr in this.groupedByDate) {
      this.groupedByDate[dateStr].sort((a, b) => a.start - b.start);
    }
  }

  /**
   * Get date range of entries
   * @returns {Object} - {startDate, endDate}
   */
  _getDateRange() {
    const dates = Object.keys(this.groupedByDate).sort();
    return {
      startDate: dates[0],
      endDate: dates[dates.length - 1]
    };
  }

  /**
   * Convert entries for a specific date to Personio periods
   * @param {string} dateStr - Date string (YYYY-MM-DD)
   * @param {string} timezone - Target timezone (default: Europe/Berlin)
   * @returns {Array} - Array of periods with breaks
   */
  convertToPeriods(dateStr, timezone = 'Europe/Berlin') {
    const entries = this.groupedByDate[dateStr];
    if (!entries || entries.length === 0) {
      return [];
    }

    const periods = [];
    const MICRO_GAP_THRESHOLD = 60 * 1000; // 1 minute in milliseconds

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const nextEntry = entries[i + 1];

      // Convert UTC to local timezone and round to minutes
      const startLocal = this._convertToTimezone(entry.start, timezone);
      const endLocal = this._convertToTimezone(entry.end, timezone);

      // Add work period
      periods.push({
        start: startLocal,
        end: endLocal,
        period_type: 'work',
        attendance_period_id: this._generateUUID()
      });

      // Check for break between this and next entry
      if (nextEntry) {
        const gapMs = nextEntry.start - entry.end;

        // Only add break if gap is >= 1 minute
        if (gapMs >= MICRO_GAP_THRESHOLD) {
          const breakStartLocal = this._convertToTimezone(entry.end, timezone);
          const breakEndLocal = this._convertToTimezone(nextEntry.start, timezone);

          periods.push({
            start: breakStartLocal,
            end: breakEndLocal,
            period_type: 'break',
            attendance_period_id: this._generateUUID()
          });
        }
      }
    }

    return periods;
  }

  /**
   * Convert UTC date to timezone and format for Personio
   * @param {Date} date - UTC date
   * @param {string} timezone - Target timezone
   * @returns {string} - Formatted date string (YYYY-MM-DD HH:MM:SS)
   */
  _convertToTimezone(date, timezone) {
    // Convert to timezone using Intl API
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(date);
    const obj = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        obj[part.type] = part.value;
      }
    }

    // Round seconds to 00
    return `${obj.year}-${obj.month}-${obj.day} ${obj.hour}:${obj.minute}:00`;
  }

  /**
   * Generate UUID v4
   * @returns {string} - UUID
   */
  _generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get all dates that can be imported
   * @returns {Array} - Array of date strings
   */
  getImportableDates() {
    return Object.keys(this.groupedByDate).sort();
  }

  /**
   * Get summary of import data
   * @returns {Object} - Summary object
   */
  getSummary() {
    const dates = this.getImportableDates();
    const totalWorkMinutes = this._calculateTotalWorkMinutes();

    return {
      totalEntries: this.entries.length,
      daysCount: dates.length,
      startDate: dates[0],
      endDate: dates[dates.length - 1],
      totalWorkHours: Math.floor(totalWorkMinutes / 60),
      totalWorkMinutes: totalWorkMinutes % 60,
      dates: dates
    };
  }

  /**
   * Calculate total work minutes from all entries
   * @returns {number} - Total minutes
   */
  _calculateTotalWorkMinutes() {
    let totalMs = 0;
    for (const entry of this.entries) {
      totalMs += (entry.end - entry.start);
    }
    return Math.floor(totalMs / (1000 * 60));
  }

  /**
   * Clear all loaded data
   */
  clear() {
    this.entries = [];
    this.groupedByDate = {};
  }
}

