import React, { useState, useEffect, useRef } from 'react';
import { useAdminTheme } from '../../context/AdminThemeContext';
import api from '../../services/api';
import cacheService from '../../services/cacheService';
import { OFFICIAL_ROLE_GROUPS } from '../../config/officialRoles';
import RoleBadge from '../../components/common/RoleBadge';
import ViewToggle from '../../components/admin/ViewToggle';
import { formatEventDate } from '../../utils/dateUtils';
import {
  Users, UserCheck, Sparkles, Search, Filter, ChevronLeft, ChevronRight,
  Eye, Download, RefreshCw, X, ShieldAlert, ShieldCheck, Mail, Phone,
  Calendar, BookOpen, MessageSquare, Heart, Bookmark, Flag, CheckCircle2,
  Building, User as UserIcon
} from 'lucide-react';

export default function UserDirectoryAdmin() {
  const { isLight } = useAdminTheme();

  // Summary Metrics State
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newThisMonth: 0,
    contributors: 0
  });

  // Table Data & Pagination State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  // Grid / List View Toggle State
  const [userViewMode, setUserViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_view_user_directory');
      if (saved === 'grid' || saved === 'list') return saved;
    } catch (e) {}
    return 'grid';
  });

  const handleUserViewChange = (mode) => {
    setUserViewMode(mode);
    try {
      localStorage.setItem('admin_view_user_directory', mode);
    } catch (e) {}
  };

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // User Details Drawer / Modal State
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load summary stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  // Fetch paginated user list on filter/page change
  useEffect(() => {
    loadUsers(pagination.page, users.length === 0);
  }, [debouncedSearch, roleFilter, statusFilter, pagination.page]);

  const loadStats = async () => {
    try {
      const res = await api.get('/admin/users/stats');
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.warn('Failed loading user stats:', err);
    }
  };

  const loadUsers = async (page = 1, isInitial = false) => {
    if (isInitial && users.length === 0) {
      setLoading(true);
    }
    try {
      const res = await api.get('/admin/users', {
        params: {
          page,
          limit: pagination.limit,
          search: debouncedSearch,
          role: roleFilter,
          status: statusFilter
        }
      });

      if (res.data?.success) {
        setUsers(res.data.users || res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.warn('Failed loading user directory:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open User Details Drawer & Fetch Detailed Activity
  const handleViewDetails = async (userId) => {
    setSelectedUserId(userId);
    setLoadingDetail(true);
    setSelectedUserDetail(null);
    setUserActivity(null);

    try {
      const [detailRes, activityRes] = await Promise.all([
        api.get(`/admin/users/${userId}`),
        api.get(`/admin/users/${userId}/activity`)
      ]);

      if (detailRes.data?.user) {
        setSelectedUserDetail(detailRes.data.user);
      }
      if (activityRes.data) {
        setUserActivity({
          counts: activityRes.data.activity || {},
          recentLogs: activityRes.data.recentLogs || []
        });
      }
    } catch (err) {
      console.warn('Failed loading user detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!users || users.length === 0) return;

    const headers = ['Name', 'Username', 'Email', 'Phone', 'Community Role', 'Department', 'Joined Date', 'Status'];
    const rows = users.map(u => [
      `"${u.name || ''}"`,
      `"${u.username || ''}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.communityRole || ''}"`,
      `"${u.department || ''}"`,
      `"${u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : ''}"`,
      `"${u.status || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gfg_user_directory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-6 font-sans ${isLight ? 'text-slate-900' : 'text-gray-100'}`}>
      
      {/* Top Header Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors shadow-sm ${
        isLight
          ? 'bg-gradient-to-r from-emerald-50 via-white to-green-50 border-emerald-200 text-slate-900'
          : 'bg-gradient-to-r from-[#161b22] via-[#0d1117] to-[#142e16] border-[#2f9e44]/40 text-white'
      }`}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2f9e44]">
            <Sparkles className="w-4 h-4" /> USER MANAGEMENT MODULE
          </div>
          <h1 className={`text-2xl sm:text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
            User Directory
          </h1>
          <p className={`text-xs sm:text-sm max-w-xl ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
            Inspect registered platform user accounts, community roles, activity engagement, and profile data in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition-colors shadow-sm ${
              isLight ? 'bg-white text-slate-800 border-gray-300 hover:bg-gray-100' : 'bg-[#21262d] text-white hover:bg-[#30363d] border-[#30363d]'
            }`}
          >
            <Download className="w-4 h-4 text-[#2f9e44]" /> Export Users CSV
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Total Users */}
        <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm transition-colors ${
          isLight ? 'bg-white border-gray-200' : 'bg-[#121721] border-[#30363d]'
        }`}>
          <div>
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              REGISTERED USERS
            </span>
            <span className={`text-2xl sm:text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {stats.totalUsers}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active Users */}
        <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm transition-colors ${
          isLight ? 'bg-white border-gray-200' : 'bg-[#121721] border-[#30363d]'
        }`}>
          <div>
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              ACTIVE USERS
            </span>
            <span className={`text-2xl sm:text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {stats.activeUsers}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-[#2f9e44]/10 text-[#2f9e44] border border-[#2f9e44]/20">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* New This Month */}
        <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm transition-colors ${
          isLight ? 'bg-white border-gray-200' : 'bg-[#121721] border-[#30363d]'
        }`}>
          <div>
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              NEW THIS MONTH
            </span>
            <span className={`text-2xl sm:text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {stats.newThisMonth}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Community Contributors */}
        <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm transition-colors ${
          isLight ? 'bg-white border-gray-200' : 'bg-[#121721] border-[#30363d]'
        }`}>
          <div>
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              CONTRIBUTORS
            </span>
            <span className={`text-2xl sm:text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {stats.contributors}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Toolbar: Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Search name, @username, email, phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium border focus:outline-none focus:border-[#2f9e44] ${
              isLight ? 'bg-white border-gray-300 text-slate-900 placeholder-gray-400 shadow-sm' : 'bg-[#121721] border-[#30363d] text-white placeholder-gray-500'
            }`}
          />
        </div>

        {/* Filters & ViewToggle */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className={`rounded-xl px-3 py-2 text-xs font-semibold border focus:outline-none focus:border-[#2f9e44] ${
              isLight ? 'bg-white border-gray-300 text-slate-800' : 'bg-[#121721] border-[#30363d] text-white'
            }`}
          >
            <option value="All">All Roles</option>
            {OFFICIAL_ROLE_GROUPS.map(g => (
              <optgroup key={g.group} label={g.group}>
                {g.roles.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={`rounded-xl px-3 py-2 text-xs font-semibold border focus:outline-none focus:border-[#2f9e44] ${
              isLight ? 'bg-white border-gray-300 text-slate-800' : 'bg-[#121721] border-[#30363d] text-white'
            }`}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>

          {/* View Toggle */}
          <ViewToggle
            viewMode={userViewMode}
            onChange={handleUserViewChange}
          />
        </div>

      </div>

      {/* Users Container (Grid or Table) */}
      <div className={`rounded-2xl border overflow-hidden transition-colors ${
        isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#121721] border-[#30363d]'
      }`}>
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-gray-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#2f9e44]" />
            <span>Loading user accounts from MongoDB...</span>
          </div>
        ) : users.length === 0 ? (
          <div className={`p-12 text-center space-y-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
            <p className="text-sm font-bold">No registered users found</p>
            <p className="text-xs">Try adjusting your search keywords or active filters.</p>
          </div>
        ) : userViewMode === 'grid' ? (
          <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {users.map((u) => (
              <div
                key={u._id}
                className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all duration-200 hover:shadow-md ${
                  isLight
                    ? 'bg-white border-gray-200 hover:border-[#2f9e44]/60 shadow-xs'
                    : 'bg-[#0d1117] border-[#30363d] hover:border-[#2f9e44]/50'
                }`}
              >
                {/* Profile Header */}
                <div className="flex items-start gap-3.5">
                  <img
                    src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=2f9e44&color=fff`}
                    alt={u.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#2f9e44] flex-shrink-0 shadow-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-sm font-extrabold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {u.name}
                    </h4>
                    <p className={`text-xs font-mono truncate mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                      @{u.username}
                    </p>
                    {u.userCode && (
                      <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-bold mt-1">
                        {u.userCode}
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact & Meta */}
                <div className={`p-2.5 rounded-xl border text-xs font-mono space-y-1 ${
                  isLight ? 'bg-gray-50 text-slate-700 border-gray-200' : 'bg-[#161b22] text-gray-300 border-[#30363d]/80'
                }`}>
                  <p className="truncate">✉️ {u.email}</p>
                  {u.phone && <p className="truncate">📞 {u.phone}</p>}
                </div>

                {/* Role Badge & Status */}
                <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                  <RoleBadge role={u.communityRole} size="sm" />
                  <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold ${
                    u.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      u.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`} />
                    {u.status}
                  </span>
                </div>

                {/* Action Footer */}
                <div className="pt-3 border-t border-gray-200 dark:border-[#30363d]/80 flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    Joined: {formatEventDate(u.joinedAt)}
                  </span>
                  <button
                    onClick={() => handleViewDetails(u._id)}
                    className="py-1.5 px-3 rounded-xl bg-[#2f9e44]/15 hover:bg-[#2f9e44] text-[#2f9e44] hover:text-white font-bold text-xs border border-[#2f9e44]/30 transition-all flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b text-[10px] font-mono uppercase ${
                  isLight ? 'border-gray-200 text-slate-600 bg-gray-50' : 'border-[#30363d] text-gray-400 bg-[#0d1117]/60'
                }`}>
                  <th className="py-3.5 px-4 font-bold">User</th>
                  <th className="py-3.5 px-4 font-bold">Email</th>
                  <th className="py-3.5 px-4 font-bold">Phone</th>
                  <th className="py-3.5 px-4 font-bold">Community Role</th>
                  <th className="py-3.5 px-4 font-bold">Department/Branch</th>
                  <th className="py-3.5 px-4 font-bold">Joined</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-gray-200' : 'divide-[#30363d]/60'}`}>
                {users.map((u) => (
                  <tr key={u._id} className={isLight ? 'hover:bg-slate-50 transition-colors' : 'hover:bg-[#18202c]/50 transition-colors'}>
                    {/* User Column */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=2f9e44&color=fff`}
                          alt=""
                          className={`w-8 h-8 rounded-full object-cover border ${isLight ? 'border-gray-300' : 'border-[#30363d]'}`}
                        />
                        <div>
                          <p className={`font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{u.name}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>@{u.username}</span>
                            {u.userCode && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-mono text-[9px] font-bold">
                                {u.userCode}
                              </span>
                            )}
                            {!u.profileComplete && (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Profile Incomplete
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className={`py-3 px-4 font-mono text-[11px] ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                      {u.email}
                    </td>

                    {/* Phone */}
                    <td className={`py-3 px-4 font-mono text-[11px] ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                      {u.phone || '—'}
                    </td>

                    {/* Role Badge */}
                    <td className="py-3 px-4">
                      <RoleBadge role={u.communityRole} size="sm" />
                    </td>

                    {/* Department */}
                    <td className={`py-3 px-4 text-[11px] ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                      {u.department}
                    </td>

                    {/* Joined Date */}
                    <td className={`py-3 px-4 font-mono text-[11px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                      {formatEventDate(u.joinedAt)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold ${
                        u.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          u.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                        }`} />
                        {u.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleViewDetails(u._id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 ml-auto transition-colors ${
                          isLight
                            ? 'bg-white border-gray-300 text-slate-800 hover:bg-gray-100'
                            : 'bg-[#18202c] border-[#30363d] text-gray-200 hover:text-white'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5 text-[#2f9e44]" /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between font-mono text-xs pt-2">
          <span className={isLight ? 'text-slate-600' : 'text-gray-400'}>
            Page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong> ({pagination.total} total)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => loadUsers(pagination.page - 1)}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                isLight ? 'bg-white border-gray-300 text-slate-700' : 'bg-[#121721] border-[#30363d] text-gray-300'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>

            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => loadUsers(pagination.page + 1)}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                isLight ? 'bg-white border-gray-300 text-slate-700' : 'bg-[#121721] border-[#30363d] text-gray-300'
              }`}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* USER DETAILS DRAWER / MODAL */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-end">
          <div className={`w-full max-w-xl h-full overflow-y-auto p-6 space-y-6 shadow-2xl transition-colors border-l ${
            isLight ? 'bg-white border-gray-200 text-slate-900' : 'bg-[#121721] border-[#30363d] text-white'
          }`}>
            
            {/* Header */}
            <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-[#2f9e44]" />
                <h3 className={`font-extrabold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>Administrative User Details</h3>
              </div>
              <button onClick={() => setSelectedUserId(null)} className={isLight ? 'text-gray-400 hover:text-slate-700' : 'text-gray-400 hover:text-white'}>
                <X className="w-6 h-6" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="p-12 text-center text-xs font-mono text-gray-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#2f9e44]" />
                <span>Loading account details...</span>
              </div>
            ) : selectedUserDetail ? (
              <div className="space-y-6">
                
                {/* Profile Banner Card */}
                <div className={`p-5 rounded-2xl border space-y-4 ${
                  isLight ? 'bg-slate-50 border-gray-200' : 'bg-[#0d1117] border-[#30363d]'
                }`}>
                  <div className="flex items-start gap-4">
                    <img
                      src={selectedUserDetail.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUserDetail.name)}&background=2f9e44&color=fff`}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#2f9e44]"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className={`text-lg font-black leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {selectedUserDetail.name}
                      </h4>
                      <p className="text-xs font-mono text-gray-400">@{selectedUserDetail.username}</p>
                      <RoleBadge role={selectedUserDetail.communityRole} />
                    </div>
                  </div>
                </div>

                {/* Profile & Account Information Grid */}
                <div className="space-y-3">
                  <h5 className={`text-xs font-mono font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    PROFILE & ACCOUNT INFORMATION
                  </h5>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-gray-200' : 'bg-[#18202c] border-[#30363d]'}`}>
                      <span className="text-[10px] font-mono text-gray-400 uppercase block">Email Address</span>
                      <span className="font-bold font-mono text-xs">{selectedUserDetail.email}</span>
                    </div>

                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-gray-200' : 'bg-[#18202c] border-[#30363d]'}`}>
                      <span className="text-[10px] font-mono text-gray-400 uppercase block">Phone Number</span>
                      <span className="font-bold font-mono text-xs">{selectedUserDetail.phone}</span>
                    </div>

                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-gray-200' : 'bg-[#18202c] border-[#30363d]'}`}>
                      <span className="text-[10px] font-mono text-gray-400 uppercase block">Department / Branch</span>
                      <span className="font-bold text-xs">{selectedUserDetail.department}</span>
                    </div>

                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-gray-200' : 'bg-[#18202c] border-[#30363d]'}`}>
                      <span className="text-[10px] font-mono text-gray-400 uppercase block">College</span>
                      <span className="font-bold text-xs">{selectedUserDetail.college}</span>
                    </div>

                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-gray-200' : 'bg-[#18202c] border-[#30363d]'}`}>
                      <span className="text-[10px] font-mono text-gray-400 uppercase block">Account Created</span>
                      <span className="font-bold font-mono text-xs">{formatEventDate(selectedUserDetail.joinedAt)}</span>
                    </div>

                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-gray-200' : 'bg-[#18202c] border-[#30363d]'}`}>
                      <span className="text-[10px] font-mono text-gray-400 uppercase block">Account Status</span>
                      <span className="font-bold font-mono text-xs text-emerald-500">{selectedUserDetail.status}</span>
                    </div>
                  </div>
                </div>

                {/* Community Aggregated Activity */}
                {userActivity && (
                  <div className="space-y-3 pt-2">
                    <h5 className={`text-xs font-mono font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                      COMMUNITY ACTIVITY COUNTS
                    </h5>

                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                      <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-gray-200' : 'bg-[#18202c] border-[#30363d]'}`}>
                        <span className="text-[10px] font-mono text-gray-400 block uppercase">Posts</span>
                        <span className="text-base font-black text-[#2f9e44]">{userActivity.counts.posts || 0}</span>
                      </div>

                      <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-gray-200' : 'bg-[#18202c] border-[#30363d]'}`}>
                        <span className="text-[10px] font-mono text-gray-400 block uppercase">Comments</span>
                        <span className="text-base font-black text-sky-500">{userActivity.counts.comments || 0}</span>
                      </div>

                      <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-gray-200' : 'bg-[#18202c] border-[#30363d]'}`}>
                        <span className="text-[10px] font-mono text-gray-400 block uppercase">Likes</span>
                        <span className="text-base font-black text-pink-500">{userActivity.counts.likes || 0}</span>
                      </div>

                      <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-gray-200' : 'bg-[#18202c] border-[#30363d]'}`}>
                        <span className="text-[10px] font-mono text-gray-400 block uppercase">Saved</span>
                        <span className="text-base font-black text-amber-500">{userActivity.counts.bookmarks || 0}</span>
                      </div>

                      <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-gray-200' : 'bg-[#18202c] border-[#30363d]'}`}>
                        <span className="text-[10px] font-mono text-gray-400 block uppercase">Reports</span>
                        <span className="text-base font-black text-red-500">{userActivity.counts.reports || 0}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Activity Log */}
                {userActivity && userActivity.recentLogs.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h5 className={`text-xs font-mono font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                      RECENT COMMUNITY LOGS
                    </h5>

                    <div className="space-y-2">
                      {userActivity.recentLogs.map((log, idx) => (
                        <div key={idx} className={`p-3 rounded-xl border text-xs space-y-1 ${
                          isLight ? 'bg-slate-50 border-gray-200' : 'bg-[#0d1117] border-[#30363d]'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#2f9e44]">{log.title}</span>
                            <span className="text-[10px] font-mono text-gray-400">{formatEventDate(log.timestamp)}</span>
                          </div>
                          {log.snippet && <p className={`italic ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{log.snippet}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-500">No account details found.</div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
