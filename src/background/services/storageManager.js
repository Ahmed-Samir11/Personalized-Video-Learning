/**
 * Storage Manager - Handles all chrome.storage operations
 * 
 * Manages user settings, preferences, and extension state
 */

export class StorageManager {
  constructor() {
    this.defaults = {
      // Feature toggles
      features: {
        objectHighlighting: true,
        vocabularySimplification: true,
        stepChecklist: true,
        autoPause: true,
        focusMode: false
      },
      // Global enable/disable for the whole extension (useful to completely turn off)
      extensionEnabled: true,
      
      // User preferences
      preferences: {
        simplificationLevel: 'elementary', // elementary, middle, high
        highlightColor: '#FFD700',
        highlightOpacity: 0.3,
        pauseDuration: 3, // seconds before complex steps
        proactiveAssistance: true,
        uiPosition: 'right', // left, right
        fontSize: 'medium' // small, medium, large
      },
      
      // AI configuration
      ai: {
        provider: 'openai',
        apiKey: null,
        apiEndpoint: null,
        modelVLM: 'gpt-4-vision-preview',
        modelLLM: 'gpt-4-turbo-preview',
        useMockAI: true // Default to mock AI for easy testing
      },
      
      // User data
      userData: {
        totalVideosWatched: 0,
        totalInterventions: 0,
        preferredInterventions: [],
        lastUsed: null
      }
    };
  }

  /**
   * Initialize default settings
   */
  async initializeDefaults() {
    await chrome.storage.sync.set(this.defaults);
    console.log('[StorageManager] Defaults initialized');
  }

  /**
   * Is the extension globally enabled?
   */
  async isExtensionEnabled() {
    const val = await this.getSetting('extensionEnabled');
    // Default to true if not set
    return typeof val === 'boolean' ? val : true;
  }

  /**
   * Set the global enabled state for the extension
   */
  async setExtensionEnabled(enabled) {
    await this.updateSetting('extensionEnabled', !!enabled);
  }

  /**
   * Toggle the global enabled state
   */
  async toggleExtensionEnabled() {
    const current = await this.getSetting('extensionEnabled');
    const next = !(current === false);
    await this.setExtensionEnabled(next);
    return next;
  }

  /**
   * Get all settings
   */
  async getAllSettings() {
    return await chrome.storage.sync.get(null);
  }

  /**
   * Get specific setting
   */
  async getSetting(key) {
    const result = await chrome.storage.sync.get(key);
    return result[key];
  }

  /**
   * Update setting
   */
  async updateSetting(key, value) {
    await chrome.storage.sync.set({ [key]: value });
    console.log('[StorageManager] Setting updated:', key);
  }

  /**
   * Get feature toggle state
   */
  async isFeatureEnabled(featureName) {
    const features = await this.getSetting('features');
    return features?.[featureName] ?? true;
  }

  /**
   * Toggle feature on/off
   */
  async toggleFeature(featureName) {
    const features = await this.getSetting('features') || {};
    features[featureName] = !features[featureName];
    await this.updateSetting('features', features);
    return features[featureName];
  }

  /**
   * Get user preferences
   */
  async getPreferences() {
    return await this.getSetting('preferences') || this.defaults.preferences;
  }

  /**
   * Update preferences
   */
  async updatePreferences(newPreferences) {
    const current = await this.getPreferences();
    const updated = { ...current, ...newPreferences };
    await this.updateSetting('preferences', updated);
  }

  /**
   * Get AI configuration
   */
  async getAIConfig() {
    return await this.getSetting('ai') || this.defaults.ai;
  }

  /**
   * Update AI configuration
   */
  async updateAIConfig(config) {
    const current = await this.getAIConfig();
    const updated = { ...current, ...config };
    await this.updateSetting('ai', updated);
  }

  /**
   * Record user interaction for analytics
   */
  async recordInteraction(interactionType) {
    const userData = await this.getSetting('userData') || this.defaults.userData;
    userData.totalInterventions += 1;
    userData.lastUsed = Date.now();
    
    // Track preferred interventions
    if (!userData.preferredInterventions) {
      userData.preferredInterventions = [];
    }
    userData.preferredInterventions.push({
      type: interactionType,
      timestamp: Date.now()
    });
    
    await this.updateSetting('userData', userData);
  }

  /**
   * Clear all data (for testing or user request)
   */
  async clearAllData() {
    await chrome.storage.sync.clear();
    console.log('[StorageManager] All data cleared');
  }
}
