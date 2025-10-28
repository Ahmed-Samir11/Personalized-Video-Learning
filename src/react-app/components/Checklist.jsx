import React, { useState } from 'react';

/**
 * Checklist Component - Interactive step-by-step checklist
 * 
 * Principles:
 * - Clear sequencing (numbers, order)
 * - Concrete language
 * - Interactive (click to jump to timestamp)
 */
function Checklist({ items, onItemClick }) {
  const [checkedItems, setCheckedItems] = useState(new Set());

  const handleToggleCheck = (itemId) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  const handleItemClick = (item) => {
    if (onItemClick && item.timestamp !== undefined) {
      onItemClick(item.timestamp);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pvl-checklist">
      <div className="pvl-section-header">
        <h3>Step-by-Step Guide</h3>
        <span className="pvl-progress">
          {checkedItems.size} / {items.length} completed
        </span>
      </div>
      
      <ul className="pvl-checklist-items">
        {items.map((item, index) => (
          <li
            key={item.id}
            className={`pvl-checklist-item ${checkedItems.has(item.id) ? 'checked' : ''}`}
          >
            <div className="pvl-checklist-item-content">
              <input
                type="checkbox"
                id={`checklist-${item.id}`}
                checked={checkedItems.has(item.id)}
                onChange={() => handleToggleCheck(item.id)}
                aria-label={`Mark step ${index + 1} as complete`}
              />
              
              <label htmlFor={`checklist-${item.id}`}>
                <span className="pvl-step-number">{index + 1}</span>
                <span className="pvl-step-text">{item.text}</span>
              </label>
            </div>
            
            {item.timestamp !== undefined && (
              <button
                className="pvl-timestamp-button"
                onClick={() => handleItemClick(item)}
                aria-label={`Jump to ${formatTime(item.timestamp)}`}
                title="Jump to this step in video"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                {formatTime(item.timestamp)}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Checklist;
