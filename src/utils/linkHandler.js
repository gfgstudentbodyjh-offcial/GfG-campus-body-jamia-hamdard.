/**
 * GFG Campus Body — Centralized Link Handling & Navigation Resolver
 *
 * Intelligently classifies and processes all URLs across the website:
 * - Internal SPA Routes (/events, /profile, /community) -> React Router navigate()
 * - Hash Anchor Links (#events, #team) -> Smooth scrolling with fixed navbar offset
 * - Google & Microsoft Forms -> EmbedModal iframe candidate with automatic new tab fallback
 * - External Websites / Blogs / Socials -> Safe new tab with noopener,noreferrer
 * - PDFs -> Browser / PDF viewer handling
 * - Mailto / Tel -> Native client handlers
 * - Dead / Invalid Links -> Safe fallback with zero page jumping
 */

export const LINK_TYPES = {
  INTERNAL: 'INTERNAL',
  HASH: 'HASH',
  GOOGLE_FORM: 'GOOGLE_FORM',
  EXTERNAL: 'EXTERNAL',
  PDF: 'PDF',
  MAIL: 'MAIL',
  TEL: 'TEL',
  INVALID: 'INVALID'
};

/**
 * Normalizes and analyzes any raw URL string to return structured link metadata.
 * @param {string} rawUrl
 * @returns {{ type: string, url: string, cleanUrl: string, isExternal: boolean, isEmbedCandidate: boolean }}
 */
export function parseLinkInfo(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { type: LINK_TYPES.INVALID, url: '', cleanUrl: '', isExternal: false, isEmbedCandidate: false };
  }

  const trimmed = rawUrl.trim();

  // Guard against empty / dead links
  if (!trimmed || trimmed === '#' || trimmed.toLowerCase().startsWith('javascript:')) {
    return { type: LINK_TYPES.INVALID, url: '', cleanUrl: '', isExternal: false, isEmbedCandidate: false };
  }

  // Native protocols
  if (trimmed.toLowerCase().startsWith('mailto:')) {
    return { type: LINK_TYPES.MAIL, url: trimmed, cleanUrl: trimmed, isExternal: true, isEmbedCandidate: false };
  }
  if (trimmed.toLowerCase().startsWith('tel:')) {
    return { type: LINK_TYPES.TEL, url: trimmed, cleanUrl: trimmed, isExternal: true, isEmbedCandidate: false };
  }

  // Internal hash anchors (only if not preceded by http/https)
  if (trimmed.startsWith('#')) {
    return { type: LINK_TYPES.HASH, url: trimmed, cleanUrl: trimmed, isExternal: false, isEmbedCandidate: false };
  }

  // Form detection (Google Forms & Microsoft Forms)
  const isGoogleForm = /docs\.google\.com\/forms|forms\.gle/i.test(trimmed);
  const isMicrosoftForm = /forms\.office\.com|forms\.microsoft\.com/i.test(trimmed);
  if (isGoogleForm || isMicrosoftForm) {
    return { type: LINK_TYPES.GOOGLE_FORM, url: trimmed, cleanUrl: trimmed, isExternal: true, isEmbedCandidate: true };
  }

  // PDF documents
  if (/\.pdf($|\?)/i.test(trimmed) || trimmed.includes('/stream-pdf') || trimmed.includes('/raw-pdf')) {
    return { type: LINK_TYPES.PDF, url: trimmed, cleanUrl: trimmed, isExternal: true, isEmbedCandidate: false };
  }

  // External full URLs (http:// or https:// or //)
  if (/^(?:https?:)?\/\//i.test(trimmed)) {
    // Check if the URL points to our own origin
    try {
      const parsed = new URL(trimmed, window.location.origin);
      if (parsed.origin === window.location.origin) {
        // Internal full URL -> convert to relative path
        const internalPath = parsed.pathname + parsed.search + parsed.hash;
        return { type: LINK_TYPES.INTERNAL, url: trimmed, cleanUrl: internalPath, isExternal: false, isEmbedCandidate: false };
      }
    } catch (e) {}

    return { type: LINK_TYPES.EXTERNAL, url: trimmed, cleanUrl: trimmed, isExternal: true, isEmbedCandidate: false };
  }

  // Relative internal paths (/events, /profile/123, etc.)
  if (trimmed.startsWith('/')) {
    return { type: LINK_TYPES.INTERNAL, url: trimmed, cleanUrl: trimmed, isExternal: false, isEmbedCandidate: false };
  }

  // Relative without leading slash -> default to internal route
  return { type: LINK_TYPES.INTERNAL, url: `/${trimmed}`, cleanUrl: `/${trimmed}`, isExternal: false, isEmbedCandidate: false };
}

/**
 * Smoothly scrolls to a section ID accounting for sticky navbar height (default 80px).
 * @param {string} hashOrId - e.g. '#events' or 'events'
 * @param {number} navbarOffset - Offset height in pixels
 * @returns {boolean} True if element was found and scrolled to
 */
export function scrollToAnchorSection(hashOrId, navbarOffset = 80) {
  if (!hashOrId || typeof window === 'undefined') return false;
  const cleanId = hashOrId.replace(/^#/, '').trim();
  if (!cleanId) return false;

  const targetEl = document.getElementById(cleanId) || document.querySelector(`[name="${cleanId}"]`) || document.querySelector(hashOrId);
  if (targetEl) {
    const elPosition = targetEl.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = Math.max(0, elPosition - navbarOffset);

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
    return true;
  }
  return false;
}

/**
 * Central action dispatcher for any link click event.
 *
 * @param {string} rawUrl - The target URL
 * @param {object} options
 * @param {function} options.navigate - React Router navigate function
 * @param {function} [options.openEmbedModal] - Optional callback to open EmbedModal for forms: (url, title) => void
 * @param {string} [options.title] - Optional title for the link / modal
 * @param {string} [options.currentPath] - Current pathname (to decide if anchor scroll is on current page)
 */
export function handleLinkAction(rawUrl, options = {}) {
  const { navigate, openEmbedModal, title = 'External Content', currentPath = window.location.pathname } = options;
  const info = parseLinkInfo(rawUrl);

  switch (info.type) {
    case LINK_TYPES.INTERNAL:
      if (typeof navigate === 'function') {
        navigate(info.cleanUrl);
      } else {
        window.location.href = info.cleanUrl;
      }
      break;

    case LINK_TYPES.HASH: {
      const scrolled = scrollToAnchorSection(info.cleanUrl);
      if (!scrolled) {
        // If not found on the current page, navigate to homepage with hash
        if (currentPath !== '/') {
          if (typeof navigate === 'function') {
            navigate(`/${info.cleanUrl}`);
          } else {
            window.location.href = `/${info.cleanUrl}`;
          }
        }
      }
      break;
    }

    case LINK_TYPES.GOOGLE_FORM:
      if (typeof openEmbedModal === 'function') {
        openEmbedModal(info.url, title);
      } else {
        window.open(info.url, '_blank', 'noopener,noreferrer');
      }
      break;

    case LINK_TYPES.PDF:
    case LINK_TYPES.EXTERNAL:
      window.open(info.url, '_blank', 'noopener,noreferrer');
      break;

    case LINK_TYPES.MAIL:
    case LINK_TYPES.TEL:
      window.location.href = info.url;
      break;

    case LINK_TYPES.INVALID:
    default:
      // Prevent browser from jumping to top or appending broken #
      break;
  }

  return info;
}

export default {
  LINK_TYPES,
  parseLinkInfo,
  handleLinkAction,
  scrollToAnchorSection
};
