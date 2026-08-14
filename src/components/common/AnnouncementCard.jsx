import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Pin, Calendar, ArrowRight, ExternalLink, Sparkles, FileText } from 'lucide-react';
import { parseLinkInfo, handleLinkAction, LINK_TYPES } from '../../utils/linkHandler';
import TechCard from './TechCard';

export default function AnnouncementCard({ announcement, onOpenEmbed = null, className = '' }) {
  const navigate = useNavigate();

  if (!announcement) return null;

  const { title, description, type, priority, linkUrl, linkLabel, isPinned, publishDate, createdAt } = announcement;
  const rawDate = publishDate || createdAt;
  const dateFormatted = rawDate ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';

  // Category Badge Themes
  const getCategoryTheme = (catType) => {
    const t = (catType || '').toLowerCase().trim();
    if (t === 'important') {
      return { label: 'IMPORTANT', class: 'bg-[#d6b65c]/15 text-[#e7d59a] border-[#d6b65c]/40' };
    }
    if (t === 'event') {
      return { label: 'EVENT', class: 'bg-[#2f9e44]/15 text-[#2f9e44] border-[#2f9e44]/40' };
    }
    if (t === 'opportunity') {
      return { label: 'OPPORTUNITY', class: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' };
    }
    if (t === 'update') {
      return { label: 'UPDATE', class: 'bg-sky-500/15 text-sky-300 border-sky-500/40' };
    }
    return { label: catType?.toUpperCase() || 'BULLETIN', class: 'bg-gray-800/60 text-gray-300 border-gray-700/60' };
  };

  const category = getCategoryTheme(type);
  const linkInfo = parseLinkInfo(linkUrl);

  const handleCtaClick = (e) => {
    e.stopPropagation();
    if (!linkUrl) {
      navigate('/community');
      return;
    }
    handleLinkAction(linkUrl, {
      navigate,
      openEmbedModal: onOpenEmbed,
      openPdfModal: (url) => window.open(url, '_blank', 'noopener,noreferrer')
    });
  };

  return (
    <TechCard
      className={`p-6 bg-gradient-to-br from-[#121721] via-[#090d12] to-[#141d18] border-[#30363d] hover:border-[#2f9e44]/60 transition-all duration-300 flex flex-col justify-between space-y-5 shadow-xl group ${className}`}
    >
      <div className="space-y-3">
        {/* Header Tags & Metadata */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-wider ${category.class}`}>
              {category.label}
            </span>

            {isPinned && (
              <span className="px-2 py-0.5 rounded-full bg-[#2f9e44]/20 text-[#2f9e44] border border-[#2f9e44]/40 text-[9px] font-bold inline-flex items-center gap-1">
                <Pin className="w-2.5 h-2.5 fill-[#2f9e44]" /> Pinned
              </span>
            )}

            {priority === 'High' && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-[9px] font-bold uppercase tracking-wider">
                High Priority
              </span>
            )}
          </div>

          <span className="text-[11px] text-gray-400 flex items-center gap-1.5 font-mono">
            <Calendar className="w-3 h-3 text-gray-500" /> {dateFormatted}
          </span>
        </div>

        {/* Announcement Content */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-[#2f9e44] transition-colors leading-snug">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>
      </div>

      {/* Action Footer CTA */}
      <div className="pt-3 border-t border-[#30363d]/50 flex items-center justify-between gap-4">
        <span className="text-[10px] font-mono text-gray-500">Official Campus Bulletin</span>

        <button
          onClick={handleCtaClick}
          className="px-4 py-2 rounded-xl bg-[#18202c] group-hover:bg-[#2f9e44] text-gray-200 group-hover:text-white border border-[#30363d] text-xs font-bold font-mono inline-flex items-center gap-1.5 transition-all shadow-md transform group-hover:translate-x-0.5"
          aria-label={`${linkLabel || 'View details'} for ${title}`}
        >
          <span>{linkLabel || (linkUrl ? 'View Details' : 'Explore Community')}</span>
          {linkInfo.isExternal || linkInfo.isGoogleForm ? (
            <ExternalLink className="w-3.5 h-3.5" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </TechCard>
  );
}
