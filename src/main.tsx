import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import scheduleData from './data/schedule.json';

// Expose global schedule data for Android Companion WebView Auto-Sync
(window as any).__STUDY_ROOM_SCHEDULE__ = scheduleData;
if (typeof (window as any).AndroidBridge !== 'undefined' && (window as any).AndroidBridge.syncSchedule) {
  try {
    (window as any).AndroidBridge.syncSchedule(JSON.stringify(scheduleData));
  } catch (e) {
    console.warn('AndroidBridge sync skipped:', e);
  }
}

// Register Service Worker for ultra-fast mobile loading & offline caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('Новая версия приложения загружена в фоновом режиме.');
              }
            };
          }
        };
      })
      .catch((err) => {
        console.warn('Service Worker registration skipped:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
