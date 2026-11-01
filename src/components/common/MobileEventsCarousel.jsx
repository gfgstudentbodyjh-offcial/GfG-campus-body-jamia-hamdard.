import React, { useRef, useState, useEffect } from 'react';
import { Calendar, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

/**
 * MobileEventsCarousel
 * 
 * Mobile-only manual touch & drag carousel for Upcoming & Past Events.
 * Features:
 * - Displays 3 event cards simultaneously within the mobile viewport.
 * - Proportional typography, padding, and image height.
 * - Zero automatic rotation/autoplay (pure manual swipe & navigation).
 * - CSS scroll snapping + touch-action: pan-y for smooth vertical page scrolling.
 * - Touch swipe & mouse dragging support without accidental clicks.
 * - Symmetrical cards with no awkward clipping on mobile viewport.
 * - Responsive pagination indicators & prev/next controls.
 */
export default function MobileEventsCarousel({ events = [], type = 'upcoming', onSelectEvent }) {
  const scrollRef = useRef(null);
  const [activePage, setActivePage] = useState(0);

  // Drag tracking to distinguish swipe/drag from clicks
  const isMouseDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasDragged = useRef(false);
  const touchStartX = useRef(0);

  const isUpcoming = type === 'upcoming';
  const totalPages = Math.max(1, Math.ceil(events.length / 3));

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

  // Mouse drag handlers (for responsive mobile inspection & dragging)
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

  const fallbackImg = isUpcoming
    ? 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
    : 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80';

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
        {events.map((ev, idx) => {
          const title = ev.title || ev.name;
          const thumbUrl = isUpcoming
            ? (ev.banner || ev.image || ev.thumbnailUrl || ev.thumbnail?.url || ev.thumbnail)
            : (ev.thumbnail?.url || ev.thumbnail || ev.thumbnailUrl || ev.banner || ev.image);
          const dateStr = ev.date
            ? (typeof ev.date === 'string' ? ev.date : new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))
            : null;
          const desc = ev.description || ev.shortDescription;

          return (
            <div
              key={ev._id || ev.legacyId || idx}
              onClick={() => {
                if (!hasDragged.current && onSelectEvent) {
                  onSelectEvent(ev);
                }
              }}
              className="flex-none snap-start w-[calc((100%-16px)/3)] bg-[#0d121c] border border-[#30363d] hover:border-[#2f9e44]/60 active:border-[#2f9e44] rounded-xl overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 shadow-md group"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative w-full aspect-[4/3] bg-[#070a0f] overflow-hidden">
                  <img
                    src={thumbUrl || fallbackImg}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = fallbackImg;
                    }}
                  />

                  {/* Badges */}
                  {isUpcoming ? (
                    <span className="absolute top-1 left-1 max-w-[92%] px-1 py-0.5 rounded text-[7.5px] font-mono font-bold bg-[#0a0d12]/90 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                      <span className="truncate">{ev.status || 'OPEN'}</span>
                    </span>
                  ) : (
                    <div className="absolute top-1 inset-x-1 flex items-center justify-between pointer-events-none gap-0.5">
                      {ev.category ? (
                        <span className="text-[7px] font-mono uppercase font-bold text-gray-200 bg-[#0a0d12]/90 px-1 py-0.5 rounded border border-gray-700/50 truncate max-w-[55%]">
                          {ev.category}
                        </span>
                      ) : <span />}
                      <span className="text-[7px] font-mono font-bold uppercase bg-[#2f9e44] text-white px-1 py-0.5 rounded shadow flex items-center gap-0.5 flex-shrink-0">
                        <CheckCircle2 className="w-2 h-2" /> Done
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-1.5 space-y-1">
                  <h3 className="text-[10px] font-bold text-white line-clamp-2 leading-tight group-hover:text-[#2f9e44] transition-colors min-h-[26px]">
                    {title}
                  </h3>

                  {dateStr && (
                    <div className="flex items-center gap-1 text-[8px] font-mono text-[#2f9e44] font-semibold">
                      <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">{dateStr}</span>
                    </div>
                  )}

                  {desc && (
                    <p className="text-[8px] text-gray-400 line-clamp-2 leading-tight">
                      {desc}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="p-1.5 pt-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectEvent) onSelectEvent(ev);
                  }}
                  className="w-full py-1 px-1 rounded-lg bg-[#161d28] active:bg-[#2f9e44] hover:bg-[#2f9e44] text-white text-[9px] font-bold flex items-center justify-center gap-0.5 border border-[#30363d] transition-colors"
                >
                  <span>{isUpcoming ? 'Details' : 'View'}</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination & Navigation Bar (when multiple pages exist) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          {/* Subtle swipe hint */}
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

