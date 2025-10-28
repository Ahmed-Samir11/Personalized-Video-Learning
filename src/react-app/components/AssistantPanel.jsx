import React from 'react';

/**
 * Assistant Panel - Main container for all UI features
 * 
 * Principles:
 * - Peripherality: Stays to the side, doesn't block content
 * - User Control: Can be minimized or closed
 * - Consistency: Always in same location
 */
function AssistantPanel({ children, isMinimized, onMinimize, onClose }) {
  return (
    <div className={`pvl-assistant-panel ${isMinimized ? 'minimized' : ''}`}>
      <div className="pvl-panel-header">
        <div className="pvl-panel-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span>Learning Assistant</span>
        </div>
        
        <div className="pvl-panel-controls">
          <button
            className="pvl-icon-button"
            onClick={onMinimize}
            aria-label={isMinimized ? 'Expand panel' : 'Minimize panel'}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="18 15 12 9 6 15"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            )}
          </button>
          
          <button
            className="pvl-icon-button"
            onClick={onClose}
            aria-label="Close assistant"
            title="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div className="pvl-panel-content">
          {children}
        </div>
      )}
    </div>
  );
}

export default AssistantPanel;
