import React, { useState, useEffect } from 'react';
import ContentCrudModule from '../../components/admin/ContentCrudModule';
import MediaPicker from '../../components/admin/MediaPicker';
import api from '../../services/api';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { formatEventDate } from '../../utils/dateUtils';
import { OFFICIAL_ROLE_GROUPS, getTeamNameFromRole } from '../../config/officialRoles';
import {
  Upload, Download, Trash2, Edit3, Image as ImageIcon, Plus, X,
  UserCheck, ShieldCheck, UserX, Clock, Award, Users, Eye, Building,
  GraduationCap, Mail, Phone, Calendar, Loader2
} from 'lucide-react';

export default function MembersAdmin() {
  const { isLight } = useAdminTheme();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [inspectMember, setInspectMember] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const filterOptions = ['All', 'Visitors', 'Members', 'Leads', 'Co-Leads', 'Campus Ambassadors', 'Campus Mantri', 'Faculty', 'Inactive'];

  const [formData, setFormData] = useState({
    _id: '',
    name: '',
    email: '',
    phone: '',
    teamName: 'General',
    role: 'Visitor',
    photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    accountType: 'Visitor',
    membershipStatus: 'pending',
    membershipId: '',
    session: '2026–27',
    skills: ''
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    loadMembers(true);
  }, []);

  const loadMembers = async (isInitial = false) => {
    if (isInitial && members.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await api.get('/members');
      setMembers(res.data?.data || []);
    } catch (err) {
      console.warn('[MembersAdmin] Fetch error:', err);
      if (members.length === 0) {
        setError('Failed loading live MongoDB member directory.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = (m.name || '').toLowerCase().includes(q);
      const matchEmail = (m.email || '').toLowerCase().includes(q);
      const matchUser = (m.username || '').toLowerCase().includes(q);
      const matchId = (m.membershipId || '').toLowerCase().includes(q);
      const matchRole = (m.role || '').toLowerCase().includes(q);
      const matchTeam = (m.teamName || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchUser && !matchId && !matchRole && !matchTeam) return false;
    }
    if (roleFilter === 'Visitors') return m.accountType === 'Visitor' || m.role === 'Visitor';
    if (roleFilter === 'Members') return m.accountType === 'Member';
    if (roleFilter === 'Leads') return (m.role || '').toLowerCase().endsWith('lead') || (m.role || '').toLowerCase().includes('lead');
    if (roleFilter === 'Co-Leads') return (m.role || '').toLowerCase().includes('co-lead');
    if (roleFilter === 'Campus Ambassadors') return (m.role || '').toLowerCase().includes('ambassador');
    if (roleFilter === 'Campus Mantri') return (m.role || '').toLowerCase().includes('mantri');
    if (roleFilter === 'Faculty') return (m.role || '').toLowerCase().includes('faculty');
    if (roleFilter === 'Inactive') return m.status === 'Inactive' || m.membershipStatus === 'suspended' || m.membershipStatus === 'revoked';
    return true;
  });

  const totalVisitors = members.filter(m => m.accountType === 'Visitor' || m.role === 'Visitor').length;
  const verifiedMembers = members.filter(m => m.accountType === 'Member').length;
  const teamLeads = members.filter(m => (m.role || '').toLowerCase().includes('lead')).length;
  const pendingReview = members.filter(m => m.membershipStatus === 'pending').length;

  const handleOpenAdd = () => {
    setFormData({
      _id: '',
      name: '',
      email: '',
      phone: '',
      teamName: 'General',
      role: 'Visitor',
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      accountType: 'Visitor',
      membershipStatus: 'pending',
      membershipId: '',
      session: '2026–27',
      skills: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m) => {
    setFormData({
      _id: m._id,
      name: m.name || '',
      email: m.email || '',
      phone: m.phone || '',
      teamName: m.teamName || 'General',
      role: m.role || 'Member',
      photo: m.photo || '',
      accountType: m.accountType || 'Member',
      membershipStatus: m.membershipStatus || 'active',
      membershipId: m.membershipId || '',
      session: m.session || '2026–27',
      skills: Array.isArray(m.skills) ? m.skills.join(', ') : m.skills || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveMembership = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (formData._id) {
        await api.patch(`/members/${formData._id}/membership`, formData);
      } else {
        await api.post('/members', formData);
      }
      setIsModalOpen(false);
      await loadMembers();
    } catch (err) {
      alert('Failed saving member record: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id, newStatus) => {
    try {
      await api.patch(`/members/${id}/status`, { status: newStatus, membershipStatus: newStatus.toLowerCase() });
      loadMembers();
    } catch (err) {
      alert('Status update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete member record permanently?')) return;
    try {
      await api.delete(`/members/${id}`);
      loadMembers();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Name,Email,AccountType,Role,MembershipID,Status"].join(",") + "\n"
      + members.map(e => `"${e.name}","${e.email}","${e.accountType || 'Visitor'}","${e.role}","${e.membershipId || ''}","${e.membershipStatus || 'active'}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "gfg_member_directory.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-6">
      
      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className={`p-4 rounded-2xl border flex flex-col justify-between shadow-sm transition-colors ${
          isLight ? 'bg-white border-gray-200' : 'bg-[#121721] border-[#30363d]'
        }`}>
          <span className={`text-[10px] font-mono font-bold uppercase ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Total Accounts</span>
          <span className={`text-2xl font-black ${isLight ? 'text-gray-900' : 'text-white'}`}>{members.length}</span>
        </div>

        <div className={`p-4 rounded-2xl border flex flex-col justify-between shadow-sm transition-colors ${
          isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-[#121721] border-amber-500/40'
        }`}>
          <span className={`text-[10px] font-mono font-bold uppercase ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>Visitors</span>
          <span className={`text-2xl font-black ${isLight ? 'text-amber-900' : 'text-amber-400'}`}>{totalVisitors}</span>
        </div>

        <div className={`p-4 rounded-2xl border flex flex-col justify-between shadow-sm transition-colors ${
          isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-[#121721] border-[#2f9e44]/40'
        }`}>
          <span className={`text-[10px] font-mono font-bold uppercase ${isLight ? 'text-emerald-800' : 'text-[#2f9e44]'}`}>Verified Members</span>
          <span className={`text-2xl font-black ${isLight ? 'text-emerald-900' : 'text-[#2f9e44]'}`}>{verifiedMembers}</span>
        </div>

        <div className={`p-4 rounded-2xl border flex flex-col justify-between shadow-sm transition-colors ${
          isLight ? 'bg-sky-50/60 border-sky-200' : 'bg-[#121721] border-sky-500/40'
        }`}>
          <span className={`text-[10px] font-mono font-bold uppercase ${isLight ? 'text-sky-800' : 'text-sky-400'}`}>Team Leads</span>
          <span className={`text-2xl font-black ${isLight ? 'text-sky-900' : 'text-sky-400'}`}>{teamLeads}</span>
        </div>

        <div className={`p-4 rounded-2xl border flex flex-col justify-between shadow-sm transition-colors ${
          isLight ? 'bg-purple-50/60 border-purple-200' : 'bg-[#121721] border-purple-500/40'
        }`}>
          <span className={`text-[10px] font-mono font-bold uppercase ${isLight ? 'text-purple-800' : 'text-purple-400'}`}>Pending Review</span>
          <span className={`text-2xl font-black ${isLight ? 'text-purple-900' : 'text-purple-400'}`}>{pendingReview}</span>
        </div>
      </div>

      {/* CSV Export Button Bar */}
      <div className="flex justify-end">
        <button
          onClick={handleExportCSV}
          className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
            isLight
              ? 'bg-white text-gray-800 border-gray-200 hover:bg-gray-100 shadow-sm'
              : 'bg-[#21262d] text-gray-300 border-[#30363d] hover:text-white'
          }`}
        >
          <Download className="w-4 h-4 text-[#2f9e44]" /> Export Directory CSV
        </button>
      </div>

      <ContentCrudModule
        title="Member Directory & Membership Control"
        subtitle="Manage registered users, promote Visitors to official Members, assign roles, and control digital identity cards."
        items={filteredMembers}
        loading={loading}
        onAdd={handleOpenAdd}
        filterOptions={filterOptions}
        activeFilter={roleFilter}
        onFilterChange={setRoleFilter}
        searchTerm={search}
        onSearchChange={setSearch}
        gridCols="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
        storageKey="admin_view_member_directory"
        columns={['Member Profile', 'Email', 'Account Type', 'Official Role', 'Membership Status', 'Joined Date', 'Actions']}
        renderRow={(m) => (
          <tr key={m._id} className={`transition-colors ${
            isLight ? 'hover:bg-slate-50/80 border-b border-gray-200' : 'hover:bg-[#0d1117]/60 border-b border-[#30363d]'
          }`}>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <img
                  src={m.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                  alt={m.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#2f9e44] flex-shrink-0"
                />
                <div>
                  <p className={`font-bold text-xs sm:text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>{m.name}</p>
                  {m.membershipId && (
                    <p className="text-[10px] text-[#2f9e44] font-mono font-bold">{m.membershipId}</p>
                  )}
                </div>
              </div>
            </td>
            <td className={`px-6 py-4 text-xs ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>{m.email}</td>
            <td className="px-6 py-4">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                m.accountType === 'Member'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
              }`}>
                {m.accountType || 'Visitor'}
              </span>
            </td>
            <td className={`px-6 py-4 text-xs font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{m.role || 'Visitor'}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${
                m.membershipStatus === 'active' || m.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-[#2f9e44]/20 dark:text-[#2f9e44] dark:border-[#2f9e44]/30'
                  : m.membershipStatus === 'suspended'
                  ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30'
                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {m.membershipStatus || m.status || 'pending'}
              </span>
            </td>
            <td className={`px-6 py-4 text-xs font-mono ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
              {formatEventDate(m.createdAt || m.issueDate)}
            </td>
            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
              <button
                onClick={() => handleOpenEdit(m)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-[#2f9e44]/20 text-[#2f9e44] border-[#2f9e44]/30 hover:bg-[#2f9e44] hover:text-white'
                }`}
                title="Promote / Manage Membership & Role"
              >
                Change Membership
              </button>
              <button
                onClick={() => setInspectMember(m)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-colors inline-flex items-center gap-1 ${
                  isLight
                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500 hover:text-white'
                }`}
                title="Inspect Registered Signup Information"
              >
                <Eye className="w-3 h-3" /> Inspect
              </button>
              <button
                onClick={() => handleDelete(m._id)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isLight ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-[#21262d] text-red-400 border-[#30363d] hover:bg-red-500/20'
                }`}
                title="Delete Member"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
        )}
        renderCard={(m) => {
          const isVerifiedMember = m.accountType === 'Member';
          const isActive = m.membershipStatus === 'active' || m.status === 'Active';

          return (
            <div
              key={m._id}
              className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all duration-200 hover:shadow-md ${
                isLight
                  ? 'bg-white border-gray-200 hover:border-[#2f9e44]/60 shadow-xs'
                  : 'bg-[#121721] border-[#30363d] hover:border-[#2f9e44]/50'
              }`}
            >
              {/* Profile Image, Name, Membership ID */}
              <div className="flex items-start gap-3.5">
                <div className="relative flex-shrink-0">
                  <img
                    src={m.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                    alt={m.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#2f9e44] shadow-xs"
                  />
                  {isVerifiedMember && (
                    <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#2f9e44] text-white shadow-xs" title="Verified Member">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className={`text-sm font-extrabold leading-snug break-words ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    {m.name}
                  </h3>
                  <p className="text-[11px] text-[#2f9e44] font-mono font-bold mt-0.5 truncate">
                    {m.membershipId || 'No ID Assigned'}
                  </p>
                  <p className={`text-[11px] font-mono mt-0.5 truncate ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                    @{m.username || (m.email ? m.email.split('@')[0] : 'user')}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className={`text-xs break-all py-1.5 px-2.5 rounded-xl border font-mono ${
                isLight ? 'bg-gray-50 text-gray-700 border-gray-200' : 'bg-[#0d1117] text-gray-300 border-[#30363d]/80'
              }`}>
                {m.email}
              </div>

              {/* Account Type & Official Role */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                  isVerifiedMember
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-[#2f9e44]/20 dark:text-[#2f9e44] dark:border-[#2f9e44]/30'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
                }`}>
                  {m.accountType || 'Visitor'}
                </span>

                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold truncate max-w-[150px] border ${
                  isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-[#21262d] text-gray-200 border-[#30363d]'
                }`}>
                  {m.role || 'Visitor'}
                </span>
              </div>

              {/* Status Badge & Joined Date */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-[#2f9e44]/20 dark:text-[#2f9e44] dark:border-[#2f9e44]/30'
                    : m.membershipStatus === 'suspended'
                    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30'
                    : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {m.membershipStatus || m.status || 'pending'}
                </span>

                <span className={`text-[10px] font-mono ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                  Joined: {formatEventDate(m.createdAt || m.issueDate)}
                </span>
              </div>

              {/* Action Buttons: [Change Membership] [Inspect] [Delete] */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-200 dark:border-[#30363d]/80">
                <button
                  onClick={() => handleOpenEdit(m)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                    isLight
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-[#2f9e44]/15 text-[#2f9e44] border-[#2f9e44]/30 hover:bg-[#2f9e44] hover:text-white'
                  }`}
                  title="Promote / Manage Membership & Role"
                >
                  Change Membership
                </button>

                <button
                  onClick={() => setInspectMember(m)}
                  className={`p-1.5 rounded-xl border transition-colors flex items-center justify-center ${
                    isLight
                      ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                      : 'bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500 hover:text-white'
                  }`}
                  title="Inspect Signup Details"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(m._id)}
                  className={`p-1.5 rounded-xl border transition-colors flex items-center justify-center ${
                    isLight
                      ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                      : 'bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-500/20'
                  }`}
                  title="Delete Member Record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        }}
      />

      {/* Change Membership / Role Modal Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className={`rounded-2xl border w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl transition-colors ${
            isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#161b22] border-[#30363d] text-white'
          }`}>
            
            <div className={`flex justify-between items-center border-b pb-4 ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
              <div>
                <h3 className={`text-lg font-extrabold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {formData._id ? 'Manage Membership & Role' : 'Register New User Record'}
                </h3>
                <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                  Super Admin approval converts Visitors into verified GFG Campus Members.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className={isLight ? 'text-gray-400 hover:text-gray-700' : 'text-gray-400 hover:text-white'}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMembership} className="space-y-4 text-xs font-medium">
              
              {/* Member Photo */}
              <div className="flex items-center gap-3">
                <img src={formData.photo} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-[#2f9e44]" />
                <button
                  type="button"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                    isLight ? 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200' : 'bg-[#21262d] text-gray-200 border-[#30363d]'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#2f9e44]" /> Change Avatar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                      isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                      isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
              </div>

              {/* MEMBERSHIP PROMOTION CONTROL */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-[#0d1117] border-[#2f9e44]/40'
              }`}>
                <div className="flex items-center justify-between border-b pb-2 border-emerald-300 dark:border-[#30363d]">
                  <h4 className="font-bold text-[#2f9e44] text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Super Admin Membership Approval
                  </h4>
                  <span className="text-[10px] font-mono text-gray-400">Official Access</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Account Type</label>
                    <select
                      value={formData.accountType || 'Visitor'}
                      onChange={e => {
                        const val = e.target.value;
                        const autoId = val === 'Member' && !formData.membershipId
                          ? `GFG-JH-2026-${String(Math.floor(Math.random() * 900) + 100)}`
                          : formData.membershipId;
                        setFormData({
                          ...formData,
                          accountType: val,
                          membershipStatus: val === 'Member' ? 'active' : 'pending',
                          membershipId: autoId,
                          role: val === 'Member' && formData.role === 'Visitor' ? 'Member' : formData.role
                        });
                      }}
                      className={`w-full rounded-xl px-3 py-2 border text-xs font-bold focus:outline-none focus:border-[#2f9e44] ${
                        isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#161b22] border-[#30363d] text-white'
                      }`}
                    >
                      <option value="Visitor">Visitor (Unverified)</option>
                      <option value="Member">Verified Member</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Membership Status</label>
                    <select
                      value={formData.membershipStatus || 'active'}
                      onChange={e => setFormData({ ...formData, membershipStatus: e.target.value })}
                      className={`w-full rounded-xl px-3 py-2 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                        isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#161b22] border-[#30363d] text-white'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                      <option value="revoked">Revoked</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Official Role</label>
                    <select
                      value={formData.role || 'Member'}
                      onChange={e => {
                        const newRole = e.target.value;
                        const derivedTeam = getTeamNameFromRole(newRole);
                        setFormData({ ...formData, role: newRole, teamName: derivedTeam });
                      }}
                      className={`w-full rounded-xl px-3 py-2 border text-xs font-bold focus:outline-none focus:border-[#2f9e44] ${
                        isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#161b22] border-[#30363d] text-white'
                      }`}
                    >
                      {OFFICIAL_ROLE_GROUPS.map(g => (
                        <optgroup key={g.group} label={g.group}>
                          {g.roles.map(r => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      {/* Backward compatibility for legacy roles like Campus Ambassador */}
                      {formData.role && !OFFICIAL_ROLE_GROUPS.some(g => g.roles.includes(formData.role)) && (
                        <optgroup label="LEGACY ROLES">
                          <option value={formData.role}>{formData.role}</option>
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Member ID</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={formData.membershipId || ''}
                        onChange={e => setFormData({ ...formData, membershipId: e.target.value })}
                        placeholder="GFG-JH-2026-001"
                        className={`flex-1 rounded-xl px-3 py-2 border text-xs font-mono font-bold focus:outline-none focus:border-[#2f9e44] ${
                          isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#161b22] border-[#30363d] text-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const num = String(Math.floor(Math.random() * 900) + 100);
                          setFormData({ ...formData, membershipId: `GFG-JH-2026-${num}` });
                        }}
                        className="px-2 py-1 rounded-lg bg-[#2f9e44] text-white text-[10px] font-bold shadow"
                        title="Auto Generate Unique Member ID"
                      >
                        Auto
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Session Tenure</label>
                  <input
                    type="text"
                    value={formData.session || '2026–27'}
                    onChange={e => setFormData({ ...formData, session: e.target.value })}
                    placeholder="2026–27"
                    className={`w-full rounded-xl px-3 py-2 border text-xs font-mono focus:outline-none focus:border-[#2f9e44] ${
                      isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#161b22] border-[#30363d] text-white'
                    }`}
                  />
                </div>

              </div>

              <button type="submit" className="w-full py-3 rounded-xl gradient-button font-bold text-xs shadow-lg">
                Approve & Save Membership Status
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker */}
      <MediaPicker
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelectMedia={(url) => setFormData(prev => ({ ...prev, photo: url }))}
        currentFolder="Members"
      />

      {/* Inspect User Signup Details Drawer */}
      {inspectMember && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md h-full p-6 overflow-y-auto shadow-2xl transition-colors border-l flex flex-col justify-between ${
            isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#161b22] border-[#30363d] text-white'
          }`}>
            <div className="space-y-6">
              
              {/* Drawer Header */}
              <div className={`flex justify-between items-center border-b pb-4 ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#2f9e44]/10 border border-[#2f9e44]/30">
                    <Eye className="w-5 h-5 text-[#2f9e44]" />
                  </div>
                  <div>
                    <h3 className={`text-base font-extrabold ${isLight ? 'text-gray-900' : 'text-white'}`}>User Signup Inspection</h3>
                    <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Registered Platform Account Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectMember(null)}
                  className={`p-1.5 rounded-xl border transition-colors ${
                    isLight ? 'border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'border-[#30363d] text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Identity Card */}
              <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
                isLight ? 'bg-gray-50 border-gray-200' : 'bg-[#0d1117] border-[#30363d]'
              }`}>
                <img
                  src={inspectMember.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                  alt="User Avatar"
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#2f9e44] shadow-md"
                />
                <div>
                  <h4 className={`text-sm font-extrabold ${isLight ? 'text-gray-900' : 'text-white'}`}>{inspectMember.name}</h4>
                  <p className={`text-xs font-mono ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                    @{inspectMember.username || (inspectMember.email ? inspectMember.email.split('@')[0] : 'user')}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2f9e44]/20 text-[#2f9e44] border border-[#2f9e44]/30">
                      {inspectMember.role || inspectMember.accountType || 'Visitor'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      inspectMember.membershipStatus === 'active' || inspectMember.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-[#2f9e44]/20 dark:text-[#2f9e44] dark:border-[#2f9e44]/30'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400'
                    }`}>
                      {inspectMember.membershipStatus || inspectMember.status || 'pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* CONTACT DETAILS SECTION */}
              <div className="space-y-2">
                <h5 className={`text-xs font-extrabold uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Contact Information</h5>
                <div className={`p-4 rounded-xl border space-y-3 text-xs ${isLight ? 'bg-white border-gray-200' : 'bg-[#0d1117] border-[#30363d]'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium flex items-center gap-1.5 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Mail className="w-3.5 h-3.5 text-[#2f9e44]" /> Email Address
                    </span>
                    <span className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{inspectMember.email || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium flex items-center gap-1.5 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Phone className="w-3.5 h-3.5 text-[#2f9e44]" /> Phone Number
                    </span>
                    <span className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      {inspectMember.phone || inspectMember.userRef?.phone || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ACADEMIC & SIGNUP INFORMATION */}
              <div className="space-y-2">
                <h5 className={`text-xs font-extrabold uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Academic Signup Information</h5>
                <div className={`p-4 rounded-xl border space-y-3 text-xs ${isLight ? 'bg-white border-gray-200' : 'bg-[#0d1117] border-[#30363d]'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium flex items-center gap-1.5 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                      <GraduationCap className="w-3.5 h-3.5 text-[#2f9e44]" /> Jamia Hamdard Student
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      inspectMember.userRef?.institutionType === 'jamia_hamdard' || (inspectMember.college && inspectMember.college.toLowerCase().includes('jamia hamdard'))
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                    }`}>
                      {inspectMember.userRef?.institutionType === 'jamia_hamdard' || (inspectMember.college && inspectMember.college.toLowerCase().includes('jamia hamdard')) ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium flex items-center gap-1.5 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Building className="w-3.5 h-3.5 text-[#2f9e44]" /> Institution / College
                    </span>
                    <span className={`font-semibold text-right max-w-[200px] truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      {inspectMember.userRef?.collegeName || inspectMember.college || 'Jamia Hamdard'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Department / Course</span>
                    <span className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      {inspectMember.userRef?.course || inspectMember.department || 'General'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ACCOUNT METADATA */}
              <div className="space-y-2">
                <h5 className={`text-xs font-extrabold uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Account Metadata</h5>
                <div className={`p-4 rounded-xl border space-y-3 text-xs ${isLight ? 'bg-white border-gray-200' : 'bg-[#0d1117] border-[#30363d]'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Community Role</span>
                    <span className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>{inspectMember.role || 'Visitor'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Membership ID</span>
                    <span className={`font-mono font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{inspectMember.membershipId || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium flex items-center gap-1.5 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Calendar className="w-3.5 h-3.5 text-[#2f9e44]" /> Account Created / Joined
                    </span>
                    <span className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      {formatEventDate(inspectMember.createdAt || inspectMember.issueDate)}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* SECURITY NOTICE FOOTER */}
            <div className={`pt-4 border-t mt-6 text-[10px] text-center font-medium ${
              isLight ? 'border-gray-200 text-gray-500' : 'border-[#30363d] text-gray-400'
            }`}>
              🔒 Passwords, hashes, PINs, and authentication secrets are strictly excluded for security.
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
