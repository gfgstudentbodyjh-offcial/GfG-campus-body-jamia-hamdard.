import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';

export default function RegistrationFlashBanner({
  isVisible,
  onDismiss,
  onRegisterClick
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.25 }}
          aria-label="Ideathon Registration Announcement"
          className="sticky top-[72px] z-40 bg-[#0B100E]/95 backdrop-blur-md border-b border-[#22A447]/30 shadow-md"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
            {/* Live Indicator + Announcement Message */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22A447] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22A447]" />
              </span>
              <div className="flex items-center gap-2 truncate">
                <strong className="text-white font-bold tracking-wide">
                  REGISTRATION IS LIVE NOW
                </strong>
                <span className="text-[#28342D] hidden sm:inline">•</span>
                <span className="text-[#A2ADA6] hidden sm:inline truncate">
                  THINKTANK IDEATHON 2026
                </span>
                <span className="hidden md:inline px-1.5 py-0.5 rounded bg-[#171F1B] border border-[#28342D] text-[#22A447] text-[10px] font-mono font-bold">
                  ₹9,000 PRIZES
                </span>
              </div>
            </div>

            {/* Actions: Register CTA + Close Button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={onRegisterClick}
                className="px-3.5 py-1.5 rounded-lg bg-[#22A447] hover:bg-[#1e913e] active:scale-[0.98] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#22A447]"
              >
                <span>Register Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss banner"
                className="p-1.5 rounded-lg text-[#707E75] hover:text-white hover:bg-[#171F1B] transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
