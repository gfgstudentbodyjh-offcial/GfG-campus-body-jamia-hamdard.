import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Instagram, Globe, ArrowRight } from 'lucide-react';

/**
 * GFG Campus Body — Public Member Discovery Card
 *
 * Consumes real user profile bio/about, canonical avatar image,
 * hierarchy-aware role badge, and validated developer social links.
 */
export default function MemberCard({ member }) {
  const [imageError, setImageError] = useState(false);

  if (!member) return null;

  const displayName = (member.name || member.fullName || 'Community Member').trim();
  const displayRole = (member.role || 'Member').trim();

  // Canonical Bio / About resolution: Prioritize user-written bio, avoid generic boilerplates
  let displayBio = 'GeeksforGeeks Campus Community Member';
  if (member.bio && member.bio.trim()) {
    displayBio = member.bio.trim();
  } else if (
    member.about &&
    member.about.trim() &&
    !member.about.includes('Joined GFG Campus Community')
  ) {
    displayBio = member.about.trim();
  }

  const profileSlug = member.username || member._id;
  const profileUrl = `/profile/${profileSlug}`;

  // Role accent theme based on official hierarchy
  const isLeadership = /mantri|president|community lead/i.test(displayRole);
  const isLead = /\blead\b|head/i.test(displayRole) && !/co-lead|deputy|vice/i.test(displayRole);
  const isCoLead = /co-lead|deputy|vice/i.test(displayRole);

  const roleBadgeClass = isLeadership || isLead
    ? 'bg-[#d6b65c]/15 text-[#d6b65c] border-[#d6b65c]/40'
    : isCoLead
    ? 'bg-slate-400/15 text-slate-300 border-slate-500/40'
    : 'bg-[#2f9e44]/15 text-[#2f9e44] border-[#2f9e44]/40';

  const avatarSrc = !imageError && member.photo
    ? member.photo
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2f9e44&color=fff&bold=true`;

  return (
    <div className="w-72 sm:w-80 flex-shrink-0 snap-start p-5 rounded-2xl bg-gradient-to-b from-[#121721] to-[#0a0d12] border border-[#30363d] hover:border-[#2f9e44]/60 transition-all duration-300 shadow-lg flex flex-col justify-between space-y-4 group relative overflow-hidden">
      
      {/* Top Ambient Glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#2f9e44]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#2f9e44]/10 transition-colors" />

      {/* Header Info: Photo + Name + Role */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center gap-3.5">
          <Link to={profileUrl} className="flex-shrink-0 block relative">
            <img
              src={avatarSrc}
              alt={displayName}
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
              className="w-14 h-14 rounded-xl object-cover border border-[#30363d] group-hover:border-[#2f9e44] transition-all shadow-md"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block mb-1 truncate max-w-full ${roleBadgeClass}`}>
              {displayRole}
            </span>
            <Link to={profileUrl} className="block">
              <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-[#2f9e44] transition-colors truncate">
                {displayName}
              </h4>
            </Link>
          </div>
        </div>

        {/* Clamped Real Bio */}
        <p className="text-xs text-gray-300 leading-relaxed font-normal line-clamp-2 min-h-[32px] whitespace-pre-line">
          {displayBio}
        </p>
      </div>

      {/* Footer: Social Links + View Profile CTA */}
      <div className="pt-3 border-t border-[#30363d]/60 flex items-center justify-between gap-2 relative z-10">
        {/* Social Icons (Only render non-empty valid links) */}
        <div className="flex items-center gap-1.5 text-gray-400">
          {member.github && member.github.trim() && (
            <a
              href={member.github.startsWith('http') ? member.github : `https://github.com/${member.github.trim()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:text-white hover:bg-[#21262d] transition-colors"
              aria-label={`${displayName}'s GitHub`}
              onClick={(e) => e.stopPropagation()}
            >
              <Github className="w-3.5 h-3.5" />
            </a>
          )}
          {member.linkedin && member.linkedin.trim() && (
            <a
              href={member.linkedin.startsWith('http') ? member.linkedin : `https://linkedin.com/in/${member.linkedin.trim()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:text-[#0a66c2] hover:bg-[#21262d] transition-colors"
              aria-label={`${displayName}'s LinkedIn`}
              onClick={(e) => e.stopPropagation()}
            >
              <Linkedin className="w-3.5 h-3.5" />
            </a>
          )}
          {member.instagram && member.instagram.trim() && (
            <a
              href={member.instagram.startsWith('http') ? member.instagram : `https://instagram.com/${member.instagram.trim()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:text-[#e1306c] hover:bg-[#21262d] transition-colors"
              aria-label={`${displayName}'s Instagram`}
              onClick={(e) => e.stopPropagation()}
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>
          )}
          {(member.website || member.portfolio) && (member.website || member.portfolio).trim() && (
            <a
              href={
                (member.website || member.portfolio).startsWith('http')
                  ? (member.website || member.portfolio).trim()
                  : `https://${(member.website || member.portfolio).trim()}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:text-[#2f9e44] hover:bg-[#21262d] transition-colors"
              aria-label={`${displayName}'s Website`}
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* View Profile Action Link */}
        <Link
          to={profileUrl}
          className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#2f9e44] hover:text-white transition-colors"
        >
          <span>Profile</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

    </div>
  );
}
