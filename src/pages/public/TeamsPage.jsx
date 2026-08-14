import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import api from '../../services/api';
import { MOCK_TEAMS } from '../../data/teams';
import { MOCK_FACULTY } from '../../data/faculty';
import {
  Users, Code2, Palette, Calendar, Megaphone, Share2, Mail, Linkedin,
  Github, Instagram, Award, GraduationCap, ArrowUpRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import TechHeader from '../../components/common/TechHeader';
import TechCard from '../../components/common/TechCard';
import cacheService from '../../services/cacheService';
import TeamMemberModal from '../../components/common/TeamMemberModal';

const ICON_MAP = {
  Users,
  Code2,
  Palette,
  Calendar,
  Megaphone,
  Share2
};

function TeamMembersSection({ members, teamName, onOpenDetails }) {
  const [startIndex, setStartIndex] = useState(0);
  const total = members.length;

  if (total === 0) return null;

  // Looping 4-Cards Carousel Controls for Desktop
  const handleNext = () => {
    setStartIndex((prev) => (prev + 4) % total);
  };

  const handlePrev = () => {
    setStartIndex((prev) => (prev - 4 + total) % total);
  };

  const visibleMembers = [];
  for (let i = 0; i < Math.min(4, total); i++) {
    const idx = (startIndex + i) % total;
    visibleMembers.push(members[idx]);
  }

  const currentPage = Math.floor(startIndex / 4) + 1;
  const totalPages = Math.ceil(total / 4);

  return (
    <div className="pt-4 border-t border-[#30363d]/60 space-y-3">
      {/* ─── DESKTOP PRESENTATION (4 Cards Grid / Looping Carousel) ─── */}
      <div className="hidden md:block space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider">
              Team Members ({total})
            </span>
            {total > 4 ? (
              <span className="text-[10px] font-mono text-[#2f9e44] bg-[#2f9e44]/10 px-2 py-0.5 rounded font-bold">
                Page {currentPage} of {totalPages}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-[#2f9e44]">
                Alphabetical Order
              </span>
            )}
          </div>

          {total > 4 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg bg-[#0a0d12] hover:bg-[#2f9e44] text-gray-300 hover:text-white border border-[#30363d] hover:border-[#2f9e44] transition-all shadow-sm flex items-center justify-center"
                title="Previous members"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-lg bg-[#0a0d12] hover:bg-[#2f9e44] text-gray-300 hover:text-white border border-[#30363d] hover:border-[#2f9e44] transition-all shadow-sm flex items-center justify-center"
                title="Next members"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 transition-all duration-300">
          {(total > 4 ? visibleMembers : members).map((mem, idx) => (
            <MemberItem
              key={`${mem._id || mem.username || mem.name}-${startIndex}-${idx}`}
              mem={mem}
              teamName={teamName}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </div>
      </div>

      {/* ─── MOBILE PRESENTATION (Compact Horizontal Member Strip) ─── */}
      <div className="block md:hidden space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
            TEAM MEMBERS ({total})
          </span>
          <span className="text-[9px] font-mono text-[#2f9e44] bg-[#2f9e44]/10 px-2 py-0.5 rounded">
            Scroll →
          </span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1.5 -mx-1 px-1">
          {members.map((mem) => (
            <div
              key={mem._id || mem.username || mem.name}
              onClick={() => onOpenDetails(mem, teamName)}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0a0d12] border border-[#30363d] hover:border-[#2f9e44] active:bg-[#18202c] transition-all cursor-pointer group shadow-sm"
              style={{ minWidth: '150px', maxWidth: '180px' }}
            >
              <img
                src={mem.photo}
                alt={mem.name}
                loading="lazy"
                className="w-8 h-8 rounded-lg object-cover border border-[#2f9e44]/60 flex-shrink-0 group-hover:border-[#2f9e44]"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-white text-xs truncate leading-tight group-hover:text-[#2f9e44]">
                  {mem.name}
                </p>
                <span className="text-[9px] font-mono text-gray-400 truncate block">
                  {mem.username ? `@${mem.username}` : (mem.membershipId || 'Member')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Individual Member Card ────────────────────────────────────────────────
function MemberItem({ mem, teamName, onOpenDetails }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetails(mem, teamName)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetails(mem, teamName);
        }
      }}
      className="p-2.5 rounded-xl bg-[#0a0d12] border border-[#30363d] hover:border-[#2f9e44]/60 flex items-center justify-between gap-2.5 cursor-pointer transition-all hover:bg-[#161b22] group"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <img
          src={mem.photo}
          alt={mem.name}
          loading="lazy"
          className="w-9 h-9 rounded-lg object-cover border border-[#30363d] group-hover:border-[#2f9e44] flex-shrink-0 transition-colors"
        />
        <div className="min-w-0 flex-1">
          <h5 className="font-bold text-white text-xs truncate leading-tight group-hover:text-[#2f9e44] transition-colors">
            {mem.name}
          </h5>
          <span className="text-[9px] font-mono text-gray-400 block truncate">
            {mem.username ? `@${mem.username}` : (mem.membershipId || 'Member')}
          </span>
        </div>
      </div>
      {mem.username && (
        <a
          href={`/profile/${mem.username}`}
          onClick={(e) => e.stopPropagation()}
          className="text-gray-400 group-hover:text-[#2f9e44] hover:!text-white p-1 rounded transition-colors"
          title="View Profile"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

export default function TeamsPage() {
  const [teams, setTeams] = useState(() => {
    const cached = cacheService.get('teams');
    return cached?.data || [];
  });
  const [faculty, setFaculty] = useState(() => {
    const cached = cacheService.get('faculty');
    return cached?.data || [];
  });
  const [loading, setLoading] = useState(() => {
    const cachedTeams = cacheService.get('teams');
    return !(cachedTeams && cachedTeams.data && cachedTeams.data.length > 0);
  });

  // Mobile / Quick Team Details Modal State (Matches Events interaction model)
  const [selectedTeamModal, setSelectedTeamModal] = useState(null);

  // Individual Member Details Modal State
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedTeamName, setSelectedTeamName] = useState('');
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  const handleOpenMemberDetails = (member, teamName) => {
    if (!member) return;
    setSelectedMember(member);
    setSelectedTeamName(teamName);
    setIsMemberModalOpen(true);
  };

  useEffect(() => {
    // 1. Subscribe to cache updates (realtime sync when admin edits teams/faculty)
    const unsubTeams = cacheService.subscribe('teams', (data) => {
      if (Array.isArray(data)) {
        setTeams(data);
        setLoading(false);
      }
    });

    const unsubFaculty = cacheService.subscribe('faculty', (data) => {
      if (Array.isArray(data)) {
        setFaculty(data);
      }
    });

    // 2. Fetch fresh live data from database on page load
    api.get('/teams')
      .then((teamsRes) => {
        const teamsData = teamsRes.data?.data;
        if (Array.isArray(teamsData) && teamsData.length > 0) {
          setTeams(teamsData);
          cacheService.set('teams', teamsData);
        } else if (!teams || teams.length === 0) {
          setTeams(MOCK_TEAMS);
        }
      })
      .catch((err) => {
        console.warn('[TeamsPage] Live fetch failed, using fallback:', err);
        if (!teams || teams.length === 0) setTeams(MOCK_TEAMS);
      })
      .finally(() => setLoading(false));

    api.get('/faculty')
      .then((facultyRes) => {
        const facultyData = facultyRes.data?.data;
        if (Array.isArray(facultyData) && facultyData.length > 0) {
          setFaculty(facultyData);
          cacheService.set('faculty', facultyData);
        } else if (!faculty || faculty.length === 0) {
          setFaculty(MOCK_FACULTY);
        }
      })
      .catch((err) => {
        console.warn('[TeamsPage] Faculty fetch failed, using fallback:', err);
        if (!faculty || faculty.length === 0) setFaculty(MOCK_FACULTY);
      });

    return () => {
      unsubTeams();
      unsubFaculty();
    };
  }, []);

  const normalizePerson = (p, fallbackTitle = 'Member') => {
    if (!p) return null;
    const bioText = p.bio || p.about || p.message || 'GeeksforGeeks Campus Body Member';
    return {
      _id: p._id,
      name: p.name || p.fullName,
      username: p.username,
      membershipId: p.membershipId || p.userCode,
      userCode: p.userCode || p.membershipId,
      photo: p.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      title: p.title || p.role || fallbackTitle,
      role: p.role || p.title || fallbackTitle,
      message: bioText,
      bio: bioText,
      about: bioText,
      imagePosition: p.imagePosition || 'center 50%',
      socials: p.socials || {
        email: p.email,
        linkedin: p.linkedin,
        github: p.github,
        instagram: p.instagram,
        website: p.website || p.portfolio
      }
    };
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-100 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 sm:space-y-12">
        
        {/* Page Header */}
        <TechHeader
          tag="OUR TEAMS"
          title="Faculty Guidance & Team Leads"
          description="Meet the faculty mentors and dedicated student leaders behind GeeksforGeeks Campus Body at Jamia Hamdard."
          count={teams.length}
          countLabel="Teams"
        />

        {/* ─── Faculty Coordinators Section ─────────── */}
        <section className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-3 border-b border-[#30363d] pb-3 sm:pb-4">
            <div className="p-2 rounded-xl bg-[#2f9e44]/20 text-[#2f9e44] border border-[#2f9e44]/30 flex-shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#2f9e44] uppercase tracking-wider font-bold block">FACULTY GUIDANCE</span>
              <h2 className="text-lg sm:text-xl font-bold text-white">Faculty Guidance</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {faculty.map((f, idx) => {
              const facObj = {
                name: f.name || f.memberRef?.name,
                title: 'Faculty Coordinator',
                photo: f.photo || f.memberRef?.photo,
                imagePosition: f.imagePosition || 'top',
                message: [
                  f.designation,
                  f.department || f.institution,
                  f.about
                ].filter(Boolean).join(' • '),
                socials: {
                  email: f.email,
                  linkedin: f.linkedin
                }
              };

              return (
                <TechCard
                  key={f._id || idx}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenMemberDetails(facObj, 'Faculty Guidance')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenMemberDetails(facObj, 'Faculty Guidance');
                    }
                  }}
                  className="p-4 sm:p-6 border-[#30363d] bg-gradient-to-br from-[#121721] to-[#0a0d12] flex flex-col justify-between space-y-4 cursor-pointer active:scale-[0.985] transition-transform"
                >
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                    <img
                      src={f.photo || f.memberRef?.photo}
                      alt={`${f.name || f.memberRef?.name}, Faculty Coordinator`}
                      loading="lazy"
                      style={{ objectPosition: f.imagePosition || 'top' }}
                      className="w-28 h-32 sm:w-36 sm:h-40 rounded-xl object-cover border-2 border-[#2f9e44] shadow-md flex-shrink-0"
                    />
                    <div className="space-y-1.5 sm:space-y-2 text-center sm:text-left min-w-0 w-full">
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold text-[#2f9e44] uppercase tracking-wider bg-[#2f9e44]/15 border border-[#2f9e44]/30 px-2 py-0.5 rounded inline-block">
                        Faculty Coordinator
                      </span>
                      <h3 className="text-base sm:text-xl font-bold text-white leading-tight truncate">{f.name || f.memberRef?.name}</h3>
                      <p className="text-xs sm:text-sm font-semibold text-gray-300 line-clamp-1">{f.designation}</p>
                      <p className="text-[11px] sm:text-xs text-gray-400 line-clamp-2">{f.department || f.institution}</p>
                      
                      {f.email && (
                        <a
                          href={`mailto:${f.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs text-[#2f9e44] hover:underline pt-1 truncate"
                        >
                          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{f.email}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Awards & Recognition */}
                  {f.awards && f.awards.length > 0 && (
                    <div className="pt-3 border-t border-[#30363d]/60 space-y-1.5">
                      <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#2f9e44]" /> Awards & Honors
                      </span>
                      <div className="space-y-1">
                        {f.awards.map((award, aIdx) => (
                          <div key={aIdx} className="text-xs text-gray-300 bg-[#0a0d12] p-2 rounded-lg border border-[#30363d] flex items-start gap-2">
                            <span className="text-[#2f9e44] font-bold">•</span>
                            <span>{award}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TechCard>
              );
            })}
          </div>
        </section>

        {/* ─── Student Teams & Leads Section ─────────── */}
        <section className="space-y-6 sm:space-y-8">
          <div className="flex items-center gap-3 border-b border-[#30363d] pb-3 sm:pb-4">
            <div className="p-2 rounded-xl bg-[#2f9e44]/20 text-[#2f9e44] border border-[#2f9e44]/30 flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#2f9e44] uppercase tracking-wider font-bold block">STUDENT TEAMS</span>
              <h2 className="text-lg sm:text-xl font-bold text-white">Student Teams & Leads</h2>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400 font-mono">Loading Teams...</div>
          ) : (
            <div className="space-y-5 sm:space-y-8">
              {teams.map((t, idx) => {
                const IconComponent = ICON_MAP[t.icon] || Users;
                const isCommunityLead = t.name && t.name.toLowerCase().includes('community');
                
                const lead = normalizePerson(t.lead || t.leadRef, 'Lead');
                const coLead = !isCommunityLead ? normalizePerson(t.coLead || t.coLeadRef, 'Co-Lead') : null;
                const memberRefsRaw = (!isCommunityLead && Array.isArray(t.memberRefs)) ? t.memberRefs : [];
                const membersList = memberRefsRaw
                  .map(m => normalizePerson(m, 'Member'))
                  .filter(Boolean)
                  .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));

                const teamPayload = {
                  ...t,
                  idx,
                  IconComponent,
                  isCommunityLead,
                  lead,
                  coLead,
                  membersList
                };

                return (
                  <TechCard
                    key={t._id}
                    className="p-5 sm:p-7 lg:p-8 border-[#30363d] bg-[#121721] space-y-5 sm:space-y-6"
                  >
                    {/* Team Module Header */}
                    <div className="flex items-center gap-3.5 pb-4 sm:pb-5 border-b border-[#30363d]">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#2f9e44]/20 border border-[#2f9e44]/40 flex items-center justify-center text-[#2f9e44] flex-shrink-0">
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-2xl font-bold text-white truncate leading-tight">{t.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-400 line-clamp-1 mt-0.5">{t.description}</p>
                      </div>
                    </div>

                    {/* Member Cards: Lead & Co-Lead (or Full-Width Lead for Community Lead) */}
                    {(lead || coLead) && (
                      <div className={isCommunityLead ? "max-w-xl" : (coLead ? "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6")}>
                        {lead && (
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => handleOpenMemberDetails(lead, t.name)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenMemberDetails(lead, t.name);
                              }
                            }}
                            className="bg-[#0a0d12] p-4 sm:p-6 rounded-2xl border border-[#2f9e44]/40 flex flex-col justify-between tech-corner space-y-4 cursor-pointer active:scale-[0.985] transition-transform"
                          >
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
                              <img
                                src={lead.photo}
                                alt={`${lead.name}, ${lead.title || 'Lead'}`}
                                loading="lazy"
                                style={{ objectPosition: lead.imagePosition || 'center 50%' }}
                                className="w-28 h-32 sm:w-32 sm:h-36 rounded-xl object-cover border-2 border-[#2f9e44] flex-shrink-0 shadow-md"
                              />
                              <div className="space-y-1.5 sm:space-y-2 text-center sm:text-left min-w-0 w-full flex-1">
                                <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-white bg-[#2f9e44] px-2.5 py-0.5 rounded inline-block">
                                  {lead.title || 'Lead'}
                                </span>
                                <h4 className="font-bold text-white text-base sm:text-lg leading-tight truncate">{lead.name}</h4>

                                {/* Bio Preview */}
                                <p className="text-xs text-gray-300 italic leading-relaxed pt-1.5 border-t border-[#30363d]/60 line-clamp-3">
                                  "{lead.bio}"
                                </p>
                              </div>
                            </div>

                            {/* Social Links & Profile Action */}
                            <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#30363d]">
                              {lead.socials ? (
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                  {lead.socials.email && (
                                    <a href={`mailto:${lead.socials.email}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 sm:p-2 rounded-lg bg-[#18202c] text-gray-300 hover:text-white hover:bg-[#2f9e44] transition-colors border border-[#30363d]" title="Email">
                                      <Mail className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  {lead.socials.linkedin && (
                                    <a href={lead.socials.linkedin.startsWith('http') ? lead.socials.linkedin : `https://linkedin.com/in/${lead.socials.linkedin}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 sm:p-2 rounded-lg bg-[#18202c] text-gray-300 hover:text-white hover:bg-[#0077b5] transition-colors border border-[#30363d]" title="LinkedIn">
                                      <Linkedin className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  {lead.socials.github && (
                                    <a href={lead.socials.github.startsWith('http') ? lead.socials.github : `https://github.com/${lead.socials.github}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 sm:p-2 rounded-lg bg-[#18202c] text-gray-300 hover:text-white hover:bg-gray-700 transition-colors border border-[#30363d]" title="GitHub">
                                      <Github className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  {lead.socials.instagram && (
                                    <a href={lead.socials.instagram.startsWith('http') ? lead.socials.instagram : `https://instagram.com/${lead.socials.instagram}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 sm:p-2 rounded-lg bg-[#18202c] text-gray-300 hover:text-white hover:bg-[#e1306c] transition-colors border border-[#30363d]" title="Instagram">
                                      <Instagram className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              ) : <div />}

                              {lead.username && (
                                <a
                                  href={`/profile/${lead.username}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#2f9e44] hover:underline bg-[#2f9e44]/10 hover:bg-[#2f9e44]/20 px-2.5 py-1 rounded-lg border border-[#2f9e44]/30"
                                >
                                  <span>Profile</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {coLead && (
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => handleOpenMemberDetails(coLead, t.name)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenMemberDetails(coLead, t.name);
                              }
                            }}
                            className="bg-[#0a0d12] p-4 sm:p-6 rounded-2xl border border-[#30363d] flex flex-col justify-between tech-corner space-y-4 cursor-pointer active:scale-[0.985] transition-transform"
                          >
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
                              <img
                                src={coLead.photo}
                                alt={`${coLead.name}, ${coLead.title || 'Co-Lead'}`}
                                loading="lazy"
                                style={{ objectPosition: coLead.imagePosition || 'center 50%' }}
                                className="w-28 h-32 sm:w-32 sm:h-36 rounded-xl object-cover border-2 border-[#30363d] flex-shrink-0 shadow-md"
                              />
                              <div className="space-y-1.5 sm:space-y-2 text-center sm:text-left min-w-0 w-full flex-1">
                                <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-gray-300 bg-[#18202c] border border-[#30363d] px-2.5 py-0.5 rounded inline-block">
                                  {coLead.title || 'Co-Lead'}
                                </span>
                                <h4 className="font-bold text-white text-base sm:text-lg leading-tight truncate">{coLead.name}</h4>

                                {/* Bio Preview */}
                                <p className="text-xs text-gray-300 italic leading-relaxed pt-1.5 border-t border-[#30363d]/60 line-clamp-3">
                                  "{coLead.bio}"
                                </p>
                              </div>
                            </div>

                            {/* Social Links & Profile Action */}
                            <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#30363d]">
                              {coLead.socials ? (
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                  {coLead.socials.email && (
                                    <a href={`mailto:${coLead.socials.email}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 sm:p-2 rounded-lg bg-[#18202c] text-gray-300 hover:text-white hover:bg-[#2f9e44] transition-colors border border-[#30363d]" title="Email">
                                      <Mail className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  {coLead.socials.linkedin && (
                                    <a href={coLead.socials.linkedin.startsWith('http') ? coLead.socials.linkedin : `https://linkedin.com/in/${coLead.socials.linkedin}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 sm:p-2 rounded-lg bg-[#18202c] text-gray-300 hover:text-white hover:bg-[#0077b5] transition-colors border border-[#30363d]" title="LinkedIn">
                                      <Linkedin className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  {coLead.socials.github && (
                                    <a href={coLead.socials.github.startsWith('http') ? coLead.socials.github : `https://github.com/${coLead.socials.github}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 sm:p-2 rounded-lg bg-[#18202c] text-gray-300 hover:text-white hover:bg-gray-700 transition-colors border border-[#30363d]" title="GitHub">
                                      <Github className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  {coLead.socials.instagram && (
                                    <a href={coLead.socials.instagram.startsWith('http') ? coLead.socials.instagram : `https://instagram.com/${coLead.socials.instagram}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 sm:p-2 rounded-lg bg-[#18202c] text-gray-300 hover:text-white hover:bg-[#e1306c] transition-colors border border-[#30363d]" title="Instagram">
                                      <Instagram className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              ) : <div />}

                              {coLead.username && (
                                <a
                                  href={`/profile/${coLead.username}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#2f9e44] hover:underline bg-[#2f9e44]/10 hover:bg-[#2f9e44]/20 px-2.5 py-1 rounded-lg border border-[#2f9e44]/30"
                                >
                                  <span>Profile</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ─── Team Members Subsection (Desktop Carousel + Mobile Compact Strip) ─── */}
                    {!isCommunityLead && membersList.length > 0 && (
                      <TeamMembersSection
                        members={membersList}
                        teamName={t.name}
                        onOpenDetails={handleOpenMemberDetails}
                      />
                    )}
                  </TechCard>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* ─── Team Details Modal (Matches Event Details interaction model) ─── */}
      {selectedTeamModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
          onClick={() => setSelectedTeamModal(null)}
        >
          <div
            className="border border-[#30363d] rounded-2xl w-full max-w-2xl bg-[#0a0d12] text-white shadow-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#30363d] flex items-center justify-between gap-4 bg-[#121721]">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#2f9e44]/20 border border-[#2f9e44]/30 flex items-center justify-center text-[#2f9e44] flex-shrink-0">
                  {React.createElement(selectedTeamModal.IconComponent || Users, { className: "w-6 h-6" })}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white truncate leading-tight">
                    {selectedTeamModal.name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedTeamModal(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors flex-shrink-0"
              >
                <ChevronRight className="w-5 h-5 rotate-90" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                  ABOUT THIS TEAM
                </span>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  {selectedTeamModal.description}
                </p>
              </div>

              {/* Leadership Section */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-mono font-bold text-[#2f9e44] uppercase tracking-wider block">
                  TEAM LEADERSHIP
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {selectedTeamModal.lead && (
                    <div className="p-4 rounded-xl bg-[#121721] border border-[#2f9e44]/40 space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedTeamModal.lead.photo}
                          alt={selectedTeamModal.lead.name}
                          className="w-12 h-14 rounded-lg object-cover border border-[#2f9e44] flex-shrink-0 shadow-sm"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-mono font-bold text-white bg-[#2f9e44] px-2 py-0.5 rounded inline-block">
                            Team Lead
                          </span>
                          <h4 className="font-bold text-white text-sm truncate mt-0.5">{selectedTeamModal.lead.name}</h4>
                          <p className="text-[10px] font-mono text-gray-400 truncate">@{selectedTeamModal.lead.username || 'user'}</p>
                        </div>
                      </div>

                      {selectedTeamModal.lead.bio && (
                        <p className="text-[11px] text-gray-300 italic line-clamp-2 border-t border-[#30363d]/60 pt-2">
                          "{selectedTeamModal.lead.bio}"
                        </p>
                      )}

                      {selectedTeamModal.lead.username && (
                        <a
                          href={`/profile/${selectedTeamModal.lead.username}`}
                          className="w-full py-1.5 rounded-lg bg-[#18202c] hover:bg-[#2f9e44] text-gray-300 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-1 border border-[#30363d] transition-colors"
                        >
                          <span>View Public Profile</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {selectedTeamModal.coLead && (
                    <div className="p-4 rounded-xl bg-[#121721] border border-[#30363d] space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedTeamModal.coLead.photo}
                          alt={selectedTeamModal.coLead.name}
                          className="w-12 h-14 rounded-lg object-cover border border-gray-600 flex-shrink-0 shadow-sm"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-mono font-bold text-gray-300 bg-[#18202c] border border-[#30363d] px-2 py-0.5 rounded inline-block">
                            Team Co-Lead
                          </span>
                          <h4 className="font-bold text-white text-sm truncate mt-0.5">{selectedTeamModal.coLead.name}</h4>
                          <p className="text-[10px] font-mono text-gray-400 truncate">@{selectedTeamModal.coLead.username || 'user'}</p>
                        </div>
                      </div>

                      {selectedTeamModal.coLead.bio && (
                        <p className="text-[11px] text-gray-300 italic line-clamp-2 border-t border-[#30363d]/60 pt-2">
                          "{selectedTeamModal.coLead.bio}"
                        </p>
                      )}

                      {selectedTeamModal.coLead.username && (
                        <a
                          href={`/profile/${selectedTeamModal.coLead.username}`}
                          className="w-full py-1.5 rounded-lg bg-[#18202c] hover:bg-[#2f9e44] text-gray-300 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-1 border border-[#30363d] transition-colors"
                        >
                          <span>View Public Profile</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Team Members Section */}
              {!selectedTeamModal.isCommunityLead && selectedTeamModal.membersList?.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                      TEAM MEMBERS ({selectedTeamModal.membersList.length})
                    </span>
                    <span className="text-[10px] font-mono text-[#2f9e44]">Alphabetical A–Z</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedTeamModal.membersList.map((mem) => (
                      <div
                        key={mem._id || mem.username}
                        onClick={() => handleOpenMemberDetails(mem, selectedTeamModal.name)}
                        className="p-2.5 rounded-xl bg-[#121721] border border-[#30363d] hover:border-[#2f9e44]/60 flex items-center justify-between gap-2.5 cursor-pointer transition-all hover:bg-[#18202c] group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <img
                            src={mem.photo}
                            alt={mem.name}
                            className="w-8 h-8 rounded-lg object-cover border border-[#30363d] group-hover:border-[#2f9e44] flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-white text-xs truncate leading-tight group-hover:text-[#2f9e44] transition-colors">
                              {mem.name}
                            </h5>
                            <span className="text-[9px] font-mono text-gray-400 block truncate">
                              {mem.username ? `@${mem.username}` : (mem.membershipId || 'Member')}
                            </span>
                          </div>
                        </div>

                        {mem.username && (
                          <a
                            href={`/profile/${mem.username}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-400 group-hover:text-[#2f9e44] hover:!text-white p-1 rounded transition-colors"
                            title="View Profile"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Action */}
              <div className="pt-3 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setSelectedTeamModal(null)}
                  className="w-full py-2.5 rounded-xl bg-[#18202c] hover:bg-[#21262d] text-gray-300 font-mono font-bold text-xs border border-[#30363d] transition-colors"
                >
                  Close Team Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Member Profile / Details Modal */}
      <TeamMemberModal
        member={selectedMember}
        teamName={selectedTeamName}
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
