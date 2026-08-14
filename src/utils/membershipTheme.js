/**
 * Shared Membership Card & Verification Wallet Theme Utility
 * Provides visual tokens for Gold (Leadership), Silver (Co-Lead), and Green (Member).
 */

export const MEMBERSHIP_THEMES = {
  gold: {
    tier: 'gold',
    cardBg: 'bg-gradient-to-br from-[#122822] via-[#0b1613] to-[#10151a]',
    cardBorder: 'border-[#d6b65c]/60 hover:border-[#e7d59a] shadow-lg shadow-[#d6b65c]/10',
    accentGlow: 'bg-[#d6b65c]/15',
    headerText: 'text-[#e7d59a]',
    headerPulse: 'bg-[#e7d59a]',
    verifiedBadge: 'bg-[#d6b65c]/20 text-[#e7d59a] border-[#d6b65c]/50',
    photoBorder: 'border-2 border-[#d6b65c] shadow-lg shadow-[#d6b65c]/20',
    gridBg: 'bg-[#0e1c19]/90 border-[#d6b65c]/35',
    credentialVal: 'text-[#e7d59a]',
    statusText: 'text-[#d6b65c]',
    qrShadow: 'shadow-[#d6b65c]/20 ring-1 ring-[#d6b65c]/30',
    roleBadgeClass: 'bg-[#d6b65c]/15 text-[#e7d59a] border-[#d6b65c]/40',
    canvasColors: {
      accent: '#d6b65c',
      glow: 'rgba(214, 182, 92, 0.25)',
      border: '#d6b65c',
      headerText: '#e7d59a',
      badgeBg: 'rgba(214, 182, 92, 0.2)',
      badgeBorder: '#d6b65c',
      badgeText: '#e7d59a',
      photoBorder: '#d6b65c',
      roleText: '#e7d59a',
      gridBg: '#0e1c19',
      gridBorder: 'rgba(214, 182, 92, 0.35)',
      sessionText: '#e7d59a',
      statusText: '#d6b65c'
    }
  },
  silver: {
    tier: 'silver',
    cardBg: 'bg-gradient-to-br from-[#112520] via-[#0a1513] to-[#10151a]',
    cardBorder: 'border-slate-400/60 hover:border-slate-300 shadow-slate-400/10',
    accentGlow: 'bg-slate-400/15',
    headerText: 'text-slate-200',
    headerPulse: 'bg-slate-300',
    verifiedBadge: 'bg-slate-400/20 text-slate-200 border-slate-400/50',
    photoBorder: 'border-2 border-slate-300 shadow-lg shadow-slate-400/20',
    gridBg: 'bg-[#0e1b18]/90 border-slate-400/35',
    credentialVal: 'text-slate-200',
    statusText: 'text-emerald-400',
    qrShadow: 'shadow-slate-400/20 ring-1 ring-slate-400/30',
    roleBadgeClass: 'bg-slate-400/15 text-slate-200 border-slate-400/40',
    canvasColors: {
      accent: '#cbd5e1',
      glow: 'rgba(203, 213, 225, 0.25)',
      border: '#94a3b8',
      headerText: '#cbd5e1',
      badgeBg: 'rgba(148, 163, 184, 0.2)',
      badgeBorder: '#94a3b8',
      badgeText: '#f1f5f9',
      photoBorder: '#94a3b8',
      roleText: '#cbd5e1',
      gridBg: '#0e1b18',
      gridBorder: 'rgba(148, 163, 184, 0.35)',
      sessionText: '#2f9e44',
      statusText: '#2f9e44'
    }
  },
  default: {
    tier: 'default',
    cardBg: 'bg-gradient-to-br from-[#0e211b] via-[#090d12] to-[#121b16]',
    cardBorder: 'border-[#2f9e44]/60 hover:border-[#2f9e44]',
    accentGlow: 'bg-[#2f9e44]/10',
    headerText: 'text-[#2f9e44]',
    headerPulse: 'bg-[#2f9e44]',
    verifiedBadge: 'bg-[#2f9e44]/20 text-[#2f9e44] border-[#2f9e44]/40',
    photoBorder: 'border-2 border-[#2f9e44]',
    gridBg: 'bg-[#0f1a16]/90 border-[#30363d]',
    credentialVal: 'text-[#2f9e44]',
    statusText: 'text-[#2f9e44]',
    qrShadow: '',
    roleBadgeClass: 'bg-[#2f9e44]/15 text-[#2f9e44] border-[#2f9e44]/40',
    canvasColors: {
      accent: '#2f9e44',
      glow: 'rgba(47, 158, 68, 0.25)',
      border: '#2f9e44',
      headerText: '#2f9e44',
      badgeBg: 'rgba(47, 158, 68, 0.2)',
      badgeBorder: '#2f9e44',
      badgeText: '#2f9e44',
      photoBorder: '#2f9e44',
      roleText: '#2f9e44',
      gridBg: '#0f1a16',
      gridBorder: '#30363d',
      sessionText: '#2f9e44',
      statusText: '#2f9e44'
    }
  }
};

/**
 * Defensive normalized resolver for member visual card theme
 */
export const resolveMembershipCardTheme = (member) => {
  if (!member) return MEMBERSHIP_THEMES.default;

  const role = (member.role || '').toLowerCase().trim();
  const team = (member.teamName || '').toLowerCase().trim();

  // Co-Lead / Sub-Leadership (Silver Tier)
  const isCoLead = /co-lead|deputy|vice/i.test(role) || /co-lead/i.test(team);
  if (isCoLead) {
    return MEMBERSHIP_THEMES.silver;
  }

  // Primary Leadership / Campus Mantri / Team Lead (Gold Tier)
  const isGoldLeadership =
    /campus mantri|mantri|community lead|team lead|president|faculty|coordinator|director|head|lead/i.test(role) ||
    /executive|leadership/i.test(team);
  if (isGoldLeadership) {
    return MEMBERSHIP_THEMES.gold;
  }

  // Default Green Tier
  return MEMBERSHIP_THEMES.default;
};

/**
 * Defensive normalized resolver for public profile page visual theme
 */
export const resolveProfileTheme = (member) => {
  if (!member) {
    return {
      tier: 'visitor',
      outerBorder: 'border-[#30363d] shadow-2xl',
      avatarBorder: 'border-4 border-gray-600 bg-[#0a0d12] shadow-2xl',
      usernameText: 'text-gray-400',
      tabActiveClass: 'bg-[#21262d] text-white shadow border border-[#30363d]',
      accentGlow: '',
      userCodeText: 'text-gray-300',
      postsCountText: 'text-gray-300',
      badgeClass: 'bg-[#18202c] border-[#30363d] text-gray-300',
      editBtnClass: 'bg-[#121721]/90 hover:bg-[#21262d] text-white border-[#30363d]'
    };
  }

  const normalizedRole = String(member.role || '').trim().toLowerCase();
  const normalizedStatus = String(member.status || member.membershipStatus || '').trim().toLowerCase();
  const normalizedAccountType = String(member.accountType || '').trim().toLowerCase();

  const isOfficialRole =
    /campus mantri|mantri|community lead|team lead|lead|co-lead|deputy|vice|president|faculty|coordinator|director|head|member/i.test(normalizedRole) &&
    normalizedRole !== 'visitor';

  const isActive =
    normalizedStatus === 'active' ||
    normalizedAccountType === 'member';

  // Visitor Profile
  if (!isOfficialRole || !isActive) {
    return {
      tier: 'visitor',
      outerBorder: 'border-[#30363d] shadow-2xl',
      avatarBorder: 'border-4 border-gray-600 bg-[#0a0d12] shadow-2xl',
      usernameText: 'text-gray-400',
      tabActiveClass: 'bg-[#21262d] text-white shadow border border-[#30363d]',
      accentGlow: '',
      userCodeText: 'text-gray-300',
      postsCountText: 'text-gray-300',
      badgeClass: 'bg-[#18202c] border-[#30363d] text-gray-300',
      editBtnClass: 'bg-[#121721]/90 hover:bg-[#21262d] text-white border-[#30363d]'
    };
  }

  const cardTheme = resolveMembershipCardTheme(member);

  if (cardTheme.tier === 'gold') {
    return {
      tier: 'gold',
      outerBorder: 'border-[#D6B65C]/60 hover:border-[#E7D59A]/90 shadow-2xl shadow-[#D6B65C]/15 ring-1 ring-[#D6B65C]/30',
      avatarBorder: 'border-4 border-[#D6B65C] bg-[#0a0d12] shadow-2xl shadow-[#D6B65C]/30 ring-2 ring-[#E7D59A]/50',
      usernameText: 'text-[#E7D59A]',
      tabActiveClass: 'bg-gradient-to-r from-[#071A14] to-[#12382B] text-[#E7D59A] border border-[#D6B65C]/70 shadow-lg shadow-[#D6B65C]/15',
      accentGlow: 'bg-[#D6B65C]/10',
      userCodeText: 'text-[#E7D59A]',
      postsCountText: 'text-[#E7D59A]',
      badgeClass: 'bg-[#D6B65C]/15 border-[#D6B65C]/40 text-[#E7D59A]',
      editBtnClass: 'bg-[#071A14]/90 hover:bg-[#12382B] text-[#E7D59A] border-[#D6B65C]/60 hover:border-[#E7D59A]'
    };
  }

  if (cardTheme.tier === 'silver') {
    return {
      tier: 'silver',
      outerBorder: 'border-slate-400/60 hover:border-slate-300 shadow-2xl shadow-slate-400/15 ring-1 ring-slate-400/30',
      avatarBorder: 'border-4 border-slate-300 bg-[#0a0d12] shadow-2xl shadow-slate-400/20 ring-2 ring-slate-400/40',
      usernameText: 'text-slate-200',
      tabActiveClass: 'bg-gradient-to-r from-[#112520] to-[#1b2f29] text-slate-200 border border-slate-400/60 shadow',
      accentGlow: 'bg-slate-400/10',
      userCodeText: 'text-slate-200',
      postsCountText: 'text-slate-200',
      badgeClass: 'bg-slate-400/15 border-slate-400/40 text-slate-200',
      editBtnClass: 'bg-[#112520]/90 hover:bg-[#1b2f29] text-slate-200 border-slate-400/60 hover:border-slate-300'
    };
  }

  // Default Verified Member (Green Tier)
  return {
    tier: 'green',
    outerBorder: 'border-[#2f9e44]/60 hover:border-[#2f9e44] shadow-2xl shadow-[#2f9e44]/10 ring-1 ring-[#2f9e44]/30',
    avatarBorder: 'border-4 border-[#2f9e44] bg-[#0a0d12] shadow-2xl shadow-[#2f9e44]/20 ring-2 ring-[#2f9e44]/30',
    usernameText: 'text-[#2f9e44]',
    tabActiveClass: 'bg-[#2f9e44] text-white shadow',
    accentGlow: 'bg-[#2f9e44]/10',
    userCodeText: 'text-[#2f9e44]',
    postsCountText: 'text-[#2f9e44]',
    badgeClass: 'bg-[#2f9e44]/15 border-[#2f9e44]/40 text-[#2f9e44]',
    editBtnClass: 'bg-[#121721]/90 hover:bg-[#2f9e44] text-white border-[#30363d] hover:border-[#2f9e44]'
  };
};
