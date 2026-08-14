import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * GFG Campus Body — Safe Form & Embed Modal
 *
 * Implements iframe loading detection with automatic CSP / X-Frame-Options
 * failure fallback so users are never left with a blank or broken embed.
 */
export default function EmbedModal({ isOpen, onClose, url, title = 'Community Form' }) {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setHasError(false);

      // 8-second fallback timeout in case iframe fails to trigger onLoad due to browser security blocking
      const timer = setTimeout(() => {
        setLoading((prev) => {
          if (prev) {
            // Still loading after 8s -> likely blocked by X-Frame-Options / CSP
            setHasError(true);
            return false;
          }
          return prev;
        });
      }, 8000);

      // Lock body scroll
      document.body.style.overflow = 'hidden';

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, url]);

  if (!isOpen || !url) return null;

  const handleOpenExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[850px] bg-[#0d1117] border border-[#30363d] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2f9e44] animate-pulse flex-shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-white truncate">{title}</h3>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleOpenExternal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#2f9e44] text-gray-300 hover:text-white text-xs font-semibold border border-[#30363d] transition-all"
              title="Open Form in New Tab"
            >
              <span>Open in New Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="relative flex-1 w-full bg-[#0a0d12] overflow-hidden">
          
          {/* Loading Skeleton */}
          {loading && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0a0d12] text-gray-400 z-10">
              <Loader2 className="w-8 h-8 text-[#2f9e44] animate-spin" />
              <p className="text-xs font-mono">Loading form...</p>
            </div>
          )}

          {/* Error / CSP Fallback Card */}
          {hasError ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <AlertCircle className="w-8 h-8 mx-auto" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-white">This form cannot be displayed directly here</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  The form provider restricts direct embedding inside other websites for security reasons.
                </p>
              </div>
              <button
                onClick={handleOpenExternal}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2f9e44] hover:bg-[#258537] text-white text-xs font-bold font-mono shadow-lg transition-all transform hover:scale-[1.02]"
              >
                <span>Open Form in New Tab</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <iframe
              src={url}
              title={title}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setHasError(true);
              }}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          )}

        </div>

        {/* Footer Bar */}
        <div className="px-5 py-2.5 bg-[#161b22] border-t border-[#30363d] flex items-center justify-between text-[11px] text-gray-400 font-mono flex-shrink-0">
          <span>GeeksforGeeks Campus Body</span>
          <button
            onClick={handleOpenExternal}
            className="text-[#2f9e44] hover:underline flex items-center gap-1"
          >
            Trouble viewing? Open externally ↗
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
