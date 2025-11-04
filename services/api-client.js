// Personio API Client
class PersonioAPIClient {
  constructor(personioInstance, authManager) {
    this.baseUrl = `https://${personioInstance}`;
    this.personioInstance = personioInstance;
    this.authManager = authManager; // AuthManager instance to get fresh cookies
  }

  /**
   * Refresh session by calling /api/v1/projects
   * This sets a fresh personio_session cookie
   * CRITICAL: Must be called before any attendance API calls!
   * @param {string} xsrfToken - Current XSRF token to use for this request
   * @returns {Promise<void>}
   */
  async refreshSession(xsrfToken) {
    const url = `${this.baseUrl}/api/v1/projects`;

    console.log('🔄 Refreshing session via /api/v1/projects...');

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-athena-xsrf-token': xsrfToken  // Lowercase! This is critical!
        },
        credentials: 'include' // This will receive the fresh personio_session cookie
      });

      if (!response.ok) {
        console.warn(`⚠️ Session refresh returned ${response.status}, but continuing...`);
      } else {
        console.log('✅ Session refreshed successfully');
      }

      // Delay to ensure cookie is set and propagated
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.warn('⚠️ Session refresh failed:', error.message, '- continuing anyway...');
      // Don't throw - try to continue even if refresh fails
    }
  }

  /**
   * Get fresh auth data before each request
   * @returns {Promise<Object>}
   */
  async getFreshAuthData() {
    return await this.authManager.extractAuthData(this.personioInstance);
  }

  /**
   * Fetch timesheet for a given period
   * @param {string|number} employeeId
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   * @param {string} timezone - Default: Europe/Berlin
   * @returns {Promise<Object>}
   */
  async fetchTimesheet(employeeId, startDate, endDate, timezone = 'Europe/Berlin') {
    const url = `${this.baseUrl}/svc/attendance-bff/v1/timesheet/${employeeId}` +
                `?start_date=${startDate}&end_date=${endDate}&timezone=${encodeURIComponent(timezone)}`;

    console.log(`📅 Fetching timesheet: ${startDate} to ${endDate}`);

    try {
      // STEP 1: Get initial auth data
      const initialAuthData = await this.getFreshAuthData();

      // STEP 2: Refresh session with current token
      await this.refreshSession(initialAuthData.xsrfToken);

      // STEP 3: Get FRESH auth data after session refresh
      const authData = await this.getFreshAuthData();

      // STEP 4: Make the actual request
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-athena-xsrf-token': authData.xsrfToken  // Lowercase!
        },
        credentials: 'include' // Chrome sends cookies automatically (including fresh personio_session)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Timesheet abgerufen: ${data.timecards?.length || 0} Tage`);
      return data;

    } catch (error) {
      console.error('❌ Timesheet fetch failed:', error);
      throw error;
    }
  }

  /**
   * Record attendance for a single day
   * IMPORTANT: This is a 2-step process:
   * 1. POST to validate-and-calculate-full-day (validates)
   * 2. PUT to /v1/days/{day_id} (actually saves!)
   * @param {Object} attendanceDayRequest
   * @returns {Promise<Object>}
   */
  async recordAttendance(attendanceDayRequest) {
    console.log(`📝 Recording attendance for day: ${attendanceDayRequest.attendance_day_id}`);

    try {
      // STEP 1: Get initial auth data
      const initialAuthData = await this.getFreshAuthData();

      // STEP 2: Refresh session with current token
      await this.refreshSession(initialAuthData.xsrfToken);

      // STEP 3: Get FRESH auth data after session refresh
      const authData = await this.getFreshAuthData();

      console.log('🔑 Using fresh XSRF token (full):', authData.xsrfToken);

      // STEP 4: Validate the day (POST to validate-and-calculate-full-day)
      const validateUrl = `${this.baseUrl}/svc/attendance-api/validate-and-calculate-full-day?propose-fix=false`;

      console.log('🔍 Step 1: Validating attendance...');

      // Use content script to make request (runs in page context!)
      const validateResult = await this._makeRequestViaContentScript(
        validateUrl,
        'POST',
        attendanceDayRequest,
        authData.xsrfToken
      );

      console.log(`✅ Validation successful:`, validateResult);

      // STEP 5: Actually save the day (PUT to /v1/days/{day_id})
      // Use SAME auth data - no need to refresh again
      const saveUrl = `${this.baseUrl}/svc/attendance-api/v1/days/${attendanceDayRequest.attendance_day_id}`;

      // Convert periods to the format expected by PUT endpoint
      const savePeriods = attendanceDayRequest.periods.map(period => ({
        id: period.attendance_period_id,
        comment: period.comment,
        period_type: period.period_type,
        project_id: period.project_id,
        start: this._convertToISOFormat(period.start), // Convert to ISO-8601 with T
        end: this._convertToISOFormat(period.end),     // Convert to ISO-8601 with T
        auto_generated: false
      }));

      const savePayload = {
        employee_id: attendanceDayRequest.employee_id,
        periods: savePeriods,
        original_periods: null,
        geolocation: null,
        is_from_clock_out: false
      };

      console.log('💾 Step 2: Saving attendance...', savePayload);

      // Use content script to make request
      const saveResult = await this._makeRequestViaContentScript(
        saveUrl,
        'PUT',
        savePayload,
        authData.xsrfToken
      );

      console.log(`✅ Attendance saved successfully!`);

      return saveResult;

    } catch (error) {
      console.error('❌ Attendance record failed:', error);
      throw error;
    }
  }

  /**
   * Convert "YYYY-MM-DD HH:MM:SS" to "YYYY-MM-DDTHH:MM:SS" (ISO-8601 format)
   * @param {string} dateTimeString
   * @returns {string}
   */
  _convertToISOFormat(dateTimeString) {
    // Replace space with T
    return dateTimeString.replace(' ', 'T');
  }

  /**
   * Make HTTP request via content script (runs in page context with full cookie access)
   * @param {string} url
   * @param {string} method
   * @param {Object} body
   * @param {string} xsrfToken
   * @returns {Promise<Object>}
   */
  async _makeRequestViaContentScript(url, method, body, xsrfToken) {
    // Get ANY Personio tab (not just active)
    const tabs = await chrome.tabs.query({
      url: 'https://*.app.personio.com/*'
    });

    console.log(`🔍 Found ${tabs.length} Personio tab(s)`);

    if (tabs.length === 0) {
      throw new Error('Kein Personio-Tab gefunden. Bitte öffnen Sie Personio in einem Tab.');
    }

    // Use first Personio tab (could be improved to find best match)
    const tab = tabs[0];
    console.log(`📍 Using tab: ${tab.id} - ${tab.title}`);

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'x-athena-xsrf-token': xsrfToken,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    console.log(`📤 Sending request to content script: ${method} ${url}`);

    // Send message to content script
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'makeApiRequest',
        url: url,
        method: method,
        body: body,
        headers: headers
      }, (response) => {
        // Check for Chrome runtime errors
        if (chrome.runtime.lastError) {
          const errorMsg = chrome.runtime.lastError.message;
          console.error('❌ Chrome runtime error:', errorMsg);

          // Provide helpful error messages
          if (errorMsg.includes('Receiving end does not exist')) {
            reject(new Error('Content script nicht geladen. Bitte laden Sie die Personio-Seite neu.'));
          } else {
            reject(new Error(`Content script error: ${errorMsg}`));
          }
          return;
        }

        // Check response
        if (!response) {
          console.error('❌ No response from content script');
          reject(new Error('Keine Antwort vom Content Script. Bitte Extension neu laden.'));
          return;
        }

        if (response.success) {
          console.log(`✅ Content script response: Success`);
          resolve(response.data);
        } else {
          console.error(`❌ Content script response: Error`, response.error);
          reject(new Error(response.error || 'Unknown error from content script'));
        }
      });
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PersonioAPIClient;
}

