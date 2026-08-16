import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import cacheService from '../../services/cacheService';
import { useAdminTheme } from '../../context/AdminThemeContext';
import {
  ShieldCheck, Edit3, Trash2, Plus, Search, CheckCircle2,
  AlertCircle, X, Sparkles, ExternalLink, Calendar, Award, User
} from 'lucide-react';

export default function MantriAdmin() {
  const { isLight } = useAdminTheme();
  const [mantris, setMantris] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'

  // Member Search / Fetch state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberNotFound, setMemberNotFound] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    _id: '',
    memberRef: '',
    session: '2026–27',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    about: '',
    achievements: '',
    isCurrent: false,
    status: 'Active'
  });

  useEffect(() => {
    loadData(true);
  }, []);

  const loadData = async (isInitial = false) => {
    if (isInitial && mantris.length === 0) {
      setLoading(true);
    }
    try {
      const res = await api.get('/mantri');
      const list = res.data.data || [];
      setMantris(list);
      cacheService.set('mantri', list);
    } catch (err) {
      console.warn('[MantriAdmin] Error loading mantris:', err);
    } finally {
      setLoading(false);
    }
  };

  const [searchConflict, setSearchConflict] = useState(false);

  // Member search handler (by Member ID, Username, Name, Email)
  const handleSearchMember = async (queryStr) => {
    const q = (queryStr !== undefined ? queryStr : searchQuery).trim();
    if (!q) {
      setSearchResults([]);
      setMemberNotFound(false);
      setSearchConflict(false);
      return;
    }

    setIsSearching(true);
    setMemberNotFound(false);
    setSearchConflict(false);
    try {
      const res = await api.get(`/members?search=${encodeURIComponent(q)}`);
      const list = res.data?.data || [];
      setSearchResults(list);
      
      if (list.length === 0) {
        setMemberNotFound(true);
        setSelectedMember(null);
      } else if (q.toUpperCase().startsWith('GFG')) {
        // Filter exact Member ID / UserCode matches
        const exactMatches = list.filter(m => 
          (m.membershipId && m.membershipId.toUpperCase() === q.toUpperCase()) ||
          (m.userCode && m.userCode.toUpperCase() === q.toUpperCase())
        );

        if (exactMatches.length === 1) {
          handleSelectMember(exactMatches[0]);
        } else if (exactMatches.length > 1) {
          setSearchConflict(true);
          setSelectedMember(null);
        }
      }
    } catch (err) {
      console.warn('[MantriAdmin] Member lookup failed:', err);
      setMemberNotFound(true);
    }
    setIsSearching(false);
  };

  const handleSelectMember = (mem) => {
    setSelectedMember(mem);
    setFormData(prev => ({
      ...prev,
      memberRef: mem._id,
      about: prev.about || mem.bio || mem.about || ''
    }));
    setSearchResults([]);
    setMemberNotFound(false);
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setSelectedMember(null);
    setSearchQuery('');
    setSearchResults([]);
    setMemberNotFound(false);
    setFormData({
      _id: '',
      memberRef: '',
      session: '2026–27',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      about: '',
      achievements: 'Organized Flagship Hackathons, Expanded Community to 1,500+ Members',
      isCurrent: mantris.length === 0,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m) => {
    setModalMode('edit');
    const linkedMem = m.memberRef || null;
    setSelectedMember(linkedMem);
    setSearchQuery(linkedMem?.membershipId || linkedMem?.userCode || '');
    setSearchResults([]);
    setMemberNotFound(false);
    setFormData({
      _id: m._id,
      memberRef: linkedMem?._id || m.memberRef || '',
      session: m.session || m.tenure || '2026–27',
      startDate: m.startDate ? new Date(m.startDate).toISOString().split('T')[0] : '',
      endDate: m.endDate ? new Date(m.endDate).toISOString().split('T')[0] : '',
      about: m.about || '',
      achievements: Array.isArray(m.achievements) ? m.achievements.join(', ') : m.achievements || '',
      isCurrent: m.isCurrent || false,
      status: m.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const handleSetCurrent = async (id) => {
    try {
      await api.patch(`/mantri/${id}/set-current`);
      cacheService.remove('mantri');
      cacheService.remove('homepage');
      loadData();
    } catch (err) {
      alert('Failed to set current Campus Mantri');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.memberRef) {
      alert('Please select or search for an existing member by Member ID or Name.');
      return;
    }

    const payload = {
      ...formData,
      achievements: typeof formData.achievements === 'string'
        ? formData.achievements.split(',').map(a => a.trim()).filter(Boolean)
        : formData.achievements
    };

    if (!payload._id || String(payload._id).trim() === '') {
      delete payload._id;
    }
    if (!payload.endDate || String(payload.endDate).trim() === '') {
      delete payload.endDate;
    }

    try {
      if (formData._id) {
        await api.put(`/mantri/${formData._id}`, payload);
      } else {
        await api.post('/mantri', payload);
      }
      cacheService.remove('mantri');
      cacheService.remove('homepage');
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.message || err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (m) => {
    const memName = m.memberRef?.name || 'this Campus Mantri';
    const confirmed = window.confirm(
      `Remove Campus Mantri tenure record for "${memName}" (Session ${m.session || m.tenure})?\n\n` +
      `NOTE: This will only remove the Campus Mantri organizational assignment. ` +
      `The member's account, profile, Member ID, membership card, posts, and comments will NOT be deleted.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/mantri/${m._id}`);
      cacheService.remove('mantri');
      cacheService.remove('homepage');
      loadData();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const currentServingMantri = mantris.find(m => m.isCurrent);

  return (
    <div className="space-y-8">
      {/* ─── Header & Action ─────────────────────────────────────────── */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:p-7 rounded-2xl border transition-colors ${
        isLight
          ? 'bg-white border-gray-200 shadow-sm'
          : 'bg-[#161b22] border-[#30363d] shadow-md'
      }`}>
        <div>
          <span className="text-[10px] font-mono font-bold text-[#2f9e44] uppercase tracking-wider block">
            ADMINISTRATION
          </span>
          <h1 className={`text-xl sm:text-2xl font-black mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Campus Mantri Management
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
            Manage active leadership and historical tenure records. Member ID serves as the single source of truth.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2f9e44] hover:bg-[#288439] text-white text-xs font-bold font-mono transition-all shadow-md shadow-[#2f9e44]/20 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Campus Mantri</span>
        </button>
      </div>

      {/* ─── 1. Active Serving Campus Mantri Spotlight ────────────────── */}
      {currentServingMantri && (
        <div className={`p-6 sm:p-8 rounded-2xl border transition-colors shadow-md space-y-4 ${
          isLight
            ? 'bg-gradient-to-br from-emerald-50/70 via-white to-green-50/40 border-emerald-300/80 text-slate-900'
            : 'bg-gradient-to-br from-[#121721] via-[#0a0d12] to-[#142e16]/40 border-[#2f9e44]/50 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-md flex items-center gap-1.5 ${
              isLight
                ? 'text-[#2f9e44] bg-[#2f9e44]/10 border border-[#2f9e44]/30'
                : 'text-[#2f9e44] bg-[#2f9e44]/15 border border-[#2f9e44]/30'
            }`}>
              <ShieldCheck className="w-4 h-4 text-[#2f9e44]" /> Currently Serving Campus Mantri
            </span>
            <span className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              Session {currentServingMantri.session || currentServingMantri.tenure}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
            <img
              src={currentServingMantri.memberRef?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
              alt={currentServingMantri.memberRef?.name}
              className="w-24 h-28 sm:w-28 sm:h-32 rounded-xl object-cover border-2 border-[#2f9e44] shadow-md flex-shrink-0"
            />
            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className={`text-xl sm:text-2xl font-black leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {currentServingMantri.memberRef?.name || 'Campus Mantri'}
                </h3>
                {currentServingMantri.memberRef?.membershipId && (
                  <span className="text-xs font-mono font-bold text-[#2f9e44] bg-[#2f9e44]/10 border border-[#2f9e44]/30 px-2 py-0.5 rounded">
                    {currentServingMantri.memberRef.membershipId}
                  </span>
                )}
              </div>
              {currentServingMantri.memberRef?.username && (
                <p className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                  @{currentServingMantri.memberRef.username}
                </p>
              )}
              <p className={`text-xs italic line-clamp-2 max-w-2xl p-3 rounded-xl border ${
                isLight
                  ? 'text-slate-700 bg-white/80 border-emerald-200'
                  : 'text-gray-300 bg-[#0a0d12]/80 border-[#30363d]'
              }`}>
                "{currentServingMantri.about || currentServingMantri.memberRef?.bio || currentServingMantri.memberRef?.about || 'Leading community initiatives and technical growth.'}"
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                <button
                  onClick={() => handleOpenEdit(currentServingMantri)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-800 border-gray-300'
                      : 'bg-[#21262d] hover:bg-[#30363d] text-gray-200 border-[#30363d]'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Record
                </button>
                {currentServingMantri.memberRef?.username && (
                  <a
                    href={`/profile/${currentServingMantri.memberRef.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#2f9e44]/15 hover:bg-[#2f9e44]/25 text-[#2f9e44] text-xs font-semibold flex items-center gap-1.5 border border-[#2f9e44]/30"
                  >
                    <span>View Live Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. Campus Mantri Timeline Table ─────────────────────────── */}
      <div className={`rounded-2xl border overflow-hidden transition-colors shadow-md ${
        isLight
          ? 'bg-white border-gray-200'
          : 'bg-[#161b22] border-[#30363d]'
      }`}>
        <div className={`p-5 border-b flex items-center justify-between ${
          isLight ? 'border-gray-200 bg-slate-50/50' : 'border-[#30363d] bg-[#161b22]'
        }`}>
          <div>
            <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Tenure Sessions & History</h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Past and current Campus Mantris. Setting one as Current automatically transitions others to Former.</p>
          </div>
          <span className={`text-xs font-mono font-bold px-3 py-1 rounded-lg border ${
            isLight
              ? 'text-slate-700 bg-white border-gray-200 shadow-sm'
              : 'text-gray-400 bg-[#0a0d12] border-[#30363d]'
          }`}>
            {mantris.length} Records
          </span>
        </div>

        {loading ? (
          <div className={`p-8 text-center text-xs font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Loading records...</div>
        ) : mantris.length === 0 ? (
          <div className={`p-8 text-center text-xs font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>No Campus Mantri records found. Click "+ Add Campus Mantri" to create one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`font-mono uppercase text-[10px] border-b ${
                isLight
                  ? 'bg-slate-100/80 text-slate-600 border-gray-200'
                  : 'bg-[#0a0d12] text-gray-400 border-[#30363d]'
              }`}>
                <tr>
                  <th className="px-6 py-3.5">Campus Mantri</th>
                  <th className="px-6 py-3.5">Member ID</th>
                  <th className="px-6 py-3.5">Session / Tenure</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-gray-200' : 'divide-[#30363d]/60'}`}>
                {mantris.map((m) => {
                  const mem = m.memberRef || {};
                  const isCur = m.isCurrent;

                  return (
                    <tr
                      key={m._id}
                      className={`transition-colors ${
                        isLight ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-[#121721] text-gray-300'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={mem.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                            alt={mem.name}
                            className="w-10 h-10 rounded-lg object-cover border border-[#2f9e44] flex-shrink-0"
                          />
                          <div>
                            <p className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{mem.name || 'Unknown Member'}</p>
                            <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{mem.username ? `@${mem.username}` : mem.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[#2f9e44]">
                        {mem.membershipId || mem.userCode || '—'}
                      </td>
                      <td className={`px-6 py-4 font-semibold ${isLight ? 'text-slate-800' : 'text-gray-200'}`}>
                        {m.session || m.tenure || '—'}
                      </td>
                      <td className="px-6 py-4">
                        {isCur ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#2f9e44] text-white shadow-sm">
                            <ShieldCheck className="w-3 h-3" /> Current Session
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                            isLight
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-gray-800 text-gray-400 border-gray-700'
                          }`}>
                            Former Session
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {!isCur && (
                          <button
                            onClick={() => handleSetCurrent(m._id)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#2f9e44]/15 hover:bg-[#2f9e44] text-[#2f9e44] hover:text-white text-xs font-bold border border-[#2f9e44]/30 transition-all"
                            title="Set as Current Serving Campus Mantri"
                          >
                            Set Current
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isLight
                              ? 'bg-white hover:bg-slate-100 text-slate-700 border-gray-300'
                              : 'bg-[#21262d] hover:bg-[#30363d] text-gray-300 border-[#30363d]'
                          }`}
                          title="Edit Session"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isLight
                              ? 'bg-white hover:bg-red-50 text-red-600 border-red-200'
                              : 'bg-[#21262d] hover:bg-red-500/20 text-red-400 border-[#30363d]'
                          }`}
                          title="Remove Tenure Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── 3. Add / Edit Campus Mantri Modal ───────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className={`border rounded-2xl w-full max-w-xl p-6 sm:p-7 space-y-5 my-8 shadow-2xl transition-colors ${
            isLight ? 'bg-white border-gray-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
          }`}>
            <div className={`flex justify-between items-center border-b pb-4 ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
              <div>
                <span className="text-[10px] font-mono font-bold text-[#2f9e44] uppercase tracking-wider block">
                  {modalMode === 'add' ? 'NEW TENURE' : 'EDIT TENURE'}
                </span>
                <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {modalMode === 'add' ? '+ Add Campus Mantri' : 'Edit Campus Mantri Record'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-[#21262d]'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Member Search / Member ID lookup */}
              <div className="space-y-2">
                <label className={`block font-bold ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                  Member ID or Member Lookup <span className="text-[#2f9e44]">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Enter Member ID (e.g. GFG-JH-2026-008), username, or name..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearchMember(e.target.value);
                      }}
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs border focus:outline-none focus:border-[#2f9e44] transition-colors ${
                        isLight
                          ? 'bg-slate-50 border-gray-300 text-slate-900 placeholder-slate-400'
                          : 'bg-[#0a0d12] border-[#30363d] text-white placeholder-gray-500'
                      }`}
                    />
                    {isSearching && (
                      <span className="absolute right-3 top-3 text-[10px] font-mono text-gray-400">Searching...</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSearchMember()}
                    className={`px-4 py-2.5 rounded-xl font-semibold flex items-center gap-1.5 border transition-colors ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-gray-300'
                        : 'bg-[#21262d] hover:bg-[#30363d] text-gray-200 border-[#30363d]'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Fetch</span>
                  </button>
                </div>

                {searchConflict && (
                  <p className="text-red-500 text-[11px] flex items-center gap-1 pt-1 font-bold">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Member ID conflict detected! Multiple records are assigned to "{searchQuery}". Please resolve before selecting.
                  </p>
                )}

                {memberNotFound && !searchConflict && (
                  <p className="text-amber-600 text-[11px] flex items-center gap-1 pt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    No member found matching "{searchQuery}". Please check the Member ID.
                  </p>
                )}

                {/* Dropdown Suggestions */}
                {searchResults.length > 0 && (
                  <div className={`max-h-48 overflow-y-auto border rounded-xl divide-y shadow-lg ${
                    isLight ? 'bg-white border-gray-200 divide-gray-100' : 'bg-[#0a0d12] border-[#30363d] divide-[#30363d]'
                  }`}>
                    {searchResults.map((mem) => (
                      <div
                        key={mem._id}
                        onClick={() => handleSelectMember(mem)}
                        className={`p-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                          isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1f242c]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={mem.photo} alt={mem.name} className="w-8 h-8 rounded-lg object-cover" />
                          <div>
                            <p className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{mem.name}</p>
                            <p className="text-[10px] text-gray-500">{mem.username ? `@${mem.username}` : mem.email}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[#2f9e44] font-bold">
                          {mem.membershipId || mem.userCode}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Live Member Preview Card */}
              {selectedMember && (
                <div className={`p-3.5 rounded-xl border flex items-center gap-3.5 ${
                  isLight
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-[#0a0d12] border-[#2f9e44]/40'
                }`}>
                  <img
                    src={selectedMember.photo}
                    alt={selectedMember.name}
                    className="w-12 h-14 rounded-lg object-cover border border-[#2f9e44] flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className={`font-bold text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedMember.name}</h4>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2f9e44]" />
                    </div>
                    <p className={`text-[11px] font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                      @{selectedMember.username || 'user'} • {selectedMember.department || 'Jamia Hamdard'}
                    </p>
                    <span className="text-[10px] font-mono font-bold text-[#2f9e44]">
                      ID: {selectedMember.membershipId || selectedMember.userCode}
                    </span>
                  </div>
                </div>
              )}

              {/* Session Tenure & Current Switch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>Session / Tenure <span className="text-[#2f9e44]">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026–27"
                    value={formData.session}
                    onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-[#2f9e44] ${
                      isLight ? 'bg-slate-50 border-gray-300 text-slate-900' : 'bg-[#0a0d12] border-[#30363d] text-white'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isCurrent}
                      onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                      className="w-4 h-4 rounded text-[#2f9e44] focus:ring-0 accent-[#2f9e44]"
                    />
                    <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Mark as Current Serving Mantri</span>
                  </label>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-[#2f9e44] ${
                      isLight ? 'bg-slate-50 border-gray-300 text-slate-900' : 'bg-[#0a0d12] border-[#30363d] text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-[#2f9e44] ${
                      isLight ? 'bg-slate-50 border-gray-300 text-slate-900' : 'bg-[#0a0d12] border-[#30363d] text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Custom About / Vision */}
              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                  Custom About / Vision (Optional)
                  <span className={`text-[10px] block font-normal ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Leave blank to use the member's live profile bio.</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Custom leadership vision or statement for this session..."
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-slate-50 border-gray-300 text-slate-900' : 'bg-[#0a0d12] border-[#30363d] text-white'
                  }`}
                />
              </div>

              {/* Achievements */}
              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>Key Achievements (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Organized Flagship Hackathon, Expanded to 1500+ Members"
                  value={formData.achievements}
                  onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                  className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-slate-50 border-gray-300 text-slate-900' : 'bg-[#0a0d12] border-[#30363d] text-white'
                  }`}
                />
              </div>

              {/* Form Action Buttons */}
              <div className={`flex justify-end gap-3 pt-4 border-t ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border transition-colors ${
                    isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-gray-300' : 'bg-[#21262d] text-gray-300 hover:text-white border-[#30363d]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2f9e44] hover:bg-[#288439] text-white font-bold font-mono shadow-md shadow-[#2f9e44]/20"
                >
                  {modalMode === 'add' ? 'Create Record' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
