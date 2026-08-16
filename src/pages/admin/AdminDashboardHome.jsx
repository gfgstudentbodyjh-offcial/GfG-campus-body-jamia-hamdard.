import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Bell, MessageSquare, AlertTriangle, Plus, ArrowUpRight,
  CheckCircle2, Sparkles, Flag, Pin, Users, ImageIcon, BookOpen, Clock, UserCheck
} from 'lucide-react';
import api from '../../services/api';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { formatEventDate } from '../../utils/dateUtils';

export default function AdminDashboardHome() {
  const { isLight } = useAdminTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    members: { totalAccounts: 0, visitors: 0, verifiedMembers: 0, pending: 0 },
    events: { total: 0, upcoming: 0, completed: 0 },
    gallery: { photos: 0 },
    resources: { total: 0, published: 0 },
    moderation: { reported: 0, underReview: 0 },
    announcements: { published: 0 }
  });

  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    loadDashboardData(true);
  }, []);

  const loadDashboardData = async (isInitial = false) => {
    if (isInitial && !stats.members.totalAccounts) {
      setLoading(true);
    }
    setError(null);
    try {
      const [statsRes, eventsRes, annRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/events'),
        api.get('/announcements')
      ]);

      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
      }
      setEvents(eventsRes.data?.data || []);
      setAnnouncements(annRes.data?.data || []);
    } catch (err) {
      console.warn('[Admin Dashboard] Live data fetch error:', err);
      if (!stats.members.totalAccounts) {
        setError('Failed to sync live MongoDB statistics.');
      }
    } finally {
      setLoading(false);
    }
  };

  const upcomingEvents = events.filter(e => e.status !== 'Completed');

  const metricCards = [
    { title: 'Total Accounts', value: stats.members.totalAccounts || 0, icon: Users, link: '/admin/members', color: 'text-purple-500' },
    { title: 'Visitors', value: stats.members.visitors || 0, icon: Clock, link: '/admin/members?role=Visitors', color: 'text-amber-500' },
    { title: 'Verified Members', value: stats.members.verifiedMembers || 0, icon: UserCheck, link: '/admin/members?role=Members', color: 'text-[#2f9e44]' },
    { title: 'Total Events', value: stats.events.total || 0, icon: Calendar, link: '/admin/events', color: 'text-[#2f9e44]' },
    { title: 'Gallery Photos', value: stats.gallery.photos || 0, icon: ImageIcon, link: '/admin/gallery', color: 'text-pink-500' },
    { title: 'Needs Review', value: stats.moderation.reported || 0, icon: AlertTriangle, link: '/admin/feed-moderation', color: 'text-red-500' }
  ];

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors shadow-sm ${
        isLight
          ? 'bg-gradient-to-r from-emerald-50 via-white to-green-50 border-emerald-200 text-slate-900'
          : 'bg-gradient-to-r from-[#161b22] via-[#0d1117] to-[#142e16] border-[#2f9e44]/40 text-white'
      }`}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2f9e44]">
            <Sparkles className="w-4 h-4" /> GFG Campus Real-Time MongoDB Control Center
          </div>
          <h1 className={`text-2xl sm:text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Admin Control Center
          </h1>
          <p className={`text-xs sm:text-sm max-w-xl ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
            Live synchronization for Member Directory, Visitors Approval, Events, Gallery, Resources, and Community Moderation.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/admin/members" className="px-4 py-2.5 rounded-xl gradient-button text-xs font-bold flex items-center gap-2 shadow-md">
            <Users className="w-4 h-4" /> Member Directory
          </Link>
          <button
            onClick={loadDashboardData}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors shadow-sm ${
              isLight ? 'bg-white text-slate-800 border-gray-300 hover:bg-gray-100' : 'bg-[#21262d] text-white hover:bg-[#30363d] border-[#30363d]'
            }`}
          >
            ↻ Refresh Metrics
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadDashboardData} className="px-3 py-1 rounded-lg bg-amber-500 text-black font-bold">
            Try Again
          </button>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 group shadow-sm ${
                isLight
                  ? 'bg-white border-gray-200 hover:border-[#2f9e44] text-slate-900'
                  : 'bg-[#121721] border-[#30363d] hover:border-[#2f9e44] text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold uppercase ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{card.title}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {loading ? '...' : card.value}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#2f9e44] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Dashboard Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Events Spotlight */}
        <div className={`p-6 rounded-2xl border space-y-4 shadow-sm transition-colors ${
          isLight ? 'bg-white border-gray-200' : 'bg-[#121721] border-[#30363d]'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-gray-200' : 'border-gray-700/50'}`}>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2f9e44]" />
              <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Upcoming Events Schedule</h3>
            </div>
            <Link to="/admin/events" className="text-xs text-[#2f9e44] hover:underline font-bold">Manage All →</Link>
          </div>

          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className={`text-xs py-6 text-center ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>No upcoming events scheduled.</p>
            ) : (
              upcomingEvents.slice(0, 3).map((e) => (
                <div key={e._id} className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                  isLight ? 'bg-slate-50 border-gray-200' : 'bg-[#0a0d12] border-[#30363d]'
                }`}>
                  <div className="space-y-0.5">
                    <h4 className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{e.title}</h4>
                    <p className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{formatEventDate(e.date)} • {e.venue || 'Jamia Hamdard'}</p>
                  </div>
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                    isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#2f9e44]/15 text-[#2f9e44] border-[#2f9e44]/30'
                  }`}>
                    {e.status || 'Upcoming'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Announcements */}
        <div className={`p-6 rounded-2xl border space-y-4 shadow-sm transition-colors ${
          isLight ? 'bg-white border-gray-200' : 'bg-[#121721] border-[#30363d]'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-gray-200' : 'border-gray-700/50'}`}>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-500" />
              <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Recent Latest Announcements</h3>
            </div>
            <Link to="/admin/announcements" className="text-xs text-[#2f9e44] hover:underline font-bold">Manage All →</Link>
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <p className={`text-xs py-6 text-center ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>No published announcements.</p>
            ) : (
              announcements.slice(0, 3).map((a) => (
                <div key={a._id} className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                  isLight ? 'bg-slate-50 border-gray-200' : 'bg-[#0a0d12] border-[#30363d]'
                }`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold text-sky-600 bg-sky-50 border border-sky-200 uppercase px-1.5 py-0.5 rounded">
                        {a.type || 'Announcement'}
                      </span>
                      {a.isPinned && <Pin className="w-3 h-3 text-[#2f9e44] fill-[#2f9e44]" />}
                    </div>
                    <h4 className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{a.title}</h4>
                  </div>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{formatEventDate(a.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
