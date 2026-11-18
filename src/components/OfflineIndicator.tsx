import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-4 left-3 sm:left-4 z-30 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-white shadow-lg max-w-[calc(100vw-8.5rem)] sm:max-w-none"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">Offline Mode — Cached catalog</span>
    </div>
  );
};
