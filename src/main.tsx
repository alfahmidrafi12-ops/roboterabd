import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const blockInspectionMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  const blockInspectionShortcuts = (e: KeyboardEvent) => {
    const key = (e.key || '').toLowerCase();
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const isDevToolsCombo =
      e.key === 'F12' ||
      e.keyCode === 123 ||
      (isCtrlOrCmd && e.shiftKey && ['i', 'j', 'c', 'k', 'e', 'm', 's'].includes(key)) ||
      (e.metaKey && e.altKey && ['i', 'j', 'c', 'u', 'k', 'e'].includes(key)) ||
      (isCtrlOrCmd && !e.shiftKey && (key === 'u' || key === 's'));

    if (isDevToolsCombo) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
    return undefined;
  };

  document.addEventListener('contextmenu', blockInspectionMenu, { capture: true });
  window.addEventListener('keydown', blockInspectionShortcuts, { capture: true });
}

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      registration.update().catch(() => {});
    }
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
