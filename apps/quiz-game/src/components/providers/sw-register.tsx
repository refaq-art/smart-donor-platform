'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // التسجيل غير حرج لعمل التطبيق — فشله لا يجب أن يعطّل شيئًا
    });
  }, []);

  return null;
}
