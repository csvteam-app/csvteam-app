import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// PWA: register service worker with auto-update
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onRegisteredSW(swUrl, registration) {
        // Check for updates every 60 seconds
        if (registration) {
          setInterval(() => {
            registration.update();
          }, 60 * 1000);
        }
      },
      onNeedRefresh() {
        // Auto-reload when new version is available
        window.location.reload();
      },
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
