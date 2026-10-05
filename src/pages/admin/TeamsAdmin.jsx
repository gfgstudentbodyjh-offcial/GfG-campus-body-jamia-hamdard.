import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import cacheService from '../../services/cacheService';
import { useAdminTheme } from '../../context/AdminThemeContext';
import {
  Users, Code2, Palette, Calendar, Megaphone, Share2, Camera, PenTool, Database, Plus,
  Edit3, Trash2, Search, CheckCircle2, AlertCircle, X,
  UserPlus, UserMinus, Shield, ShieldCheck, ChevronRight
} from 'lucide-react';

const CHAPTER_TEAM_DOMAINS = [
  {
    name: 'Community Lead',
    icon: 'Users',
    iconComp: Users,
    description: 'Spearheading community leadership, campus growth, and cross-team alignment.'
  },
  {
    name: 'Design & Creative',
    icon: 'Palette',
    iconComp: Palette,
    description: 'Crafting visual brand identities, graphic assets, design systems, and UI/UX assets.'
  },
  {
    name: 'Event & Operations',
    icon: 'Calendar',
    iconComp: Calendar,
    description: 'Planning and executing hackathons, technical workshops, competitions, and logistics.'
  },
  {
    name: 'PR & Outreach',
    icon: 'Megaphone',
    iconComp: Megaphone,
    description: 'Managing public relations, media outreach, campus alliances, and sponsor partnerships.'
  },
  {
    name: 'Social Media',
    icon: 'Share2',
    iconComp: Share2,
    description: 'Driving digital presence, content strategy, storytelling, and social campaigns.'
  },
  {
    name: 'Technical Team',
    icon: 'Code2',
    iconComp: Code2,
    description: 'Architecting web platforms, open-source projects, algorithms, and engineering sessions.'
  },
  {
    name: 'Media Team',
    icon: 'Camera',
    iconComp: Camera,
    description: 'Capturing photos and videos of chapter events and producing visual content.'
  },
  {
    name: 'Editorial Team',
    icon: 'PenTool',
    iconComp: PenTool,
    description: 'Writing articles, newsletters, and announcements with consistent quality.'
  },
  {
    name: 'Data & Form Team',
    icon: 'Database',
    iconComp: Database,
    description: 'Building registration forms, managing event data, and analytics reporting.'
  }
];

export default function TeamsAdmin() {
  const { isLight } = useAdminTheme();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Team Create / Edit Modal
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamFormData, setTeamFormData] = useState({
    _id: '',
    name: 'Technical Team',
    icon: 'Code2',
    description: 'Architecting web platforms, open-source projects, algorithms, and engineering sessions.',
    displayOrder: 1,
    status: 'Active'
  });

  // Member Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetTeam, setTargetTeam] = useState(null);
  const [targetRole, setTargetRole] = useState('Member'); // 'Lead' | 'Co-Lead' | 'Member'
  
  // Member Search / ID lookup state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberNotFound, setMemberNotFound] = useState(false);
  const [searchConflict, setSearchConflict] = useState(false);

  useEffect(() => {
    loadData(true);
  }, []);

  const loadData = async (isInitial = false) => {
    if (isInitial && teams.length === 0) {
      setLoading(true);
    }
    try {
      const res = await api.get('/teams');
      const list = res.data.data || [];
      setTeams(list);
      cacheService.set('teams', list);
    } catch (err) {
      console.warn('[TeamsAdmin] Error loading teams:', err);
    } finally {
      setLoading(false);
    }
  };

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
      console.warn('[TeamsAdmin] Member lookup failed:', err);
      setMemberNotFound(true);
    }
    setIsSearching(false);
  };

  const handleSelectMember = (mem) => {
    setSelectedMember(mem);
    setSearchResults([]);
    setMemberNotFound(false);
  };

  // Open Team Creation / Edit Modal
  const handleOpenCreateTeam = () => {
    setTeamFormData({
      _id: '',
      name: '',
      icon: 'Code2',
      description: '',
      displayOrder: teams.length + 1,
      status: 'Active'
    });
    setIsTeamModalOpen(true);
  };

  const handleOpenEditTeam = (team) => {
    setTeamFormData({
      _id: team._id,
      name: team.name,
      icon: team.icon || 'Code2',
      description: team.description || '',
      displayOrder: team.displayOrder || 1,
      status: team.status || 'Active'
    });
    setIsTeamModalOpen(true);
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    const payload = { ...teamFormData };
    if (!payload._id || String(payload._id).trim() === '') {
      delete payload._id;
    }

    try {
      if (teamFormData._id) {
        await api.put(`/teams/${teamFormData._id}`, payload);
      } else {
        await api.post('/teams', payload);
      }
      cacheService.remove('teams');
      cacheService.remove('homepage');
      setIsTeamModalOpen(false);
      loadData();
    } catch (err) {
      alert('Save team failed: ' + (err.response?.data?.message || err.response?.data?.error || err.message));
    }
  };

  const handleDeleteTeam = async (team) => {
    const confirmed = window.confirm(
      `Delete team "${team.name}"?\n\n` +
      `NOTE: This will remove the team organizational record only. ` +
      `Assigned members' accounts, profiles, Member IDs, membership cards, and posts will NOT be deleted.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/teams/${team._id}`);
      cacheService.remove('teams');
      cacheService.remove('homepage');
      loadData();
    } catch (err) {
      alert('Delete team failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // Open Assign Member Modal
  const handleOpenAssignModal = (team, role = 'Member', currentMember = null) => {
    const isCommunity = team?.name && team.name.toLowerCase().includes('community');
    const effectiveRole = isCommunity ? 'Lead' : role;

    setTargetTeam(team);
    setTargetRole(effectiveRole);
    setSelectedMember(currentMember);
    setSearchQuery(currentMember?.membershipId || currentMember?.userCode || '');
    setSearchResults([]);
    setMemberNotFound(false);
    setSearchConflict(false);
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!targetTeam || !selectedMember) {
      alert('Please search and select a verified member.');
      return;
    }

    try {
      await api.post(`/teams/${targetTeam._id}/assign`, {
        memberId: selectedMember._id,
        role: targetRole
      });
      cacheService.remove('teams');
      cacheService.remove('homepage');
      setIsAssignModalOpen(false);
      loadData();
    } catch (err) {
      alert('Assignment failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRemoveMember = async (team, memberId, role) => {
    const confirmed = window.confirm(
      `Remove this member from their ${role} role in "${team.name}"?\n\n` +
      `NOTE: This removes the team role assignment only. ` +
      `The person's account, profile, Member ID, membership card, posts, and comments will remain completely intact.`
    );
    if (!confirmed) return;

    try {
      await api.post(`/teams/${team._id}/remove-member`, {
        memberId,
        role
      });
      cacheService.remove('teams');
      cacheService.remove('homepage');
      loadData();
    } catch (err) {
      alert('Remove failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const getTeamIcon = (iconName) => {
    switch (iconName) {
      case 'Code2': return Code2;
      case 'Palette': return Palette;
      case 'Calendar': return Calendar;
      case 'Megaphone': return Megaphone;
      case 'Share2': return Share2;
      case 'Camera': return Camera;
      case 'PenTool': return PenTool;
      case 'Database': return Database;
      case 'Users': return Users;
      default: {
        const found = CHAPTER_TEAM_DOMAINS.find(d => d.icon === iconName);
        return found ? found.iconComp : Users;
      }
    }
  };

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
            Teams & Leadership Management
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
            Organize domain teams with strict Lead → Co-Lead → Members (A–Z) hierarchy. Connected to real Member IDs.
          </p>
        </div>
        <button
          onClick={handleOpenCreateTeam}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2f9e44] hover:bg-[#288439] text-white text-xs font-bold font-mono transition-all shadow-md shadow-[#2f9e44]/20 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Team</span>
        </button>
      </div>

      {/* ─── Teams List & Role Cards ─────────────────────────────────── */}
      {loading ? (
        <div className={`p-12 text-center font-mono text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Loading teams structure...</div>
      ) : teams.length === 0 ? (
        <div className={`p-12 text-center font-mono text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>No teams found. Click "+ Create New Team" to begin.</div>
      ) : (
        <div className="space-y-8">
          {teams.map((team, idx) => {
            const IconComp = getTeamIcon(team.icon);
            const lead = team.leadRef || null;
            const coLead = team.coLeadRef || null;
            const membersList = Array.isArray(team.memberRefs) ? [...team.memberRefs].sort((a, b) => (a.name || '').localeCompare(b.name || '')) : [];
            const isCommunityLead = team.name && team.name.toLowerCase().includes('community');

            return (
              <div
                key={team._id}
                className={`rounded-2xl border p-6 sm:p-7 space-y-6 transition-colors shadow-md ${
                  isLight
                    ? 'bg-white border-gray-200 text-slate-900'
                    : 'bg-[#161b22] border-[#30363d] text-white'
                }`}
              >
                {/* Team Card Header */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
                  isLight ? 'border-gray-200' : 'border-[#30363d]'
                }`}>
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#2f9e44]/15 border border-[#2f9e44]/30 flex items-center justify-center text-[#2f9e44] flex-shrink-0">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-[#2f9e44]">MODULE 0{idx + 1}</span>
                        <h2 className={`text-lg sm:text-xl font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{team.name}</h2>
                      </div>
                      <p className={`text-xs line-clamp-1 mt-0.5 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{team.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleOpenEditTeam(team)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                        isLight
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border-gray-300'
                          : 'bg-[#21262d] hover:bg-[#30363d] text-gray-300 border-[#30363d]'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Team
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isLight
                          ? 'bg-white hover:bg-red-50 text-red-600 border-red-200'
                          : 'bg-[#21262d] hover:bg-red-500/20 text-red-400 border-[#30363d]'
                      }`}
                      title="Delete Team"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ─── Community Lead Special Card (Lead Only) ──────────────── */}
                {isCommunityLead ? (
                  <div className="max-w-2xl">
                    <div className={`p-4 rounded-xl border space-y-3 ${
                      isLight
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-[#0a0d12] border-[#2f9e44]/30'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white bg-[#2f9e44] px-2.5 py-0.5 rounded">
                          Team Lead
                        </span>
                        {lead && (
                          <button
                            onClick={() => handleRemoveMember(team, lead._id, 'Lead')}
                            className="text-[10px] text-red-500 hover:underline font-mono"
                          >
                            Remove Lead
                          </button>
                        )}
                      </div>

                      {lead ? (
                        <div className="flex items-center gap-3.5 pt-1">
                          <img
                            src={lead.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                            alt={lead.name}
                            className="w-12 h-14 rounded-lg object-cover border border-[#2f9e44] flex-shrink-0 shadow-sm"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className={`font-bold text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{lead.name}</h4>
                            <p className={`text-[11px] font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>@{lead.username || 'user'}</p>
                            <p className="text-[10px] font-mono font-bold text-[#2f9e44]">
                              ID: {lead.membershipId || lead.userCode || '—'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleOpenAssignModal(team, 'Lead', lead)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                              isLight
                                ? 'bg-white hover:bg-slate-100 text-slate-800 border-gray-300'
                                : 'bg-[#21262d] hover:bg-[#30363d] text-gray-300 border-[#30363d]'
                            }`}
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div className="py-4 text-center space-y-2">
                          <p className={`text-xs font-mono ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No Lead assigned to Community Lead yet.</p>
                          <button
                            onClick={() => handleOpenAssignModal(team, 'Lead')}
                            className="px-3 py-1.5 rounded-lg bg-[#2f9e44]/15 hover:bg-[#2f9e44] text-[#2f9e44] hover:text-white text-xs font-bold border border-[#2f9e44]/30 transition-all inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add Lead</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* ─── Normal Teams: Lead & Co-Lead Hierarchy Grid ────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Lead Section */}
                      <div className={`p-4 rounded-xl border space-y-3 ${
                        isLight
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-[#0a0d12] border-[#2f9e44]/30'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white bg-[#2f9e44] px-2.5 py-0.5 rounded">
                            Team Lead
                          </span>
                          {lead && (
                            <button
                              onClick={() => handleRemoveMember(team, lead._id, 'Lead')}
                              className="text-[10px] text-red-500 hover:underline font-mono"
                            >
                              Remove Lead
                            </button>
                          )}
                        </div>

                        {lead ? (
                          <div className="flex items-center gap-3.5 pt-1">
                            <img
                              src={lead.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                              alt={lead.name}
                              className="w-12 h-14 rounded-lg object-cover border border-[#2f9e44] flex-shrink-0 shadow-sm"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className={`font-bold text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{lead.name}</h4>
                              <p className={`text-[11px] font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>@{lead.username || 'user'}</p>
                              <p className="text-[10px] font-mono font-bold text-[#2f9e44]">
                                ID: {lead.membershipId || lead.userCode || '—'}
                              </p>
                            </div>
                            <button
                              onClick={() => handleOpenAssignModal(team, 'Lead', lead)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                isLight
                                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-gray-300'
                                  : 'bg-[#21262d] hover:bg-[#30363d] text-gray-300 border-[#30363d]'
                              }`}
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <div className="py-4 text-center space-y-2">
                            <p className={`text-xs font-mono ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No Lead assigned to this team.</p>
                            <button
                              onClick={() => handleOpenAssignModal(team, 'Lead')}
                              className="px-3 py-1.5 rounded-lg bg-[#2f9e44]/15 hover:bg-[#2f9e44] text-[#2f9e44] hover:text-white text-xs font-bold border border-[#2f9e44]/30 transition-all inline-flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Add Lead</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Co-Lead Section */}
                      <div className={`p-4 rounded-xl border space-y-3 ${
                        isLight
                          ? 'bg-slate-50 border-gray-200'
                          : 'bg-[#0a0d12] border-[#30363d]'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                            isLight
                              ? 'bg-white text-slate-700 border-gray-300'
                              : 'bg-[#18202c] text-gray-300 border-[#30363d]'
                          }`}>
                            Team Co-Lead
                          </span>
                          {coLead && (
                            <button
                              onClick={() => handleRemoveMember(team, coLead._id, 'Co-Lead')}
                              className="text-[10px] text-red-500 hover:underline font-mono"
                            >
                              Remove Co-Lead
                            </button>
                          )}
                        </div>

                        {coLead ? (
                          <div className="flex items-center gap-3.5 pt-1">
                            <img
                              src={coLead.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                              alt={coLead.name}
                              className="w-12 h-14 rounded-lg object-cover border border-[#2f9e44] flex-shrink-0 shadow-sm"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className={`font-bold text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{coLead.name}</h4>
                              <p className={`text-[11px] font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>@{coLead.username || 'user'}</p>
                              <p className="text-[10px] font-mono font-bold text-[#2f9e44]">
                                ID: {coLead.membershipId || coLead.userCode || '—'}
                              </p>
                            </div>
                            <button
                              onClick={() => handleOpenAssignModal(team, 'Co-Lead', coLead)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                isLight
                                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-gray-300'
                                  : 'bg-[#21262d] hover:bg-[#30363d] text-gray-300 border-[#30363d]'
                              }`}
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <div className="py-4 text-center space-y-2">
                            <p className={`text-xs font-mono ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>No Co-Lead assigned to this team.</p>
                            <button
                              onClick={() => handleOpenAssignModal(team, 'Co-Lead')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all inline-flex items-center gap-1.5 ${
                                isLight
                                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-gray-300'
                                  : 'bg-[#21262d] hover:bg-[#30363d] text-gray-300 border-[#30363d]'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Add Co-Lead</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ─── Normal Teams: Members Section (Alphabetical A-Z) ─────── */}
                    <div className="pt-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                            isLight ? 'text-slate-700' : 'text-gray-300'
                          }`}>
                            Team Members ({membersList.length})
                          </span>
                          <span className="text-[10px] font-mono text-[#2f9e44] bg-[#2f9e44]/10 px-2 py-0.5 rounded font-bold">
                            Alphabetical A–Z
                          </span>
                        </div>

                        <button
                          onClick={() => handleOpenAssignModal(team, 'Member')}
                          className="px-3 py-1.5 rounded-lg bg-[#2f9e44]/15 hover:bg-[#2f9e44] text-[#2f9e44] hover:text-white text-xs font-bold font-mono border border-[#2f9e44]/30 transition-all flex items-center gap-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>+ Add Member</span>
                        </button>
                      </div>

                      {membersList.length === 0 ? (
                        <div className={`p-4 rounded-xl border text-center text-xs font-mono ${
                          isLight ? 'bg-slate-50 border-gray-200 text-slate-400' : 'bg-[#0a0d12] border-[#30363d]/60 text-gray-500'
                        }`}>
                          No members assigned to this team yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {membersList.map((mem) => (
                            <div
                              key={mem._id}
                              className={`p-3 rounded-xl border flex items-center justify-between group transition-all ${
                                isLight
                                  ? 'bg-slate-50 border-gray-200 hover:border-[#2f9e44] hover:bg-white'
                                  : 'bg-[#0a0d12] border-[#30363d] hover:border-[#2f9e44]/60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={mem.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                                  alt={mem.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-[#2f9e44] flex-shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className={`font-bold text-xs truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{mem.name}</p>
                                  <p className={`text-[9px] font-mono truncate ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                                    {mem.username ? `@${mem.username}` : (mem.membershipId || mem.userCode)}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveMember(team, mem._id, 'Member')}
                                className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                                title="Remove from team"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Create / Edit Team Modal ───────────────────────────────── */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className={`border rounded-2xl w-full max-w-lg p-6 sm:p-7 space-y-5 my-8 shadow-2xl transition-colors ${
            isLight ? 'bg-white border-gray-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
          }`}>
            <div className={`flex justify-between items-center border-b pb-4 ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
              <div>
                <span className="text-[10px] font-mono font-bold text-[#2f9e44] uppercase tracking-wider block">
                  ORGANIZATIONAL DOMAINS
                </span>
                <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {teamFormData._id ? 'Edit Team Details' : '+ Create Chapter Team'}
                </h3>
              </div>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-[#21262d]'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-4 text-xs">
              {/* Quick Preset Selector for New Teams */}
              {!teamFormData._id && (
                <div>
                  <label className={`block font-semibold mb-1.5 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                    Select Chapter Domain Preset
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CHAPTER_TEAM_DOMAINS.map((dom) => {
                      const DomIcon = dom.iconComp;
                      const isSelected = teamFormData.name === dom.name;
                      return (
                        <button
                          key={dom.name}
                          type="button"
                          onClick={() => {
                            setTeamFormData({
                              ...teamFormData,
                              name: dom.name,
                              icon: dom.icon,
                              description: dom.description
                            });
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                            isSelected
                              ? 'bg-[#2f9e44] text-white border-[#2f9e44] shadow-md shadow-[#2f9e44]/20 font-bold'
                              : isLight
                              ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-gray-200'
                              : 'bg-[#0a0d12] hover:bg-[#1f242c] text-gray-300 border-[#30363d]'
                          }`}
                        >
                          <DomIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-[11px] truncate leading-tight">{dom.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                  Team Name <span className="text-[#2f9e44]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technical Team, Design & Creative"
                  value={teamFormData.name}
                  onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                  className={`w-full rounded-xl px-3.5 py-2.5 border focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-slate-50 border-gray-300 text-slate-900' : 'bg-[#0a0d12] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                  Domain Icon
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {CHAPTER_TEAM_DOMAINS.map(dom => {
                    const DomIcon = dom.iconComp;
                    const isSelected = teamFormData.icon === dom.icon;
                    return (
                      <button
                        key={dom.icon}
                        type="button"
                        onClick={() => setTeamFormData({ ...teamFormData, icon: dom.icon })}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-[#2f9e44]/15 border-[#2f9e44] text-[#2f9e44] font-bold shadow-sm'
                            : isLight
                            ? 'bg-slate-50 text-slate-600 border-gray-200 hover:bg-slate-100'
                            : 'bg-[#0a0d12] text-gray-400 border-[#30363d] hover:border-gray-500'
                        }`}
                        title={dom.name}
                      >
                        <DomIcon className="w-4 h-4" />
                        <span className="text-[9px] font-mono truncate max-w-[50px]">{dom.icon}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                  Description <span className="text-[#2f9e44]">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Brief description of the team's mission and initiatives..."
                  value={teamFormData.description}
                  onChange={(e) => setTeamFormData({ ...teamFormData, description: e.target.value })}
                  className={`w-full rounded-xl px-3.5 py-2.5 border focus:outline-none focus:border-[#2f9e44] leading-relaxed ${
                    isLight ? 'bg-slate-50 border-gray-300 text-slate-900' : 'bg-[#0a0d12] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div className={`flex justify-end gap-3 pt-3 border-t ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
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
                  {teamFormData._id ? 'Save Changes' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Assign Member / Lookup Modal ────────────────────────────── */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className={`border rounded-2xl w-full max-w-lg p-6 sm:p-7 space-y-5 my-8 shadow-2xl transition-colors ${
            isLight ? 'bg-white border-gray-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
          }`}>
            <div className={`flex justify-between items-center border-b pb-4 ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
              <div>
                <span className="text-[10px] font-mono font-bold text-[#2f9e44] uppercase tracking-wider block">
                  ASSIGN TO {targetTeam?.name?.toUpperCase()}
                </span>
                <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {targetRole === 'Lead'
                    ? (selectedMember ? 'Change Team Lead' : 'Assign Member as Team Lead')
                    : targetRole === 'Co-Lead'
                    ? (selectedMember ? 'Change Team Co-Lead' : 'Assign Member as Team Co-Lead')
                    : 'Add Member to Team'}
                </h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-[#21262d]'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4 text-xs">
              {/* Role Selection — Hidden for Community Lead team */}
              {!(targetTeam?.name && targetTeam.name.toLowerCase().includes('community')) && (
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>Target Team Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Lead', 'Co-Lead', 'Member'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTargetRole(r)}
                        className={`py-2 px-3 rounded-xl font-bold font-mono text-xs transition-all border ${
                          targetRole === r
                            ? 'bg-[#2f9e44] text-white border-[#2f9e44] shadow-md shadow-[#2f9e44]/20'
                            : isLight
                            ? 'bg-slate-100 text-slate-700 border-gray-300 hover:bg-slate-200'
                            : 'bg-[#0a0d12] text-gray-400 border-[#30363d] hover:border-gray-500'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Member Search / Lookup */}
              <div className="space-y-2">
                <label className={`block font-bold ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
                  Search by Member ID <span className="text-[#2f9e44]">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Enter Member ID (e.g. GFG-JH-2026-020)..."
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
                    Member ID conflict detected. Multiple records found.
                  </p>
                )}

                {memberNotFound && !searchConflict && (
                  <p className="text-amber-600 text-[11px] flex items-center gap-1 pt-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    No member found with this Member ID.
                  </p>
                )}

                {/* Suggestions List */}
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
                    className="w-12 h-14 rounded-lg object-cover border border-[#2f9e44] flex-shrink-0 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className={`font-bold text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedMember.name}</h4>
                      <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    </div>
                    <p className={`text-[11px] font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                      @{selectedMember.username || 'user'} • {selectedMember.department || selectedMember.course || 'Computer Science & Engineering'}
                    </p>
                    <span className="text-[10px] font-mono font-bold text-[#2f9e44]">
                      ID: {selectedMember.membershipId || selectedMember.userCode}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className={`flex justify-end gap-3 pt-4 border-t ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border transition-colors ${
                    isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-gray-300' : 'bg-[#21262d] text-gray-300 hover:text-white border-[#30363d]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedMember}
                  className={`px-5 py-2 rounded-xl font-bold font-mono shadow-md transition-all ${
                    selectedMember
                      ? 'bg-[#2f9e44] hover:bg-[#288439] text-white shadow-[#2f9e44]/20'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  {targetRole === 'Lead'
                    ? (selectedMember && selectedMember._id === targetTeam?.leadRef?._id ? 'Replace Lead' : 'Assign as Lead')
                    : targetRole === 'Co-Lead'
                    ? (selectedMember && selectedMember._id === targetTeam?.coLeadRef?._id ? 'Replace Co-Lead' : 'Assign as Co-Lead')
                    : 'Add as Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
