import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Sparkles, ChevronRight, Mail, Linkedin, Instagram, Github,
  ShieldCheck, Users, Palette, Calendar, Megaphone, Share2, Camera, PenTool, Database, Terminal,
  Image as ImageIcon, Trophy, Code2, Bell, Pin, CheckCircle2, ExternalLink
} from 'lucide-react';

import api from '../../services/api';
import cacheService from '../../services/cacheService';
import LaunchCountdown from '../../components/common/LaunchCountdown';

// Shared Single Source of Truth Data Modules
import { MOCK_FACULTY } from '../../data/faculty';
import { MOCK_MANTRI_LIST } from '../../data/leadership';
import { MOCK_TEAMS } from '../../data/teams';
import { MOCK_EVENTS } from '../../data/events';
import { MOCK_GALLERY } from '../../data/gallery';

import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import InfiniteMarquee from '../../components/common/InfiniteMarquee';
import Hero3DVisual from '../../components/common/Hero3DVisual';
import GalleryLightbox from '../../components/common/GalleryLightbox';
import TechCard from '../../components/common/TechCard';
import CampusMantriBadge from '../../components/common/CampusMantriBadge';

// Team Icon Mapper
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

export default function Home() {
  // Launch Countdown State
  const [launchConfig, setLaunchConfig] = useState({ enabled: false, duration: 7, replayMode: 'first_visit' });
  const [showLaunch, setShowLaunch] = useState(false);

  const [liveMantris, setLiveMantris] = useState(() => {
    const cached = cacheService.get('mantri');
    return cached?.data || [];
  });

  const [liveTeams, setLiveTeams] = useState(() => {
    const cached = cacheService.get('teams');
    return cached?.data || [];
  });

  const [liveFaculty, setLiveFaculty] = useState(() => {
    const cached = cacheService.get('faculty');
    return cached?.data || [];
  });

  const [liveEvents, setLiveEvents] = useState(() => {
    const cached = cacheService.get('events');
    return cached?.data || [];
  });
  const [selectedEventModal, setSelectedEventModal] = useState(null);
  const [announcements, setAnnouncements] = useState(() => {
    const cached = cacheService.get('announcements');
    return cached?.data || [];
  });

  useEffect(() => {
    // Subscribe to cache updates (realtime sync when admin mutates mantri/teams/faculty/events/announcements)
    const unsubMantri = cacheService.subscribe('mantri', (data) => {
      if (Array.isArray(data)) setLiveMantris(data);
    });
    const unsubTeams = cacheService.subscribe('teams', (data) => {
      if (Array.isArray(data)) setLiveTeams(data);
    });
    const unsubFaculty = cacheService.subscribe('faculty', (data) => {
      if (Array.isArray(data)) setLiveFaculty(data);
    });
    const unsubEvents = cacheService.subscribe('events', (data) => {
      if (Array.isArray(data)) setLiveEvents(data);
    });
    const unsubAnn = cacheService.subscribe('announcements', (data) => {
      if (Array.isArray(data)) setAnnouncements(data);
    });

    // Independent background revalidations
    cacheService.dedupe('mantri', () => api.get('/mantri'))
      .then(res => {
        const data = res.data?.data || [];
        if (data.length > 0) {
          setLiveMantris(data);
          cacheService.set('mantri', data);
        }
      })
      .catch(err => console.warn('[Home] Background mantri sync error:', err));

    cacheService.dedupe('teams', () => api.get('/teams'))
      .then(res => {
        const data = res.data?.data || [];
        if (data.length > 0) {
          setLiveTeams(data);
          cacheService.set('teams', data);
        }
      })
      .catch(err => console.warn('[Home] Background teams sync error:', err));

    cacheService.dedupe('faculty', () => api.get('/faculty'))
      .then(res => {
        const data = res.data?.data || [];
        if (data.length > 0) {
          setLiveFaculty(data);
          cacheService.set('faculty', data);
        }
      })
      .catch(err => console.warn('[Home] Background faculty sync error:', err));

    cacheService.dedupe('events', () => api.get('/events'))
      .then(res => {
        const data = res.data?.data || [];
        setLiveEvents(data);
        cacheService.set('events', data);
      })
      .catch(err => console.warn('[Home] Background events sync error:', err));

    cacheService.dedupe('announcements', () => api.get('/announcements'))
      .then(res => {
        const data = res.data?.data || [];
        setAnnouncements(data);
        cacheService.set('announcements', data);
      })
      .catch(err => console.warn('[Home] Background announcements sync error:', err));

    // Check Launch Countdown (Only for visitors when enabled by Admin)
    try {
      cacheService.dedupe('launch_settings', () => api.get('/settings/launch'))
        .then(res => {
          const data = res.data?.data;
          if (data && data.enabled === true) {
            const isSessionMode = data.replayMode === 'session';
            const alreadySeen = isSessionMode
              ? sessionStorage.getItem('gfg_launch_seen')
              : localStorage.getItem('gfg_launch_seen');

            if (alreadySeen !== 'true') {
              setLaunchConfig({
                enabled: true,
                duration: [5, 7, 10].includes(data.duration) ? data.duration : 7,
                replayMode: isSessionMode ? 'session' : 'first_visit'
              });
              setShowLaunch(true);
            }
          }
        })
        .catch(err => {
          // Fail silently, load website normally
          console.warn('[Home] Launch setting query skipped:', err.message);
        });
    } catch (e) {}

    return () => {
      unsubMantri();
      unsubTeams();
      unsubFaculty();
      unsubEvents();
      unsubAnn();
    };
  }, []);

  const normalizePerson = (p, fallbackTitle = 'Member') => {
    if (!p) return null;
    const bioText = p.bio || p.about || p.message || p.memberRef?.bio || p.memberRef?.about || 'GeeksforGeeks Campus Body Member';
    const linkedinVal = p.linkedin || p.socialLinks?.linkedin || p.socials?.linkedin || p.memberRef?.linkedin || p.memberRef?.socialLinks?.linkedin;
    const githubVal = p.github || p.socialLinks?.github || p.socials?.github || p.memberRef?.github || p.memberRef?.socialLinks?.github;
    const instagramVal = p.instagram || p.socialLinks?.instagram || p.socials?.instagram || p.memberRef?.instagram || p.memberRef?.socialLinks?.instagram;
    const emailVal = p.email || p.userRef?.email || p.memberRef?.email;

    return {
      _id: p._id || p.id || String(Math.random()),
      name: p.name || p.fullName || p.memberRef?.name || 'Member',
      username: p.username || p.userRef?.username || p.memberRef?.username || (p.name || 'user').toLowerCase().replace(/\s+/g, ''),
      photo: p.photo || p.userRef?.avatar || p.memberRef?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      title: p.title || p.role || p.memberRef?.role || fallbackTitle,
      role: p.role || p.title || p.memberRef?.role || fallbackTitle,
      message: bioText,
      bio: bioText,
      about: bioText,
      imagePosition: p.imagePosition || 'center 50%',
      linkedin: linkedinVal,
      github: githubVal,
      instagram: instagramVal,
      socials: {
        email: emailVal,
        linkedin: linkedinVal,
        github: githubVal,
        instagram: instagramVal
      }
    };
  };

  // Determine current live Campus Mantri (prefer isCurrent: true, then newest session)
  const effectiveMantris = liveMantris.length > 0 ? liveMantris : MOCK_MANTRI_LIST;
  const currentMantriRaw = effectiveMantris.find(m => m.isCurrent) || effectiveMantris[0];
  const currentMantri = currentMantriRaw ? {
    _id: currentMantriRaw._id,
    name: currentMantriRaw.memberRef?.name || currentMantriRaw.name,
    username: currentMantriRaw.memberRef?.username || currentMantriRaw.username,
    photo: currentMantriRaw.memberRef?.photo || currentMantriRaw.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    about: currentMantriRaw.about || currentMantriRaw.memberRef?.bio || currentMantriRaw.memberRef?.about || 'Leading community initiatives and technical growth.',
    session: currentMantriRaw.session || currentMantriRaw.tenure || '2025–2026',
    imagePosition: currentMantriRaw.imagePosition || 'center top',
    socials: currentMantriRaw.memberRef?.socials || {
      email: currentMantriRaw.memberRef?.email || currentMantriRaw.email,
      linkedin: currentMantriRaw.memberRef?.linkedin || currentMantriRaw.linkedin,
      instagram: currentMantriRaw.memberRef?.instagram || currentMantriRaw.instagram,
      github: currentMantriRaw.memberRef?.github || currentMantriRaw.github
    }
  } : null;

  // Determine live teams list (excluding Community Lead as it's prominently highlighted in Leadership section)
  const effectiveTeams = liveTeams.length > 0 ? liveTeams : MOCK_TEAMS;
  const teamsList = effectiveTeams
    .filter(t => !t.name?.toLowerCase().includes('community'))
    .map(t => {
      const memberRefs = Array.isArray(t.memberRefs) ? t.memberRefs : [];
      return {
        _id: t._id,
        name: t.name,
        icon: t.icon,
        description: t.description,
        lead: normalizePerson(t.lead || t.leadRef, 'Lead'),
        coLead: normalizePerson(t.coLead || t.coLeadRef, 'Co-Lead'),
        members: memberRefs.map(m => normalizePerson(m, 'Member')).filter(Boolean)
      };
    });

  // Domain Lead Role Label Resolver
  const getDomainRoleTitles = (teamName = '') => {
    if (/media team/i.test(teamName)) return { leadRole: 'Media Lead', coLeadRole: 'Media Co-Lead' };
    if (/editorial/i.test(teamName)) return { leadRole: 'Editorial Lead', coLeadRole: 'Editorial Co-Lead' };
    if (/data\s*&\s*form/i.test(teamName)) return { leadRole: 'Data & Form Lead', coLeadRole: 'Data & Form Co-Lead' };
    if (/design|creative/i.test(teamName)) return { leadRole: 'Design Lead', coLeadRole: 'Design Co-Lead' };
    if (/tech/i.test(teamName)) return { leadRole: 'Technical Lead', coLeadRole: 'Technical Co-Lead' };
    if (/event|operation/i.test(teamName)) return { leadRole: 'Event Lead', coLeadRole: 'Event Co-Lead' };
    if (/pr|outreach/i.test(teamName)) return { leadRole: 'PR & Outreach Lead', coLeadRole: 'PR & Outreach Co-Lead' };
    if (/social/i.test(teamName)) return { leadRole: 'Social Media Lead', coLeadRole: 'Social Media Co-Lead' };
    if (/community/i.test(teamName)) return { leadRole: 'Community Lead', coLeadRole: 'Community Co-Lead' };
    return { leadRole: `${teamName} Lead`, coLeadRole: `${teamName} Co-Lead` };
  };

  // Assemble Infinite Leadership Showcase List
  const DOMAIN_LEADERSHIP_ORDER = [
    { key: 'community' },
    { key: 'design' },
    { key: 'event' },
    { key: 'pr' },
    { key: 'social' },
    { key: 'tech' },
    { key: 'media team' },
    { key: 'editorial' },
    { key: 'data' }
  ];

  const leadershipShowcaseList = [];

  DOMAIN_LEADERSHIP_ORDER.forEach(({ key }) => {
    const team = effectiveTeams.find(t => t.name && new RegExp(key, 'i').test(t.name));
    if (team) {
      const lead = normalizePerson(team.lead || team.leadRef, 'Lead');
      const coLead = normalizePerson(team.coLead || team.coLeadRef, 'Co-Lead');
      const { leadRole, coLeadRole } = getDomainRoleTitles(team.name);

      if (lead && lead.name) {
        leadershipShowcaseList.push({
          _id: `${team._id}-lead`,
          personId: lead._id,
          name: lead.name,
          username: lead.username,
          photo: lead.photo,
          imagePosition: lead.imagePosition || 'center 50%',
          roleTitle: leadRole,
          teamName: team.name,
          icon: team.icon,
          bio: lead.bio || lead.about || team.description || 'Dedicated to empowering the campus community with technical skills and opportunities.',
          linkedin: lead.linkedin,
          github: lead.github
        });
      }

      if (coLead && coLead.name) {
        leadershipShowcaseList.push({
          _id: `${team._id}-colead`,
          personId: coLead._id,
          name: coLead.name,
          username: coLead.username,
          photo: coLead.photo,
          imagePosition: coLead.imagePosition || 'center 50%',
          roleTitle: coLeadRole,
          teamName: team.name,
          icon: team.icon,
          bio: coLead.bio || coLead.about || team.description || 'Dedicated to empowering the campus community with technical skills and opportunities.',
          linkedin: coLead.linkedin,
          github: coLead.github
        });
      }
    }
  });

  // Mantri Selection
  const activeMantri = liveMantris.find(m => m.isCurrent) || liveMantris[0] || MOCK_MANTRI_LIST[0];

  // Faculty Coordinators
  const facultyList = (liveFaculty.length > 0 ? liveFaculty : MOCK_FACULTY).map(f => ({
    _id: f._id,
    name: f.name || f.memberRef?.name || 'Faculty Member',
    designation: f.designation,
    department: f.department || f.institution,
    institution: f.department || f.institution,
    photo: f.photo || f.memberRef?.photo,
    email: f.email || f.memberRef?.email,
    imagePosition: f.imagePosition || 'top'
  }));
  const facultyCoordinators = facultyList;

  const allEvents = liveEvents.length > 0 ? liveEvents : MOCK_EVENTS;
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

  const upcomingEvents = allEvents.filter(isUpcomingEvent);
  const pastEvents = allEvents.filter(isPastEvent);
  const galleryList = MOCK_GALLERY;

  const now = new Date();
  const isPublishedAndNotExpired = (a) => {
    const isPub = a.status === 'Published' || a.status === 'Active' || !a.status;
    const notExpired = !a.expiryDate && !a.expiresAt ? true : new Date(a.expiryDate || a.expiresAt) > now;
    return isPub && notExpired;
  };

  const activeAnnouncements = announcements.filter(isPublishedAndNotExpired);
  const pinnedAnnouncement = activeAnnouncements.find(a => a.isPinned);
  const latestAnnouncement = activeAnnouncements[0];

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const openLightbox = (index) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-100 flex flex-col font-sans overflow-x-hidden">
      {showLaunch && (
        <LaunchCountdown
          duration={launchConfig.duration}
          replayMode={launchConfig.replayMode}
          onComplete={() => setShowLaunch(false)}
        />
      )}

      <Navbar />

      <main className="flex-1">

        {/* ─── 1. HERO SECTION (2-COLUMN WITH 3D DEVELOPER SCENE) ───────────── */}
        <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-[#30363d]/50">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-[#2f9e44]/16 rounded-full blur-[140px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            
            {/* Left Column: Content & Identity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#121721] border border-[#2f9e44]/40 text-[#2f9e44] text-xs sm:text-sm font-bold tracking-wide shadow-lg shadow-green-950/40 tech-corner">
                <div className="h-6 bg-white px-2 py-0.5 rounded-lg flex items-center justify-center border border-[#2f9e44]/30 flex-shrink-0">
                  <img
                    src="/assets/gfg-official-logo.png"
                    alt="GeeksforGeeks Campus Body Logo"
                    style={{ height: '18px', width: 'auto' }}
                    className="h-4.5 max-h-5 w-auto object-contain"
                  />
                </div>
                <span className="font-mono">GeeksforGeeks Campus Body • Jamia Hamdard</span>
              </div>
              
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
                Learn. Build. Grow Together.
              </h1>

              <p className="text-lg sm:text-xl text-gray-400 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
                GeeksforGeeks Campus Body at Jamia Hamdard is a student-led tech community where students learn together, build projects, prepare for opportunities, and connect through workshops, events, hackathons, and peer learning.
              </p>

              <p className="text-xs sm:text-sm font-mono font-bold text-[#2f9e44] tracking-wider uppercase">
                Learn • Build • Collaborate • Grow
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link to="/events" className="w-full sm:w-auto px-8 py-4 rounded-xl gradient-button font-bold text-base flex items-center justify-center gap-3 shadow-lg shadow-[#2f9e44]/25">
                  Explore Events <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/community" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#121721] border border-[#30363d] hover:border-[#2f9e44]/60 font-semibold text-base text-gray-200 hover:text-white flex items-center justify-center gap-2 transition-all">
                  Join Community
                </Link>
              </div>
            </motion.div>

            {/* Right Column: 3D Tech Ecosystem Scene */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="hidden lg:flex lg:col-span-5 items-center justify-center"
            >
              <Hero3DVisual />
            </motion.div>

          </div>
        </section>

        {/* ─── 1.5. TOP PINNED ANNOUNCEMENT STRIP (HERO AREA) ────────────────────── */}
        {pinnedAnnouncement && (
          <section className="bg-gradient-to-r from-[#0a0d12] via-[#142e16] to-[#0a0d12] border-y border-[#2f9e44]/40 py-2.5 sm:py-3 px-4 sm:px-6 lg:px-8 shadow-xl relative z-20">
            {/* Desktop View (>= 640px) — UNCHANGED BASELINE */}
            <div className="hidden sm:flex max-w-7xl mx-auto items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-left">
                <span className="flex items-center gap-1.5 bg-[#2f9e44] text-white text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm flex-shrink-0">
                  <Pin className="w-3 h-3 fill-white" /> Pinned Bulletin
                </span>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-1">
                    {pinnedAnnouncement.title}
                  </h4>
                  <span className="hidden md:inline text-gray-300 text-xs truncate max-w-md">
                    — {pinnedAnnouncement.description}
                  </span>
                </div>
              </div>

              <button
                onClick={() =>
                  handleLinkAction(pinnedAnnouncement.linkUrl || '/community', {
                    navigate,
                    openEmbedModal: (url) => openEmbedModal(url, pinnedAnnouncement.title),
                    title: pinnedAnnouncement.title
                  })
                }
                className="flex items-center gap-1.5 font-bold text-xs text-[#2f9e44] hover:text-white flex-shrink-0 bg-white/10 hover:bg-[#2f9e44] px-3.5 py-1.5 rounded-lg border border-[#2f9e44]/40 transition-all shadow-sm cursor-pointer"
              >
                <span>{pinnedAnnouncement.linkLabel || (pinnedAnnouncement.linkUrl ? 'Apply Now' : 'View Community')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile View (< 640px) — Compact Horizontal Announcement Strip */}
            <div
              onClick={() =>
                handleLinkAction(pinnedAnnouncement.linkUrl || '/community', {
                  navigate,
                  openEmbedModal: (url) => openEmbedModal(url, pinnedAnnouncement.title),
                  title: pinnedAnnouncement.title
                })
              }
              className="sm:hidden flex items-start gap-2.5 text-left py-0.5 group cursor-pointer"
            >
              <div className="pt-0.5 flex-shrink-0 text-[#2f9e44]">
                <Pin className="w-4 h-4 fill-[#2f9e44]" />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <h4 className="font-bold text-white text-sm leading-snug group-hover:text-[#2f9e44] transition-colors">
                  {pinnedAnnouncement.title}
                </h4>
                {pinnedAnnouncement.description && (
                  <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed font-normal">
                    {pinnedAnnouncement.description}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ─── 2. FACULTY COORDINATORS (STATIC) ───────────────────────────── */}
        <section className="py-12 bg-[#121721]/60 border-b border-[#30363d] px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="tech-eyebrow">
                FACULTY GUIDANCE
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Faculty Guidance</h2>
              <p className="text-sm text-gray-400">Meet the faculty mentors who guide and support our campus community.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {facultyList.map((f) => (
                <TechCard key={f._id} className="p-6 flex items-center gap-6">
                  <img
                    src={f.photo}
                    alt={`${f.name}, Faculty Coordinator`}
                    loading="lazy"
                    style={{ objectPosition: f.imagePosition || 'top' }}
                    className="w-28 h-32 sm:w-32 sm:h-36 rounded-2xl object-cover border-2 border-[#2f9e44] flex-shrink-0 shadow-md"
                  />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#2f9e44] bg-[#2f9e44]/10 px-2.5 py-0.5 rounded border border-[#2f9e44]/30 inline-block">
                      Faculty Coordinator
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white truncate">{f.name}</h3>
                    <p className="text-xs font-semibold text-gray-300">{f.designation}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{f.department || f.institution}</p>
                    {f.email && (
                      <a href={`mailto:${f.email}`} className="text-[11px] text-[#2f9e44] hover:underline flex items-center gap-1 pt-1 truncate">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{f.email}</span>
                      </a>
                    )}
                  </div>
                </TechCard>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 3. CAMPUS MANTRI (CURRENT SPOTLIGHT) ─────────────────────────── */}
        {currentMantri && (
          <section className="py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <TechCard className="p-6 sm:p-10 lg:p-12 border-[#D4A72C]/40 bg-gradient-to-br from-[#181611] via-[#0a0d12] to-[#2b2413]/30 shadow-2xl shadow-[#D4A72C]/5 rounded-2xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center">
                  
                  {/* Photo & Gold Badge */}
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={currentMantri.photo}
                      alt={`${currentMantri.name}, Campus Mantri`}
                      loading="lazy"
                      style={{ objectPosition: currentMantri.imagePosition || 'center top' }}
                      className="w-32 h-36 sm:w-40 sm:h-44 rounded-2xl object-cover border-2 border-[#D4A72C] shadow-[0_0_15px_rgba(212,167,44,0.25)] flex-shrink-0"
                    />
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-3 sm:mt-4 leading-tight">{currentMantri.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <CampusMantriBadge
                        isCurrent={true}
                        session={currentMantri.tenure || currentMantri.session}
                        showSession={true}
                        size="normal"
                      />
                    </div>
                  </div>

                  {/* Vision & Links */}
                  <div className="md:col-span-2 space-y-4 sm:space-y-5 text-center md:text-left min-w-0">
                    <div>
                      <h4 className="text-lg sm:text-xl font-bold text-white">Campus Mantri Vision</h4>
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed italic mt-2 bg-[#0a0d12]/80 p-4 rounded-2xl border border-[#30363d]">
                        "{currentMantri.about}"
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[#30363d]">
                      {currentMantri.socials && (
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                          {currentMantri.socials.email && (
                            <a href={`mailto:${currentMantri.socials.email}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-300 hover:text-white flex items-center gap-1.5 bg-[#18202c] px-3 py-1.5 rounded-lg border border-[#30363d] transition-colors hover:bg-[#2f9e44]">
                              <Mail className="w-3.5 h-3.5 text-[#2f9e44]" /> Email
                            </a>
                          )}
                          {currentMantri.socials.linkedin && (
                            <a href={currentMantri.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-300 hover:text-white flex items-center gap-1.5 bg-[#18202c] px-3 py-1.5 rounded-lg border border-[#30363d] transition-colors hover:bg-[#0077b5]">
                              <Linkedin className="w-3.5 h-3.5 text-[#0077b5]" /> LinkedIn
                            </a>
                          )}
                          {currentMantri.socials.instagram && (
                            <a href={currentMantri.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-300 hover:text-white flex items-center gap-1.5 bg-[#18202c] px-3 py-1.5 rounded-lg border border-[#30363d] transition-colors hover:bg-[#e1306c]">
                              <Instagram className="w-3.5 h-3.5 text-[#e1306c]" /> Instagram
                            </a>
                          )}
                        </div>
                      )}

                      {(() => {
                        const currentProfileSlug =
                          currentMantri.username ||
                          currentMantri.memberRef?.username ||
                          currentMantri.memberRef?._id ||
                          currentMantri.memberRef ||
                          currentMantri._id;

                        return (
                          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5">
                            {currentProfileSlug && (
                              <Link
                                to={`/profile/${currentProfileSlug}`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all bg-[#D4A72C]/15 hover:bg-[#D4A72C] text-[#E6B83F] hover:text-black border border-[#D4A72C]/50 shadow-sm shadow-[#D4A72C]/10 group"
                              >
                                <span>View Profile</span>
                                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </Link>
                            )}

                            <Link
                              to="/campus-mantri"
                              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-gray-300 hover:text-white transition-colors bg-[#18202c] hover:bg-[#21262d] px-4 py-2 rounded-xl border border-[#30363d]"
                            >
                              <span>Campus Mantri History</span>
                              <ArrowRight className="w-3.5 h-3.5 text-[#2f9e44]" />
                            </Link>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                </div>
              </TechCard>
            </div>
          </section>
        )}

        {/* ─── 3.5. LEADERSHIP SHOWCASE (INFINITE HORIZONTAL CAROUSEL) ──────── */}
        {leadershipShowcaseList && leadershipShowcaseList.length > 0 && (
          <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div>
                <span className="tech-eyebrow">LEADERSHIP SHOWCASE</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Campus Leadership</h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Meet the student leads guiding our active domain initiatives.</p>
              </div>
              <Link to="/teams" className="text-xs font-bold text-[#2f9e44] hover:underline flex items-center gap-1.5 flex-shrink-0 bg-[#2f9e44]/10 hover:bg-[#2f9e44]/20 border border-[#2f9e44]/30 px-3 py-1.5 rounded-xl transition-all">
                <span>View All Teams</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Continuous Seamless Infinite Loop Marquee (Leftward continuous motion) */}
            <InfiniteMarquee direction="left" duration={45} gapClass="gap-5 sm:gap-6">
              {leadershipShowcaseList.map((leader, idx) => {
                const IconComponent = getTeamIcon(leader.icon);

                return (
                  <TechCard
                    key={`${leader._id}-${idx}`}
                    className="w-[82vw] sm:w-[320px] md:w-[500px] lg:w-[540px] flex-shrink-0 snap-start p-5 sm:p-6 border-[#2f9e44]/40 bg-gradient-to-br from-[#121721] via-[#0a0d12] to-[#142e16] flex flex-col justify-between space-y-4 shadow-xl rounded-2xl group transition-all"
                  >
                    {/* Domain Header: Team Icon + EXACT Team Name */}
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#30363d]/80">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-xl bg-[#2f9e44]/15 text-[#2f9e44] border border-[#2f9e44]/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-white truncate leading-tight group-hover:text-[#2f9e44] transition-colors">
                          {leader.teamName}
                        </h3>
                      </div>

                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase flex-shrink-0 ${leader.isLead ? 'bg-[#2f9e44] text-white' : 'bg-[#18202c] text-gray-300 border border-[#30363d]'}`}>
                        {leader.isLead ? 'Lead' : 'Co-Lead'}
                      </span>
                    </div>

                    {/* Responsive Member Layout: PORTRAIT on Mobile (<md) → LANDSCAPE on Laptop/Desktop (>=md) */}
                    <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 md:gap-4 lg:gap-5 min-w-0 flex-1">
                      {/* Member Portrait (Centered on Mobile, Left-aligned on Desktop) */}
                      <img
                        src={leader.photo}
                        alt={`${leader.name}, ${leader.roleTitle}`}
                        loading="lazy"
                        style={{ objectPosition: leader.imagePosition || 'center 50%' }}
                        className={`w-28 h-32 sm:w-32 sm:h-36 md:w-32 md:h-38 lg:w-34 lg:h-40 rounded-2xl object-cover border-2 shadow-xl flex-shrink-0 mx-auto md:mx-0 ${leader.isLead ? 'border-[#2f9e44]' : 'border-gray-600'}`}
                      />

                      {/* Member Details + Bio (Below image on Mobile, Right-aligned on Desktop) */}
                      <div className="min-w-0 flex-1 flex flex-col justify-between space-y-2.5 w-full">
                        <div>
                          <h4 className="text-base sm:text-lg md:text-xl font-bold text-white truncate leading-tight">
                            {leader.name}
                          </h4>
                          <p className="text-[11px] font-mono text-gray-400 truncate mt-0.5">@{leader.username || 'user'}</p>

                          <div className="mt-1.5">
                            <span className="text-[10px] sm:text-xs font-mono font-bold text-[#2f9e44] uppercase tracking-wider bg-[#2f9e44]/15 border border-[#2f9e44]/30 px-2.5 py-0.5 rounded-md inline-block">
                              {leader.roleTitle}
                            </span>
                          </div>
                        </div>

                        {/* Vision / Bio Quote Container (Constrained, Non-clipped) */}
                        <div className="bg-[#0a0d12]/90 p-2.5 sm:p-3 rounded-xl border border-[#30363d] overflow-hidden">
                          <p className="text-xs text-gray-300 leading-relaxed italic line-clamp-3">
                            "{leader.bio}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Socials & Profile Action (Clean bottom rail) */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#30363d]/80">
                      {leader.socials ? (
                        <div className="flex items-center gap-1.5">
                          {leader.socials.email && (
                            <a href={`mailto:${leader.socials.email}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-[#18202c] text-gray-300 hover:text-white hover:bg-[#2f9e44] transition-colors border border-[#30363d]" title="Email">
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {leader.socials.linkedin && (
                            <a href={leader.socials.linkedin.startsWith('http') ? leader.socials.linkedin : `https://linkedin.com/in/${leader.socials.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-[#18202c] text-gray-300 hover:text-white hover:bg-[#0077b5] transition-colors border border-[#30363d]" title="LinkedIn">
                              <Linkedin className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {leader.socials.instagram && (
                            <a href={leader.socials.instagram.startsWith('http') ? leader.socials.instagram : `https://instagram.com/${leader.socials.instagram}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-[#18202c] text-gray-300 hover:text-white hover:bg-[#e1306c] transition-colors border border-[#30363d]" title="Instagram">
                              <Instagram className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {leader.socials.github && (
                            <a href={leader.socials.github.startsWith('http') ? leader.socials.github : `https://github.com/${leader.socials.github}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-[#18202c] text-gray-300 hover:text-white hover:bg-gray-700 transition-colors border border-[#30363d]" title="GitHub">
                              <Github className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ) : <div />}

                      <Link
                        to={leader.profileUrl || '/teams'}
                        className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#2f9e44] hover:text-white transition-colors bg-[#2f9e44]/10 hover:bg-[#2f9e44] px-3 py-1.5 rounded-xl border border-[#2f9e44]/30 ml-auto"
                      >
                        <span>Profile</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </TechCard>
                );
              })}
            </InfiniteMarquee>
          </section>
        )}



        {/* ─── 5. UPCOMING EVENTS (LIVE TECH SESSIONS) ────────────────────── */}
        {upcomingEvents && upcomingEvents.length > 0 && (
          <section className="py-10 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <span className="tech-eyebrow">UPCOMING EVENTS</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Upcoming Events</h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Workshops, hackathons, and peer learning sessions coming up.</p>
              </div>
              <Link to="/events" className="text-xs font-bold text-[#2f9e44] hover:underline flex items-center gap-1 flex-shrink-0">
                View All Events <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Marquee Container: LEFT → RIGHT */}
            <InfiniteMarquee direction="right" duration={30} gapClass="gap-4 sm:gap-6">
              {upcomingEvents.map((ev) => {
                const upTitle = ev.title || ev.name;
                const upBanner = ev.banner || ev.image || ev.thumbnailUrl || ev.thumbnail?.url || ev.thumbnail;
                const upDateStr = ev.date
                  ? (typeof ev.date === 'string' ? ev.date : new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }))
                  : null;
                const upDesc = ev.description || ev.shortDescription;
                return (
                  <TechCard
                    key={ev._id || ev.legacyId}
                    className="w-[84vw] sm:w-[350px] flex-shrink-0 snap-start border-[#30363d] hover:border-[#2f9e44] flex flex-col justify-between group bg-[#121721] shadow-xl"
                  >
                    <div>
                      <div className="h-36 sm:h-44 relative overflow-hidden bg-[#0d1117]">
                        <img
                          src={upBanner}
                          alt={upTitle}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'; }}
                        />
                        {/* Live Registration Badge */}
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-[#0a0d12]/90 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-lg">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>{ev.status || 'REGISTRATION OPEN'}</span>
                        </span>
                      </div>

                      <div className="p-4 sm:p-5 space-y-1.5 sm:space-y-2">
                        <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-[#2f9e44] transition-colors leading-snug">{upTitle}</h3>
                        {upDateStr && <p className="text-xs text-[#2f9e44] font-semibold font-mono">{upDateStr}</p>}
                        {upDesc && <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">{upDesc}</p>}
                        {ev.partner && (
                          <p className="text-[11px] text-gray-300 font-medium truncate">Partner: {ev.partner}</p>
                        )}
                        {ev.prizePool && (
                          <p className="text-[11px] text-yellow-400 font-bold flex items-center gap-1">
                            <Trophy className="w-3 h-3" /> Prize Pool: {ev.prizePool}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 pt-0">
                      <button
                        onClick={() => setSelectedEventModal(ev)}
                        className="w-full py-2 sm:py-2.5 rounded-xl bg-[#18202c] text-white hover:bg-[#2f9e44] transition-colors text-xs font-bold flex items-center justify-center gap-2 border border-[#30363d]"
                      >
                        Event Details <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TechCard>
                );
              })}
            </InfiniteMarquee>
          </section>
        )}

        {/* ─── 6. PAST EVENTS (DIGITAL ARCHIVE AUTO-SCROLL WITH THUMBNAILS) ── */}
        {pastEvents && pastEvents.length > 0 && (
          <section className="py-10 sm:py-12 bg-[#121721]/30 border-t border-[#30363d] px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <span className="tech-eyebrow">PAST EVENTS</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Past Events</h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Highlights from our past technical sessions and workshops.</p>
              </div>
              <Link to="/events" className="text-xs font-bold text-[#2f9e44] hover:underline flex items-center gap-1 flex-shrink-0">
                Explore Past Events <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Auto-Scroll Marquee Container: RIGHT → LEFT */}
            <InfiniteMarquee direction="left" duration={35} gapClass="gap-4 sm:gap-6">
              {pastEvents.map((ev) => {
                // SOURCE OF TRUTH: MongoDB / CMS fields — DO NOT substitute with generic text
                const pastTitle = ev.title || ev.name;
                const pastThumb = ev.thumbnail?.url || ev.thumbnail || ev.thumbnailUrl || ev.banner || ev.image;
                const pastDateStr = ev.date
                  ? (typeof ev.date === 'string' ? ev.date : new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }))
                  : null;
                // Only render actual description from CMS — NEVER a generic replacement
                const pastDesc = ev.description || ev.shortDescription || null;

                return (
                  <TechCard
                    key={ev._id || ev.legacyId}
                    className="w-[84vw] sm:w-[350px] flex-shrink-0 snap-start p-0 bg-[#0a0d12] border-[#30363d] overflow-hidden rounded-2xl flex flex-col justify-between group shadow-xl hover:border-[#2f9e44]/60 transition-all duration-300"
                  >
                    <div>
                      {/* Thumbnail Image */}
                      <div className="h-40 sm:h-48 relative overflow-hidden bg-[#18202c]">
                        <img
                          src={pastThumb}
                          alt={pastTitle}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80';
                          }}
                        />

                        {/* Completed Badge */}
                        <span className="absolute top-3 right-3 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#2f9e44] text-white px-2.5 py-0.5 rounded-md shadow-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>

                        {ev.category && (
                          <span className="absolute top-3 left-3 text-[10px] font-mono uppercase font-bold text-gray-200 bg-[#0a0d12]/80 backdrop-blur-md px-2.5 py-0.5 rounded border border-gray-700/50">
                            {ev.category}
                          </span>
                        )}
                      </div>

                      {/* CMS Content — exact MongoDB fields only */}
                      <div className="p-4 sm:p-5 space-y-2">
                        <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-[#2f9e44] transition-colors leading-snug">
                          {pastTitle}
                        </h3>

                        {pastDateStr && (
                          <div className="flex items-center gap-2 text-xs font-mono text-[#2f9e44] font-semibold">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{pastDateStr}</span>
                          </div>
                        )}

                        {/* Render description ONLY if it exists in CMS — no generic fallback */}
                        {pastDesc && (
                          <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">{pastDesc}</p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 pt-0">
                      <button
                        onClick={() => setSelectedEventModal(ev)}
                        className="w-full py-2 sm:py-2.5 rounded-xl bg-[#18202c] text-white hover:bg-[#2f9e44] transition-colors text-xs font-bold flex items-center justify-center gap-2 border border-[#30363d]"
                      >
                        View Event <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TechCard>
                );
              })}
            </InfiniteMarquee>
          </section>
        )}

        {/* ─── 7. GALLERY (SPATIAL TECH MARQUEE + LIGHTBOX) ───────────────── */}
        {galleryList && galleryList.length > 0 && (
          <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-[#30363d] space-y-6 relative overflow-hidden bg-gradient-to-b from-[#0a0d12] via-[#121721]/40 to-[#0a0d12]">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <span className="tech-eyebrow">OUR COMMUNITY</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Our Community</h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">The people, projects, events, and moments that shape GFG Campus Body at Jamia Hamdard.</p>
              </div>
              <Link to="/gallery" className="text-xs font-bold text-[#2f9e44] hover:underline flex items-center gap-1">
                View Full Gallery ({galleryList.length} Unique Photos) <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-5">
              {/* Row 1 Marquee: RIGHT → LEFT */}
              <InfiniteMarquee direction="left" duration={45} gapClass="gap-5">
                {galleryList.slice(0, 24).map((g, idx) => {
                  const widths = ['w-64', 'w-80', 'w-72', 'w-84'];
                  const cardWidth = widths[idx % widths.length];

                  return (
                    <div
                      key={g._id}
                      onClick={() => openLightbox(idx)}
                      className={`${cardWidth} h-44 rounded-2xl overflow-hidden border border-[#30363d] group flex-shrink-0 shadow-lg relative cursor-pointer card-3d-hover tech-corner`}
                    >
                      <img
                        src={g.url}
                        alt={g.title || 'Community Moment'}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                        <span className="text-xs font-bold text-white truncate">{g.title || 'GFG Campus Moment'}</span>
                        <span className="text-[10px] text-[#2f9e44] font-semibold">{g.album || 'Jamia Hamdard'}</span>
                      </div>
                    </div>
                  );
                })}
              </InfiniteMarquee>

              {/* Row 2 Marquee: LEFT → RIGHT */}
              <InfiniteMarquee direction="right" duration={52} gapClass="gap-5" className="opacity-95">
                {galleryList.slice(24, 48).map((g, idx) => {
                  const realIdx = idx + 24;
                  const widths = ['w-72', 'w-64', 'w-84', 'w-80'];
                  const cardWidth = widths[idx % widths.length];

                  return (
                    <div
                      key={g._id}
                      onClick={() => openLightbox(realIdx)}
                      className={`${cardWidth} h-44 rounded-2xl overflow-hidden border border-[#30363d] group flex-shrink-0 shadow-lg relative cursor-pointer card-3d-hover tech-corner`}
                    >
                      <img
                        src={g.url}
                        alt={g.title || 'Community Moment'}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                        <span className="text-xs font-bold text-white truncate">{g.title || 'GFG Campus Moment'}</span>
                        <span className="text-[10px] text-[#2f9e44] font-semibold">{g.album || 'Jamia Hamdard'}</span>
                      </div>
                    </div>
                  );
                })}
              </InfiniteMarquee>
            </div>
          </section>
        )}

        {/* ─── 8. LATEST ANNOUNCEMENTS BANNER (PREMIUM COMPACT BULLETIN) ─── */}
        {latestAnnouncement && (
          <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="max-w-5xl mx-auto relative z-10">
              
              {/* Premium Bulletin Container */}
              <div className="relative rounded-2xl bg-gradient-to-br from-[#071511] via-[#0B211D] to-[#12281e] border border-[#2f9e44]/35 hover:border-[#2f9e44]/60 transition-all duration-300 p-6 sm:p-8 shadow-2xl space-y-5 overflow-hidden group">
                
                {/* Subtle Ambient Radial Glow */}
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#2f9e44]/12 rounded-full blur-3xl pointer-events-none" />

                {/* Header Metadata Bar */}
                <div className="flex items-center justify-between gap-3 text-xs font-mono relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#2f9e44]/15 border border-[#2f9e44]/40 text-[#2f9e44] text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2f9e44] animate-pulse" />
                      📌 {latestAnnouncement.type?.toUpperCase() || 'ANNOUNCEMENT'}
                    </span>
                    <span className="text-[10px] text-gray-400 hidden sm:inline">• Official Bulletin</span>
                  </div>

                  <span className="text-[11px] text-gray-400">
                    {latestAnnouncement.publishDate || latestAnnouncement.createdAt
                      ? new Date(latestAnnouncement.publishDate || latestAnnouncement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Recently updated'}
                  </span>
                </div>

                {/* Body Content: Title & Clamped Description */}
                <div className="space-y-2 relative z-10">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug group-hover:text-[#2f9e44] transition-colors">
                    {latestAnnouncement.title}
                  </h3>
                  {latestAnnouncement.description && (
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal line-clamp-2 sm:line-clamp-3">
                      {latestAnnouncement.description}
                    </p>
                  )}
                </div>

                {/* Footer Action Area (GUARANTEED VISIBILITY & Touch Area) */}
                <div className="pt-4 border-t border-[#30363d]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>GeeksforGeeks Campus Body</span>
                  </div>

                  <button
                    onClick={() =>
                      handleLinkAction(latestAnnouncement.linkUrl || '/community', {
                        navigate,
                        openEmbedModal: (url) => openEmbedModal(url, latestAnnouncement.title)
                      })
                    }
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#18261e] hover:bg-[#2f9e44] text-white text-xs font-bold font-mono border border-[#2f9e44]/50 flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                    aria-label={`${latestAnnouncement.linkLabel || 'Stay tuned'} - ${latestAnnouncement.title}`}
                  >
                    <span>{latestAnnouncement.linkLabel || (latestAnnouncement.linkUrl ? 'Stay tuned!' : 'Explore Community')}</span>
                    {latestAnnouncement.linkUrl && (latestAnnouncement.linkUrl.startsWith('http') || latestAnnouncement.linkUrl.includes('forms')) ? (
                      <ExternalLink className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

              </div>

            </div>
          </section>
        )}

        {/* ─── 9. JOIN COMMUNITY (HIGH-IMPACT DEVELOPER CTA) ──────────────── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <TechCard className="max-w-5xl mx-auto p-10 sm:p-14 border-[#2f9e44]/50 bg-gradient-to-br from-[#121721] via-[#0a0d12] to-[#142e16] text-center space-y-6 shadow-2xl">
            <span className="tech-eyebrow font-mono">
              <Code2 className="w-3.5 h-3.5" /> JOIN THE COMMUNITY
            </span>
            
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Join the Community
            </h2>
            
            <p className="text-lg font-bold text-[#2f9e44] font-mono">
              Learn • Build • Collaborate • Grow
            </p>

            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Connect with fellow student developers, participate in hands-on workshops, hackathons, and peer learning at Jamia Hamdard.
            </p>

            <div className="pt-4 flex justify-center">
              <Link to="/community" className="px-8 py-4 rounded-xl gradient-button font-bold text-base flex items-center gap-3 shadow-xl shadow-[#2f9e44]/30">
                Join Community <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </TechCard>
        </section>

      </main>

      {/* ─── EVENT DETAILS MODAL ────────────────────────────────────────── */}
      {selectedEventModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedEventModal(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#121721] border border-[#30363d] rounded-2xl overflow-hidden shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedEventModal(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 text-gray-300 hover:text-white hover:bg-black transition-colors"
            >
              ✕
            </button>

            {/* Banner Image */}
            <div className="h-56 sm:h-64 relative overflow-hidden bg-[#0d1117]">
              <img
                src={selectedEventModal.banner || selectedEventModal.image || selectedEventModal.thumbnailUrl || selectedEventModal.thumbnail?.url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'}
                alt={selectedEventModal.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#0a0d12]/90 text-emerald-400 border border-emerald-500/40">
                {selectedEventModal.category || selectedEventModal.status || 'Event Details'}
              </span>
            </div>

            {/* Details Content */}
            <div className="p-6 space-y-4 pt-0">
              <div className="space-y-2">
                <span className="tech-eyebrow">EVENT DETAILS</span>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {selectedEventModal.title || selectedEventModal.name}
                </h2>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs font-mono">
                {selectedEventModal.date && (
                  <div className="flex items-center gap-2 text-[#2f9e44] font-bold">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>{typeof selectedEventModal.date === 'string' ? selectedEventModal.date : new Date(selectedEventModal.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
                {selectedEventModal.venue && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="text-gray-400 font-bold">Venue:</span>
                    <span>{selectedEventModal.venue}</span>
                  </div>
                )}
                {selectedEventModal.speaker && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <UserCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Speaker: {selectedEventModal.speaker}</span>
                  </div>
                )}
                {selectedEventModal.partner && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Handshake className="w-4 h-4 text-[#06b6d4] flex-shrink-0" />
                    <span>Partner: {selectedEventModal.partner}</span>
                  </div>
                )}
                {selectedEventModal.prizePool && (
                  <div className="flex items-center gap-2 text-yellow-400 font-bold">
                    <Trophy className="w-4 h-4 flex-shrink-0" />
                    <span>Prize Pool: {selectedEventModal.prizePool}</span>
                  </div>
                )}
              </div>

              {/* Full Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold text-gray-400 uppercase">About Event</h4>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                  {selectedEventModal.description || selectedEventModal.shortDescription || 'No detailed description available.'}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex gap-3">
                {selectedEventModal.registrationLink ? (
                  <a
                    href={selectedEventModal.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-xl gradient-button text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>Register / Apply Now</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (selectedEventModal.formId || selectedEventModal.registrationFormRef) ? (
                  <Link
                    to={`/forms/${selectedEventModal.formId || selectedEventModal.registrationFormRef}`}
                    className="flex-1 py-3 rounded-xl gradient-button text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>Open Registration Form</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                ) : null}

                <Link
                  to="/events"
                  className="flex-1 py-3 rounded-xl bg-[#18202c] text-white hover:bg-[#2f9e44] transition-colors text-xs font-bold flex items-center justify-center gap-2 border border-[#30363d]"
                >
                  View All Events <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      <GalleryLightbox
        images={galleryList}
        currentIndex={activeImageIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onPrev={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryList.length - 1))}
        onNext={() => setActiveImageIndex((prev) => (prev < galleryList.length - 1 ? prev + 1 : 0))}
      />

      {/* ─── 10. FOOTER (STATIC) ────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
