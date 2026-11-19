'use client';

import { useEffect } from 'react';

export function PWARegistry() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV !== 'production') {
        // Unregister only caching service worker (/sw.js) in development; keep /push-sw.js for push testing
        navigator.serviceWorker.getRegistrations()
          .then((registrations) => {
            return Promise.all(
              registrations
                .filter(r => !r.active?.scriptURL?.includes('push-sw.js'))
                .map(r => r.unregister().catch(err => console.error('Error unregistering service worker:', err)))
            );
          })
          .catch(err => console.error('Error getting service worker registrations:', err));
        return;
      }

      const handleServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered with scope:', registration.scope);
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      };

      handleServiceWorker();
    }
  }, []);

  return null;
}

