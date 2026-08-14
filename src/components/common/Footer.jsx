import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Instagram, Linkedin, Mail, MapPin, ArrowRight, ArrowUpRight,
  ShieldCheck, X, ChevronDown, ChevronUp, Users, Calendar,
  BookOpen, Image as ImageIcon, Sparkles, MessageSquare, Trophy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Footer() {
  let user = null;
  let openAuthModal = null;
  try {
    const auth = useAuth();
    user = auth?.user;
    openAuthModal = auth?.openAuthModal;
  } catch (err) {
    // Optional Auth Context fallback
  }

  // Modals state
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  // Mobile Accordion state
  const [expandedSection, setExpandedSection] = useState(null);
  const toggleSection = (sec) => {
    setExpandedSection(expandedSection === sec ? null : sec);
  };

  return (
    <footer className="bg-[#0b1015] border-t border-[#30363d] pt-12 sm:pt-16 pb-8 text-gray-300 font-sans relative overflow-hidden z-10">

      {/* Background Subtle Tech Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">

        {/* ─── LAYER 1: LARGE COMMUNITY CTA STATEMENT PANEL ─────────────────── */}
        <div className="rounded-2xl bg-gradient-to-r from-[#121721] via-[#0f141d] to-[#121c15] border border-[#30363d] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#2f9e44]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#2f9e44]/10 border border-[#2f9e44]/30 text-[#2f9e44] text-[11px] font-mono font-bold tracking-wider uppercase">
                <Sparkles className="w-3 h-3 text-[#2f9e44]" />
                <span>GeeksforGeeks Campus Body • Jamia Hamdard</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Learn together.<br />
                <span className="text-[#2f9e44]">Build what matters.</span>
              </h2>

              <p className="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
                Connect with students who code, build projects, prepare for opportunities, and grow together at Jamia Hamdard.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  to="/community"
                  className="px-6 py-3 rounded-xl bg-[#2f9e44] hover:bg-[#2b8a3e] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#2f9e44]/20 active:scale-98 min-h-[44px]"
                >
                  <span>Explore Community</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/events"
                  className="px-6 py-3 rounded-xl bg-[#161b22] hover:bg-[#1f2633] text-gray-200 hover:text-white border border-[#30363d] hover:border-[#2f9e44]/50 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all min-h-[44px]"
                >
                  <span>View Events</span>
                </Link>
              </div>
            </div>

            {/* Right Side: Interactive CSS Node Composition (Desktop Only) */}
            <div className="hidden lg:flex lg:col-span-5 items-center justify-center relative min-h-[160px]">
              <div className="relative w-full max-w-xs h-36 flex items-center justify-center">
                
                {/* Connecting CSS Lines */}
                <svg className="absolute inset-0 w-full h-full stroke-gray-700/60" strokeWidth="1.5" fill="none">
                  <line x1="20%" y1="50%" x2="50%" y2="25%" strokeDasharray="3 3" />
                  <line x1="20%" y1="50%" x2="50%" y2="75%" strokeDasharray="3 3" />
                  <line x1="50%" y1="25%" x2="80%" y2="50%" />
                  <line x1="50%" y1="75%" x2="80%" y2="50%" />
                </svg>

                {/* Left Node: Web */}
                <div className="absolute left-[10%] top-1/2 -translate-y-1/2 group cursor-pointer">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] group-hover:border-[#2f9e44] group-hover:shadow-[0_0_12px_rgba(47,158,68,0.3)] transition-all">
                    <span className="w-2 h-2 rounded-full bg-[#2f9e44] group-hover:animate-ping" />
                    <span className="text-[11px] font-mono font-bold text-gray-200 group-hover:text-white">WEB</span>
                  </div>
                </div>

                {/* Top Center Node: DSA */}
                <div className="absolute top-[10%] left-1/2 -translate-x-1/2 group cursor-pointer">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] group-hover:border-[#2f9e44] group-hover:shadow-[0_0_12px_rgba(47,158,68,0.3)] transition-all">
                    <span className="w-2 h-2 rounded-full bg-[#2f9e44]" />
                    <span className="text-[11px] font-mono font-bold text-gray-200 group-hover:text-white">DSA</span>
                  </div>
                </div>

                {/* Bottom Center Node: AI */}
                <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 group cursor-pointer">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] group-hover:border-[#2f9e44] group-hover:shadow-[0_0_12px_rgba(47,158,68,0.3)] transition-all">
                    <span className="w-2 h-2 rounded-full bg-[#2f9e44]" />
                    <span className="text-[11px] font-mono font-bold text-gray-200 group-hover:text-white">AI</span>
                  </div>
                </div>

                {/* Right Node: Community */}
                <div className="absolute right-[10%] top-1/2 -translate-y-1/2 group cursor-pointer">
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2f9e44]/15 border border-[#2f9e44]/60 group-hover:bg-[#2f9e44] group-hover:shadow-[0_0_16px_rgba(47,158,68,0.4)] transition-all">
                    <span className="w-2 h-2 rounded-full bg-[#2f9e44] group-hover:bg-white" />
                    <span className="text-[11px] font-mono font-bold text-[#2f9e44] group-hover:text-white">COMMUNITY</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* ─── LAYER 2: COMMUNITY STATUS RAIL ───────────────────────────────── */}
        <div className="rounded-xl bg-[#121721]/90 border border-[#30363d] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2f9e44] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2f9e44]" />
            </span>
            <span className="font-mono font-bold text-[#2f9e44] uppercase tracking-wider text-[11px]">
              Community Active
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs overflow-x-auto no-scrollbar py-0.5">
            <Link to="/events" className="text-gray-300 hover:text-white font-medium flex items-center gap-1 transition-colors whitespace-nowrap">
              <span>Upcoming Events</span>
              <ArrowRight className="w-3 h-3 text-[#2f9e44]" />
            </Link>
            <span className="text-gray-700 hidden sm:inline">•</span>
            <Link to="/resources" className="text-gray-300 hover:text-white font-medium flex items-center gap-1 transition-colors whitespace-nowrap">
              <span>Resources</span>
              <ArrowRight className="w-3 h-3 text-[#2f9e44]" />
            </Link>
            <span className="text-gray-700 hidden sm:inline">•</span>
            <Link to="/community" className="text-gray-300 hover:text-white font-medium flex items-center gap-1 transition-colors whitespace-nowrap">
              <span>Community Feed</span>
              <ArrowRight className="w-3 h-3 text-[#2f9e44]" />
            </Link>
          </div>
        </div>

        {/* ─── MOBILE REDESIGN (< 768px): QUICK ACCESS TILES & ACCORDION ───── */}
        <div className="block md:hidden space-y-6">

          {/* Quick Access 2x2 Navigation Grid */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-mono font-bold text-[#2f9e44] uppercase tracking-wider">
              Quick Access
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/community"
                className="p-3 rounded-xl bg-[#121721] border border-[#30363d] hover:border-[#2f9e44]/60 flex items-center gap-2.5 text-xs font-bold text-white transition-all active:scale-98"
              >
                <div className="p-1.5 rounded-lg bg-[#2f9e44]/15 text-[#2f9e44]">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <span>Community</span>
              </Link>

              <Link
                to="/events"
                className="p-3 rounded-xl bg-[#121721] border border-[#30363d] hover:border-[#2f9e44]/60 flex items-center gap-2.5 text-xs font-bold text-white transition-all active:scale-98"
              >
                <div className="p-1.5 rounded-lg bg-[#2f9e44]/15 text-[#2f9e44]">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <span>Events</span>
              </Link>

              <Link
                to="/resources"
                className="p-3 rounded-xl bg-[#121721] border border-[#30363d] hover:border-[#2f9e44]/60 flex items-center gap-2.5 text-xs font-bold text-white transition-all active:scale-98"
              >
                <div className="p-1.5 rounded-lg bg-[#2f9e44]/15 text-[#2f9e44]">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <span>Resources</span>
              </Link>

              <Link
                to="/gallery"
                className="p-3 rounded-xl bg-[#121721] border border-[#30363d] hover:border-[#2f9e44]/60 flex items-center gap-2.5 text-xs font-bold text-white transition-all active:scale-98"
              >
                <div className="p-1.5 rounded-lg bg-[#2f9e44]/15 text-[#2f9e44]">
                  <ImageIcon className="w-3.5 h-3.5" />
                </div>
                <span>Gallery</span>
              </Link>
            </div>
          </div>

          {/* Collapsible Mobile Navigation Accordion */}
          <div className="space-y-2 border-t border-b border-[#30363d] py-2">
            
            {/* Explore Group */}
            <div className="border-b border-[#30363d]/60 pb-2">
              <button
                onClick={() => toggleSection('explore')}
                className="w-full py-2 flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider"
              >
                <span>Explore</span>
                {expandedSection === 'explore' ? <ChevronUp className="w-4 h-4 text-[#2f9e44]" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              {expandedSection === 'explore' && (
                <div className="pl-2 pt-2 space-y-2 text-xs text-gray-300">
                  <Link to="/" className="block py-1">Home</Link>
                  <Link to="/campus-mantri" className="block py-1">Campus Mantri</Link>
                  <Link to="/teams" className="block py-1">Teams</Link>
                  <Link to="/members" className="block py-1">Members</Link>
                  <Link to="/events" className="block py-1">Events</Link>
                  <Link to="/gallery" className="block py-1">Gallery</Link>
                </div>
              )}
            </div>

            {/* Community Group */}
            <div className="border-b border-[#30363d]/60 pb-2">
              <button
                onClick={() => toggleSection('community')}
                className="w-full py-2 flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider"
              >
                <span>Community</span>
                {expandedSection === 'community' ? <ChevronUp className="w-4 h-4 text-[#2f9e44]" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              {expandedSection === 'community' && (
                <div className="pl-2 pt-2 space-y-2 text-xs text-gray-300">
                  <Link to="/community" className="block py-1">Community Feed</Link>
                  <Link to="/resources" className="block py-1">Resources</Link>
                  <Link to="/leaderboard" className="block py-1">Leaderboard</Link>
                  <Link to="/profile" className="block py-1">Member Profile</Link>
                </div>
              )}
            </div>

            {/* Connect Group */}
            <div>
              <button
                onClick={() => toggleSection('connect')}
                className="w-full py-2 flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider"
              >
                <span>Connect</span>
                {expandedSection === 'connect' ? <ChevronUp className="w-4 h-4 text-[#2f9e44]" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              {expandedSection === 'connect' && (
                <div className="pl-2 pt-2 space-y-3 text-xs text-gray-300">
                  <a href="mailto:gfgstudentbody.jh@gmail.com" className="block text-[#2f9e44] font-medium truncate">
                    gfgstudentbody.jh@gmail.com
                  </a>
                  <p>Jamia Hamdard, New Delhi, India</p>
                </div>
              )}
            </div>

          </div>

          {/* Social Row Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <a
              href="https://www.instagram.com/geeksforgeeks.jh"
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 rounded-xl bg-[#121721] border border-[#30363d] hover:border-[#2f9e44] text-xs font-bold text-gray-200 hover:text-white flex items-center justify-center gap-2 transition-all min-h-[44px]"
            >
              <Instagram className="w-4 h-4 text-[#e1306c]" />
              <span>Instagram</span>
            </a>
            <a
              href="https://www.linkedin.com/company/geeksforgeeks-student-body-jamia-hamdard"
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 rounded-xl bg-[#121721] border border-[#30363d] hover:border-[#2f9e44] text-xs font-bold text-gray-200 hover:text-white flex items-center justify-center gap-2 transition-all min-h-[44px]"
            >
              <Linkedin className="w-4 h-4 text-[#0077b5]" />
              <span>LinkedIn</span>
            </a>
          </div>

        </div>

        {/* ─── DESKTOP LAYER 3: ASYMMETRICAL BENTO GRID (>= 768px) ─────────── */}
        <div className="hidden md:grid grid-cols-12 gap-4 lg:gap-6">

          {/* 1. Large Brand Panel (5 Cols) */}
          <div className="col-span-5 rounded-2xl bg-[#121721] border border-[#30363d] p-6 space-y-4 flex flex-col justify-between hover:border-[#2f9e44]/40 transition-colors">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white p-1 rounded-xl flex items-center justify-center border border-[#2f9e44]/40 shadow-sm flex-shrink-0">
                  <img
                    src="/assets/gfg-official-logo.png"
                    alt="GeeksforGeeks Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-snug">GeeksforGeeks</h3>
                  <p className="text-xs font-mono font-bold text-[#2f9e44]">Campus Body</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 font-mono tracking-widest uppercase">
                Jamia Hamdard
              </p>

              <p className="text-xs text-gray-300 leading-relaxed">
                A student-led community for coding, collaboration and technical growth.
              </p>
            </div>

            {/* Topic Chips */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#30363d]/60">
              <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-md bg-[#0a0d12] border border-[#30363d] text-gray-300">
                Data Structures
              </span>
              <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-md bg-[#0a0d12] border border-[#30363d] text-gray-300">
                Development
              </span>
              <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-md bg-[#0a0d12] border border-[#30363d] text-gray-300">
                Artificial Intelligence
              </span>
            </div>
          </div>

          {/* 2. Explore Panel (3 Cols) */}
          <div className="col-span-3 rounded-2xl bg-[#121721] border border-[#30363d] p-6 space-y-3 flex flex-col justify-between hover:border-[#2f9e44]/40 transition-colors">
            <h4 className="text-xs font-mono font-bold text-white tracking-wider uppercase border-b border-[#30363d]/60 pb-2">
              Explore
            </h4>

            <div className="space-y-1 text-xs">
              {[
                { label: 'Home', path: '/' },
                { label: 'Campus Mantri', path: '/campus-mantri' },
                { label: 'Teams', path: '/teams' },
                { label: 'Members', path: '/members' },
                { label: 'Events', path: '/events' },
                { label: 'Gallery', path: '/gallery' }
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className="group flex items-center justify-between py-1.5 text-gray-300 hover:text-[#2f9e44] transition-colors border-b border-[#30363d]/30 last:border-0"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#2f9e44] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          </div>

          {/* 3. Community Panel (4 Cols) */}
          <div className="col-span-4 rounded-2xl bg-[#121721] border border-[#30363d] p-6 space-y-3 flex flex-col justify-between hover:border-[#2f9e44]/40 transition-colors">
            <h4 className="text-xs font-mono font-bold text-white tracking-wider uppercase border-b border-[#30363d]/60 pb-2">
              Community
            </h4>

            <div className="space-y-2 text-xs">
              {/* Highlighted Row */}
              <Link
                to="/community"
                className="group p-2.5 rounded-xl bg-[#2f9e44]/10 border border-[#2f9e44]/40 hover:border-[#2f9e44] flex items-center justify-between transition-all"
              >
                <div>
                  <p className="font-bold text-white group-hover:text-[#2f9e44] transition-colors flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2f9e44]" />
                    <span>Community Feed</span>
                  </p>
                  <p className="text-[10px] text-gray-400">Join the conversation</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#2f9e44] group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link to="/resources" className="group flex items-center justify-between py-1 text-gray-300 hover:text-[#2f9e44] transition-colors">
                <span>Resources</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#2f9e44] group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link to="/leaderboard" className="group flex items-center justify-between py-1 text-gray-300 hover:text-[#2f9e44] transition-colors">
                <span>Leaderboard</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#2f9e44] group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link to="/events" className="group flex items-center justify-between py-1 text-gray-300 hover:text-[#2f9e44] transition-colors">
                <span>Upcoming Events</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#2f9e44] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* 4. Contact & Social Panel (7 Cols) */}
          <div className="col-span-7 rounded-2xl bg-[#121721] border border-[#30363d] p-6 space-y-4 flex flex-col justify-between hover:border-[#2f9e44]/40 transition-colors">
            <div>
              <h4 className="text-xs font-mono font-bold text-white tracking-wider uppercase border-b border-[#30363d]/60 pb-2">
                Get In Touch
              </h4>

              <div className="pt-2 space-y-1">
                <p className="text-[11px] font-mono text-gray-400 uppercase">Official Email</p>
                <a
                  href="mailto:gfgstudentbody.jh@gmail.com"
                  className="text-xs sm:text-sm font-bold text-[#2f9e44] hover:underline flex items-center gap-1.5"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span>gfgstudentbody.jh@gmail.com</span>
                </a>
              </div>
            </div>

            {/* Integrated Icon + Label Social Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#30363d]/60">
              <a
                href="https://www.instagram.com/geeksforgeeks.jh"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#0a0d12] border border-[#30363d] hover:border-[#e1306c] hover:bg-[#e1306c]/10 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-2 transition-all"
              >
                <Instagram className="w-3.5 h-3.5 text-[#e1306c]" />
                <span>Instagram</span>
              </a>

              <a
                href="https://www.linkedin.com/company/geeksforgeeks-student-body-jamia-hamdard"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#0a0d12] border border-[#30363d] hover:border-[#0077b5] hover:bg-[#0077b5]/10 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-2 transition-all"
              >
                <Linkedin className="w-3.5 h-3.5 text-[#0077b5]" />
                <span>LinkedIn</span>
              </a>

              <a
                href="https://x.com/gfg__jh"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#0a0d12] border border-[#30363d] hover:border-gray-400 hover:bg-white/5 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-2 transition-all"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>X (Twitter)</span>
              </a>
            </div>
          </div>

          {/* 5. Location Block with Decorative CSS Grid (5 Cols) */}
          <div className="col-span-5 rounded-2xl bg-[#121721] border border-[#30363d] p-6 space-y-2 relative overflow-hidden flex flex-col justify-between hover:border-[#2f9e44]/40 transition-colors">
            
            {/* Subtle Decorative CSS Grid Lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#30363d_1px,transparent_1px)] [background-size:12px_12px] opacity-30 pointer-events-none" />

            <div className="relative z-10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#2f9e44] tracking-widest uppercase">
                  LOCATION
                </span>
                <MapPin className="w-4 h-4 text-[#2f9e44]" />
              </div>

              <h4 className="text-base font-extrabold text-white">JAMIA HAMDARD</h4>
              <p className="text-xs text-gray-300 font-medium">New Delhi, India</p>
            </div>

            <div className="relative z-10 pt-2 border-t border-[#30363d]/60 flex items-center justify-between text-[10px] font-mono text-gray-500">
              <span>LAT: 28.5144° N</span>
              <span>LON: 77.2505° E</span>
            </div>
          </div>

        </div>

        {/* ─── LAYER 4: LARGE TYPOGRAPHIC SIGNATURE ────────────────────────── */}
        <div className="py-4 select-none pointer-events-none text-center overflow-hidden">
          <h2 className="text-[clamp(32px,8vw,110px)] font-black tracking-tighter uppercase font-mono text-white/5 leading-none whitespace-nowrap">
            GFG × JAMIA HAMDARD
          </h2>
        </div>

        {/* ─── LAYER 5: FINAL BOTTOM BAR ────────────────────────────────────── */}
        <div className="pt-6 border-t border-[#2f9e44]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="text-center sm:text-left space-y-0.5">
            <p>© 2026 GeeksforGeeks Campus Body, Jamia Hamdard</p>
          </div>

          <div className="text-center text-[11px] text-gray-300">
            Built by the Campus Body development team.
          </div>

          <div className="flex items-center gap-3 text-xs flex-wrap justify-center">
            <button
              onClick={() => setPrivacyOpen(true)}
              className="hover:text-white transition-colors focus:outline-none"
            >
              Privacy
            </button>
            <span className="text-gray-700">•</span>
            <button
              onClick={() => setGuidelinesOpen(true)}
              className="hover:text-white transition-colors focus:outline-none"
            >
              Guidelines
            </button>
            <span className="text-gray-700">•</span>
            <Link
              to="/admin/login"
              className="text-gray-400 hover:text-[#2f9e44] font-medium flex items-center gap-0.5 transition-colors focus:outline-none"
            >
              <span>Admin Portal</span>
              <ArrowUpRight className="w-3 h-3 text-[#2f9e44]" />
            </Link>
          </div>
        </div>

      </div>

      {/* ─── PRIVACY MODAL ──────────────────────────────────────────────── */}
      {privacyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121721] border border-[#30363d] max-w-md w-full rounded-2xl p-6 space-y-4 text-left shadow-2xl relative">
            <button
              onClick={() => setPrivacyOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1f293d]"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-[#2f9e44]" />
              <span>Privacy Policy</span>
            </div>
            <div className="text-xs text-gray-300 space-y-2 leading-relaxed max-h-60 overflow-y-auto pr-1">
              <p>
                GeeksforGeeks Campus Body at Jamia Hamdard is committed to protecting student privacy.
              </p>
              <p>
                • <strong>Data Usage:</strong> Account details, verified email addresses, and student profile info are used strictly for community management, verification, event registration, and leaderboard recognition.
              </p>
              <p>
                • <strong>Data Protection:</strong> Passwords and PINs are securely hashed. We never sell or share member data with unauthorized third parties.
              </p>
              <p>
                • <strong>Member Control:</strong> Members can update or remove their uploaded content and profile info anytime via profile settings.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPrivacyOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#2f9e44] text-white text-xs font-bold hover:bg-[#2b8a3e]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── COMMUNITY GUIDELINES MODAL ───────────────────────────────────── */}
      {guidelinesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121721] border border-[#30363d] max-w-md w-full rounded-2xl p-6 space-y-4 text-left shadow-2xl relative">
            <button
              onClick={() => setGuidelinesOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1f293d]"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-[#2f9e44]" />
              <span>Community Guidelines</span>
            </div>
            <div className="text-xs text-gray-300 space-y-2 leading-relaxed max-h-60 overflow-y-auto pr-1">
              <p>
                Welcome to GFG Campus Body Jamia Hamdard. To foster a safe, collaborative tech community, all members agree to:
              </p>
              <p>
                1. <strong>Respect & Inclusivity:</strong> Support fellow student coders of all skill levels. Harassment, hate speech, or personal attacks are strictly prohibited.
              </p>
              <p>
                2. <strong>Constructive Sharing:</strong> Share original projects, authentic study notes, and helpful answers. Spamming or self-promotion without relevance will be moderated.
              </p>
              <p>
                3. <strong>Academic & Code Integrity:</strong> Respect intellectual property and cite open-source contributions appropriately.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setGuidelinesOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#2f9e44] text-white text-xs font-bold hover:bg-[#2b8a3e]"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

    </footer>
  );
}


