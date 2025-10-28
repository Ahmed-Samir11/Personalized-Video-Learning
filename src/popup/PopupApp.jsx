import React, { useState, useEffect } from 'react';

/**
 * Popup App - Extension settings and configuration
 */
function PopupApp() {
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('features');
  const [testingAPI, setTestingAPI] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_SETTINGS'
      });
      
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        data: { key, value }
      });
      
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const toggleFeature = async (featureName) => {
    const newFeatures = {
      ...settings.features,
      [featureName]: !settings.features[featureName]
    };
    await updateSetting('features', newFeatures);
  };

  const testAPI = async () => {
    setTestingAPI(true);
    setTestResult(null);
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SIMPLIFY_TEXT',
        data: { 
          text: 'The implementation utilizes sophisticated algorithms.',
          level: 'elementary'
        }
      });
      
      if (response.success) {
        setTestResult({ success: true, message: 'API test successful! ✓' });
      } else {
        setTestResult({ success: false, message: 'API test failed: ' + response.error });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Error: ' + error.message });
    } finally {
      setTestingAPI(false);
    }
  };

  const testGeminiKey = async () => {
    setTestingAPI(true);
    setTestResult(null);
    try {
      // First, verify API key is configured
      const getKeyResponse = await chrome.runtime.sendMessage({
        type: 'GET_SETTINGS',
        data: { keys: ['geminiApiKey'] }
      });

      const apiKey = getKeyResponse?.data?.geminiApiKey;
      if (!apiKey || apiKey === '<YOUR_GEMINI_API_KEY_HERE>') {
        setTestResult({ 
          success: false, 
          message: '❌ Gemini API key not configured. Please enter your key above and save.' 
        });
        setTestingAPI(false);
        return;
      }

      // Create a minimal test image
      const svg = `
        <svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
          <rect width='64' height='64' fill='white'/>
          <circle cx='32' cy='32' r='18' fill='navy'/>
        </svg>`;

      const img = new Image();
      const svgDataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      
      let pngDataUrl;
      try {
        pngDataUrl = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('SVG rendering timeout')), 5000);
          
          img.onload = () => {
            clearTimeout(timeout);
            try {
              const canvas = document.createElement('canvas');
              const size = 64;
              canvas.width = size;
              canvas.height = size;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, size, size);
              const dataUrl = canvas.toDataURL('image/png');
              resolve(dataUrl);
            } catch (e) {
              reject(e);
            }
          };
          
          img.onerror = (e) => {
            clearTimeout(timeout);
            reject(new Error('Failed to render SVG for test image'));
          };
          
          img.src = svgDataUri;
        });
      } catch (e) {
        setTestResult({ success: false, message: '❌ Failed to create test image: ' + e.message });
        setTestingAPI(false);
        return;
      }

      // Add timeout wrapper around the message send
      const testPromise = chrome.runtime.sendMessage({
        type: 'TEST_GEMINI',
        data: {
          frameDataUrl: pngDataUrl,
          frameWidth: 64,
          frameHeight: 64,
          prompt: 'Return JSON object {"test":true} if this works'
        }
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout (>15s) - service worker may have crashed')), 15000)
      );

      const response = await Promise.race([testPromise, timeoutPromise]);

      if (chrome.runtime.lastError) {
        setTestResult({ success: false, message: '❌ Chrome error: ' + chrome.runtime.lastError.message });
      } else if (response && response.success) {
        let msg = '';
        try {
          msg = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        } catch (e) {
          msg = String(response.data);
        }
        setTestResult({ 
          success: true, 
          message: '✅ Success! API is working. Response: ' + (msg.length > 300 ? msg.slice(0, 300) + '…' : msg) 
        });
      } else {
        const errorMsg = response?.error || response?.message || 'Unknown error';
        setTestResult({ success: false, message: '❌ API Error: ' + errorMsg });
      }
    } catch (error) {
      const errMsg = error?.message || String(error);
      if (errMsg.includes('port closed')) {
        setTestResult({ success: false, message: '❌ Service worker connection failed. Try reloading the extension.' });
      } else {
        setTestResult({ success: false, message: '❌ Error: ' + errMsg });
      }
    } finally {
      setTestingAPI(false);
    }
  };

  if (!settings) {
    return (
      <div className="popup-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h1>Learning Assistant</h1>
        <p>Configure your personalized learning experience</p>
      </div>

      {/* Global enable/disable for the whole extension */}
      <div className="global-toggle" style={{ display: 'flex', alignItems: 'center', padding: '8px 16px' }}>
        <div style={{ flex: 1 }}>
          <strong>Extension</strong>
          <div style={{ fontSize: '12px', color: '#666' }}>Turn the extension on or off (saves resources when off)</div>
        </div>
        <label className="toggle" style={{ marginLeft: '12px' }}>
          <input
            type="checkbox"
            checked={settings.extensionEnabled !== false}
            onChange={async () => {
              // Treat missing/undefined as enabled (true)
              const current = settings.extensionEnabled === false ? false : true;
              const newVal = !current;
              await updateSetting('extensionEnabled', newVal);
              setSettings(prev => ({ ...prev, extensionEnabled: newVal }));
            }}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="popup-tabs">
        <button
          className={activeTab === 'features' ? 'active' : ''}
          onClick={() => setActiveTab('features')}
        >
          Features
        </button>
        <button
          className={activeTab === 'preferences' ? 'active' : ''}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
        <button
          className={activeTab === 'ai' ? 'active' : ''}
          onClick={() => setActiveTab('ai')}
        >
          AI Settings
        </button>
      </div>

      <div className="popup-content">
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #eee' }}>
          <button
            className="test-button"
            onClick={async () => {
              try {
                // Reload the active tab to force content script injection
                const tabs = await new Promise((resolve) => chrome.tabs.query({ active: true, currentWindow: true }, resolve));
                if (tabs && tabs[0] && tabs[0].id) {
                  chrome.tabs.reload(tabs[0].id);
                }
              } catch (e) {
                console.error('Failed to reload tab', e);
              }
            }}
          >
            Reload page (force inject)
          </button>
          <button
            className="test-button"
            style={{ marginLeft: '8px' }}
            onClick={async () => {
              try {
                const tabs = await new Promise((resolve) => chrome.tabs.query({ active: true, currentWindow: true }, resolve));
                if (tabs && tabs[0] && tabs[0].id) {
                  chrome.tabs.sendMessage(tabs[0].id, { type: 'FORCE_INIT' }, (resp) => {
                    // ignore response, popup will reflect UI state when content initializes
                  });
                }
              } catch (e) {
                console.error('Failed to send FORCE_INIT', e);
              }
            }}
          >
            Force init
          </button>
        </div>
        {activeTab === 'features' && (
          <div className="settings-section">
            <h2>Feature Toggles</h2>
            
            <div className="setting-item">
              <div className="setting-info">
                <strong>Object Highlighting</strong>
                <p>Highlight tools and objects in videos</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.features.objectHighlighting}
                  onChange={() => toggleFeature('objectHighlighting')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <strong>Vocabulary Simplification</strong>
                <p>Simplify complex words and phrases</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.features.vocabularySimplification}
                  onChange={() => toggleFeature('vocabularySimplification')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <strong>Step Checklist</strong>
                <p>Generate step-by-step checklists</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.features.stepChecklist}
                  onChange={() => toggleFeature('stepChecklist')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <strong>Auto Pause</strong>
                <p>Pause before complex steps</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.features.autoPause}
                  onChange={() => toggleFeature('autoPause')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <strong>Focus Mode</strong>
                <p>Dim distractions around video</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.features.focusMode}
                  onChange={() => toggleFeature('focusMode')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="settings-section">
            <h2>Preferences</h2>
            
            <div className="setting-item">
              <label>
                <strong>Simplification Level</strong>
                <select
                  value={settings.preferences.simplificationLevel}
                  onChange={(e) => updateSetting('preferences', {
                    ...settings.preferences,
                    simplificationLevel: e.target.value
                  })}
                >
                  <option value="elementary">Elementary</option>
                  <option value="middle">Middle School</option>
                  <option value="high">High School</option>
                  <option value="elderly">Elderly/Simple</option>
                </select>
              </label>
            </div>

            <div className="setting-item">
              <label>
                <strong>UI Position</strong>
                <select
                  value={settings.preferences.uiPosition}
                  onChange={(e) => updateSetting('preferences', {
                    ...settings.preferences,
                    uiPosition: e.target.value
                  })}
                >
                  <option value="right">Right Side</option>
                  <option value="left">Left Side</option>
                </select>
              </label>
            </div>

            <div className="setting-item">
              <label>
                <strong>Font Size</strong>
                <select
                  value={settings.preferences.fontSize}
                  onChange={(e) => updateSetting('preferences', {
                    ...settings.preferences,
                    fontSize: e.target.value
                  })}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="settings-section">
            <h2>AI Configuration</h2>
            <p className="info-text">Configure AI provider for analysis features</p>
            
            <div className="setting-item">
              <label>
                <strong>AI Mode</strong>
                <select
                  value={settings.ai.useMockAI !== false ? 'mock' : 'real'}
                  onChange={(e) => updateSetting('ai', {
                    ...settings.ai,
                    useMockAI: e.target.value === 'mock'
                  })}
                >
                  <option value="mock">Mock AI (No API key needed)</option>
                  <option value="real">Real AI (Requires API key)</option>
                </select>
              </label>
              <p className="info-text" style={{ marginTop: '8px', fontSize: '12px' }}>
                Mock AI provides demo responses for testing without using real AI services.
              </p>
            </div>

            {settings.ai.useMockAI !== true && (
              <>
                <div className="setting-item">
                  <label>
                    <strong>AI Provider</strong>
                    <select
                      value={settings.ai.provider}
                      onChange={(e) => updateSetting('ai', {
                        ...settings.ai,
                        provider: e.target.value
                      })}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google AI</option>
                    </select>
                  </label>
                </div>

                {/* Show only one API key input at a time depending on provider */}
                {settings.ai.provider === 'google' ? (
                  <div className="setting-item">
                    <label>
                      <strong>Gemini API Key</strong>
                      <input
                        type="password"
                        placeholder="Enter Gemini API key"
                        value={settings.geminiApiKey || ''}
                        onChange={(e) => updateSetting('geminiApiKey', e.target.value)}
                      />
                    </label>
                    <p className="info-text" style={{ marginTop: '6px', fontSize: '12px' }}>
                      This key is stored in Chrome sync storage and is used for Gemini Vision requests.
                    </p>
                    <div style={{ marginTop: '10px' }}>
                      <button
                        className="test-button"
                        onClick={testGeminiKey}
                        disabled={testingAPI}
                      >
                        {testingAPI ? 'Testing...' : 'Test Gemini Key'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="setting-item">
                    <label>
                      <strong>API Key</strong>
                      <input
                        type="password"
                        placeholder="Enter your API key"
                        value={settings.ai.apiKey || ''}
                        onChange={(e) => updateSetting('ai', {
                          ...settings.ai,
                          apiKey: e.target.value
                        })}
                      />
                    </label>
                  </div>
                )}
              </>
            )}

            <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <button 
                className="test-button"
                onClick={testAPI}
                disabled={testingAPI}
              >
                {testingAPI ? 'Testing...' : 'Test AI Connection'}
              </button>
              {testResult && (
                <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                  {testResult.message}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="popup-footer">
        <p className="version">Version 1.0.0</p>
      </div>
    </div>
  );
}

export default PopupApp;
