import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X, User, BookOpen, Users, Trophy, Image as ImageIcon, LogOut, Shield, Bookmark, CreditCard, Bell, Pin, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthModal from './AuthModal';
import api from '../../services/api';

export default function Navbar() {
  const { user, member, isAuthenticated, loading, openAuthModal, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/announcements');
        if (res.data?.data) setAnnouncements(res.data.data);
      } catch (err) {
        console.warn('Navbar announcements fetch error:', err);
      }
    };
    fetchAnnouncements();
  }, [location.pathname]);

  // Lock background body scroll when announcement modal is open
  useEffect(() => {
    if (isAnnouncementsOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAnnouncementsOpen]);

  const now = new Date();
  const activeAnnouncements = announcements.filter(a => {
    const isPub = a.status === 'Published' || a.status === 'Active' || !a.status;
    const notExpired = !a.expiryDate && !a.expiresAt ? true : new Date(a.expiryDate || a.expiresAt) > now;
    return isPub && notExpired;
  });

  const pinnedAnnouncement = activeAnnouncements.find(a => a.isPinned);

  // Primary visible links in main navigation
  const primaryLinks = [
    { name: 'Home', path: '/' },
    { name: 'Campus Mantri', path: '/campus-mantri' },
    { name: 'Teams', path: '/teams' },
    { name: 'Members', path: '/members' },
    { name: 'Events', path: '/events' },
    { name: 'Community', path: '/community', badge: 'Feed' }
  ];

  // Secondary links inside More dropdown
  const moreLinks = [
    { name: 'Register for Ideathon', path: '/registration', desc: 'THINKTANK Ideathon 2026 entry', icon: Sparkles, badge: 'Live' },
    { name: 'Announcements', path: '#announcements', desc: 'Latest bulletins & updates', icon: Bell, isModalTrigger: true },
    { name: 'Gallery', path: '/gallery', desc: 'Photo & video highlights', icon: ImageIcon },
    { name: 'Resources', path: '/resources', desc: 'Study notes & roadmaps', icon: BookOpen },
    { name: 'Leaderboard', path: '/leaderboard', desc: 'Top contributors', icon: Trophy }
  ];

  const isActive = (path) =>
    location.pathname === path || (path === '/campus-mantri' && location.pathname === '/mantri-history');

  const isMoreActive = moreLinks.some((link) => location.pathname === link.path);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMoreOpen(false);
        setIsUserMenuOpen(false);
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMoreOpen(false);
    setIsUserMenuOpen(false);
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const displayName = member?.name || user?.username || 'Member Profile';
  const displayPhoto = member?.photo || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2f9e44&color=fff&bold=true`;
  // Consistent role: use the community role (e.g. 'Campus Mantri') rather than accountType
  const displayRole = member?.role || user?.role || 'Member';
  const isSuperAdmin = user?.role === 'Super Admin' || user?.role === 'Admin';

  return (
    <header className="sticky top-0 z-50 glass-nav border-b border-[#30363d]/80 transition-all duration-200">
      
      {/* Universal Auth Modal */}
      <AuthModal />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          
          {/* 1. Unified Brand Lockup */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 aspect-square bg-white p-1 rounded-xl flex items-center justify-center border border-[#2f9e44]/40 shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
              <img
                src="/assets/gfg-official-logo.png"
                alt="GeeksforGeeks Campus Body Jamia Hamdard"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-[13px] sm:text-base tracking-tight text-white group-hover:text-[#2f9e44] transition-colors leading-tight truncate">
                GeeksforGeeks <span className="text-[#2f9e44]">Campus Body</span>
              </span>
              <span className="text-[10px] sm:text-xs text-gray-400 font-medium tracking-wide truncate">
                Jamia Hamdard
              </span>
            </div>
          </Link>

          {/* 2. Desktop Primary Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {primaryLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    active
                      ? 'text-white bg-[#21262d] font-bold border-b-2 border-[#2f9e44]'
                      : 'text-gray-300 hover:text-white hover:bg-[#161b22]'
                  }`}
                >
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2f9e44] text-white font-bold tracking-wider uppercase">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* More Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1 ${
                  isMoreActive || isMoreOpen
                    ? 'text-white bg-[#21262d] font-bold border-b-2 border-[#2f9e44]'
                    : 'text-gray-300 hover:text-white hover:bg-[#161b22]'
                }`}
              >
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreOpen ? 'rotate-180 text-[#2f9e44]' : ''}`} />
              </button>

              {isMoreOpen && (
                <div className="absolute right-0 mt-2 w-60 glass-panel bg-[#161b22] border border-[#30363d] rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {moreLinks.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname === item.path;
                    if (item.isModalTrigger) {
                      return (
                        <button
                          key={item.name}
                          onClick={() => {
                            setIsMoreOpen(false);
                            setIsAnnouncementsOpen(true);
                          }}
                          className="w-full text-left flex items-start gap-3 p-2.5 rounded-xl transition-all text-gray-300 hover:text-white hover:bg-[#21262d]/60 cursor-pointer"
                        >
                          <div className="p-2 rounded-lg bg-[#0d1117] text-[#2f9e44] border border-[#30363d] flex-shrink-0 mt-0.5">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              {item.name}
                              {activeAnnouncements.length > 0 && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#2f9e44] text-white font-bold">
                                  {activeAnnouncements.length}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 font-normal">{item.desc}</div>
                          </div>
                        </button>
                      );
                    }
                    return (
                      <Link
                        key={item.name + item.path}
                        to={item.path}
                        onClick={() => setIsMoreOpen(false)}
                        className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                          active
                            ? 'bg-[#21262d] text-white border border-[#2f9e44]/40'
                            : 'text-gray-300 hover:text-white hover:bg-[#21262d]/60'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-[#0d1117] text-[#2f9e44] border border-[#30363d] flex-shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            {item.name}
                            {item.badge && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#2f9e44] text-white font-mono font-bold">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 font-normal">{item.desc}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* 3. Desktop Auth / Profile Control */}
          <div className="hidden lg:flex items-center gap-3">
            {loading ? (
              <div className="h-9 w-24 rounded-xl bg-[#21262d] animate-pulse"></div>
            ) : !isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-[#21262d] transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="px-4 py-2 rounded-xl gradient-button text-xs font-bold shadow-md hover:scale-[1.02] transition-transform"
                >
                  Join Community
                </button>
              </div>
            ) : (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-[#2f9e44]/60 transition-all text-xs font-semibold text-white shadow-sm"
                >
                  <img
                    src={displayPhoto}
                    alt={displayName}
                    className="w-7 h-7 min-w-[28px] min-h-[28px] aspect-square rounded-full object-cover border border-[#2f9e44] flex-shrink-0"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2f9e44&color=fff&bold=true`;
                    }}
                  />
                  <span className="max-w-[120px] truncate">{displayName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180 text-[#2f9e44]' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass-panel bg-[#161b22] border border-[#30363d] rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in duration-150">
                    
                    {/* User Summary Header */}
                    <div className="p-3 border-b border-[#30363d] mb-1">
                      <p className="font-bold text-xs text-white truncate">{displayName}</p>
                      <p className="text-[10px] text-[#2f9e44] font-mono uppercase font-bold mt-0.5">
                        {displayRole}
                      </p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-[#21262d] font-semibold transition-colors"
                    >
                      <User className="w-4 h-4 text-[#2f9e44]" /> My Profile
                    </Link>

                    <Link
                      to="/community"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-[#21262d] font-semibold transition-colors"
                    >
                      <Users className="w-4 h-4 text-[#2f9e44]" /> Community Feed
                    </Link>

                    <Link
                      to="/profile?tab=saved"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-[#21262d] font-semibold transition-colors"
                    >
                      <Bookmark className="w-4 h-4 text-[#2f9e44]" /> Saved Posts
                    </Link>

                    <Link
                      to="/profile?tab=card"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-[#21262d] font-semibold transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-[#2f9e44]" /> Membership Card
                    </Link>

                    {isSuperAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 font-bold border border-emerald-500/30 my-1 transition-colors"
                      >
                        <Shield className="w-4 h-4" /> Admin Console
                      </Link>
                    )}

                    <div className="border-t border-[#30363d] pt-1 mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 font-semibold transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>

                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Mobile Controls (Bell + Hamburger) */}
          <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
            {/* Mobile Announcement Bell Button */}
            <button
              onClick={() => setIsAnnouncementsOpen(true)}
              className="relative w-10 h-10 rounded-xl text-gray-300 hover:text-white hover:bg-[#21262d] focus:outline-none transition-colors border border-[#30363d] flex items-center justify-center flex-shrink-0 cursor-pointer"
              aria-label="Open Announcements"
            >
              <Bell className="w-5 h-5 text-[#2f9e44]" />
              {activeAnnouncements.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2f9e44] text-[9px] font-bold text-white shadow-sm ring-2 ring-[#0d1117]">
                  {activeAnnouncements.length}
                </span>
              )}
            </button>

            {/* Hamburger Menu Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-10 h-10 rounded-xl text-gray-400 hover:text-white hover:bg-[#21262d] focus:outline-none transition-colors border border-[#30363d] flex items-center justify-center flex-shrink-0 cursor-pointer"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* 5. Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden glass-panel border-b border-[#30363d] px-4 pt-3 pb-6 space-y-4 animate-in fade-in duration-150">
          
          {/* Main Pages */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider px-2">Navigation</span>
            {primaryLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'text-white bg-[#21262d] font-bold border-l-4 border-[#2f9e44]'
                    : 'text-gray-300 hover:text-white hover:bg-[#161b22]'
                }`}
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2f9e44] text-white font-bold uppercase">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* More Links */}
          <div className="space-y-1 pt-2 border-t border-[#30363d]">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider px-2">More Options</span>
            {moreLinks.map((link) => {
              const Icon = link.icon;
              if (link.isModalTrigger) {
                return (
                  <button
                    key={link.name}
                    onClick={() => {
                      setIsOpen(false);
                      setIsAnnouncementsOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-[#161b22] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-[#2f9e44]" />
                      <span>{link.name}</span>
                    </div>
                    {activeAnnouncements.length > 0 && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#2f9e44] text-white font-bold">
                        {activeAnnouncements.length}
                      </span>
                    )}
                  </button>
                );
              }
              return (
                <Link
                  key={link.name + link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === link.path
                      ? 'text-white bg-[#21262d] font-bold border-l-4 border-[#2f9e44]'
                      : 'text-gray-300 hover:text-white hover:bg-[#161b22]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#2f9e44]" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Auth Actions */}
          <div className="pt-2 border-t border-[#30363d] space-y-2">
            {!isAuthenticated ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setIsOpen(false); openAuthModal('login'); }}
                  className="py-2.5 text-center text-xs font-bold rounded-xl bg-[#21262d] text-white border border-[#30363d]"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setIsOpen(false); openAuthModal('signup'); }}
                  className="py-2.5 text-center text-xs font-bold rounded-xl gradient-button text-white shadow-md"
                >
                  Join Community
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Profile Info Card */}
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#21262d] border border-[#30363d] hover:border-[#2f9e44]/50 transition-colors"
                >
                  <img
                    src={displayPhoto}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#2f9e44] flex-shrink-0"
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2f9e44&color=fff&bold=true`; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{displayName}</p>
                    <p className="text-[10px] text-[#2f9e44] font-mono font-semibold truncate">{displayRole}</p>
                  </div>
                  <span className="text-[10px] text-[#2f9e44] font-bold flex-shrink-0">View →</span>
                </Link>

                {/* Divider + Sign Out */}
                <div className="border-t border-[#30363d] pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full py-2 text-xs font-semibold rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-center"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 6. Universal Announcement Center Portal Modal */}
      {isAnnouncementsOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAnnouncementsOpen(false);
          }}
        >
          <div className="w-full max-w-lg sm:max-w-xl bg-[#161b22] border border-[#30363d] rounded-2xl p-5 sm:p-6 flex flex-col max-h-[85vh] shadow-2xl my-auto animate-in zoom-in-95 duration-200">
            
            {/* Fixed Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#30363d] flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#2f9e44]" />
                  <h3 className="font-extrabold text-lg text-white">Announcements Center</h3>
                </div>
                <p className="text-xs text-gray-400 font-medium">GeeksforGeeks Campus Body • Jamia Hamdard</p>
              </div>
              <button
                onClick={() => setIsAnnouncementsOpen(false)}
                className="p-2 rounded-full text-gray-400 hover:text-white bg-[#21262d] border border-[#30363d] cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Smooth Scrollable Bulletins Body */}
            <div className="flex-1 overflow-y-auto pr-1 pt-4 space-y-4">
              {/* Pinned Announcement Section */}
              {pinnedAnnouncement && (
                <div className="space-y-2">
                  <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#2f9e44] uppercase tracking-wider">
                    <Pin className="w-3.5 h-3.5 fill-[#2f9e44]" /> Pinned Bulletin
                  </span>
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1b5e20]/40 via-[#121721] to-[#0a0d12] border border-[#2f9e44]/60 space-y-3 shadow-lg relative overflow-hidden">
                    <div className="space-y-1">
                      <h4 className="font-bold text-base text-white leading-snug">{pinnedAnnouncement.title}</h4>
                      <p className="text-xs text-gray-300 font-medium leading-relaxed">{pinnedAnnouncement.description}</p>
                    </div>
                    {pinnedAnnouncement.linkUrl && (
                      <div className="flex items-center justify-end pt-1">
                        <a
                          href={pinnedAnnouncement.linkUrl}
                          target={pinnedAnnouncement.linkUrl.startsWith('http') ? '_blank' : '_self'}
                          rel="noopener noreferrer"
                          onClick={() => setIsAnnouncementsOpen(false)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2f9e44] hover:bg-[#258537] text-white text-xs font-bold shadow-md transition-all transform hover:scale-[1.02]"
                        >
                          {pinnedAnnouncement.linkLabel || 'Apply'} →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Latest Announcements List */}
              <div className="space-y-3 pt-1">
                <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                  Latest Bulletins
                </span>
                {activeAnnouncements.length === 0 ? (
                  <p className="text-xs text-gray-500 py-6 text-center bg-[#0d1117] rounded-xl border border-[#30363d]">
                    No active announcements right now.
                  </p>
                ) : (
                  activeAnnouncements.map((a) => (
                    <div key={a._id} className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] hover:border-[#2f9e44]/40 transition-colors space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-md border border-sky-500/20 uppercase">
                          {a.type || 'Announcement'}
                        </span>
                        {a.publishDate && (
                          <span className="text-[11px] text-gray-500 font-mono">
                            {new Date(a.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-bold text-sm text-white leading-snug">{a.title}</h5>
                        <p className="text-xs text-gray-400 font-medium leading-relaxed">{a.description}</p>
                      </div>
                      {a.linkUrl && (
                        <div className="flex items-center justify-end pt-1">
                          <a
                            href={a.linkUrl}
                            target={a.linkUrl.startsWith('http') ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                            onClick={() => setIsAnnouncementsOpen(false)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-[#2f9e44] border border-[#2f9e44]/40 hover:border-transparent text-xs font-bold text-[#2f9e44] hover:text-white transition-all"
                          >
                            {a.linkLabel || 'View'} →
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
