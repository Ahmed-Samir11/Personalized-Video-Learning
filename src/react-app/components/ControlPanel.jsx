import React, { useState } from 'react';

/**
 * Control Panel - Quick access to key features
 * 
 * Principles:
 * - Clear labels and icons
 * - Immediate feedback
 * - Customization options
 */
function ControlPanel({ onToggleFocusMode, onHighlightObject, onGenerateChecklist, settings }) {
  const [focusModeActive, setFocusModeActive] = useState(false);

  const handleFocusMode = () => {
    setFocusModeActive(!focusModeActive);
    onToggleFocusMode();
  };

  return (
    <div className="pvl-control-panel">
      <div className="pvl-section-header">
        <h3>Quick Tools</h3>
      </div>
      
      <div className="pvl-control-buttons">
        <button
          className={`pvl-control-button ${focusModeActive ? 'active' : ''}`}
          onClick={handleFocusMode}
          title="Dim everything except the video to reduce distractions"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <span>Focus Mode</span>
          {focusModeActive && <span className="pvl-active-indicator">ON</span>}
        </button>
        
        <button
          className="pvl-control-button"
          onClick={onHighlightObject}
          title="Highlight tools and objects in the video"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>Highlight Objects</span>
        </button>
        
        <button
          className="pvl-control-button"
          onClick={onGenerateChecklist}
          title="Create a step-by-step checklist from the video"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
          </svg>
          <span>Generate Steps</span>
        </button>
      </div>
      
      <div className="pvl-control-info">
        <p className="pvl-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Click any button above to get help with the video
        </p>
      </div>
    </div>
  );
}

export default ControlPanel;
