// Storage Manager - Handles data persistence
class StorageManager {
  constructor() {
    this.KEYS = {
      WORK_PROFILE: 'workProfile',
      SETTINGS: 'settings',
      LAST_SYNC: 'lastSync'
    };
  }

  /**
   * Save work profile
   * @param {Object} profile
   * @returns {Promise<void>}
   */
  async saveWorkProfile(profile) {
    try {
      await chrome.storage.local.set({
        [this.KEYS.WORK_PROFILE]: profile
      });
      console.log('✅ Work profile saved');
    } catch (error) {
      console.error('❌ Failed to save work profile:', error);
      throw error;
    }
  }

  /**
   * Load work profile
   * @returns {Promise<Object|null>}
   */
  async loadWorkProfile() {
    try {
      const result = await chrome.storage.local.get([this.KEYS.WORK_PROFILE]);
      return result[this.KEYS.WORK_PROFILE] || null;
    } catch (error) {
      console.error('❌ Failed to load work profile:', error);
      throw error;
    }
  }

  /**
   * Save settings
   * @param {Object} settings
   * @returns {Promise<void>}
   */
  async saveSettings(settings) {
    try {
      await chrome.storage.local.set({
        [this.KEYS.SETTINGS]: settings
      });
      console.log('✅ Settings saved');
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Load settings
   * @returns {Promise<Object>}
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.local.get([this.KEYS.SETTINGS]);
      return result[this.KEYS.SETTINGS] || this.getDefaultSettings();
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Save last sync timestamp
   * @param {number} timestamp
   * @returns {Promise<void>}
   */
  async saveLastSync(timestamp) {
    try {
      await chrome.storage.local.set({
        [this.KEYS.LAST_SYNC]: timestamp
      });
    } catch (error) {
      console.error('❌ Failed to save last sync:', error);
    }
  }

  /**
   * Load last sync timestamp
   * @returns {Promise<number|null>}
   */
  async loadLastSync() {
    try {
      const result = await chrome.storage.local.get([this.KEYS.LAST_SYNC]);
      return result[this.KEYS.LAST_SYNC] || null;
    } catch (error) {
      console.error('❌ Failed to load last sync:', error);
      return null;
    }
  }

  /**
   * Clear all storage
   * @returns {Promise<void>}
   */
  async clearAll() {
    try {
      await chrome.storage.local.clear();
      console.log('✅ Storage cleared');
    } catch (error) {
      console.error('❌ Failed to clear storage:', error);
      throw error;
    }
  }

  /**
   * Get default settings
   * @returns {Object}
   */
  getDefaultSettings() {
    return {
      language: 'de',
      theme: 'light',
      autoRecordEnabled: false
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}

