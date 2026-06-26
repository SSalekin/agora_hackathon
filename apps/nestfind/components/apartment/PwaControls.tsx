'use client';

import { useEffect, useState } from 'react';
import { Bell, Download, WifiOff } from 'lucide-react';

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

declare global {
  interface Window {
    __nestfindSwSetup?: boolean;
  }
}

export function PwaControls() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setNotificationsEnabled('Notification' in window && Notification.permission === 'granted');

    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    const shouldRegisterSw =
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production' &&
      !isLocalhost;

    if (!window.__nestfindSwSetup) {
      window.__nestfindSwSetup = true;

      if (shouldRegisterSw) {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((error) => console.warn('Service worker registration failed:', error));
      } else if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) =>
            Promise.all(registrations.map((registration) => registration.unregister()))
          )
          .catch((error) => console.warn('Service worker cleanup failed:', error));
      }
    }

    const handleInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as BeforeInstallPromptEvent); };
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('beforeinstallprompt', handleInstall);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
  };

  const enableNotifications = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
    if (permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('NestFind alerts are on', { body: 'We’ll let you know when a saved search has new matches.', icon: '/android-chrome-192x192.png', badge: '/favicon-32x32.png' });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!isOnline && <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800"><WifiOff className="h-3.5 w-3.5" /> Offline</span>}
      {installPrompt && <button type="button" onClick={install} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-muted-foreground hover:bg-muted" aria-label="Install NestFind app" title="Install app"><Download className="h-4 w-4" /></button>}
      <button type="button" onClick={enableNotifications} className={`grid h-9 w-9 place-items-center rounded-full border transition ${notificationsEnabled ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:bg-muted'}`} aria-label={notificationsEnabled ? 'Listing alerts enabled' : 'Enable listing alerts'} title={notificationsEnabled ? 'Alerts enabled' : 'Enable alerts'}><Bell className={`h-4 w-4 ${notificationsEnabled ? 'fill-current' : ''}`} /></button>
    </div>
  );
}
