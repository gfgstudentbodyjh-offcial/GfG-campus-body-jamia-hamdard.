import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, ArrowUpRight,
  Users, Palette, Calendar, Megaphone, Share2, Camera, PenTool, Database, Terminal
} from 'lucide-react';

const getTeamIcon = (iconName) => {
  switch (iconName) {
    case 'Users': return Users;
    case 'Palette': return Palette;
    case 'Calendar': return Calendar;
    case 'Megaphone': return Megaphone;
    case 'Share2': return Share2;
    case 'Camera': return Camera;
    case 'PenTool': return PenTool;
    case 'Database': return Database;
    case 'Terminal': return Terminal;
    default: return Users;
  }
};

/**
 * MobileLeadershipCarousel
 * 
 * Mobile-only manual touch & drag carousel for Campus Leadership.
 * Features:
 * - Displays 3 leadership cards simultaneously within the mobile viewport.
 * - Proportional typography, padding, and image height.
 * - Zero automatic rotation/autoplay (pure manual swipe & navigation).
 * - CSS scroll snapping + touch-action: pan-y for smooth vertical page scrolling.
 * - Touch swipe & mouse dragging support without accidental clicks.
 * - Symmetrical cards with no awkward clipping on mobile viewport.
 * - Responsive pagination indicators & prev/next controls.
 */
export default function MobileLeadershipCarousel({ leaders = [] }) {
  const scrollRef = useRef(null);
  const [activePage, setActivePage] = useState(0);

  // Drag tracking to distinguish swipe/drag from clicks
  const isMouseDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasDragged = useRef(false);
  const touchStartX = useRef(0);

  const totalPages = Math.max(1, Math.ceil(leaders.length / 3));

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth, scrollWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 5) {
      setActivePage(0);
      return;
    }
    const pageRatio = scrollLeft / maxScroll;
    const page = Math.round(pageRatio * (totalPages - 1));
    setActivePage(Math.min(totalPages - 1, Math.max(0, page)));
  };

  const scrollToPage = (pageIdx) => {
    if (!scrollRef.current) return;
    const { clientWidth, scrollWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) return;
    const target = (pageIdx / (totalPages - 1)) * maxScroll;
    scrollRef.current.scrollTo({ left: target, behavior: 'smooth' });
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    scrollToPage(Math.max(0, activePage - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    scrollToPage(Math.min(totalPages - 1, activePage + 1));
  };

  // Touch handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    hasDragged.current = false;
  };

  const handleTouchMove = (e) => {
    if (Math.abs(e.touches[0].clientX - touchStartX.current) > 8) {
      hasDragged.current = true;
    }
  };

  const handleTouchEnd = () => {
    setTimeout(() => {
      hasDragged.current = false;
    }, 80);
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    if (!scrollRef.current) return;
    isMouseDown.current = true;
    hasDragged.current = false;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftStart.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown.current || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.3;
    if (Math.abs(walk) > 6) {
      hasDragged.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleMouseUp = () => {
    isMouseDown.current = false;
    setTimeout(() => {
      hasDragged.current = false;
    }, 80);
  };

  const handleMouseLeave = () => {
    if (isMouseDown.current) {
      isMouseDown.current = false;
      setTimeout(() => {
        hasDragged.current = false;
      }, 80);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* 3-Card Viewport Track */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="flex overflow-x-auto gap-2 snap-x snap-mandatory scroll-smooth no-scrollbar select-none cursor-grab active:cursor-grabbing"
        style={{
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {leaders.map((leader, idx) => {
          const IconComponent = getTeamIcon(leader.icon);
          const isLead = leader.isLead ?? !leader.roleTitle?.toLowerCase().includes('co-lead');
          const shortTeam = (leader.teamName || '').replace(/team/i, '').trim();

          return (
            <div
              key={`${leader._id || idx}`}
              className="flex-none snap-start w-[calc((100%-16px)/3)] bg-[#0d121c] border border-[#2f9e44]/40 hover:border-[#2f9e44] active:border-[#2f9e44] rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 shadow-md group"
            >
              <div>
                {/* Portrait Header */}
                <div className="relative w-full aspect-[4/5] bg-[#070a0f] overflow-hidden">
                  <img
                    src={leader.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                    alt={`${leader.name}, ${leader.roleTitle}`}
                    loading="lazy"
                    style={{ objectPosition: leader.imagePosition || 'center 50%' }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
                    }}
                  />

                  {/* Team domain tag */}
                  <span className="absolute top-1 left-1 max-w-[60%] truncate px-1 py-0.5 rounded text-[7px] font-mono font-bold bg-[#0a0d12]/90 text-emerald-400 border border-emerald-500/40 flex items-center gap-0.5 shadow-sm">
                    <IconComponent className="w-2 h-2 flex-shrink-0" />
                    <span className="truncate">{shortTeam || 'Team'}</span>
                  </span>

                  {/* Lead / Co-Lead Badge */}
                  <span
                    className={`absolute top-1 right-1 px-1 py-0.5 rounded text-[7px] font-mono font-bold uppercase shadow-sm ${
                      isLead ? 'bg-[#2f9e44] text-white' : 'bg-[#18202c] text-gray-300 border border-[#30363d]'
                    }`}
                  >
                    {isLead ? 'Lead' : 'Co-Lead'}
                  </span>
                </div>

                {/* Content */}
                <div className="p-1.5 space-y-0.5">
                  <h4 className="text-[10px] font-bold text-white line-clamp-1 group-hover:text-[#2f9e44] transition-colors leading-tight">
                    {leader.name}
                  </h4>
                  <p className="text-[8px] font-mono text-gray-400 truncate">
                    @{leader.username || 'user'}
                  </p>
                  <p className="text-[8px] font-mono font-semibold text-[#2f9e44] truncate">
                    {leader.roleTitle}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-1.5 pt-0">
                <Link
                  to={leader.profileUrl || '/teams'}
                  onClick={(e) => {
                    if (hasDragged.current) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full py-1 px-1 rounded-lg bg-[#161d28] active:bg-[#2f9e44] hover:bg-[#2f9e44] text-white text-[9px] font-bold flex items-center justify-center gap-0.5 border border-[#30363d] transition-colors"
                >
                  <span>Profile</span>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination & Navigation Bar (when multiple pages exist) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[9px] font-mono text-gray-500">
            Swipe left/right
          </span>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToPage(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activePage === idx ? 'w-4 bg-[#2f9e44]' : 'w-1.5 bg-[#30363d] hover:bg-gray-500'
                }`}
                aria-label={`Go to slide page ${idx + 1}`}
              />
            ))}
          </div>

          {/* Prev / Next Mini Chevrons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={activePage === 0}
              aria-label="Previous slide"
              className="p-1 rounded-md bg-[#161d28] border border-[#30363d] text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={activePage === totalPages - 1}
              aria-label="Next slide"
              className="p-1 rounded-md bg-[#161d28] border border-[#30363d] text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

