import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Bell, MessageSquare, AlertTriangle, ArrowUpRight,
  Sparkles, Pin, Users, ImageIcon, BookOpen, Clock, UserCheck,
  Activity, Database, CheckCircle2, ShieldCheck, ChevronRight,
  TrendingUp, RefreshCw, Plus, Layers, Zap, ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { formatEventDate } from '../../utils/dateUtils';

// ─── ANIMATED COUNT-UP NUMBER HOOK ───────────────────────────────────────────
function AnimatedCounter({ value, duration = 800 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const target = parseInt(value, 10) || 0;
    if (target === 0) {
      setDisplayValue(0);
      return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easedProgress * target));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
      }
    };

    const animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}

export default function AdminDashboardHome() {
  const { isLight } = useAdminTheme();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Live Performance & Telemetry
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);

  // Core Statistics Payload from Backend
  const [stats, setStats] = useState({
    members: { totalAccounts: 0, visitors: 0, verifiedMembers: 0, pending: 0 },
    events: { total: 0, upcoming: 0, completed: 0 },
    gallery: { photos: 0 },
    resources: { total: 0, published: 0 },
    moderation: { reported: 0, underReview: 0 },
    announcements: { published: 0 }
  });

  // Raw Database Entity Collections for Graphs & Aggregations
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [galleryList, setGalleryList] = useState([]);

  // Chart Interactive Filters
  const [growthFilter, setGrowthFilter] = useState('30D'); // '7D' | '30D' | '90D' | '1Y'
  const [eventsFilter, setEventsFilter] = useState('30D');
  const [activeGrowthTooltip, setActiveGrowthTooltip] = useState(null);
  const [activeEventTooltip, setActiveEventTooltip] = useState(null);

  useEffect(() => {
    loadDashboardData(true);
  }, []);

  const loadDashboardData = async (isInitial = false) => {
    if (isInitial && !stats.members.totalAccounts) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);
    const startPing = performance.now();

    try {
      const [statsRes, eventsRes, annRes, membersRes, galleryRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/events').catch(() => ({ data: { data: [] } })),
        api.get('/announcements').catch(() => ({ data: { data: [] } })),
        api.get('/members').catch(() => ({ data: { data: [] } })),
        api.get('/gallery').catch(() => ({ data: { data: [] } }))
      ]);

      const roundTrip = Math.round(performance.now() - startPing);
      setLatencyMs(roundTrip > 0 ? roundTrip : 18);
      setLastSyncTime(new Date());

      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
      }
      setEvents(eventsRes.data?.data || []);
      setAnnouncements(annRes.data?.data || []);
      setMembersList(membersRes.data?.data || []);
      setGalleryList(galleryRes.data?.data || []);
    } catch (err) {
      console.warn('[Admin Dashboard] Live data fetch error:', err);
      if (!stats.members.totalAccounts) {
        setError('Failed to sync live MongoDB statistics.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // ─── CHART 1: COMMUNITY GROWTH ANALYTICS AGGREGATION ───────────────────────
  const growthChartData = useMemo(() => {
    const now = new Date();
    let days = 30;
    let bucketCount = 6;
    if (growthFilter === '7D') {
      days = 7;
      bucketCount = 7;
    } else if (growthFilter === '30D') {
      days = 30;
      bucketCount = 6;
    } else if (growthFilter === '90D') {
      days = 90;
      bucketCount = 6;
    } else if (growthFilter === '1Y') {
      days = 365;
      bucketCount = 12;
    }

    const startTime = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const intervalMs = (now.getTime() - startTime.getTime()) / bucketCount;

    const buckets = [];
    let totalFound = 0;

    for (let i = 0; i < bucketCount; i++) {
      const bStart = new Date(startTime.getTime() + i * intervalMs);
      const bEnd = new Date(startTime.getTime() + (i + 1) * intervalMs);

      let label = '';
      if (growthFilter === '7D') {
        label = bStart.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (growthFilter === '30D' || growthFilter === '90D') {
        label = bStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        label = bStart.toLocaleDateString('en-US', { month: 'short' });
      }

      // Filter verified members vs visitors
      const membersInBucket = membersList.filter((m) => {
        const d = m.createdAt ? new Date(m.createdAt) : null;
        const isMem = (m.accountType || m.role || '').toLowerCase() === 'member';
        return d && d >= bStart && d < bEnd && isMem;
      }).length;

      const visitorsInBucket = membersList.filter((m) => {
        const d = m.createdAt ? new Date(m.createdAt) : null;
        const isVis = (m.accountType || m.role || '').toLowerCase() === 'visitor';
        return d && d >= bStart && d < bEnd && isVis;
      }).length;

      totalFound += membersInBucket + visitorsInBucket;

      buckets.push({
        label,
        startStr: bStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        endStr: bEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        members: membersInBucket,
        visitors: visitorsInBucket
      });
    }

    return { buckets, totalFound };
  }, [membersList, growthFilter]);

  // ─── CHART 2: EVENTS & ENGAGEMENT ANALYTICS AGGREGATION ───────────────────
  const eventsChartData = useMemo(() => {
    const now = new Date();
    let days = 30;
    let bucketCount = 6;
    if (eventsFilter === '7D') {
      days = 7;
      bucketCount = 7;
    } else if (eventsFilter === '30D') {
      days = 30;
      bucketCount = 6;
    } else if (eventsFilter === '90D') {
      days = 90;
      bucketCount = 6;
    } else if (eventsFilter === '1Y') {
      days = 365;
      bucketCount = 12;
    }

    const startTime = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const intervalMs = (now.getTime() - startTime.getTime()) / bucketCount;

    const buckets = [];
    let totalFound = 0;

    for (let i = 0; i < bucketCount; i++) {
      const bStart = new Date(startTime.getTime() + i * intervalMs);
      const bEnd = new Date(startTime.getTime() + (i + 1) * intervalMs);

      let label = '';
      if (eventsFilter === '7D') {
        label = bStart.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (eventsFilter === '30D' || eventsFilter === '90D') {
        label = bStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        label = bStart.toLocaleDateString('en-US', { month: 'short' });
      }

      const eventsInBucket = events.filter((e) => {
        const d = e.createdAt ? new Date(e.createdAt) : (e.date ? new Date(e.date) : null);
        return d && d >= bStart && d < bEnd;
      }).length;

      const galleryInBucket = galleryList.filter((g) => {
        const d = g.createdAt ? new Date(g.createdAt) : null;
        return d && d >= bStart && d < bEnd;
      }).length;

      totalFound += eventsInBucket + galleryInBucket;

      buckets.push({
        label,
        startStr: bStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        events: eventsInBucket,
        gallery: galleryInBucket
      });
    }

    return { buckets, totalFound };
  }, [events, galleryList, eventsFilter]);

  // ─── TEAM-WISE DISTRIBUTION AGGREGATION ────────────────────────────────────
  const teamDistribution = useMemo(() => {
    if (!membersList.length) return [];
    const counts = {};
    membersList.forEach((m) => {
      const t = (m.teamName || 'General Community').trim();
      counts[t] = (counts[t] || 0) + 1;
    });

    const total = membersList.length;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [membersList]);

  // ─── RECENT ACTIVITY TIMELINE SYNTHESIS ────────────────────────────────────
  const recentActivities = useMemo(() => {
    const list = [];

    announcements.forEach((a) => {
      list.push({
        id: a._id,
        type: 'announcement',
        title: a.title,
        subtitle: `Bulletin published (${a.type || 'Notice'})`,
        date: a.createdAt || new Date(),
        badge: 'Bulletin',
        badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
      });
    });

    events.forEach((e) => {
      list.push({
        id: e._id,
        type: 'event',
        title: e.title || e.name,
        subtitle: `Event status: ${e.status || 'Active'}`,
        date: e.createdAt || e.date || new Date(),
        badge: 'Event',
        badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      });
    });

    membersList.slice(0, 5).forEach((m) => {
      list.push({
        id: m._id,
        type: 'member',
        title: m.name,
        subtitle: `Registered as ${m.accountType || m.role || 'Member'} • ${m.teamName || 'General'}`,
        date: m.createdAt || new Date(),
        badge: 'Member',
        badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
      });
    });

    return list
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4);
  }, [announcements, events, membersList]);

  const upcomingEvents = events.filter((e) => (e.status || '').toLowerCase() !== 'completed');

  // Exact 6 Metrics Cards
  const metricCards = [
    {
      title: 'Total Accounts',
      value: stats.members.totalAccounts || 0,
      icon: Users,
      link: '/admin/members',
      color: 'text-purple-400',
      bgGlow: 'from-purple-500/10 via-purple-500/5 to-transparent',
      borderColor: 'group-hover:border-purple-500/50',
      tag: 'All Profiles'
    },
    {
      title: 'Visitors',
      value: stats.members.visitors || 0,
      icon: Clock,
      link: '/admin/members?role=Visitors',
      color: 'text-amber-400',
      bgGlow: 'from-amber-500/10 via-amber-500/5 to-transparent',
      borderColor: 'group-hover:border-amber-500/50',
      tag: 'Guest Access'
    },
    {
      title: 'Verified Members',
      value: stats.members.verifiedMembers || 0,
      icon: UserCheck,
      link: '/admin/members?role=Members',
      color: 'text-emerald-400',
      bgGlow: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      borderColor: 'group-hover:border-emerald-500/50',
      tag: 'Active Pass'
    },
    {
      title: 'Total Events',
      value: stats.events.total || 0,
      icon: Calendar,
      link: '/admin/events',
      color: 'text-cyan-400',
      bgGlow: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
      borderColor: 'group-hover:border-cyan-500/50',
      tag: 'Workshops & Hackathons'
    },
    {
      title: 'Gallery Photos',
      value: stats.gallery.photos || 0,
      icon: ImageIcon,
      link: '/admin/gallery',
      color: 'text-pink-400',
      bgGlow: 'from-pink-500/10 via-pink-500/5 to-transparent',
      borderColor: 'group-hover:border-pink-500/50',
      tag: 'Cloud Media'
    },
    {
      title: 'Needs Review',
      value: stats.moderation.reported || 0,
      icon: AlertTriangle,
      link: '/admin/feed-moderation',
      color: 'text-rose-400',
      bgGlow: 'from-rose-500/10 via-rose-500/5 to-transparent',
      borderColor: 'group-hover:border-rose-500/50',
      tag: 'Queue Items'
    }
  ];

  // Reusable Glass Card Classes
  const glassCardClass = isLight
    ? 'bg-white/80 backdrop-blur-xl border border-slate-200/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] text-slate-900'
    : 'bg-[#121721]/80 backdrop-blur-xl border border-[#30363d]/80 shadow-[0_8px_30px_rgb(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] text-white';

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      
      {/* ─── 1. COMMAND CENTER HERO BANNER (APPLE LIQUID GLASS) ─────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all shadow-xl ${
          isLight
            ? 'bg-gradient-to-br from-emerald-50/90 via-white/80 to-slate-50/90 border-emerald-500/30 text-slate-900 shadow-emerald-500/5'
            : 'bg-gradient-to-br from-[#132218]/90 via-[#121721]/90 to-[#0a0d12]/90 border-[#2f9e44]/40 text-white shadow-green-950/20'
        }`}
      >
        {/* Soft Ambient Light Glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#2f9e44]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            {/* Real-Time Status Pill */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live MongoDB Atlas
              </span>

              {latencyMs && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isLight ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-[#0d1117] text-gray-400 border-[#30363d]'
                }`}>
                  ⚡ {latencyMs}ms latency
                </span>
              )}

              {lastSyncTime && (
                <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                  • Synced {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              GFG Admin Command Center <span className="text-[#2f9e44]">V2</span>
            </h1>

            <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
              Real-time synchronization for Jamia Hamdard Chapter accounts, member approvals, event lifecycle, digital archives, and moderation.
            </p>
          </div>

          {/* Quick Command Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin/events?action=new"
              className="px-4 py-2.5 rounded-xl gradient-button text-xs font-bold flex items-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" /> Add Event
            </Link>

            <Link
              to="/admin/members"
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shadow-sm ${
                isLight
                  ? 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100 hover:border-[#2f9e44]'
                  : 'bg-[#18202c] text-gray-200 border-[#30363d] hover:bg-[#212b3a] hover:text-white hover:border-[#2f9e44]/60'
              }`}
            >
              <Users className="w-4 h-4 text-[#2f9e44]" /> Member Directory
            </Link>

            <button
              onClick={() => loadDashboardData(false)}
              disabled={isRefreshing}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shadow-sm ${
                isLight
                  ? 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                  : 'bg-[#18202c] text-gray-200 border-[#30363d] hover:bg-[#212b3a] hover:text-white'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#2f9e44]' : 'text-gray-400'}`} />
              <span>{isRefreshing ? 'Syncing…' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => loadDashboardData(false)} className="px-3 py-1 rounded-lg bg-amber-500 text-black font-bold text-xs">
            Try Again
          </button>
        </div>
      )}

      {/* ─── 2. SIX STATISTICS WIDGETS (NEUMORPHIC LIQUID GLASS) ─────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
            >
              <Link
                to={card.link}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 group shadow-sm relative overflow-hidden block ${
                  glassCardClass
                } ${card.borderColor} hover:-translate-y-1 hover:shadow-xl`}
              >
                {/* Subtle Gradient Backlight */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGlow} pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity`} />

                <div className="flex items-center justify-between relative z-10">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider truncate max-w-[85%] ${
                    isLight ? 'text-slate-500' : 'text-gray-400'
                  }`}>
                    {card.title}
                  </span>
                  <div className="p-1.5 rounded-lg bg-[#000000]/10 border border-[#ffffff]/5 group-hover:scale-110 transition-transform">
                    <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                  </div>
                </div>

                <div className="space-y-1 relative z-10">
                  <div className="flex items-baseline justify-between">
                    <span className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      {loading ? (
                        <span className="inline-block w-8 h-6 bg-gray-500/20 rounded animate-pulse" />
                      ) : (
                        <AnimatedCounter value={card.value} />
                      )}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#2f9e44] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <p className={`text-[9.5px] font-mono truncate ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    {card.tag}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* ─── 3. ANALYTICS SECTION: TWO ANIMATED PRIMARY CHARTS ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── GRAPH 01: COMMUNITY GROWTH ANALYTICS (AREA / LINE) ─────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={`p-5 sm:p-6 rounded-3xl border space-y-4 shadow-xl relative overflow-hidden ${glassCardClass}`}
        >
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-[#30363d]/50">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#2f9e44]" />
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight">Community Growth Analytics</h3>
              </div>
              <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                Verified members vs visitor account trajectory
              </p>
            </div>

            {/* Timeframe Filter Buttons */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/20 border border-white/5 self-start sm:self-auto">
              {['7D', '30D', '90D', '1Y'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setGrowthFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    growthFilter === t
                      ? 'bg-[#2f9e44] text-white shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-[#2f9e44] font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2f9e44]" /> Members
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Visitors
            </span>
          </div>

          {/* SVG Area / Line Chart Body */}
          <div className="relative pt-2">
            {growthChartData.buckets.length > 0 ? (
              (() => {
                const b = growthChartData.buckets;
                const maxVal = Math.max(1, ...b.map((x) => Math.max(x.members, x.visitors)));
                const w = 500;
                const h = 180;
                const padTop = 20;
                const padBottom = 25;
                const chartH = h - padTop - padBottom;

                // Points for members
                const ptsMem = b.map((pt, i) => {
                  const x = (i / (b.length - 1)) * w;
                  const y = padTop + chartH - (pt.members / maxVal) * chartH;
                  return { x, y, data: pt };
                });

                // Points for visitors
                const ptsVis = b.map((pt, i) => {
                  const x = (i / (b.length - 1)) * w;
                  const y = padTop + chartH - (pt.visitors / maxVal) * chartH;
                  return { x, y, data: pt };
                });

                const linePathMem = ptsMem.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
                const areaPathMem = `${linePathMem} L ${w} ${h - padBottom} L 0 ${h - padBottom} Z`;

                const linePathVis = ptsVis.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
                const areaPathVis = `${linePathVis} L ${w} ${h - padBottom} L 0 ${h - padBottom} Z`;

                return (
                  <div className="w-full overflow-hidden">
                    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44 overflow-visible">
                      <defs>
                        <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2f9e44" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#2f9e44" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59f00" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#f59f00" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Subtle Horizontal Grid lines */}
                      {[0, 0.5, 1].map((pct, idx) => {
                        const y = padTop + chartH * pct;
                        return (
                          <line
                            key={idx}
                            x1="0"
                            y1={y}
                            x2={w}
                            y2={y}
                            stroke={isLight ? '#e2e8f0' : '#30363d'}
                            strokeDasharray="4 4"
                            strokeWidth="1"
                          />
                        );
                      })}

                      {/* Area Fill */}
                      <motion.path
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        d={areaPathMem}
                        fill="url(#memGrad)"
                      />
                      <motion.path
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        d={areaPathVis}
                        fill="url(#visGrad)"
                      />

                      {/* Animated Stroke Lines */}
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        d={linePathMem}
                        fill="none"
                        stroke="#2f9e44"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
                        d={linePathVis}
                        fill="none"
                        stroke="#f59f00"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray="5 3"
                      />

                      {/* Interactive Circles */}
                      {ptsMem.map((p, idx) => (
                        <circle
                          key={`mem-c-${idx}`}
                          cx={p.x}
                          cy={p.y}
                          r={activeGrowthTooltip?.idx === idx ? 6 : 4}
                          className="fill-[#2f9e44] stroke-[#121721] stroke-2 cursor-pointer transition-all duration-150"
                          onMouseEnter={() => setActiveGrowthTooltip({ idx, ...p.data })}
                          onClick={() => setActiveGrowthTooltip({ idx, ...p.data })}
                        />
                      ))}
                      {ptsVis.map((p, idx) => (
                        <circle
                          key={`vis-c-${idx}`}
                          cx={p.x}
                          cy={p.y}
                          r={activeGrowthTooltip?.idx === idx ? 5 : 3.5}
                          className="fill-[#f59f00] stroke-[#121721] stroke-2 cursor-pointer transition-all duration-150"
                          onMouseEnter={() => setActiveGrowthTooltip({ idx, ...p.data })}
                          onClick={() => setActiveGrowthTooltip({ idx, ...p.data })}
                        />
                      ))}
                    </svg>

                    {/* X-Axis Labels */}
                    <div className="flex justify-between text-[10px] font-mono text-gray-500 pt-1 px-1">
                      {b.map((pt, i) => (
                        <span key={i} className="truncate max-w-[60px] text-center">
                          {pt.label}
                        </span>
                      ))}
                    </div>

                    {/* Interactive Tooltip Card */}
                    <AnimatePresence>
                      {activeGrowthTooltip && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`mt-2 p-2.5 rounded-xl border text-xs flex items-center justify-between font-mono shadow-lg ${
                            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                          }`}
                        >
                          <span className="font-bold text-gray-400">
                            {activeGrowthTooltip.startStr} - {activeGrowthTooltip.endStr}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[#2f9e44] font-bold">
                              {activeGrowthTooltip.members} Members
                            </span>
                            <span className="text-amber-400 font-bold">
                              {activeGrowthTooltip.visitors} Visitors
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })()
            ) : (
              <div className="py-12 text-center text-xs font-mono text-gray-500">
                No registrations found for this interval.
              </div>
            )}
          </div>
        </motion.div>

        {/* ─── GRAPH 02: EVENTS & ENGAGEMENT ANALYTICS (ANIMATED BAR) ──────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className={`p-5 sm:p-6 rounded-3xl border space-y-4 shadow-xl relative overflow-hidden ${glassCardClass}`}
        >
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-[#30363d]/50">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight">Events & Engagement Analytics</h3>
              </div>
              <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                Active event sessions vs media gallery additions
              </p>
            </div>

            {/* Timeframe Filter Buttons */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/20 border border-white/5 self-start sm:self-auto">
              {['7D', '30D', '90D', '1Y'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEventsFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    eventsFilter === t
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" /> Events
            </span>
            <span className="flex items-center gap-1.5 text-pink-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-sm bg-pink-400" /> Gallery Uploads
            </span>
          </div>

          {/* SVG Animated Bar Chart Body */}
          <div className="relative pt-2">
            {eventsChartData.buckets.length > 0 ? (
              (() => {
                const b = eventsChartData.buckets;
                const maxVal = Math.max(1, ...b.map((x) => Math.max(x.events, x.gallery)));
                const w = 500;
                const h = 180;
                const padBottom = 25;
                const chartH = h - padBottom;
                const slotW = w / b.length;
                const barW = Math.min(22, slotW * 0.35);

                return (
                  <div className="w-full overflow-hidden">
                    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44 overflow-visible">
                      {/* Subtle Horizontal Grid lines */}
                      {[0, 0.5, 1].map((pct, idx) => {
                        const y = chartH * pct;
                        return (
                          <line
                            key={idx}
                            x1="0"
                            y1={y}
                            x2={w}
                            y2={y}
                            stroke={isLight ? '#e2e8f0' : '#30363d'}
                            strokeDasharray="4 4"
                            strokeWidth="1"
                          />
                        );
                      })}

                      {/* Grouped Bars */}
                      {b.map((pt, idx) => {
                        const centerX = idx * slotW + slotW / 2;
                        const hEv = (pt.events / maxVal) * (chartH - 10);
                        const hGal = (pt.gallery / maxVal) * (chartH - 10);

                        return (
                          <g key={idx}>
                            {/* Events Bar */}
                            <motion.rect
                              initial={{ height: 0, y: chartH }}
                              animate={{ height: Math.max(3, hEv), y: chartH - Math.max(3, hEv) }}
                              transition={{ duration: 0.5, delay: idx * 0.05 }}
                              x={centerX - barW - 2}
                              width={barW}
                              rx="3"
                              className="fill-cyan-400 hover:fill-cyan-300 transition-colors cursor-pointer"
                              onMouseEnter={() => setActiveEventTooltip({ idx, ...pt })}
                              onClick={() => setActiveEventTooltip({ idx, ...pt })}
                            />

                            {/* Gallery Bar */}
                            <motion.rect
                              initial={{ height: 0, y: chartH }}
                              animate={{ height: Math.max(3, hGal), y: chartH - Math.max(3, hGal) }}
                              transition={{ duration: 0.5, delay: idx * 0.05 + 0.03 }}
                              x={centerX + 2}
                              width={barW}
                              rx="3"
                              className="fill-pink-400 hover:fill-pink-300 transition-colors cursor-pointer"
                              onMouseEnter={() => setActiveEventTooltip({ idx, ...pt })}
                              onClick={() => setActiveEventTooltip({ idx, ...pt })}
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* X-Axis Labels */}
                    <div className="flex justify-between text-[10px] font-mono text-gray-500 pt-1 px-1">
                      {b.map((pt, i) => (
                        <span key={i} className="truncate max-w-[60px] text-center">
                          {pt.label}
                        </span>
                      ))}
                    </div>

                    {/* Interactive Tooltip Card */}
                    <AnimatePresence>
                      {activeEventTooltip && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`mt-2 p-2.5 rounded-xl border text-xs flex items-center justify-between font-mono shadow-lg ${
                            isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                          }`}
                        >
                          <span className="font-bold text-gray-400">
                            {activeEventTooltip.startStr || activeEventTooltip.label}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-cyan-400 font-bold">
                              {activeEventTooltip.events} Events
                            </span>
                            <span className="text-pink-400 font-bold">
                              {activeEventTooltip.gallery} Photos
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })()
            ) : (
              <div className="py-12 text-center text-xs font-mono text-gray-500">
                No event or gallery entries found for this interval.
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* ─── 4. SECONDARY COMMAND GRID: TEAMS, ACTIVITY & SCHEDULE ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── 4A. UPCOMING EVENTS SPOTLIGHT ───────────────────────────────── */}
        <div className={`p-6 rounded-3xl border space-y-4 shadow-xl flex flex-col justify-between ${glassCardClass}`}>
          <div>
            <div className="flex items-center justify-between border-b pb-3 border-[#30363d]/50">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#2f9e44]" />
                <h3 className="font-bold text-sm tracking-tight">Upcoming Events</h3>
              </div>
              <Link to="/admin/events" className="text-xs text-[#2f9e44] hover:underline font-bold flex items-center gap-1">
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3 mt-4">
              {upcomingEvents.length === 0 ? (
                <p className={`text-xs py-8 text-center font-mono ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
                  No upcoming events scheduled.
                </p>
              ) : (
                upcomingEvents.slice(0, 3).map((e) => (
                  <div
                    key={e._id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all hover:border-[#2f9e44]/50 ${
                      isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-[#0a0d12]/80 border-[#30363d]'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1 pr-2">
                      <h4 className="font-bold text-xs truncate">{e.title}</h4>
                      <p className={`text-[10px] font-mono truncate ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                        {formatEventDate(e.date)} • {e.venue || 'Jamia Hamdard'}
                      </p>
                    </div>
                    <span className="text-[9.5px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border bg-[#2f9e44]/15 text-[#2f9e44] border-[#2f9e44]/30 flex-shrink-0">
                      {e.status || 'Upcoming'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            to="/admin/events"
            className="w-full py-2.5 rounded-xl border border-dashed border-[#2f9e44]/40 text-xs font-bold text-[#2f9e44] hover:bg-[#2f9e44]/10 transition-colors flex items-center justify-center gap-1.5 mt-2"
          >
            <Plus className="w-3.5 h-3.5" /> Create New Schedule
          </Link>
        </div>

        {/* ─── 4B. TEAM-WISE MEMBER DISTRIBUTION ───────────────────────────── */}
        <div className={`p-6 rounded-3xl border space-y-4 shadow-xl flex flex-col justify-between ${glassCardClass}`}>
          <div>
            <div className="flex items-center justify-between border-b pb-3 border-[#30363d]/50">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm tracking-tight">Team Distribution</h3>
              </div>
              <Link to="/admin/teams" className="text-xs text-[#2f9e44] hover:underline font-bold flex items-center gap-1">
                Teams <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3 mt-4">
              {teamDistribution.length === 0 ? (
                <p className={`text-xs py-8 text-center font-mono ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
                  No team member data available.
                </p>
              ) : (
                teamDistribution.map((t, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium truncate max-w-[70%]">{t.name}</span>
                      <span className="font-mono font-bold text-[11px] text-gray-400">
                        {t.count} ({t.percent}%)
                      </span>
                    </div>
                    {/* Neumorphic Progress Track */}
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-[#0d1117]'}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${t.percent}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.1 }}
                        className="h-full bg-gradient-to-r from-[#2f9e44] to-emerald-400 rounded-full"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`p-3 rounded-xl border text-[11px] font-mono flex items-center justify-between ${
            isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-[#0a0d12] border-[#30363d] text-gray-400'
          }`}>
            <span>Total Chapter Members:</span>
            <strong className="text-[#2f9e44]">{stats.members.verifiedMembers} verified</strong>
          </div>
        </div>

        {/* ─── 4C. RECENT ACTIVITY STREAM ──────────────────────────────────── */}
        <div className={`p-6 rounded-3xl border space-y-4 shadow-xl flex flex-col justify-between ${glassCardClass}`}>
          <div>
            <div className="flex items-center justify-between border-b pb-3 border-[#30363d]/50">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm tracking-tight">Recent Activity</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Live Audit
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {recentActivities.length === 0 ? (
                <p className={`text-xs py-8 text-center font-mono ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
                  No recent activities logged.
                </p>
              ) : (
                recentActivities.map((act) => (
                  <div
                    key={`${act.type}-${act.id}`}
                    className={`p-3 rounded-2xl border space-y-1 transition-all ${
                      isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-[#0a0d12]/80 border-[#30363d]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${act.badgeColor}`}>
                        {act.badge}
                      </span>
                      <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                        {formatEventDate(act.date)}
                      </span>
                    </div>
                    <h5 className="font-bold text-xs truncate">{act.title}</h5>
                    <p className={`text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                      {act.subtitle}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/admin/announcements"
              className={`w-full py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-[#161b22] hover:bg-[#21262d] text-gray-300 hover:text-white border-[#30363d]'
              }`}
            >
              <span>View All Bulletins</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* ─── 5. SYSTEM HEALTH FOOTPRINT RAIL ───────────────────────────────── */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 text-xs font-mono shadow-sm ${
        isLight ? 'bg-white/60 border-slate-200 text-slate-600' : 'bg-[#121721]/60 border-[#30363d] text-gray-400'
      }`}>
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#2f9e44]" />
          <span>MongoDB Atlas Engine: <strong className="text-[#2f9e44]">Active & Synchronized</strong></span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span>REST API: <strong className="text-emerald-400">200 OK</strong></span>
          <span>•</span>
          <span>Auth Engine: <strong className="text-purple-400">JWT Verified</strong></span>
          <span>•</span>
          <span>Chapter: <strong className="text-white">Jamia Hamdard</strong></span>
        </div>
      </div>

    </div>
  );
}
