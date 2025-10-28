import React from 'react';

/**
 * Confusion Alert - Proactive assistance when confusion is detected
 * 
 * Principles:
 * - Proactive but Deferential (gentle invitation)
 * - Transparency (explain why it appeared)
 * - User Control (easy to dismiss)
 */
function ConfusionAlert({ data, onDismiss, onAcceptHelp }) {
  const getSuggestionText = (suggestions) => {
    if (!suggestions || suggestions.length === 0) {
      return 'Would you like some help with this section?';
    }
    
    const suggestionMap = {
      vocabulary_simplification: 'simplify complex words',
      step_breakdown: 'break down the steps',
      pause_assistance: 'pause and review'
    };
    
    const text = suggestions
      .map(s => suggestionMap[s] || s)
      .join(', ');
    
    return `I can help you ${text}.`;
  };

  return (
    <div className="pvl-confusion-alert" role="alert">
      <div className="pvl-alert-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      
      <div className="pvl-alert-content">
        <h4>I noticed you might be having trouble</h4>
        <p className="pvl-alert-explanation">
          You've rewound or paused this section a few times. 
        </p>
        <p className="pvl-alert-suggestion">
          {getSuggestionText(data.suggestions)}
        </p>
      </div>
      
      <div className="pvl-alert-actions">
        <button
          className="pvl-button pvl-button-primary"
          onClick={onAcceptHelp}
        >
          Yes, help me
        </button>
        <button
          className="pvl-button pvl-button-secondary"
          onClick={onDismiss}
        >
          No thanks
        </button>
      </div>
      
      <button
        className="pvl-alert-close"
        onClick={onDismiss}
        aria-label="Dismiss alert"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

export default ConfusionAlert;
