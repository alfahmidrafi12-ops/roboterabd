import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { BrandLogo } from './BrandLogo';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!showGuide) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowGuide(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showGuide]);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          type="button"
          onClick={handleClick}
          className="w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-lg bg-[#EFF6FF] hover:bg-blue-100 border border-blue-200 text-xs font-semibold text-[#0866F5] transition-colors"
        >
          <span className="inline-flex items-center gap-2 min-w-0">
            <Smartphone className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {isInstallable ? 'Install Android App' : 'Get Mobile App'}
            </span>
          </span>
          <Download className="w-3.5 h-3.5 shrink-0" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          aria-label="Install Robotera BD App"
          className={`hidden min-[400px]:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
            isInstallable
              ? 'bg-[#071A3B] hover:bg-[#071A3B]/90 text-white border border-[#071A3B]'
              : 'border border-slate-200 bg-[#F1F5F9] hover:bg-slate-200/70 text-[#071A3B]'
          }`}
        >
          <Smartphone className="w-4 h-4 text-[#0866F5] shrink-0" />
          <span className="hidden md:inline">
            {isInstallable ? 'Install App' : 'Android App'}
          </span>
        </button>
      )}

      {showGuide &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-[#071A3B]/60 backdrop-blur-sm"
              onClick={() => setShowGuide(false)}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Install Robotera BD Mobile App"
              className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <BrandLogo size="md" className="shadow-sm" />
                  <div>
                    <h3 className="font-display text-base font-bold text-[#071A3B]">
                      Install Robotera BD App
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isIOS
                        ? 'iPhone / iPad Safari'
                        : isAndroid
                        ? 'Android Chrome'
                        : 'Mobile & Desktop App'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  aria-label="Close install instructions"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isIOS ? (
                <ol className="space-y-2 text-xs text-slate-600 leading-relaxed bg-[#F1F5F9] rounded-xl p-4 border border-slate-200">
                  <li>1. Tap the <strong>Share</strong> icon in your Safari toolbar.</li>
                  <li>2. Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>3. Tap <strong>Add</strong> to launch Robotera BD full-screen.</li>
                </ol>
              ) : (
                <ol className="space-y-2 text-xs text-slate-600 leading-relaxed bg-[#F1F5F9] rounded-xl p-4 border border-slate-200">
                  <li>1. Open this store in <strong>Google Chrome</strong> on Android.</li>
                  <li>2. Tap the <strong>⋮</strong> menu in the top-right corner.</li>
                  <li>
                    3. Tap <strong>Add to Home screen</strong> → <strong>Install</strong> to add the
                    Robotera BD app icon to your phone.
                  </li>
                </ol>
              )}

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full h-10 rounded-lg bg-[#0866F5] hover:bg-[#0866F5]/90 border border-[#0866F5] hover:border-[#1685FF] text-white text-xs font-semibold transition-colors"
              >
                Got It
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
