import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { GarageProvider } from './contexts/GarageContext';
import { LanguageProvider } from './contexts/LanguageContext';

const originalFetch = window.fetch;

Object.defineProperty(window, 'fetch', {
  configurable: true,
  writable: true,
  enumerable: true,
  value: async (input: RequestInfo | URL, init: RequestInit = {}) => {
    let url = '';
    if (typeof input === 'string') url = input;
    else if (input instanceof URL) url = input.toString();
    else if (input instanceof Request) url = input.url;

    if (url.startsWith('/api/') && !url.includes('/auth/login') && !url.includes('/auth/pin-login') && !url.includes('/auth/send-otp') && !url.includes('/auth/verify-otp') && !url.includes('/auth/reset-password')) {
      const token = localStorage.getItem('masuma_auth_token');
      if (token) {
        init.headers = {
          ...init.headers,
          'Authorization': `Bearer ${token}`
        };
        if (input instanceof Request) {
          input = new Request(input, init);
        }
      }
    }
    
    return originalFetch(input, init);
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <SettingsProvider>
          <GarageProvider>
            <App />
          </GarageProvider>
        </SettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
