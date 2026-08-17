import cacheService from '../services/cacheService';

/**
 * Single source of truth helper to determine if a member/profile is the currently active Campus Mantri
 * Dynamically resolves against the live Mantri data store without hardcoding any names or IDs.
 *
 * @param {Object|string} memberOrRole - Member document, profile object, or role string
 * @param {Array} [liveMantriList] - Optional live mantri array if available in local scope
 * @returns {boolean} - true if currently serving Campus Mantri, false if former or not mantri
 */
export function isCurrentCampusMantri(memberOrRole, liveMantriList = null) {
  if (!memberOrRole) return false;

  // Direct boolean override if present on object
  if (typeof memberOrRole === 'object') {
    if (memberOrRole.isCurrent === true || memberOrRole.isCurrentMantri === true) return true;
    if (memberOrRole.isCurrent === false && memberOrRole.isCurrentMantri === false) return false;
  }

  // String check
  const roleStr = typeof memberOrRole === 'string'
    ? memberOrRole
    : (memberOrRole.role || memberOrRole.title || memberOrRole.communityRole || '');

  const normalizedRole = roleStr.toLowerCase().trim();

  // If role explicitly specifies "Current Campus Mantri"
  if (normalizedRole.includes('current campus mantri') || normalizedRole === 'current mantri') {
    return true;
  }

  // If not a mantri at all, return false
  if (!normalizedRole.includes('mantri')) {
    return false;
  }

  // If role explicitly says "former campus mantri", return false
  if (normalizedRole.includes('former')) {
    return false;
  }

  // Resolve against active mantri list from arguments or cache
  const mantris = Array.isArray(liveMantriList) && liveMantriList.length > 0
    ? liveMantriList
    : (cacheService.get('mantri')?.data || []);

  if (!Array.isArray(mantris) || mantris.length === 0) {
    // If no cache/list is present, default "Campus Mantri" to current if not former
    return !normalizedRole.includes('former');
  }

  const currentServing = mantris.find(m => m.isCurrent === true) || mantris[0];
  if (!currentServing) return false;

  if (typeof memberOrRole === 'object') {
    const memId = String(memberOrRole._id || memberOrRole.id || memberOrRole.memberRef?._id || memberOrRole.memberRef || '');
    const currentMemberId = String(currentServing.memberRef?._id || currentServing.memberRef || currentServing._id || '');
    if (memId && currentMemberId && memId === currentMemberId) {
      return true;
    }

    const username = (memberOrRole.username || memberOrRole.memberRef?.username || '').toLowerCase().trim();
    const currentUsername = (currentServing.username || currentServing.memberRef?.username || '').toLowerCase().trim();
    if (username && currentUsername && username === currentUsername) {
      return true;
    }

    const membershipId = (memberOrRole.membershipId || memberOrRole.memberId || memberOrRole.memberRef?.membershipId || '').toUpperCase().trim();
    const currentMembershipId = (currentServing.memberRef?.membershipId || currentServing.membershipId || '').toUpperCase().trim();
    if (membershipId && currentMembershipId && membershipId === currentMembershipId) {
      return true;
    }
  }

  return false;
}
