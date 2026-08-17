import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, Rocket } from 'lucide-react';

/**
 * Premium Official GFG Campus Body Website Launch Experience
 * @param {number} duration - Total countdown duration in seconds (5, 7, or 10)
 * @param {string} replayMode - 'first_visit' | 'session'
 * @param {function} onComplete - Callback executed when transition finishes
 * @param {boolean} isPreview - If true, runs as an isolated preview without setting storage
 */
export default function LaunchCountdown({
  duration = 7,
  replayMode = 'first_visit',
  onComplete,
  isPreview = false
}) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [phase, setPhase] = useState('opening'); // 'opening' | 'countdown' | 'reveal' | 'fading'
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hasFinishedRef = useRef(false);

  // Check prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleFinish = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    setIsFadingOut(true);
    if (!isPreview) {
      try {
        if (replayMode === 'session') {
          sessionStorage.setItem('gfg_launch_seen', 'true');
        } else {
          localStorage.setItem('gfg_launch_seen', 'true');
        }
      } catch (e) {}
    }

    setTimeout(() => {
      if (onComplete) onComplete();
    }, 700);
  };

  // Keyboard shortcut: Escape to skip
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Opening sequence: 600ms opening transition -> 'countdown'
  useEffect(() => {
    if (prefersReducedMotion) {
      const t = setTimeout(handleFinish, 1200);
      return () => clearTimeout(t);
    }

    const openingTimer = setTimeout(() => {
      setPhase('countdown');
    }, 600);

    return () => clearTimeout(openingTimer);
  }, []);

  // Countdown timer lifecycle
  useEffect(() => {
    if (phase !== 'countdown') return;

    if (timeLeft <= 0) {
      setPhase('reveal');
      const climaxTimer = setTimeout(() => {
        handleFinish();
      }, 1600);
      return () => clearTimeout(climaxTimer);
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  // Dynamic supporting copy based on remaining ratio
  const getDynamicCopy = () => {
    if (timeLeft <= 1) return "WE'RE LIVE";
    const ratio = timeLeft / duration;
    if (ratio <= 0.35) return "JAMIA HAMDARD × GFG";
    if (ratio <= 0.65) return "CONNECT • LEARN • BUILD";
    return "PREPARING SOMETHING NEW";
  };

  const progressPercent = Math.max(0, Math.min(100, ((duration - timeLeft) / duration) * 100));

  return (
    <div
      aria-label="GFG Campus Body Launch Countdown"
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-[99999] bg-[#06080d] text-white flex flex-col items-center justify-between py-8 sm:py-12 px-6 select-none overflow-hidden transition-all duration-700 ease-out ${
        isFadingOut ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* ─── 1. Animated Ambient Background ─────────────────────────────── */}
      {/* Radial Breathing Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(47,158,68,0.22),transparent_60%)] pointer-events-none animate-pulse duration-[3000ms]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.12),transparent_50%)] pointer-events-none"></div>

      {/* Subtle Slow-Drifting Technical Grid */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#2f9e44 1px, transparent 1px), linear-gradient(90deg, #2f9e44 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          animation: prefersReducedMotion ? 'none' : 'gfgGridDrift 20s linear infinite'
        }}
      ></div>

      {/* Sparse Ambient Particles */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-1/4 left-1/5 w-1.5 h-1.5 rounded-full bg-[#2f9e44] blur-[0.5px] animate-ping duration-[4000ms]"></div>
          <div className="absolute top-2/3 right-1/4 w-1 h-1 rounded-full bg-emerald-400 blur-[0.5px] animate-pulse duration-[3000ms]"></div>
          <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-green-500 blur-[1px] animate-pulse duration-[5000ms]"></div>
        </div>
      )}

      {/* ─── 2. Top Header (Preview Badge / Clean Skip Button) ────────────── */}
      <div className="w-full max-w-5xl flex items-center justify-between z-20 relative">
        {isPreview ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-bold tracking-wider animate-pulse">
            <Rocket className="w-3.5 h-3.5" />
            <span>PREVIEW MODE ({duration}s)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-gray-400 font-semibold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2f9e44] animate-ping" />
            <span>OFFICIAL CAMPUS LAUNCH</span>
          </div>
        )}

        {/* Minimal Clean Skip Button */}
        <button
          onClick={handleFinish}
          aria-label="Skip countdown"
          className="flex items-center gap-1 text-xs font-mono text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer group"
        >
          <span>Skip</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#2f9e44]" />
        </button>
      </div>

      {/* ─── 3. Center Hero Presentation & Countdown ──────────────────────── */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-auto py-4">
        
        {/* Official GFG Logo Lockup with Halo */}
        <div className={`relative mb-5 transition-all duration-700 ${
          phase === 'reveal' ? 'scale-110' : 'scale-100'
        }`}>
          {/* Outward Glowing Light Halo */}
          <div className={`absolute -inset-4 bg-emerald-500/25 rounded-full blur-2xl transition-all duration-700 ${
            phase === 'reveal' ? 'scale-150 bg-emerald-500/45' : 'animate-pulse'
          }`}></div>

          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 flex items-center justify-center border border-[#2f9e44]/50 shadow-2xl shadow-green-950/60">
            <img
              src="/assets/gfg-official-logo.png"
              alt="GeeksforGeeks Official Logo"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
        </div>

        {/* Sequential Branding Title */}
        <div className="space-y-1 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] sm:text-xs font-mono font-bold tracking-widest text-[#2f9e44] uppercase shadow-xs">
            <Sparkles className="w-3 h-3 text-[#2f9e44]" />
            <span>GEEKSFORGEEKS CAMPUS BODY</span>
          </div>

          <h2 className="text-xs sm:text-sm font-mono text-gray-400 tracking-wider">
            Jamia Hamdard • Official Student Platform
          </h2>
        </div>

        {/* Dynamic Countdown Number OR Climax Reveal */}
        {phase === 'reveal' || timeLeft === 0 ? (
          <div className="space-y-3 animate-in fade-in zoom-in duration-500 ease-out">
            <div className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-[#2f9e44] drop-shadow-[0_0_35px_rgba(47,158,68,0.7)]">
              WE'RE LIVE
            </div>
            <div className="w-16 h-0.5 bg-[#2f9e44] mx-auto rounded-full"></div>
            <p className="text-xs sm:text-sm text-emerald-400 font-mono font-bold tracking-wide pt-1">
              Welcome to GFG Jamia Hamdard 🚀
            </p>
          </div>
        ) : (
          <div className="relative flex flex-col items-center justify-center min-h-[140px] sm:min-h-[170px]">
            {/* Animated Large Countdown Digits with Scale & Pulse Event */}
            <div
              key={timeLeft}
              className="text-7xl sm:text-9xl md:text-[10rem] font-black font-mono tracking-tighter text-white drop-shadow-[0_0_35px_rgba(47,158,68,0.75)] animate-[countdownDigitTick_0.9s_ease-out_forwards]"
            >
              {timeLeft}
            </div>

            {/* Dynamic Stage Copy */}
            <div className="h-6 flex items-center justify-center mt-2">
              <span
                key={getDynamicCopy()}
                className="text-[11px] sm:text-xs font-mono font-bold text-emerald-400/90 uppercase tracking-widest animate-in fade-in duration-300"
              >
                {getDynamicCopy()}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* ─── 4. Progress Indicator Strip ─────────────────────────────────── */}
      <div className="w-full max-w-xs sm:max-w-sm z-20 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#2f9e44] font-mono leading-none">●</span>
          
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-xs relative">
            <div
              className="h-full bg-gradient-to-r from-[#1b5e20] to-[#2f9e44] transition-all duration-1000 ease-linear rounded-full shadow-[0_0_10px_#2f9e44]"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <span className={`text-[10px] font-mono leading-none ${
            progressPercent >= 100 ? 'text-[#2f9e44] font-bold' : 'text-gray-500'
          }`}>
            {progressPercent >= 100 ? '●' : '○'}
          </span>
        </div>

        <p className="text-[10px] font-mono text-center text-gray-500">
          Press <kbd className="px-1 py-0.2 rounded bg-white/10 border border-white/10 text-gray-300 text-[9px]">Esc</kbd> to skip to website
        </p>
      </div>

      {/* CSS Keyframes injected for hardware-accelerated grid and digit pulses */}
      <style>{`
        @keyframes gfgGridDrift {
          0% { background-position: 0 0; }
          100% { background-position: 48px 48px; }
        }
        @keyframes countdownDigitTick {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          40% {
            opacity: 1;
            transform: scale(1.03);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
