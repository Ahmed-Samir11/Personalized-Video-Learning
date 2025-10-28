/**
 * Content Script - The "Hands" of the Extension
 * 
 * Responsibilities:
 * - Inject and manage React UI
 * - Interact with page's <video> element
 * - Draw visual overlays (highlights, bounding boxes)
 * - Send messages to background script
 * - Monitor user behavior for confusion detection
 */

import { VideoController } from './controllers/videoController.js';
import { UIManager } from './controllers/uiManager.js';
import { OverlayManager } from './controllers/overlayManager.js';
import { BehaviorTracker } from './controllers/behaviorTracker.js';
import { MessageClient } from './utils/messageClient.js';

console.log('[Content] Content script loaded');

// Surface unhandled promise rejections to the in-page debug panel for easier diagnosis
window.addEventListener('unhandledrejection', (ev) => {
  try {
    const msg = ev.reason?.message || String(ev.reason);
    console.warn('[Content] Unhandled promise rejection:', ev.reason);
    if (window.PVL_DEBUG && typeof window.PVL_DEBUG.log === 'function') {
      window.PVL_DEBUG.log('[UnhandledRejection] ' + msg);
    }
  } catch (e) {
    // swallow
  }
});

class PersonalizedVideoLearning {
  constructor() {
    this.videoController = null;
    this.uiManager = null;
    this.overlayManager = null;
    this.behaviorTracker = null;
    this.messageClient = new MessageClient();
    this.videoElement = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the extension on the page
   */
  async init() {
    if (this.isInitialized) {
      console.log('[Content] Already initialized');
      return;
    }

    // Wait for page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
      return;
    }

    // Check global extension enabled flag before doing heavy initialization
    try {
      const globalSettings = await this.messageClient.getSettings(['extensionEnabled']);
      const enabled = (typeof globalSettings?.extensionEnabled === 'boolean') ? globalSettings.extensionEnabled : true;
      if (!enabled) {
        console.log('[Content] Extension is disabled by user settings; initialization aborted.');
        if (window.PVL_DEBUG && typeof window.PVL_DEBUG.log === 'function') {
          window.PVL_DEBUG.log('[Content] Initialization aborted because extensionEnabled=false');
        }
        return;
      }
    } catch (e) {
      console.warn('[Content] Could not read extensionEnabled setting, proceeding with initialization', e);
    }

    // Find video element
    this.videoElement = this.findVideoElement();
    
    if (!this.videoElement) {
      console.log('[Content] No video element found');
      // Set up observer to detect video elements added later
      this.observeForVideo();
      return;
    }

    console.log('[Content] Video element found, initializing...');

    try {
      // Get user settings
      console.debug('[Content] Requesting settings from background');
      const settings = await this.messageClient.getSettings();
      console.debug('[Content] Settings received:', settings);
      
      // Initialize controllers
      console.debug('[Content] Initializing controllers');
      this.videoController = new VideoController(this.videoElement);
      console.debug('[Content] VideoController initialized');
      this.overlayManager = new OverlayManager(this.videoElement);
      console.debug('[Content] OverlayManager initialized');
      this.behaviorTracker = new BehaviorTracker(this.videoController);
      console.debug('[Content] BehaviorTracker initialized');
      this.uiManager = new UIManager(settings);
      console.debug('[Content] UIManager constructed');

      // Set up event listeners
      this.setupEventListeners();
      console.debug('[Content] Event listeners set up');

      // Inject React UI
      console.debug('[Content] Injecting React UI');
      await this.uiManager.injectUI();
      console.debug('[Content] UI injection complete');

      // Start behavior tracking
      this.behaviorTracker.start();
      console.debug('[Content] Behavior tracking started');

      this.isInitialized = true;
      console.log('[Content] Initialization complete');

      // Notify background that we're ready. Await the response so failures are
      // caught here instead of producing uncaught promise rejections.
      try {
        await this.messageClient.sendMessage('EXTENSION_READY', { url: window.location.href });
        console.debug('[Content] EXTENSION_READY acknowledged by background');
      } catch (err) {
        console.warn('[Content] EXTENSION_READY failed:', err);
        if (window.PVL_DEBUG && typeof window.PVL_DEBUG.log === 'function') {
          window.PVL_DEBUG.log('[Content] EXTENSION_READY failed: ' + (err?.message || err));
        }
      }

    } catch (error) {
      console.error('[Content] Initialization error:', error);
    }
  }

  /**
   * Find the video element on the page
   */
  findVideoElement() {
    // Look for the largest visible video element
    const videos = Array.from(document.querySelectorAll('video'));
    
    if (videos.length === 0) return null;
    
    // Filter visible videos
    const visibleVideos = videos.filter(video => {
      const rect = video.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    if (visibleVideos.length === 0) return videos[0];

    // Return the largest video
    return visibleVideos.reduce((largest, video) => {
      const largestArea = largest.offsetWidth * largest.offsetHeight;
      const videoArea = video.offsetWidth * video.offsetHeight;
      return videoArea > largestArea ? video : largest;
    });
  }

  /**
   * Observe for video elements added dynamically
   */
  observeForVideo() {
    const observer = new MutationObserver(() => {
      const video = this.findVideoElement();
      if (video && !this.isInitialized) {
        console.log('[Content] Video element detected via observer');
        observer.disconnect();
        this.init();
      }
    });

    // Guard observe: some page contexts may not have document.body available
    // or it may not be a Node yet. Retry/attach to DOMContentLoaded if needed.
    const startObserving = () => {
      try {
        if (document.body && document.body.nodeType === Node.ELEMENT_NODE) {
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
        } else {
          // Try again shortly
          setTimeout(startObserving, 200);
        }
      } catch (e) {
        console.warn('[Content] MutationObserver.observe failed, retrying', e);
        setTimeout(startObserving, 250);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startObserving);
    } else {
      startObserving();
    }
  }

  /**
   * Set up event listeners for UI interactions
   */
  setupEventListeners() {
    // Listen for messages from React UI
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;

      const { type, data } = event.data || {};

      // The UI posts PVL_UI_READY to notify that it's ready; ignore it here
      if (type === 'PVL_UI_READY') {
        console.debug('[Content] Ignoring PVL_UI_READY message (meant for React UI)');
        return;
      }

      // Messages with PVL_RESPONSE_ are responses/content->UI messages that
      // should only be handled by the injected React UI. Ignore them in the
      // content script to avoid handling our own responses.
      if (typeof type === 'string' && type.startsWith('PVL_RESPONSE_')) {
        console.debug('[Content] Ignoring PVL response message (meant for React UI):', type);
        return;
      }

      if (type?.startsWith('PVL_')) {
        this.handleUIMessage(type, data);
      }
    });

    // Listen for confusion detection
    this.behaviorTracker.on('confusion-detected', async (behaviorData) => {
      await this.handleConfusionDetected(behaviorData);
    });

    // Listen for storage changes (preferences updated from popup)
    if (chrome && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        try {
          if (area !== 'sync') return;
          // Handle global enable/disable changes
          if (changes.extensionEnabled) {
            const newVal = changes.extensionEnabled.newValue;
            console.debug('[Content] extensionEnabled changed ->', newVal);
            try {
              if (!newVal && this.isInitialized) {
                // Disable: cleanup controllers and stop activity
                this.cleanup();
                this.isInitialized = false;
                if (window.PVL_DEBUG && typeof window.PVL_DEBUG.log === 'function') {
                  window.PVL_DEBUG.log('[Content] Extension disabled by user; cleaned up active controllers');
                }
              } else if (newVal && !this.isInitialized) {
                // Re-enable: start initialization
                this.init();
              }
            } catch (e) {
              console.warn('[Content] Error handling extensionEnabled change', e);
            }
          }
          if (changes.preferences && this.uiManager) {
            const newPrefs = changes.preferences.newValue;
            if (newPrefs && newPrefs.uiPosition) {
              this.uiManager.updatePosition(newPrefs.uiPosition);
              console.debug('[Content] Updated UI position to', newPrefs.uiPosition);
              if (window.PVL_DEBUG && typeof window.PVL_DEBUG.log === 'function') {
                window.PVL_DEBUG.log('[Content] UI position updated: ' + newPrefs.uiPosition);
              }
            }
          }
        } catch (e) {
          console.warn('[Content] Error handling storage.onChanged', e);
        }
      });
    }
  }

  /**
   * Handle messages from React UI
   */
  async handleUIMessage(type, data) {
    console.log('[Content] UI message received:', type);

    switch (type) {
      case 'PVL_HIGHLIGHT_OBJECT':
        await this.handleHighlightObject(data);
        break;
      
      case 'PVL_SIMPLIFY_TEXT':
        await this.handleSimplifyText(data);
        break;
      
      case 'PVL_GENERATE_CHECKLIST':
        await this.handleGenerateChecklist(data);
        break;
      
      case 'PVL_TOGGLE_PAUSE':
        this.videoController.togglePause();
        break;
      
      case 'PVL_TOGGLE_FOCUS_MODE':
        this.overlayManager.toggleFocusMode();
        break;
      
      case 'PVL_SEEK_TO':
        this.videoController.seekTo(data.timestamp);
        break;
      
      default:
        console.warn('[Content] Unknown UI message type:', type);
    }
  }

  /**
   * Handle object highlighting request
   */
  async handleHighlightObject(data) {
    try {
      const frameData = this.videoController.captureFrame();
      const frameWidth = this.videoController.canvas ? this.videoController.canvas.width : this.videoController.video.videoWidth;
      const frameHeight = this.videoController.canvas ? this.videoController.canvas.height : this.videoController.video.videoHeight;
      const result = await this.messageClient.analyzeFrame(frameData, { frameWidth, frameHeight });

      if (result && result.objects && result.objects.length > 0) {
        result.objects.forEach(obj => {
          this.overlayManager.drawHighlight(obj.boundingBox, obj.name);
        });
        
        // Send results back to UI
        this.sendToUI('OBJECTS_DETECTED', result.objects);
      }
    } catch (err) {
      console.error('[Content] handleHighlightObject error:', err);
      if (window.PVL_DEBUG && typeof window.PVL_DEBUG.log === 'function') {
        window.PVL_DEBUG.log('[Content] handleHighlightObject error: ' + (err.message || err));
      }
    }
  }

  /**
   * Handle text simplification request
   */
  async handleSimplifyText(data) {
    try {
      const result = await this.messageClient.simplifyText(data.text);
      this.sendToUI('TEXT_SIMPLIFIED', result);
    } catch (err) {
      console.error('[Content] handleSimplifyText error:', err);
      if (window.PVL_DEBUG && typeof window.PVL_DEBUG.log === 'function') {
        window.PVL_DEBUG.log('[Content] handleSimplifyText error: ' + (err.message || err));
      }
    }
  }

  /**
   * Handle checklist generation request
   */
  async handleGenerateChecklist(data) {
    try {
      const transcript = data.transcript || await this.getVideoTranscript();
      const result = await this.messageClient.generateChecklist(transcript);
      this.sendToUI('CHECKLIST_GENERATED', result);
    } catch (err) {
      console.error('[Content] handleGenerateChecklist error:', err);
      if (window.PVL_DEBUG && typeof window.PVL_DEBUG.log === 'function') {
        window.PVL_DEBUG.log('[Content] handleGenerateChecklist error: ' + (err.message || err));
      }
    }
  }

  /**
   * Handle confusion detection
   */
  async handleConfusionDetected(behaviorData) {
    const result = await this.messageClient.detectConfusion(behaviorData);
    
    if (result.isConfused) {
      console.log('[Content] Confusion detected, offering assistance');
      this.sendToUI('CONFUSION_DETECTED', {
        score: result.confusionScore,
        suggestions: result.suggestedIntervention
      });
    }
  }

  /**
   * Send message to React UI
   */
  sendToUI(type, data) {
    window.postMessage({
      type: `PVL_RESPONSE_${type}`,
      data
    }, '*');
  }

  /**
   * Get video transcript (stub - needs implementation based on platform)
   */
  async getVideoTranscript() {
    // TODO: Implement transcript extraction
    // For YouTube: use captions API
    // For other platforms: may need to use speech-to-text
    return "Sample transcript for demonstration";
  }

  /**
   * Cleanup on page unload
   */
  cleanup() {
    if (this.behaviorTracker) {
      this.behaviorTracker.stop();
    }
    if (this.uiManager) {
      this.uiManager.cleanup();
    }
    if (this.overlayManager) {
      this.overlayManager.cleanup();
    }
  }
}

// Initialize the extension
const pvl = new PersonalizedVideoLearning();
pvl.init();

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  pvl.cleanup();
});

// Listen for runtime messages (e.g., force init from popup)
if (chrome && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      if (message?.type === 'FORCE_INIT') {
        console.debug('[Content] FORCE_INIT received, calling init()');
        pvl.init();
        sendResponse({ success: true });
        return true;
      }
    } catch (e) {
      console.error('[Content] Error handling runtime message', e);
      sendResponse({ success: false, error: e?.message || String(e) });
      return true;
    }
    return false;
  });
}
