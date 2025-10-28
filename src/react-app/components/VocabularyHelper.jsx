import React, { useState } from 'react';

/**
 * Vocabulary Helper - On-demand text simplification
 * 
 * Principles:
 * - Reactive (user initiates)
 * - Clear feedback
 * - Simple language output
 */
function VocabularyHelper() {
  const [inputText, setInputText] = useState('');
  const [simplified, setSimplified] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSimplify = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    
    // Send message to content script
    window.postMessage({
      type: 'PVL_SIMPLIFY_TEXT',
      data: { text: inputText }
    }, '*');
    
    // Listen for response
    const handleResponse = (event) => {
      if (event.data.type === 'PVL_RESPONSE_TEXT_SIMPLIFIED') {
        setSimplified(event.data.data);
        setIsLoading(false);
        window.removeEventListener('message', handleResponse);
      }
    };
    
    window.addEventListener('message', handleResponse);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      setIsLoading(false);
      window.removeEventListener('message', handleResponse);
    }, 10000);
  };

  const handleClear = () => {
    setInputText('');
    setSimplified(null);
  };

  return (
    <div className="pvl-vocabulary-helper">
      <div className="pvl-section-header">
        <h3>Vocabulary Helper</h3>
      </div>
      
      <div className="pvl-vocab-input-group">
        <textarea
          className="pvl-vocab-input"
          placeholder="Paste complex text here to simplify it..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={3}
          aria-label="Text to simplify"
        />
        
        <div className="pvl-vocab-buttons">
          <button
            className="pvl-button pvl-button-primary"
            onClick={handleSimplify}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <span className="pvl-loading-spinner-small"></span>
                Simplifying...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                Simplify
              </>
            )}
          </button>
          
          {(inputText || simplified) && (
            <button
              className="pvl-button pvl-button-secondary"
              onClick={handleClear}
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      {simplified && (
        <div className="pvl-vocab-result">
          <div className="pvl-vocab-simplified">
            <strong>Simplified:</strong>
            <p>{simplified.simplified}</p>
          </div>
          
          {simplified.definitions && simplified.definitions.length > 0 && (
            <div className="pvl-vocab-definitions">
              <strong>Word meanings:</strong>
              <ul>
                {simplified.definitions.map((def, index) => (
                  <li key={index}>
                    <strong>{def.term}:</strong> {def.definition}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VocabularyHelper;
