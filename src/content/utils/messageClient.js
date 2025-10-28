/**
 * Message Client - Handles communication with background script
 */

export class MessageClient {
  /**
   * Send message to background script
   * 
   * For ANALYZE_FRAME, preferentially uses a persistent port connection
   * to avoid service worker timeout during long Gemini API calls.
   */
  async sendMessage(type, data = {}) {
    // For long-running operations (>5 seconds), always use port-based transport
    // This keeps the service worker alive during the entire Gemini API operation
    if (type === 'ANALYZE_FRAME' || type === 'TEST_GEMINI' || type === 'SIMPLIFY_TEXT' || type === 'GENERATE_CHECKLIST' || type === 'DETECT_CONFUSION') {
      return this.sendViaPort(type, data);
    }

    // For other messages, use standard sendMessage with retry logic
    return this.sendViaMessage(type, data);
  }

  /**
   * Send message using a persistent port connection
   * Avoids service worker timeout issues with long API calls
   */
  async sendViaPort(type, data = {}) {
    return new Promise((resolve, reject) => {
      try {
        const port = chrome.runtime.connect({ name: 'pvl-client-port' });
        const requestId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        let timeout = null;

        const onMessage = (msg) => {
          try {
            if (!msg || msg.requestId !== requestId) return;
            
            // Clear the timeout when we get a response
            if (timeout) clearTimeout(timeout);
            
            port.onMessage.removeListener(onMessage);
            port.disconnect();
            
            if (msg.success) {
              resolve(msg.data);
            } else {
              reject(new Error(msg.error || 'Unknown error from port'));
            }
          } catch (err) {
            if (timeout) clearTimeout(timeout);
            port.onMessage.removeListener(onMessage);
            try { port.disconnect(); } catch (e) {}
            reject(err);
          }
        };

        port.onMessage.addListener(onMessage);

        // Timeout to avoid leaving port open forever (Gemini calls can take up to 30s)
        timeout = setTimeout(() => {
          try { port.onMessage.removeListener(onMessage); } catch (e) {}
          try { port.disconnect(); } catch (e) {}
          reject(new Error('Timeout waiting for port response (> 45s)'));
        }, 45000);

        // Send the payload with requestId
        port.postMessage({ type, data, requestId });

        // Log to debug panel
        try {
          const list = document.getElementById('pvl-debug-list');
          if (list) {
            const entry = document.createElement('div');
            entry.textContent = `[MessageClient] Sending ${type} via port...`;
            entry.style.marginBottom = '4px';
            list.insertBefore(entry, list.firstChild);
            while (list.childNodes.length > 25) list.removeChild(list.lastChild);
          }
        } catch (e) { /* ignore DOM errors */ }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Send message using chrome.runtime.sendMessage with transient retry logic
   */
  async sendViaMessage(type, data = {}) {
    const maxRetries = 3;
    const baseDelay = 150; // ms

    // Fallback transport using long-lived port if sendMessage fails with
    // a "message port closed" style error. Returns a promise that resolves
    // with the response data or rejects with an Error.
    const connectTransport = (payload) => new Promise((resolve, reject) => {
      try {
        const port = chrome.runtime.connect({ name: 'pvl-client-port' });
        const requestId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

        const onMessage = (msg) => {
          try {
            if (!msg || msg.requestId !== requestId) return;
            port.onMessage.removeListener(onMessage);
            port.disconnect();
            if (msg.success) resolve(msg.data);
            else reject(new Error(msg.error || 'Unknown error from port'));
          } catch (err) {
            port.onMessage.removeListener(onMessage);
            port.disconnect();
            reject(err);
          }
        };

        port.onMessage.addListener(onMessage);

        // Timeout to avoid leaving port open forever
        const timeout = setTimeout(() => {
          try { port.onMessage.removeListener(onMessage); } catch (e) {}
          try { port.disconnect(); } catch (e) {}
          reject(new Error('Timeout waiting for port response'));
        }, 15000);

        // Send the payload with requestId so background can respond
        port.postMessage({ type, data, requestId });
      } catch (err) {
        reject(err);
      }
    });

    const attempt = (triesLeft) => new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type, data }, (response) => {
        if (chrome.runtime.lastError) {
          const msg = chrome.runtime.lastError.message || '';
          // If context invalidated or transient, retry a few times
          const transient = /Extension context invalidated|The message port closed before a response was received/i.test(msg);
          if (transient && triesLeft > 0) {
            // write to debug panel if present
            try {
              const list = document.getElementById('pvl-debug-list');
              if (list) {
                const entry = document.createElement('div');
                entry.textContent = `[MessageClient] transient error: ${msg}. Retrying...`;
                entry.style.marginBottom = '4px';
                list.insertBefore(entry, list.firstChild);
                while (list.childNodes.length > 25) list.removeChild(list.lastChild);
              }
            } catch (e) { /* ignore DOM errors */ }

            setTimeout(() => {
              attempt(triesLeft - 1).then(resolve).catch(reject);
            }, baseDelay * (maxRetries - triesLeft + 1));
            return;
          }

          // If we've exhausted retries or it's not transient, try connect transport once
          connectTransport({ type, data })
            .then(resolve)
            .catch(() => reject(new Error(msg)));
          return;
        }

        if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Unknown error'));
        }
      });
    });

    return attempt(maxRetries);
  }

  /**
   * Analyze video frame with VLM
   */
  async analyzeFrame(frameDataUrl, options = {}) {
    // options can include { prompt, frameWidth, frameHeight }
    return this.sendMessage('ANALYZE_FRAME', { frameDataUrl, ...options });
  }

  /**
   * Simplify text with LLM
   */
  async simplifyText(text, level) {
    return this.sendMessage('SIMPLIFY_TEXT', { text, level });
  }

  /**
   * Generate checklist from transcript
   */
  async generateChecklist(transcript, keyFrames) {
    return this.sendMessage('GENERATE_CHECKLIST', { transcript, keyFrames });
  }

  /**
   * Detect confusion from behavior data
   */
  async detectConfusion(userBehavior) {
    return this.sendMessage('DETECT_CONFUSION', { userBehavior });
  }

  /**
   * Get settings from storage
   */
  async getSettings(keys) {
    return this.sendMessage('GET_SETTINGS', { keys });
  }

  /**
   * Update settings
   */
  async updateSettings(key, value) {
    return this.sendMessage('UPDATE_SETTINGS', { key, value });
  }

  /**
   * Toggle feature
   */
  async toggleFeature(featureName) {
    return this.sendMessage('TOGGLE_FEATURE', { featureName });
  }

  /**
   * Record user interaction
   */
  async recordInteraction(interactionType) {
    return this.sendMessage('RECORD_INTERACTION', { interactionType });
  }
}
