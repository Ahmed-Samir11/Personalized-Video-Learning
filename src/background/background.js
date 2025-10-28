/**
 * Background Service Worker - The "Brain" of the Extension
 * 
 * Responsibilities:
 * - Handle all AI API calls (VLM/LLM)
 * - Manage extension state and user settings
 * - Route messages from content scripts
 * - Coordinate between different components
 */

import { AIService } from './services/aiService.js';
import { StorageManager } from './services/storageManager.js';
import { MessageRouter } from './services/messageRouter.js';

console.log('[Background] Service worker initialized');
console.debug('[Background] Initializing AIService and StorageManager');

// Gemini API key placeholder - can be overridden by value stored in chrome.storage.sync under `geminiApiKey`
const GEMINI_API_KEY = '<YOUR_GEMINI_API_KEY_HERE>';

/**
 * Handle a Visual LLM (VLM) request using Google Gemini Vision API
 * Expects message.data to contain either `frameDataUrl` or `imageData` (data URI)
 */
async function handleVLMRequest(message, sender) {
  try {
    const imageData = message?.data?.frameDataUrl || message?.data?.imageData;
    const providedPrompt = message?.data?.prompt || null;
    const frameWidth = message?.data?.frameWidth || null;
    const frameHeight = message?.data?.frameHeight || null;

    if (!imageData) throw new Error('No image data provided');

    // The incoming image is a data URI. Support both base64 and url-encoded
    // inline data (SVG). If it's base64, extract it. If not, decode and
    // base64-encode the inline payload so Gemini receives raw base64.
    let mimeType = null;
    let rawBase64Data = null;

    const base64Match = imageData.match(/^data:([^;]+);base64,(.*)$/);
    if (base64Match) {
      mimeType = base64Match[1];
      rawBase64Data = base64Match[2];
    } else {
      // Try non-base64 data URI (e.g. data:image/svg+xml;utf8,<svg...>)
      const nonBaseMatch = imageData.match(/^data:([^,]+),(.+)$/);
      if (!nonBaseMatch) throw new Error('Invalid image data URI');
      mimeType = nonBaseMatch[1];
      let inline = nonBaseMatch[2];
      // If it's URL-encoded, decode it
      try {
        inline = decodeURIComponent(inline);
      } catch (e) {
        // ignore, keep raw
      }
      // btoa expects binary-safe string; ensure it's properly encoded
      try {
        rawBase64Data = btoa(unescape(encodeURIComponent(inline)));
      } catch (e) {
        // Fallback: base64 encode the raw inline string directly
        rawBase64Data = btoa(inline);
      }
    }

    // Prefer a key stored in chrome.storage.sync (set via popup). Fallback to build-time placeholder.
    let geminiKey = GEMINI_API_KEY;
    try {
      const stored = await storageManager.getSetting('geminiApiKey');
      if (stored) geminiKey = stored;
    } catch (e) {
      console.warn('[Background] Could not read geminiApiKey from storage, using placeholder');
    }

    if (!geminiKey || geminiKey === '<YOUR_GEMINI_API_KEY_HERE>') {
      throw new Error('Gemini API key not configured. Please set it in the extension popup.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;

    // Build a strict prompt asking Gemini to output only valid JSON with bounding boxes
    const imgW = frameWidth || 'UNKNOWN_WIDTH';
    const imgH = frameHeight || 'UNKNOWN_HEIGHT';
    const prompt = providedPrompt || `You will be given an image. Output a single valid JSON object and nothing else. The JSON MUST have this exact shape:\n{\n  "objects": [\n    {\n      "name": "...",\n      "confidence": 0.0,\n      "boundingBox": { "x": 0, "y": 0, "width": 0, "height": 0 },\n      "description": "..."\n    }\n  ],\n  "imageWidth": ${imgW},\n  "imageHeight": ${imgH}\n}\nProvide bounding box coordinates in PIXELS relative to the image with width ${imgW} and height ${imgH}. If no objects are found, return {"objects": [], "imageWidth": ${imgW}, "imageHeight": ${imgH}}.`;

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: rawBase64Data
              }
            }
          ]
        }
      ]
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await resp.json();

    let resultText = null;
    try {
      resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (e) {
      resultText = null;
    }

    if (!resultText) {
      const errMsg = `Gemini VLM error: ${JSON.stringify(data)}`;
      console.warn('[Background] VLM response missing expected fields', data);
      // Send back an error payload to the tab if available
      if (sender?.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, { type: 'ANALYSIS_RESULT', error: errMsg });
      }
      return { success: false, error: errMsg };
    }

    // Attempt to parse the returned text as JSON. We instructed Gemini to
    // return pure JSON; if it returned surrounding text, try to extract the
    // first JSON object.
    let parsed = null;
    try {
      parsed = JSON.parse(resultText);
    } catch (e) {
      // Try to extract a JSON substring
      const start = resultText.indexOf('{');
      const end = resultText.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        try {
          parsed = JSON.parse(resultText.substring(start, end + 1));
        } catch (e2) {
          parsed = null;
        }
      }
    }

    if (parsed) {
      // Send structured result back to content script
      if (sender?.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, { type: 'ANALYSIS_RESULT', data: parsed });
      }
      return { success: true, data: parsed };
    }

    // If parsing failed, send the raw text back so UI can show it
    if (sender?.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, { type: 'ANALYSIS_RESULT', data: { text: resultText } });
    }
    return { success: true, data: resultText };
  } catch (err) {
    console.error('[Background] handleVLMRequest error:', err);
    if (sender?.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, { type: 'ANALYSIS_RESULT', error: err.message });
    }
    return { success: false, error: err.message };
  }
}

// Initialize services
const aiService = new AIService();
const storageManager = new StorageManager();
const messageRouter = new MessageRouter(aiService, storageManager);

// Listen for installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Background] Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // Set default settings on first install
    await storageManager.initializeDefaults();
    console.log('[Background] Default settings initialized');
  }
});

// Listen for long-lived connections from content scripts
// This keeps the port open so service worker doesn't terminate during long operations
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'pvl-client-port') {
    port.disconnect();
    return;
  }

  console.debug('[Background] Port connected:', port.name);

  port.onMessage.addListener(async (payload) => {
    try {
      const { type, data, requestId } = payload;
      console.log('[Background] Message via port:', type || '<no-type>');

      // Special-case ANALYZE_FRAME and TEST_GEMINI
      if (type === 'ANALYZE_FRAME' || type === 'TEST_GEMINI') {
        const result = await handleVLMRequest({ data }, { tab: { id: null } });
        port.postMessage({
          requestId,
          success: result?.success || false,
          data: result?.data || null,
          error: result?.error || null
        });
      } else {
        // Route other messages
        const response = await messageRouter.handleMessage({ type, data }, null);
        port.postMessage({
          requestId,
          success: true,
          data: response
        });
      }
    } catch (err) {
      console.error('[Background] Port message error:', err);
      port.postMessage({
        requestId: payload.requestId,
        success: false,
        error: err.message
      });
    }
  });

  port.onDisconnect.addListener(() => {
    console.debug('[Background] Port disconnected');
  });
});

// Also listen for messages from content scripts (fallback for simple messages)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    console.log('[Background] Message received:', message?.type || '<no-type>');
    console.debug('[Background] Full message object:', message);
    console.debug('[Background] Message sender:', sender);

    // Special-case ANALYZE_FRAME and TEST_GEMINI to call Gemini VLM directly
    // from the background service worker (so we can include the API key safely).
    if (message?.type === 'ANALYZE_FRAME' || message?.type === 'TEST_GEMINI') {
      // TEST_GEMINI uses the same handler but may provide a minimal test image
      handleVLMRequest(message, sender)
        .then(result => {
          if (result && result.success) {
            sendResponse({ success: true, data: result.data });
          } else {
            sendResponse({ success: false, error: result?.error || 'VLM failed' });
          }
        })
        .catch(err => {
          console.error('[Background] VLM handler error:', err);
          sendResponse({ success: false, error: err.message });
        });
      return true; // will respond asynchronously
    }

    // Route other messages to the message router
    messageRouter.handleMessage(message, sender)
      .then(response => {
        console.debug('[Background] Message handled successfully:', message?.type);
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        console.error('[Background] Error handling message:', error);
        sendResponse({ success: false, error: error.message });
      });

  } catch (err) {
    console.error('[Background] onMessage listener error:', err);
    sendResponse({ success: false, error: err.message });
  }

  // Return true to indicate we'll respond asynchronously
  return true;
});

// Surface SW errors and promise rejections for easier debugging
self.addEventListener('unhandledrejection', (ev) => {
  console.error('[ServiceWorker] unhandledrejection', ev.reason);
});

self.addEventListener('error', (ev) => {
  console.error('[ServiceWorker] error', ev.error || ev.message || ev);
});

// Listen for tab updates to inject content scripts on video pages
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const hasVideo = await checkForVideo(tabId);
    if (hasVideo) {
      console.log('[Background] Video detected on tab:', tabId);
      // Content script is already injected via manifest
      // We can send a message to activate features if needed
    }
  }
});

/**
 * Check if a tab contains a video element
 */
async function checkForVideo(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        return document.querySelector('video') !== null;
      }
    });
    return results[0]?.result || false;
  } catch (error) {
    console.error('[Background] Error checking for video:', error);
    return false;
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('[Background] Extension icon clicked');
  // The popup will open automatically due to manifest.json configuration
});

// Keep service worker alive
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20000);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();
