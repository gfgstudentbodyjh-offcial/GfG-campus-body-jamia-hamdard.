import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import api from '../../services/api';
import { MOCK_EVENTS } from '../../data/events';
import { Calendar, UserCheck, Handshake, Trophy, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import TechHeader from '../../components/common/TechHeader';
import TechCard from '../../components/common/TechCard';
import EmbedModal from '../../components/common/EmbedModal';
import { handleLinkAction } from '../../utils/linkHandler';

import cacheService from '../../services/cacheService';

export default function EventsPage() {
  const navigate = useNavigate();
  const [embedModalState, setEmbedModalState] = useState({ isOpen: false, url: '', title: '' });
  const [events, setEvents] = useState(() => {
    const cached = cacheService.get('events');
    return cached?.data || [];
  });
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Upcoming', 'Past'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(() => {
    const cached = cacheService.get('events');
    return !(cached && cached.data && cached.data.length > 0);
  });

  useEffect(() => {
    const unsub = cacheService.subscribe('events', (data) => {
      if (Array.isArray(data)) setEvents(data);
    });

    cacheService.dedupe('events', () => api.get('/events'))
      .then((res) => {
        const data = res.data.data?.length ? res.data.data : MOCK_EVENTS;
        setEvents(data);
        cacheService.set('events', data);
      })
      .catch((err) => {
        console.warn(err);
        if (events.length === 0) setEvents(MOCK_EVENTS);
      })
      .finally(() => setLoading(false));

    return unsub;
  }, []);

  const isPastEvent = (e) => {
    if (!e) return false;
    const st = (e.status || '').toLowerCase().trim();
    if (st === 'completed' || st === 'archived') return true;
    if (st === 'upcoming' || st === 'registration open' || st === 'announced' || st === 'planning' || st === 'live' || st === 'published') return false;
    return e.isUpcoming === false;
  };

  const isUpcomingEvent = (e) => {
    if (!e) return false;
    const st = (e.status || '').toLowerCase().trim();
    if (st === 'completed' || st === 'archived' || st === 'draft') return false;
    if (st === 'upcoming' || st === 'registration open' || st === 'announced' || st === 'planning' || st === 'live' || st === 'published') return true;
    return e.isUpcoming !== false;
  };

  const upcomingEvents = events.filter(isUpcomingEvent);
  const pastEvents = events.filter(isPastEvent);

  const displayedEvents = activeTab === 'Upcoming'
    ? upcomingEvents
    : activeTab === 'Past'
    ? pastEvents
    : events;

  return (
    <div className="min-h-screen bg-transparent text-gray-100 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        
        {/* Header */}
        <TechHeader
          tag="EVENTS & WORKSHOPS"
          title="Events & Technical Workshops"
          description={`Explore ${pastEvents.length} past technical events & ${upcomingEvents.length} upcoming initiatives organized by GeeksforGeeks Campus Body Jamia Hamdard.`}
          count={events.length}
          countLabel="Total Sessions"
        >
          {/* Segmented Control Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2">
            {[
              { id: 'All', label: `All (${events.length})` },
              { id: 'Upcoming', label: `Upcoming (${upcomingEvents.length})` },
              { id: 'Past', label: `Past (${pastEvents.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[#2f9e44] text-white shadow-lg shadow-[#2f9e44]/25 border border-[#2f9e44]'
                    : 'bg-[#121721] text-gray-300 border border-[#30363d] hover:border-[#2f9e44]/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </TechHeader>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 font-mono">Loading Events...</div>
        ) : displayedEvents.length === 0 ? (
          <div className="text-center py-16 text-gray-500 font-mono">No events found for "{activeTab}"</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {displayedEvents.map((ev) => {
              const isUpcoming = upcomingEvents.includes(ev);
              const eventTitle = ev.title || ev.name || ev.eventName;
              const eventBanner = ev.banner || ev.image || ev.thumbnailUrl || ev.thumbnail?.url || ev.thumbnail || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
              const eventDateStr = ev.date ? (typeof ev.date === 'string' ? ev.date : new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })) : null;
              // CMS content only — NEVER a generic replacement
              const eventDesc = ev.description || ev.shortDescription || ev.desc || null;

              return (
                <TechCard
                  key={ev._id || ev.legacyId || Math.random()}
                  onClick={() => setSelectedEvent(ev)}
                  className="flex flex-col justify-between group bg-[#121721] cursor-pointer hover:border-[#2f9e44]"
                >
                  <div>
                    <div className="h-28 sm:h-48 relative overflow-hidden bg-[#0d1117]">
                      <img
                        src={eventBanner}
                        alt={eventTitle}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />

                      {/* Status Badge */}
                      {isUpcoming ? (
                        <span className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-mono font-bold bg-[#0a0d12]/90 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shadow-lg">
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span className="truncate max-w-[90px] sm:max-w-none">{ev.status || 'REGISTRATION OPEN'}</span>
                        </span>
                      ) : (
                        <span className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded text-[8px] sm:text-[10px] font-mono font-bold bg-[#18202c]/90 text-gray-300 border border-[#30363d] truncate max-w-[90px] sm:max-w-none">
                          {ev.category || 'Completed'}
                        </span>
                      )}
                    </div>

                    <div className="p-3 sm:p-6 space-y-1.5 sm:space-y-3">
                      <h3 className="text-xs sm:text-lg font-bold sm:font-extrabold text-white group-hover:text-[#2f9e44] transition-colors leading-snug line-clamp-2">
                        {eventTitle}
                      </h3>

                      {eventDateStr && (
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-[#2f9e44] font-semibold">
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                          <span className="truncate">{eventDateStr}</span>
                        </div>
                      )}

                      {ev.speaker && (
                        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-300">
                          <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                          <span>Speaker: {ev.speaker}</span>
                        </div>
                      )}

                      {ev.partner && (
                        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-300">
                          <Handshake className="w-3.5 h-3.5 text-[#06b6d4]" />
                          <span>Partner: {ev.partner}</span>
                        </div>
                      )}

                      {ev.prizePool && (
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-yellow-400 font-bold">
                          <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                          <span className="truncate">Prize: {ev.prizePool}</span>
                        </div>
                      )}

                      {/* Render description ONLY from CMS */}
                      {eventDesc && (
                        <p className="text-[10px] sm:text-xs text-gray-300 line-clamp-2 pt-0.5 sm:pt-1 leading-relaxed">{eventDesc}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-3 sm:p-6 pt-0">
                    {ev.registrationLink ? (
                      <a
                        href={ev.registrationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl gradient-button text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-2 shadow-md"
                      >
                        <span>Register</span>
                        <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </a>
                    ) : (ev.formId || ev.registrationFormRef) ? (
                      <Link
                        to={`/forms/${ev.formId || ev.registrationFormRef}`}
                        className="w-full py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl gradient-button text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-2 shadow-md"
                      >
                        <span>Register</span>
                        <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </Link>
                    ) : isUpcoming ? (
                      <div className="w-full py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-2 border border-emerald-500/30">
                        <span className="truncate">{ev.status || 'Registration Open'}</span>
                      </div>
                    ) : (
                      <div className="w-full py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#18202c] text-gray-300 text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-2 border border-[#30363d]">
                        <span>Completed</span>
                      </div>
                    )}
                  </div>
                </TechCard>
              );
            })}
          </div>
        )}

      </main>

      {/* ─── EVENT DETAILS MODAL ────────────────────────────────────────── */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#121721] border border-[#30363d] rounded-2xl overflow-hidden shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 text-gray-300 hover:text-white hover:bg-black transition-colors"
            >
              ✕
            </button>

            {/* Banner Image */}
            <div className="h-56 sm:h-64 relative overflow-hidden bg-[#0d1117]">
              <img
                src={selectedEvent.banner || selectedEvent.image || selectedEvent.thumbnailUrl || selectedEvent.thumbnail?.url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'}
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#0a0d12]/90 text-emerald-400 border border-emerald-500/40">
                {selectedEvent.category || selectedEvent.status || 'Event Details'}
              </span>
            </div>

            {/* Details Content */}
            <div className="p-6 space-y-4 pt-0">
              <div className="space-y-2">
                <span className="tech-eyebrow">EVENT DETAILS</span>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {selectedEvent.title || selectedEvent.name}
                </h2>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs font-mono">
                {selectedEvent.date && (
                  <div className="flex items-center gap-2 text-[#2f9e44] font-bold">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>{typeof selectedEvent.date === 'string' ? selectedEvent.date : new Date(selectedEvent.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
                {selectedEvent.venue && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="text-gray-400 font-bold">Venue:</span>
                    <span>{selectedEvent.venue}</span>
                  </div>
                )}
                {selectedEvent.speaker && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <UserCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Speaker: {selectedEvent.speaker}</span>
                  </div>
                )}
                {selectedEvent.partner && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Handshake className="w-4 h-4 text-[#06b6d4] flex-shrink-0" />
                    <span>Partner: {selectedEvent.partner}</span>
                  </div>
                )}
                {selectedEvent.prizePool && (
                  <div className="flex items-center gap-2 text-yellow-400 font-bold">
                    <Trophy className="w-4 h-4 flex-shrink-0" />
                    <span>Prize Pool: {selectedEvent.prizePool}</span>
                  </div>
                )}
              </div>

              {/* Full Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold text-gray-400 uppercase">About Event</h4>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                  {selectedEvent.description || selectedEvent.shortDescription || 'No detailed description available.'}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {selectedEvent.registrationLink ? (
                  <button
                    onClick={() =>
                      handleLinkAction(selectedEvent.registrationLink, {
                        navigate,
                        openEmbedModal: (url) =>
                          setEmbedModalState({
                            isOpen: true,
                            url,
                            title: selectedEvent.title || selectedEvent.name || 'Event Registration'
                          }),
                        title: selectedEvent.title || selectedEvent.name
                      })
                    }
                    className="w-full py-3 rounded-xl gradient-button text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <span>Register / Apply Now</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                ) : (selectedEvent.formId || selectedEvent.registrationFormRef) ? (
                  <Link
                    to={`/forms/${selectedEvent.formId || selectedEvent.registrationFormRef}`}
                    className="w-full py-3 rounded-xl gradient-button text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>Open Registration Form</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="w-full py-3 rounded-xl bg-[#18202c] text-white hover:bg-[#2f9e44] transition-colors text-xs font-bold border border-[#30363d]"
                  >
                    Close Window
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google / Microsoft Form Embed Modal */}
      <EmbedModal
        isOpen={embedModalState.isOpen}
        onClose={() => setEmbedModalState({ isOpen: false, url: '', title: '' })}
        url={embedModalState.url}
        title={embedModalState.title}
      />

      <Footer />
    </div>
  );
}
