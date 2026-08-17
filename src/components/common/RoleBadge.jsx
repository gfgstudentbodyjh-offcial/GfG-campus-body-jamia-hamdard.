import React from 'react';
import { ShieldCheck, Award, Sparkles, UserCheck } from 'lucide-react';
import CampusMantriBadge from './CampusMantriBadge';

/**
 * Universal RoleBadge Component
 * Automatically styles Current Campus Mantri as Gold and Former Campus Mantri as Green
 */
export default function RoleBadge({
  role = 'Member',
  size = 'normal',
  isCurrentMantri = false,
  className = ''
}) {
  const normalized = (role || 'Member').trim();

  // If this is a Campus Mantri role, delegate to the dedicated CampusMantriBadge
  if (normalized.toLowerCase().includes('mantri')) {
    const isCurrent = isCurrentMantri ||
      normalized.toLowerCase().includes('current') ||
      (!normalized.toLowerCase().includes('former') && isCurrentMantri);

    return (
      <CampusMantriBadge
        isCurrent={isCurrent}
        size={size}
        className={className}
      />
    );
  }

  let colorClasses = 'bg-[#18202c] text-gray-300 border-[#30363d]';
  let Icon = UserCheck;

  if (normalized.includes('Faculty') || normalized.includes('Coordinator')) {
    colorClasses = 'bg-amber-500/15 text-amber-400 border-amber-500/40';
    Icon = Award;
  } else if (normalized.includes('Co-Lead')) {
    colorClasses = 'bg-teal-500/15 text-teal-400 border-teal-500/40 shadow-xs';
    Icon = ShieldCheck;
  } else if (normalized.includes('Lead') || normalized.includes('Core')) {
    colorClasses = 'bg-sky-500/15 text-sky-400 border-sky-500/40 shadow-xs';
    Icon = ShieldCheck;
  } else if (normalized.includes('Ambassador')) {
    colorClasses = 'bg-purple-500/15 text-purple-300 border-purple-500/40';
    Icon = Sparkles;
  } else if (normalized === 'Visitor') {
    colorClasses = 'bg-gray-800/60 text-gray-400 border-gray-700/50';
    Icon = UserCheck;
  }

  const isSmall = size === 'sm';
  const textClasses = isSmall ? 'text-[9px] px-1.5 py-0.5 gap-1' : 'text-[10px] px-2 py-0.5 gap-1';
  const iconClasses = isSmall ? 'w-2.5 h-2.5 flex-shrink-0' : 'w-3 h-3 flex-shrink-0';

  return (
    <span className={`inline-flex items-center font-mono font-bold rounded-full border whitespace-nowrap ${textClasses} ${colorClasses} ${className}`}>
      <Icon className={iconClasses} />
      <span className="whitespace-nowrap">{normalized}</span>
    </span>
  );
}
