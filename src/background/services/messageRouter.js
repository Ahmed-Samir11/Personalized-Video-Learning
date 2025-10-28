/**
 * Message Router - Routes messages from content scripts to appropriate handlers
 * 
 * Implements the messaging protocol between content scripts and background
 */

export class MessageRouter {
  constructor(aiService, storageManager) {
    this.aiService = aiService;
    this.storageManager = storageManager;
    
    // Map message types to handler functions
    this.handlers = {
      'ANALYZE_FRAME': this.handleAnalyzeFrame.bind(this),
      'TEST_GEMINI': this.handleTestGemini.bind(this),
      'SIMPLIFY_TEXT': this.handleSimplifyText.bind(this),
      'GENERATE_CHECKLIST': this.handleGenerateChecklist.bind(this),
      'DETECT_CONFUSION': this.handleDetectConfusion.bind(this),
      'EXTENSION_READY': this.handleExtensionReady.bind(this),
      'GET_SETTINGS': this.handleGetSettings.bind(this),
      'UPDATE_SETTINGS': this.handleUpdateSettings.bind(this),
      'TOGGLE_FEATURE': this.handleToggleFeature.bind(this),
      'RECORD_INTERACTION': this.handleRecordInteraction.bind(this)
    };
    console.debug('[MessageRouter] Initialized with handlers:', Object.keys(this.handlers));
  }

  /**
   * Handle a TEST_GEMINI request when background special-case didn't catch it.
   * This returns whether a Gemini key is present in storage so the popup gets
   * immediate feedback even if the VLM path isn't reachable in this process.
   */
  async handleTestGemini(data) {
    console.debug('[MessageRouter] handleTestGemini data:', data);
    try {
      const key = await this.storageManager.getSetting('geminiApiKey');
      return { geminiKeyPresent: !!key, geminiKeyPreview: key ? (String(key).length > 8 ? (String(key).slice(0,4) + '…' + String(key).slice(-4)) : '****') : null };
    } catch (e) {
      console.error('[MessageRouter] handleTestGemini error', e);
      throw e;
    }
  }

  /**
   * Main message handler - routes to specific handlers
   */
  async handleMessage(message, sender) {
    const { type, data } = message || {};
    console.debug('[MessageRouter] handleMessage called with type:', type, 'data:', data, 'from sender:', sender);

    const handler = this.handlers[type];
    if (!handler) {
      console.error('[MessageRouter] No handler for message type:', type);
      throw new Error(`Unknown message type: ${type}`);
    }

    try {
      const result = await handler(data, sender);
      console.debug('[MessageRouter] Handler result for', type, ':', result);
      return result;
    } catch (err) {
      console.error('[MessageRouter] Error in handler for', type, err);
      throw err;
    }
  }

  /**
   * Handle frame analysis request
   */
  async handleAnalyzeFrame(data) {
    console.debug('[MessageRouter] handleAnalyzeFrame data:', data);
    const { frameDataUrl, prompt } = data || {};
    const res = await this.aiService.analyzeFrame(frameDataUrl, prompt);
    console.debug('[MessageRouter] analyzeFrame result:', res);
    return res;
  }

  /**
   * Handle text simplification request
   */
  async handleSimplifyText(data) {
    console.debug('[MessageRouter] handleSimplifyText data:', data);
    const { text, level } = data || {};
    const preferences = await this.storageManager.getPreferences();
    const targetLevel = level || preferences.simplificationLevel;
    const res = await this.aiService.simplifyVocabulary(text, targetLevel);
    console.debug('[MessageRouter] simplifyVocabulary result:', res);
    return res;
  }

  /**
   * Handle checklist generation request
   */
  async handleGenerateChecklist(data) {
    console.debug('[MessageRouter] handleGenerateChecklist data:', data);
    const { transcript, keyFrames } = data || {};
    const res = await this.aiService.generateChecklist(transcript, keyFrames);
    console.debug('[MessageRouter] generateChecklist result:', res);
    return res;
  }

  /**
   * Handle confusion detection request
   */
  async handleDetectConfusion(data) {
    console.debug('[MessageRouter] handleDetectConfusion data:', data);
    const { userBehavior } = data || {};
    const res = await this.aiService.detectConfusion(userBehavior);
    console.debug('[MessageRouter] detectConfusion result:', res);
    return res;
  }

  /**
   * Handle get settings request
   */
  async handleGetSettings(data) {
    console.debug('[MessageRouter] handleGetSettings data:', data);
    const { keys } = data || {};

    if (keys) {
      const result = {};
      for (const key of keys) {
        result[key] = await this.storageManager.getSetting(key);
      }
      console.debug('[MessageRouter] getSettings result for keys:', result);
      return result;
    }

    const all = await this.storageManager.getAllSettings();
    console.debug('[MessageRouter] getAllSettings result:', all);
    return all;
  }

  /**
   * Handle update settings request
   */
  async handleUpdateSettings(data) {
    console.debug('[MessageRouter] handleUpdateSettings data:', data);
    const { key, value } = data || {};
    await this.storageManager.updateSetting(key, value);
    console.debug('[MessageRouter] updateSetting completed for', key);
    return { success: true };
  }

  /**
   * Handle feature toggle request
   */
  async handleToggleFeature(data) {
    console.debug('[MessageRouter] handleToggleFeature data:', data);
    const { featureName } = data || {};
    const newState = await this.storageManager.toggleFeature(featureName);
    console.debug('[MessageRouter] toggleFeature result:', { featureName, enabled: newState });
    return { featureName, enabled: newState };
  }

  /**
   * Handle interaction recording
   */
  async handleRecordInteraction(data) {
    console.debug('[MessageRouter] handleRecordInteraction data:', data);
    const { interactionType } = data || {};
    await this.storageManager.recordInteraction(interactionType);
    console.debug('[MessageRouter] recordInteraction completed for', interactionType);
    return { success: true };
  }

  /**
   * Handle extension ready pings from content scripts
   */
  async handleExtensionReady(data) {
    console.debug('[MessageRouter] handleExtensionReady called with data:', data);
    // Optionally record the tab/url as active
    try {
      if (data && data.url) {
        await this.storageManager.recordInteraction('extension_ready');
      }
    } catch (e) {
      console.warn('[MessageRouter] handleExtensionReady storage error', e);
    }
    return { received: true };
  }
}
