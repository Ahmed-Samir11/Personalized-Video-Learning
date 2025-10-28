import React, { useState, useEffect } from 'react';
import AssistantPanel from './components/AssistantPanel';
import Checklist from './components/Checklist';
import VocabularyHelper from './components/VocabularyHelper';
import ControlPanel from './components/ControlPanel';
import ConfusionAlert from './components/ConfusionAlert';

/**
 * Main App Component
 * 
 * Manages the overall state and coordinates between different UI components
 */
function App() {
  const [settings, setSettings] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [checklist, setChecklist] = useState([]);
  const [confusionAlert, setConfusionAlert] = useState(null);
  const [highlightedObjects, setHighlightedObjects] = useState([]);

  useEffect(() => {
    // Listen for messages from content script
    const messageHandler = (event) => {
      if (event.source !== window) return;
      
      const { type, data } = event.data;
      console.debug('[React App] Received message from window:', type, data);
      
      switch (type) {
        case 'PVL_UI_READY':
          setSettings(data);
          break;
        
        case 'PVL_RESPONSE_CHECKLIST_GENERATED':
          setChecklist(data);
          break;
        
        case 'PVL_RESPONSE_CONFUSION_DETECTED':
          setConfusionAlert(data);
          // Auto-dismiss after 10 seconds
          setTimeout(() => setConfusionAlert(null), 10000);
          break;
        
        case 'PVL_RESPONSE_OBJECTS_DETECTED':
          setHighlightedObjects(data);
          break;
        
        default:
          break;
      }
    };

    window.addEventListener('message', messageHandler);
    
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  const sendToContent = (type, data = {}) => {
    console.debug('[React App] Sending message to content:', `PVL_${type}`, data);
    window.postMessage({ type: `PVL_${type}`, data }, '*');
  };

  const handleToggleFocusMode = () => {
    sendToContent('TOGGLE_FOCUS_MODE');
  };

  const handleHighlightObject = () => {
    sendToContent('HIGHLIGHT_OBJECT');
  };

  const handleGenerateChecklist = () => {
    sendToContent('GENERATE_CHECKLIST');
  };

  const handleChecklistItemClick = (timestamp) => {
    sendToContent('SEEK_TO', { timestamp });
  };

  const handleDismissConfusion = () => {
    setConfusionAlert(null);
  };

  if (!settings) {
    return (
      <div className="pvl-loading-container">
        <div className="pvl-loading-spinner"></div>
        <p>Loading Assistant...</p>
      </div>
    );
  }

  return (
    <div className="pvl-app">
      {/* Confusion Alert - Shows at top when detected */}
      {confusionAlert && (
        <ConfusionAlert
          data={confusionAlert}
          onDismiss={handleDismissConfusion}
          onAcceptHelp={() => {
            setIsPanelOpen(true);
            setIsPanelMinimized(false);
            handleDismissConfusion();
          }}
        />
      )}

      {/* Main Assistant Panel */}
      {isPanelOpen && (
        <AssistantPanel
          isMinimized={isPanelMinimized}
          onMinimize={() => setIsPanelMinimized(!isPanelMinimized)}
          onClose={() => setIsPanelOpen(false)}
        >
          {!isPanelMinimized && (
            <>
              <ControlPanel
                onToggleFocusMode={handleToggleFocusMode}
                onHighlightObject={handleHighlightObject}
                onGenerateChecklist={handleGenerateChecklist}
                settings={settings}
              />
              
              {checklist.length > 0 && (
                <Checklist
                  items={checklist}
                  onItemClick={handleChecklistItemClick}
                />
              )}
              
              <VocabularyHelper />
            </>
          )}
        </AssistantPanel>
      )}

      {/* Floating toggle button when panel is closed */}
      {!isPanelOpen && (
        <button
          className="pvl-toggle-button"
          onClick={() => setIsPanelOpen(true)}
          aria-label="Open Learning Assistant"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </button>
      )}
    </div>
  );
}

export default App;
