import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/app.css';

console.log('[React App] Script loaded');

// Wait for the root element to be available
const initializeApp = () => {
  console.log('[React App] Attempting to initialize...');
  
  const rootElement = document.getElementById('pvl-react-root');
  
  if (!rootElement) {
    console.error('[React App] Root element #pvl-react-root not found, will retry...');
    // Retry after a short delay
    setTimeout(initializeApp, 100);
    return;
  }

  console.log('[React App] Root element found, rendering...');

  try {
    // Create React root and render
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('[React App] Initialized successfully');
  } catch (error) {
    console.error('[React App] Error during initialization:', error);
  }
};

// Start initialization
initializeApp();
