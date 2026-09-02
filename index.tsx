import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { GarageProvider } from './contexts/GarageContext';
import { LanguageProvider } from './contexts/LanguageContext';

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