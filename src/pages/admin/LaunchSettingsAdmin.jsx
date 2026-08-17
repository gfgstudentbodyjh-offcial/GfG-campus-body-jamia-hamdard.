import React, { useState, useEffect } from 'react';
import { useAdminTheme } from '../../context/AdminThemeContext';
import api from '../../services/api';
import LaunchCountdown from '../../components/common/LaunchCountdown';
import {
  Rocket,
  Clock,
  Sparkles,
  Play,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Shield,
  HelpCircle,
  Eye,
  X
} from 'lucide-react';

export default function LaunchSettingsAdmin() {
  const { isLight } = useAdminTheme();

  // Settings State
  const [enabled, setEnabled] = useState(false);
  const [duration, setDuration] = useState(7);
  const [replayMode, setReplayMode] = useState('first_visit'); // 'first_visit' | 'session'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Feedback & Toast
  const [toast, setToast] = useState({ show: false, type: 'info', text: '' });
  
  // Interactive Preview & Testing State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmEnableOpen, setConfirmEnableOpen] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const showToast = (type, text) => {
    setToast({ show: true, type, text });
    setTimeout(() => {
      setToast({ show: false, type: 'info', text: '' });
    }, 4000);
  };

  // Fetch Current Settings
  useEffect(() => {
    let mounted = true;
    api.get('/settings/launch')
      .then(res => {
        if (!mounted) return;
        const data = res.data?.data;
        if (data) {
          setEnabled(Boolean(data.enabled));
          setDuration([5, 7, 10].includes(data.duration) ? data.duration : 7);
          setReplayMode(data.replayMode === 'session' ? 'session' : 'first_visit');
        }
      })
      .catch(err => {
        if (!mounted) return;
        console.warn('[LaunchSettingsAdmin] Failed to fetch launch settings:', err);
        showToast('error', 'Failed to fetch settings from server. Default values loaded.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  // Toggle Handler with Confirmation on Enable
  const handleToggle = () => {
    if (!enabled) {
      // Prompt confirmation before turning ON
      setConfirmEnableOpen(true);
    } else {
      // Turn OFF immediately
      setEnabled(false);
    }
  };

  const handleConfirmEnable = () => {
    setEnabled(true);
    setConfirmEnableOpen(false);
  };

  // Save Settings
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const res = await api.put('/settings/launch', {
        enabled,
        duration,
        replayMode
      });

      if (res.data?.success) {
        showToast('success', '✓ Launch experience settings updated successfully.');
      } else {
        throw new Error(res.data?.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error('[LaunchSettingsAdmin] Save error:', err);
      showToast('error', err.response?.data?.message || err.message || 'Failed to save launch settings.');
    } finally {
      setSaving(false);
    }
  };

  // Reset local visitor state for testing
  const handleResetLocalState = () => {
    try {
      localStorage.removeItem('gfg_launch_seen');
      sessionStorage.removeItem('gfg_launch_seen');
      setResetMessage('Local browser state cleared! You can test the website as a fresh visitor.');
      setTimeout(() => setResetMessage(''), 5000);
      showToast('success', 'Browser launch test state reset.');
    } catch (e) {
      setResetMessage('Failed to clear local state.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl pb-10">
      {/* Launch Preview Modal Overlay */}
      {previewOpen && (
        <LaunchCountdown
          duration={duration}
          replayMode={replayMode}
          isPreview={true}
          onComplete={() => setPreviewOpen(false)}
        />
      )}

      {/* Confirmation Modal Before Enabling */}
      {confirmEnableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-gray-200 text-slate-900' : 'bg-[#121721] border-[#30363d] text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2f9e44]/15 flex items-center justify-center text-[#2f9e44] flex-shrink-0">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold">Enable Launch Experience?</h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                  Public website launch sequence
                </p>
              </div>
            </div>

            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
              Visitors entering the website will see the <strong>{duration}-second</strong> cinematic launch animation ({replayMode === 'session' ? 'every new session' : 'first visit only'}).
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmEnableOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  isLight ? 'bg-gray-100 hover:bg-gray-200 text-slate-700 border-gray-300' : 'bg-[#18202c] hover:bg-[#212b3b] text-gray-300 border-[#30363d]'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEnable}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2f9e44] hover:bg-[#28863a] text-white shadow-md shadow-green-900/30 transition-all cursor-pointer"
              >
                Enable Launch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header: Title & Single Sticky Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#2f9e44] uppercase block mb-1">
            System Settings • Launch Experience
          </span>
          <h1 className={`text-xl sm:text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Website Launch Experience
          </h1>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
            Control the launch animation shown to visitors entering the website.
          </p>
        </div>

        {/* Top-Right Single Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-5 py-2.5 rounded-xl text-xs font-bold font-mono bg-[#2f9e44] hover:bg-[#28863a] text-white shadow-md shadow-green-900/30 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Toast Feedback */}
      {toast.show && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-mono animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className={`p-12 rounded-2xl border text-center font-mono text-xs flex items-center justify-center gap-2.5 ${
          isLight ? 'bg-white border-gray-200 text-slate-500' : 'bg-[#121721] border-[#30363d] text-gray-400'
        }`}>
          <Loader2 className="w-4 h-4 animate-spin text-[#2f9e44]" />
          <span>Loading launch experience configuration...</span>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* 1. Primary Hero Status Card */}
          <div className={`p-5 sm:p-6 rounded-2xl border transition-colors ${
            isLight ? 'bg-white border-gray-200 shadow-xs' : 'bg-[#121721] border-[#30363d]'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className={`text-sm font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Launch Experience
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    enabled
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30'
                  }`}>
                    {enabled ? '● Enabled' : '○ Disabled'}
                  </span>
                </div>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                  Show a short launch animation when a visitor enters the website.
                </p>
              </div>

              {/* Modern SaaS Toggle Switch */}
              <button
                type="button"
                onClick={handleToggle}
                className={`relative inline-flex h-[30px] w-[52px] flex-shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f9e44] focus-visible:ring-offset-2 ${
                  enabled
                    ? 'bg-[#2f9e44] shadow-[0_0_12px_rgba(47,158,68,0.4)]'
                    : isLight
                    ? 'bg-gray-300'
                    : 'bg-[#212936] border border-[#30363d]'
                }`}
                role="switch"
                aria-checked={enabled}
                aria-label="Toggle Website Launch Experience"
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                    enabled ? 'translate-x-[22px]' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 2. Live Status Summary Strip */}
          <div className={`px-4 py-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs font-mono transition-colors ${
            isLight ? 'bg-gray-50 border-gray-200 text-slate-700' : 'bg-[#0d1117] border-[#30363d]/80 text-gray-300'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Current Status:</span>
              <span className={`font-bold ${enabled ? 'text-[#2f9e44]' : 'text-gray-500'}`}>
                {enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-400">Duration:</span>
              <span className="font-bold">{duration} seconds</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-400">Audience:</span>
              <span className="font-bold">
                {replayMode === 'session' ? 'Every new session' : 'First-time visitors only'}
              </span>
            </div>
          </div>

          {/* 3. Countdown Duration (Compact Segmented) */}
          <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
            !enabled ? 'opacity-70' : 'opacity-100'
          } ${isLight ? 'bg-white border-gray-200 shadow-xs' : 'bg-[#121721] border-[#30363d]'}`}>
            <div className="mb-3">
              <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                Countdown Duration
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { sec: 5, label: '5 sec', tag: null },
                { sec: 7, label: '7 sec', tag: 'Recommended' },
                { sec: 10, label: '10 sec', tag: null }
              ].map(opt => {
                const isSelected = duration === opt.sec;
                return (
                  <button
                    key={opt.sec}
                    type="button"
                    onClick={() => setDuration(opt.sec)}
                    className={`py-3 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[56px] ${
                      isSelected
                        ? 'border-[#2f9e44] bg-[#2f9e44]/10 shadow-xs ring-1 ring-[#2f9e44]'
                        : isLight
                        ? 'border-gray-200 bg-gray-50/70 hover:bg-gray-100 text-slate-700'
                        : 'border-[#30363d] bg-[#0d1117]/60 hover:bg-[#18202c] text-gray-300'
                    }`}
                  >
                    <span className={`text-xs font-mono font-bold ${
                      isSelected ? 'text-[#2f9e44]' : isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      {opt.label}
                    </span>
                    {opt.tag && (
                      <span className="text-[10px] text-[#2f9e44] font-medium mt-0.5">
                        ✓ {opt.tag}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Visitor Replay Behaviour */}
          <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
            !enabled ? 'opacity-70' : 'opacity-100'
          } ${isLight ? 'bg-white border-gray-200 shadow-xs' : 'bg-[#121721] border-[#30363d]'}`}>
            <div className="mb-3">
              <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                Visitor Replay Behaviour
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { key: 'first_visit', label: 'First visit only', tag: 'Recommended', desc: 'Shows once per browser device.' },
                { key: 'session', label: 'Every new session', tag: null, desc: 'Shows once per browser session.' }
              ].map(opt => {
                const isSelected = replayMode === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setReplayMode(opt.key)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#2f9e44] bg-[#2f9e44]/10 shadow-xs ring-1 ring-[#2f9e44]'
                        : isLight
                        ? 'border-gray-200 bg-gray-50/70 hover:bg-gray-100 text-slate-700'
                        : 'border-[#30363d] bg-[#0d1117]/60 hover:bg-[#18202c] text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#2f9e44]' : 'border-gray-400'
                        }`}>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-[#2f9e44]" />}
                        </span>
                        <span className={`text-xs font-bold ${
                          isSelected ? 'text-[#2f9e44]' : isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          {opt.label}
                        </span>
                      </div>
                      {opt.tag && (
                        <span className="text-[10px] font-mono text-[#2f9e44] font-semibold">
                          ✓ {opt.tag}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] ml-5.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Testing & Preview Actions (Compact) */}
          <div className={`p-5 sm:p-6 rounded-2xl border transition-colors ${
            isLight ? 'bg-white border-gray-200 shadow-xs' : 'bg-[#121721] border-[#30363d]'
          }`}>
            <div className="mb-3">
              <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                Testing & Preview
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#2f9e44] hover:bg-[#28863a] text-white font-bold text-xs font-mono shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Preview Launch ({duration}s)</span>
              </button>

              <button
                type="button"
                onClick={handleResetLocalState}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold font-mono transition-all inline-flex items-center gap-2 cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-[#18202c] hover:bg-[#212b3b] text-gray-200 border-[#30363d]'
                }`}
                title="Clears launch state in this browser for live testing"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                <span>Reset Test State</span>
              </button>
            </div>

            {resetMessage && (
              <p className="mt-2.5 text-xs font-mono text-[#2f9e44]">
                ✓ {resetMessage}
              </p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
