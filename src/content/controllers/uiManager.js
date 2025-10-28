/**
 * UI Manager - Manages React UI injection and lifecycle
 */

export class UIManager {
  constructor(settings) {
    this.settings = settings;
    this.rootElement = null;
    this.isInjected = false;
  }

  /**
   * Inject React UI into the page
   */
  async injectUI() {
    if (this.isInjected) {
      console.log('[UIManager] UI already injected');
      return;
    }

    try {
      // Create root container
      this.rootElement = document.createElement('div');
      this.rootElement.id = 'pvl-react-root';
      
      // Apply position from settings
      const position = this.settings.preferences?.uiPosition || 'right';
      if (position === 'left') {
        this.rootElement.classList.add('left');
      }
      
      document.body.appendChild(this.rootElement);

  // Create a small debug panel so users can see init status/messages in-page
  this._createDebugPanel();

      // Load vendor bundle first (contains React, ReactDOM)
      const vendorScript = document.createElement('script');
      vendorScript.src = chrome.runtime.getURL('vendor.js');
      
      await new Promise((resolve, reject) => {
        vendorScript.onload = () => {
          console.log('[UIManager] Vendor bundle loaded');
          resolve();
        };
        vendorScript.onerror = (error) => {
          console.error('[UIManager] Failed to load vendor bundle:', error);
          reject(error);
        };
        document.body.appendChild(vendorScript);
      });

      // Then load React app
      const reactScript = document.createElement('script');
      reactScript.src = chrome.runtime.getURL('react-app/index.js');
      
      reactScript.onload = () => {
        console.log('[UIManager] React app loaded');
        this.isInjected = true;
        this.notifyUIReady();
      };
      
      reactScript.onerror = (error) => {
        console.error('[UIManager] Failed to load React app:', error);
      };
      
      document.body.appendChild(reactScript);

    } catch (error) {
      console.error('[UIManager] Error injecting UI:', error);
      throw error;
    }
  }

  /**
   * Notify that UI is ready
   */
  notifyUIReady() {
    // Post the UI_READY message multiple times to ensure the injected React app
    // receives it even if its message listener hasn't been registered yet.
    const payload = { type: 'PVL_UI_READY', data: this.settings };

    const post = () => window.postMessage(payload, '*');

    post();
    setTimeout(post, 200);
    setTimeout(post, 600);
  }

  /**
   * Update UI with new data
   */
  sendToUI(type, data) {
    if (!this.isInjected) {
      console.warn('[UIManager] Cannot send to UI - not injected yet');
      return;
    }

    window.postMessage({
      type: `PVL_${type}`,
      data
    }, '*');

    // Also write to debug panel if present
    if (window.PVL_DEBUG && typeof window.PVL_DEBUG.log === 'function') {
      window.PVL_DEBUG.log(`-> PVL_${type}: ${JSON.stringify(data).slice(0,200)}`);
    }
  }

  /**
   * Show/hide UI
   */
  toggleVisibility(visible) {
    if (this.rootElement) {
      this.rootElement.style.display = visible ? 'block' : 'none';
    }
  }

  /**
   * Update UI position
   */
  updatePosition(position) {
    if (this.rootElement) {
      if (position === 'left') {
        this.rootElement.classList.add('left');
      } else {
        this.rootElement.classList.remove('left');
      }
    }
  }

  /**
   * Cleanup - remove UI from page
   */
  cleanup() {
    if (this.rootElement && this.rootElement.parentNode) {
      this.rootElement.parentNode.removeChild(this.rootElement);
    }
    this.isInjected = false;
    // Remove debug panel
    const dbg = document.getElementById('pvl-debug-panel');
    if (dbg && dbg.parentNode) dbg.parentNode.removeChild(dbg);
    if (window.PVL_DEBUG) delete window.PVL_DEBUG;
  }

  /**
   * Create a small on-page debug panel for quick visibility when testing
   */
  _createDebugPanel() {
    if (document.getElementById('pvl-debug-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'pvl-debug-panel';
    panel.style.position = 'fixed';
    panel.style.bottom = '12px';
    panel.style.left = '12px';
    panel.style.width = '320px';
    panel.style.maxHeight = '200px';
    panel.style.overflow = 'auto';
    panel.style.background = 'rgba(0,0,0,0.75)';
    panel.style.color = 'white';
    panel.style.fontSize = '12px';
    panel.style.padding = '8px';
    panel.style.borderRadius = '6px';
    panel.style.zIndex = '1000001';
    panel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';

    const title = document.createElement('div');
    title.textContent = 'PVL Debug';
    title.style.fontWeight = '700';
    title.style.marginBottom = '6px';
    panel.appendChild(title);

    const list = document.createElement('div');
    list.id = 'pvl-debug-list';
    panel.appendChild(list);

    document.body.appendChild(panel);

    // Expose a simple log helper
    window.PVL_DEBUG = {
      log: (msg) => {
        try {
          const entry = document.createElement('div');
          entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
          entry.style.marginBottom = '4px';
          list.insertBefore(entry, list.firstChild);
          // Keep list short
          while (list.childNodes.length > 25) list.removeChild(list.lastChild);
        } catch (e) {
          // swallow
        }
      }
    };

    // Initial messages
    window.PVL_DEBUG.log('UI root created');
    window.PVL_DEBUG.log('Debug panel ready');
  }
}
