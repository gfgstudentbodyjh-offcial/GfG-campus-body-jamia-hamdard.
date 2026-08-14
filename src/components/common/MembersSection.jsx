import React, { useState, useEffect, useRef } from 'react';
import { Users, Code2, Palette, Calendar, Megaphone, Share2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import api from '../../services/api';
import cacheService from '../../services/cacheService';
import MemberCard from './MemberCard';

// Official Domain Team Configurations in Hierarchical Display Order
const TEAM_CONFIGS = [
  {
    key: 'technical',
    title: 'Technical Team',
    desc: 'Software engineers, web developers, and competitive coders building community platforms.',
    icon: Code2,
    matcher: (t) => /tech|web|app|dev|code|software|ai|ml/i.test(t || '')
  },
  {
    key: 'design',
    title: 'Design & Creative',
    desc: 'UI/UX designers, visual creators, and illustrators crafting platform branding.',
    icon: Palette,
    matcher: (t) => /design|ui|ux|creative|graphic|art/i.test(t || '')
  },
  {
    key: 'events',
    title: 'Events & Operations',
    desc: 'Logistics coordinators and organizers executing hackathons, workshops, and meetups.',
    icon: Calendar,
    matcher: (t) => /event|operation|manage|logistics/i.test(t || '')
  },
  {
    key: 'outreach',
    title: 'PR & Outreach',
    desc: 'Public relations and campus ambassadors connecting students and corporate partners.',
    icon: Megaphone,
    matcher: (t) => /pr|outreach|marketing|sponsor|partner|relation/i.test(t || '')
  },
  {
    key: 'social',
    title: 'Social Media',
    desc: 'Content creators, community managers, and media strategists spreading campus news.',
    icon: Share2,
    matcher: (t) => /social|media|content/i.test(t || '')
  }
];

// Role Hierarchy Priority Resolver:
// 0: Campus Mantri
// 1: Community Lead
// 2: Team Lead
// 3: Team Co-Lead
// 4: Team Member
const getRolePriority = (roleStr) => {
  const r = (roleStr || '').toLowerCase().trim();
  if (/mantri|president/i.test(r)) return 0;
  if (/community lead|campus lead/i.test(r)) return 1;
  if (/\blead\b|head/i.test(r) && !/co-lead|deputy|vice/i.test(r)) return 2;
  if (/co-lead|deputy|vice/i.test(r)) return 3;
  return 4;
};

// Single Team Horizontal Scroll Rail Component
function TeamRail({ teamConfig, members }) {
  const railRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const IconComponent = teamConfig.icon || Users;

  const checkScroll = () => {
    const el = railRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 10);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [members]);

  const handleScroll = (direction) => {
    const el = railRef.current;
    if (el) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!members || members.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Rail Header with Title, Count & Desktop Scroll Controls */}
      <div className="flex items-center justify-between gap-4 border-b border-[#30363d]/50 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#2f9e44]/15 text-[#2f9e44] border border-[#2f9e44]/30 flex-shrink-0">
            <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wider uppercase">
              {teamConfig.title}
            </h3>
            <p className="text-[11px] font-mono text-gray-400 font-medium">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>

        {/* Desktop Previous / Next Scroll Buttons */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            className={`p-2 rounded-xl border border-[#30363d] bg-[#161b22] text-gray-300 transition-all ${
              canScrollLeft
                ? 'hover:bg-[#2f9e44] hover:text-white hover:border-[#2f9e44] cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
            aria-label={`Scroll ${teamConfig.title} left`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            className={`p-2 rounded-xl border border-[#30363d] bg-[#161b22] text-gray-300 transition-all ${
              canScrollRight
                ? 'hover:bg-[#2f9e44] hover:text-white hover:border-[#2f9e44] cursor-pointer'
                : 'opacity-40 cursor-not-allowed'
            }`}
            aria-label={`Scroll ${teamConfig.title} right`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Member Cards Rail */}
      <div
        ref={railRef}
        onScroll={checkScroll}
        className="flex items-stretch gap-4 overflow-x-auto overflow-y-hidden scrollbar-none snap-x snap-mandatory py-1 px-0.5"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {members.map((m) => (
          <MemberCard key={m._id || m.userCode || m.username} member={m} />
        ))}
      </div>
    </div>
  );
}

/**
 * Main Members Section Component
 */
export default function MembersSection() {
  const [members, setMembers] = useState(() => {
    const cached = cacheService.get('public_members_list', 900000); // 15 min TTL
    return cached?.data || [];
  });
  const [loading, setLoading] = useState(() => {
    const cached = cacheService.get('public_members_list', 900000);
    return !(cached && cached.data && cached.data.length > 0);
  });
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    cacheService
      .dedupe('public_members_list', () => api.get('/members?status=Active&accountType=Member'))
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        // Filter strictly for active, non-suspended, non-visitor members
        const activeOnly = list.filter((m) => {
          if (!m) return false;
          const statusOk = (m.status || 'Active').toLowerCase() === 'active';
          const memStatus = (m.membershipStatus || 'active').toLowerCase();
          const notSuspended = memStatus !== 'suspended' && memStatus !== 'revoked' && memStatus !== 'inactive';
          const isNotVisitor = (m.role || '').toLowerCase() !== 'visitor';
          return statusOk && notSuspended && isNotVisitor;
        });

        setMembers(activeOnly);
        cacheService.set('public_members_list', activeOnly);
      })
      .catch((err) => {
        console.warn('Failed to load active members:', err);
        setHasError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  // Group and sort members into team buckets according to official organizational hierarchy
  const groupedTeams = React.useMemo(() => {
    if (!members || members.length === 0) return [];

    const assigned = new Set();
    const result = [];

    // Match each official team category in order
    TEAM_CONFIGS.forEach((config) => {
      const teamMembers = members.filter((m) => {
        if (assigned.has(m._id)) return false;
        const teamStr = m.teamName || m.team || '';
        if (config.matcher(teamStr)) {
          assigned.add(m._id);
          return true;
        }
        return false;
      });

      if (teamMembers.length > 0) {
        // Strict Organizational Hierarchy Sorting:
        // 1. Role Priority: Campus Mantri (0) -> Community Lead (1) -> Lead (2) -> Co-Lead (3) -> Member (4)
        // 2. Alphabetical A -> Z by name among same role level
        teamMembers.sort((a, b) => {
          const prioA = getRolePriority(a.role);
          const prioB = getRolePriority(b.role);
          if (prioA !== prioB) {
            return prioA - prioB;
          }
          const nameA = (a.name || a.fullName || '').trim();
          const nameB = (b.name || b.fullName || '').trim();
          return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
        });

        result.push({ config, members: teamMembers });
      }
    });

    // NOTE: "Other Community Members" has been intentionally removed per specification.
    // Unassigned members without a valid domain team are omitted from public team rails.

    return result;
  }, [members]);

  const totalVisibleMembers = React.useMemo(() => {
    return groupedTeams.reduce((sum, g) => sum + g.members.length, 0);
  }, [groupedTeams]);

  if (hasError && members.length === 0) {
    return null;
  }

  return (
    <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10 max-w-7xl mx-auto w-full">
      {/* Section Header */}
      <div className="border-b border-[#30363d] pb-5 space-y-1">
        <span className="text-[11px] font-mono font-bold text-[#2f9e44] uppercase tracking-wider block">
          COMMUNITY DIRECTORY
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Campus Members
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 max-w-2xl font-normal leading-relaxed">
          Explore the officially verified members of the GeeksforGeeks Campus Body, Jamia Hamdard.
        </p>
      </div>

      {/* Loading Skeletons */}
      {loading && members.length === 0 ? (
        <div className="space-y-8">
          {[1, 2].map((k) => (
            <div key={k} className="space-y-4">
              <div className="h-6 w-48 bg-[#161b22] rounded-lg animate-pulse" />
              <div className="flex gap-4 overflow-hidden py-1">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="w-72 h-44 bg-[#161b22] rounded-2xl border border-[#30363d] animate-pulse flex-shrink-0" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : groupedTeams.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#0d1117] border border-[#30363d] text-center text-gray-400 text-xs font-mono">
          No active verified community members found at this time.
        </div>
      ) : (
        /* Team Rails in Hierarchical Display */
        <div className="space-y-10 sm:space-y-12">
          {groupedTeams.map(({ config, members: teamMembers }) => (
            <TeamRail key={config.key} teamConfig={config} members={teamMembers} />
          ))}
        </div>
      )}
    </section>
  );
}
