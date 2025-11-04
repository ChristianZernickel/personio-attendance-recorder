// Auth Manager - Handles authentication with Personio
class AuthManager {
  constructor() {
    this.personioInstance = null;
  }

  /**
   * Extract authentication data from browser cookies
   * IMPORTANT: Always call this before making API requests as cookies change frequently!
   * @param {string} personioInstance - e.g., 'aoe-gmbh.app.personio.com'
   * @returns {Promise<Object>} Authentication data with xsrfToken
   */
  async extractAuthData(personioInstance) {
    try {
      if (personioInstance) {
        this.personioInstance = personioInstance;
      }

      // Get all cookies for Personio domain - FRESH each time!
      // Try both with and without leading dot
      const allCookiesWithDot = await chrome.cookies.getAll({
        domain: '.app.personio.com'
      });

      const allCookiesWithoutDot = await chrome.cookies.getAll({
        url: `https://${this.personioInstance}`
      });

      // Combine both (use Map to avoid duplicates by name)
      const cookieMap = new Map();
      [...allCookiesWithDot, ...allCookiesWithoutDot].forEach(cookie => {
        cookieMap.set(cookie.name, cookie);
      });

      const allCookies = Array.from(cookieMap.values());

      if (!allCookies || allCookies.length === 0) {
        throw new Error('Keine Cookies gefunden. Bitte bei Personio einloggen.');
      }

      // Find ATHENA-XSRF-TOKEN (required for X-Xsrf-Token header)
      const athenaXsrf = allCookies.find(c => c.name === 'ATHENA-XSRF-TOKEN');

      if (!athenaXsrf) {
        throw new Error('ATHENA-XSRF-TOKEN nicht gefunden. Bitte bei Personio einloggen.');
      }

      // Validate required cookies
      const requiredCookies = ['ATHENA_SESSION', 'personio_session'];
      const cookieNames = allCookies.map(c => c.name);
      const missing = requiredCookies.filter(name => !cookieNames.includes(name));

      if (missing.length > 0) {
        console.warn('Fehlende Cookies:', missing);
        throw new Error(`Fehlende Cookies: ${missing.join(', ')}. Bitte bei Personio einloggen.`);
      }

      // Log cookie summary for debugging
      console.log('🍪 All cookies found:');
      allCookies.forEach(c => {
        console.log(`  - ${c.name}: ${c.value.substring(0, 20)}... (domain: ${c.domain})`);
      });

      const authData = {
        xsrfToken: athenaXsrf.value,
        personioInstance: this.personioInstance
      };

      console.log('✅ Auth-Daten extrahiert (Fresh cookies!)');

      return authData;

    } catch (error) {
      console.error('❌ Authentifizierung fehlgeschlagen:', error);
      throw error;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthManager;
}

