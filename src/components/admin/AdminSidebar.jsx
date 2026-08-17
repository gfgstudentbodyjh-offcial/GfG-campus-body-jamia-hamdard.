import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Bell, MessageSquare, Sliders, ImageIcon,
  BookOpen, Award, Shield, Layers, Users, UserCheck, ShieldCheck, ChevronRight, Sun, Moon, Sparkles, Rocket
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar({ isLight, toggleTheme }) {
  const location = useLocation();
  const { logout = () => {}, user = null } = useAuth() || {};

  const activeNavGroups = [
    {
      group: 'Overview',
      items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, isV1: true }
      ]
    },
    {
      group: 'Security',
      items: [
        { name: 'Administrators', path: '/admin/administrators', icon: ShieldCheck, isV1: true }
      ]
    },
    {
      group: 'Leadership & Teams',
      items: [
        { name: 'Teams & Leads', path: '/admin/teams', icon: Layers, isV1: true },
        { name: 'Campus Mantri', path: '/admin/mantri', icon: Award, isV1: true }
      ]
    },
    {
      group: 'Content & Media',
      items: [
        { name: 'Events Manager', path: '/admin/events', icon: Calendar, isV1: true },
        { name: 'Latest Announcements', path: '/admin/announcements', icon: Bell, isV1: true },
        { name: 'Gallery Manager', path: '/admin/gallery', icon: ImageIcon, isV1: true },
        { name: 'Resources Manager', path: '/admin/resources', icon: BookOpen, isV1: true }
      ]
    },
    {
      group: 'Community',
      items: [
        { name: 'Member Directory', path: '/admin/members', icon: Users, isV1: true },
        { name: 'Community Moderation', path: '/admin/feed-moderation', icon: MessageSquare, isV1: true }
      ]
    },
    {
      group: 'System Settings',
      items: [
        { name: 'Launch Countdown', path: '/admin/launch-settings', icon: Rocket, isV1: true },
        { name: 'Faculty Coordinators', path: '/admin/faculty', icon: Award, disabled: true },
        { name: 'Homepage Copy', path: '/admin/hero-settings', icon: Sliders, disabled: true }
      ]
    }
  ];

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`w-64 border-r flex flex-col h-screen sticky top-0 z-40 transition-colors ${
      isLight ? 'bg-white border-gray-200 text-gray-800' : 'bg-[#0d1117] border-[#30363d] text-gray-100'
    }`}>
      
      {/* Brand Header */}
      <div className={`p-5 border-b flex items-center justify-between ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1b5e20] to-[#2f9e44] p-0.5 shadow-md">
            <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isLight ? 'bg-white' : 'bg-[#0d1117]'}`}>
              <Sparkles className="w-4 h-4 text-[#2f9e44]" />
            </div>
          </div>
          <div>
            <h2 className={`font-extrabold text-sm tracking-wide ${isLight ? 'text-gray-900' : 'text-white'}`}>GFG Admin OS</h2>
            <p className="text-[10px] text-[#2f9e44] font-bold">V1 Console • Jamia Hamdard</p>
          </div>
        </div>
      </div>

      {/* Nav Menu Groups */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {activeNavGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className={`px-3 text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>
              {group.group}
            </h3>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              if (item.disabled) {
                return (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-not-allowed opacity-50 ${
                      isLight ? 'text-gray-400' : 'text-gray-500'
                    }`}
                    title="Coming Soon in Phase 2"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-500 font-semibold">
                      Soon
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[#2f9e44] text-white shadow-md shadow-green-900/30'
                      : isLight
                      ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      : 'text-gray-400 hover:text-white hover:bg-[#161b22]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : isLight ? 'text-gray-500' : 'text-gray-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {active && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Admin User & Theme Toggle Footer */}
      <div className={`p-4 border-t flex items-center justify-between ${
        isLight ? 'bg-gray-50 border-gray-200' : 'bg-[#161b22] border-[#30363d]'
      }`}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-[#2f9e44]/20 border border-[#2f9e44] flex items-center justify-center text-xs font-bold text-[#2f9e44]">
            {user?.username?.charAt(0) || 'A'}
          </div>
          <div className="truncate">
            <p className={`text-xs font-bold truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{user?.username || 'Super Admin'}</p>
            <p className="text-[10px] text-gray-500 truncate">{user?.email || 'admin@gfgcampus.org'}</p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className={`p-2 rounded-xl border transition-colors ${
            isLight ? 'bg-white text-amber-600 border-gray-200 hover:bg-gray-100' : 'bg-[#0d1117] text-yellow-400 border-[#30363d] hover:bg-[#18202c]'
          }`}
        >
          {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

    </aside>
  );
}
