import React from 'react';
import { ShieldCheck, Award } from 'lucide-react';

/**
 * Premium Campus Mantri Badge Component
 *
 * Distinct Visual Hierarchy:
 * - Current Active Campus Mantri: Premium Gold / Amber (#D4A72C border, #E6B83F text, subtle dark gold background & glow)
 * - Former / Past Campus Mantri: Official GFG Green (#2f9e44 border/text, subtle green tint)
 *
 * @param {boolean} [isCurrent=false] - True if currently serving
 * @param {string} [status] - 'current' | 'former'
 * @param {string} [session] - Optional session string e.g. "2025–26"
 * @param {string} [size='normal'] - 'sm' | 'normal' | 'lg'
 * @param {boolean} [showSession=false] - Whether to append session to the label
 * @param {string} [className=''] - Additional CSS classes
 */
export default function CampusMantriBadge({
  isCurrent = false,
  status,
  session,
  size = 'normal',
  showSession = false,
  className = ''
}) {
  const active = status === 'current' || isCurrent === true;

  // Fluid responsive sizing tokens (flawless on mobile 360px up to 4K)
  const sizeClasses = {
    sm: 'text-[8.5px] sm:text-[9.5px] px-2 py-0.5 gap-1 tracking-wide',
    normal: 'text-[9.5px] sm:text-[11px] px-2.5 sm:px-3 py-0.5 sm:py-1 gap-1.5 tracking-wider',
    lg: 'text-[10px] sm:text-xs md:text-xs lg:text-sm px-3 sm:px-3.5 py-0.5 sm:py-1 gap-1.5 sm:gap-2 tracking-wider'
  }[size] || 'text-[9.5px] sm:text-[11px] px-2.5 sm:px-3 py-0.5 sm:py-1 gap-1.5 tracking-wider';

  const iconSizes = {
    sm: 'w-2.5 h-2.5 flex-shrink-0',
    normal: 'w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0',
    lg: 'w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0'
  }[size] || 'w-3 h-3 flex-shrink-0';

  const primaryLabel = active ? 'Current Campus Mantri' : 'Campus Mantri';

  // Visual Theme Tokens
  if (active) {
    // Current: Institutional Gold / Amber Identity
    return (
      <span
        aria-label={showSession && session ? `${primaryLabel} Session ${session}` : primaryLabel}
        className={`inline-flex items-center justify-center max-w-full font-mono font-bold uppercase rounded-full border transition-all select-none ${sizeClasses} bg-[#D4A72C]/10 text-[#E6B83F] border-[#D4A72C]/70 shadow-[0_0_10px_rgba(212,167,44,0.22)] ${className}`}
      >
        <ShieldCheck className={`${iconSizes} text-[#E6B83F]`} />
        <span className="truncate">{primaryLabel}</span>
        {showSession && session && (
          <>
            <span className="text-[#D4A72C]/60 flex-shrink-0">•</span>
            <span className="font-semibold text-[#F3C958] whitespace-nowrap flex-shrink-0">
              Session {session}
            </span>
          </>
        )}
      </span>
    );
  }

  // Former: Official GFG Green Identity
  return (
    <span
      aria-label={showSession && session ? `${primaryLabel} Session ${session}` : primaryLabel}
      className={`inline-flex items-center justify-center max-w-full font-mono font-bold uppercase rounded-full border transition-all select-none ${sizeClasses} bg-[#2f9e44]/15 text-[#2f9e44] border-[#2f9e44]/40 shadow-xs ${className}`}
    >
      <ShieldCheck className={`${iconSizes} text-[#2f9e44]`} />
      <span className="truncate">{primaryLabel}</span>
      {showSession && session && (
        <>
          <span className="text-[#2f9e44]/60 flex-shrink-0">•</span>
          <span className="font-semibold whitespace-nowrap flex-shrink-0">
            Session {session}
          </span>
        </>
      )}
    </span>
  );
}
