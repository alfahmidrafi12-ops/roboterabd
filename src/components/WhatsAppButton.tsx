import React from 'react';
import { MessageCircle } from 'lucide-react';

export const WHATSAPP_URL =
  'https://wa.me/8801624987366?text=Hello%20Robotera%20BD%2C%20I%20need%20support%20with%20robotics%20and%20electronics%20orders.';

export const WhatsAppButton: React.FC = () => {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Robotera BD on WhatsApp (+880 1624-987366)"
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-5 right-3 sm:right-5 z-40 inline-flex items-center gap-1.5 sm:gap-2 h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl bg-[#16A34A] hover:bg-[#16A34A]/90 active:bg-[#15803D] border border-emerald-400/40 hover:border-emerald-200/70 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
    >
      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
      <span className="hidden sm:inline text-sm font-semibold whitespace-nowrap">
        WhatsApp Support
      </span>
      <span className="sm:hidden text-xs font-semibold whitespace-nowrap">
        WhatsApp
      </span>
    </a>
  );
};
