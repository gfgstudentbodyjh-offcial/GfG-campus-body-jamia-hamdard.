import React, { useState, useEffect } from 'react';
import RoleBadge from '../../components/common/RoleBadge';
import api from '../../services/api';
import cacheService from '../../services/cacheService';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { formatEventDate } from '../../utils/dateUtils';
import {
  ShieldAlert, ShieldCheck, Eye, EyeOff, Trash2, CheckCircle2,
  AlertTriangle, Flag, MessageSquare, Heart, RefreshCw, X
} from 'lucide-react';

export default function FeedModerationAdmin() {
  const { isLight } = useAdminTheme();
  const [activeTab, setActiveTab] = useState('review'); // review | reported | hidden | all
  const [summary, setSummary] = useState({ needsReviewCount: 0, totalReportsCount: 0, hiddenCount: 0 });
  const [reviewQueue, setReviewQueue] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Context View Modal State
  const [contextItem, setContextItem] = useState(null);

  // Moderator Action Reason Modal
  const [actionModalItem, setActionModalItem] = useState(null); // { targetType, targetId, action: 'hide'|'delete' }
  const [moderatorReason, setModeratorReason] = useState('');

  useEffect(() => {
    loadModerationData(true);
  }, []);

  const loadModerationData = async (isInitial = false) => {
    if (isInitial && reviewQueue.length === 0 && allReports.length === 0) {
      setLoading(true);
    }
    try {
      const [queueRes, postsRes] = await Promise.all([
        api.get('/reports/admin'),
        api.get('/posts')
      ]);

      if (queueRes.data.success) {
        setSummary(queueRes.data.summary || {});
        setReviewQueue(queueRes.data.reviewQueue || []);
        setAllReports(queueRes.data.allReports || []);
      }
      if (postsRes.data.success) {
        setAllPosts(postsRes.data.data || []);
      }
    } catch (err) {
      console.warn('Error loading moderation queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeepContent = async (targetType, targetId) => {
    try {
      const res = await api.patch(`/reports/admin/${targetType}/${targetId}/review`, {
        action: 'keep'
      });
      alert('Content retained — active reports dismissed.');
      cacheService.invalidate('feed');
      loadModerationData();
      setContextItem(null);
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRestoreContent = async (targetType, targetId) => {
    try {
      const res = await api.patch(`/reports/admin/${targetType}/${targetId}/review`, {
        action: 'restore'
      });
      alert('Content restored to public feed.');
      cacheService.invalidate('feed');
      loadModerationData();
      setContextItem(null);
    } catch (err) {
      alert('Restore failed');
    }
  };

  const handleConfirmModeratorAction = async () => {
    if (!actionModalItem) return;
    const { targetType, targetId, action } = actionModalItem;

    if (!moderatorReason.trim()) {
      alert('Please enter a moderator reason before taking this action.');
      return;
    }

    try {
      const res = await api.patch(`/reports/admin/${targetType}/${targetId}/review`, {
        action,
        moderatorReason
      });
      alert(res.data.message);
      setActionModalItem(null);
      setModeratorReason('');
      setContextItem(null);
      cacheService.invalidate('feed');
      loadModerationData();
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Moderation Summary Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Needs Review Metric */}
        <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm transition-colors ${
          isLight ? 'bg-amber-50/80 border-amber-200' : 'bg-gradient-to-br from-[#161b22] to-[#1a1212] border-amber-500/50'
        }`}>
          <div className="space-y-1">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest block ${
              isLight ? 'text-amber-800' : 'text-amber-400'
            }`}>
              NEEDS REVIEW
            </span>
            <span className={`text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {summary.needsReviewCount || reviewQueue.length}
            </span>
            <p className={`text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              Crossed 5-report review threshold
            </p>
          </div>
          <div className={`p-3 rounded-2xl border ${
            isLight ? 'bg-amber-100/80 text-amber-800 border-amber-300' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
          }`}>
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Total Reports Metric */}
        <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm transition-colors ${
          isLight ? 'bg-white border-gray-200' : 'bg-[#121721] border-[#30363d]'
        }`}>
          <div className="space-y-1">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest block ${
              isLight ? 'text-red-700' : 'text-red-400'
            }`}>
              TOTAL REPORTS
            </span>
            <span className={`text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {summary.totalReportsCount || allReports.length}
            </span>
            <p className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              Member report submissions
            </p>
          </div>
          <div className={`p-3 rounded-2xl border ${
            isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}>
            <Flag className="w-6 h-6" />
          </div>
        </div>

        {/* Hidden Content Metric */}
        <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm transition-colors ${
          isLight ? 'bg-white border-gray-200' : 'bg-[#121721] border-[#30363d]'
        }`}>
          <div className="space-y-1">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest block ${
              isLight ? 'text-slate-500' : 'text-gray-400'
            }`}>
              HIDDEN CONTENT
            </span>
            <span className={`text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {summary.hiddenCount || 0}
            </span>
            <p className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
              Soft-hidden from feed
            </p>
          </div>
          <div className={`p-3 rounded-2xl border ${
            isLight ? 'bg-gray-100 text-slate-700 border-gray-200' : 'bg-gray-800 text-gray-400 border-gray-700'
          }`}>
            <EyeOff className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className={`flex items-center gap-2 border-b pb-2 font-mono text-xs overflow-x-auto ${
        isLight ? 'border-gray-200' : 'border-[#30363d]'
      }`}>
        <button
          onClick={() => setActiveTab('review')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
            activeTab === 'review'
              ? isLight ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-sm' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
              : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-[#161b22]'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Review Queue</span>
          {summary.needsReviewCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-extrabold text-[10px]">
              {summary.needsReviewCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reported')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
            activeTab === 'reported'
              ? isLight ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-sm' : 'bg-[#2f9e44]/20 text-[#2f9e44] border border-[#2f9e44]/40 shadow-sm'
              : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-[#161b22]'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>All Reported Items</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
            activeTab === 'all'
              ? isLight ? 'bg-white text-slate-900 border border-gray-300 shadow-sm' : 'bg-[#18202c] text-white border border-[#30363d] shadow-md'
              : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-[#161b22]'
          }`}
        >
          <span>All Community Posts</span>
        </button>
      </div>

      {/* TAB CONTENT: REVIEW QUEUE */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          {reviewQueue.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border transition-colors ${
              isLight ? 'bg-white border-gray-200' : 'bg-[#121721] border-[#30363d]'
            }`}>
              <div className="p-4 rounded-full bg-[#2f9e44]/15 text-[#2f9e44] w-fit mx-auto border border-[#2f9e44]/30 mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>Review Queue Clear</h3>
              <p className={`text-xs max-w-sm mx-auto mt-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                No reported community posts or comments currently exceed the 5-report review threshold.
              </p>
            </div>
          ) : (
            reviewQueue.map((item, idx) => (
              <div key={idx} className={`p-6 rounded-2xl border space-y-4 shadow-sm transition-colors ${
                isLight ? 'bg-white border-amber-300' : 'bg-[#121721] border-amber-500/50'
              }`}>
                <div className={`flex items-center justify-between border-b pb-3 ${
                  isLight ? 'border-gray-200' : 'border-[#30363d]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase ${
                      isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    }`}>
                      ⚠️ NEEDS REVIEW
                    </span>
                    <span className={`text-xs font-mono font-bold flex items-center gap-1 ${
                      isLight ? 'text-red-700' : 'text-red-400'
                    }`}>
                      <Flag className="w-3.5 h-3.5" /> {item.reportCount} UNIQUE REPORTS
                    </span>
                  </div>

                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    {formatEventDate(item.createdAt)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={item.targetRef?.authorRef?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'}
                      alt="Author"
                      className="w-9 h-9 rounded-full object-cover border border-[#2f9e44]"
                    />
                    <div>
                      <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {item.targetRef?.authorRef?.name || 'Community Member'}
                      </h4>
                      <RoleBadge role={item.targetRef?.authorRef?.role} />
                    </div>
                  </div>

                  {item.targetRef?.title && (
                    <h5 className={`font-bold text-base leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {item.targetRef.title}
                    </h5>
                  )}
                  
                  {/* Reported Content Body Box */}
                  <div className={`p-4 rounded-xl border leading-relaxed text-xs font-medium ${
                    isLight ? 'bg-slate-50 border-gray-200 text-slate-800' : 'bg-[#0a0d12] border-[#30363d] text-gray-200'
                  }`}>
                    {item.targetRef?.content || '[Content Details]'}
                  </div>
                </div>

                {/* Moderator Decision Controls */}
                <div className={`flex flex-wrap items-center justify-between gap-3 pt-3 border-t ${
                  isLight ? 'border-gray-200' : 'border-[#30363d]'
                }`}>
                  <button
                    onClick={() => setContextItem(item)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors ${
                      isLight
                        ? 'bg-slate-100 text-slate-800 border-gray-300 hover:bg-gray-200'
                        : 'bg-[#18202c] hover:bg-[#21262d] text-gray-300 hover:text-white border-[#30363d]'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-[#2f9e44]" /> View Context
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleKeepContent(item.targetType, item.targetId)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-colors shadow-sm ${
                        isLight
                          ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                          : 'bg-[#2f9e44]/20 hover:bg-[#2f9e44] text-[#2f9e44] hover:text-white border-[#2f9e44]/40'
                      }`}
                    >
                      Keep Content
                    </button>
                    <button
                      onClick={() => setActionModalItem({ targetType: item.targetType, targetId: item.targetId, action: 'hide' })}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-colors shadow-sm ${
                        isLight
                          ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                          : 'bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black border-amber-500/40'
                      }`}
                    >
                      Hide Content
                    </button>
                    <button
                      onClick={() => setActionModalItem({ targetType: item.targetType, targetId: item.targetId, action: 'delete' })}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-colors shadow-sm ${
                        isLight
                          ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                          : 'bg-red-500/20 hover:bg-red-600 text-red-400 hover:text-white border-red-500/40'
                      }`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: ALL REPORTED ITEMS */}
      {activeTab === 'reported' && (
        <div className="space-y-3">
          {allReports.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border ${
              isLight ? 'bg-white border-gray-200' : 'bg-[#121721] border-[#30363d]'
            }`}>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>No member report logs found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allReports.map((rep) => (
                <div key={rep._id} className={`p-4 rounded-2xl border space-y-2 text-xs transition-colors ${
                  isLight ? 'bg-white border-gray-200' : 'bg-[#121721] border-[#30363d]'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-700 dark:text-red-400 px-2 py-0.5 rounded bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 uppercase text-[10px]">
                        {rep.reason}
                      </span>
                      <span className={isLight ? 'text-slate-600' : 'text-gray-400'}>
                        Reported by: <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{rep.reporterRef?.name || 'Member'}</span>
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{formatEventDate(rep.createdAt)}</span>
                  </div>

                  {rep.details && (
                    <p className={`italic p-2 rounded-lg border ${
                      isLight ? 'bg-slate-50 text-slate-800 border-gray-200' : 'bg-[#0a0d12] text-gray-300 border-[#30363d]/50'
                    }`}>
                      "{rep.details}"
                    </p>
                  )}

                  <div className={`flex items-center justify-between text-[10px] pt-1 border-t ${
                    isLight ? 'border-gray-200 text-slate-600' : 'border-[#30363d] text-gray-400'
                  }`}>
                    <span>Target Type: <strong className={`uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>{rep.targetType}</strong></span>
                    <span>Report Status: <strong className="text-amber-700 dark:text-amber-400 uppercase">{rep.status}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODERATOR ACTION REASON MODAL */}
      {actionModalItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl space-y-4 shadow-2xl border transition-colors ${
            isLight ? 'bg-white border-red-300 text-slate-900' : 'bg-[#121721] border-red-500/50 text-white'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
              <h3 className={`font-extrabold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Confirm Moderation: {actionModalItem.action.toUpperCase()}
              </h3>
              <button onClick={() => setActionModalItem(null)} className={isLight ? 'text-gray-400 hover:text-slate-700' : 'text-gray-400 hover:text-white'}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-mono font-bold block ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                Moderator Reason (Required for audit log & author notice)
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Violates Community Guidelines regarding inappropriate media or spam link."
                value={moderatorReason}
                onChange={(e) => setModeratorReason(e.target.value)}
                className={`w-full rounded-xl p-3 text-xs border focus:outline-none focus:border-red-500 ${
                  isLight ? 'bg-white border-gray-300 text-slate-900 placeholder-gray-400' : 'bg-[#0a0d12] border-[#30363d] text-white'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActionModalItem(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                  isLight ? 'bg-gray-100 text-slate-700 border-gray-200 hover:bg-gray-200' : 'bg-[#18202c] text-gray-300 hover:text-white border-[#30363d]'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmModeratorAction}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg"
              >
                Confirm {actionModalItem.action.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTEXT VIEW MODAL */}
      {contextItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-xl p-6 rounded-2xl space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl border transition-colors ${
            isLight ? 'bg-white border-emerald-300 text-slate-900' : 'bg-[#121721] border-[#2f9e44] text-white'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
              <h3 className={`font-extrabold text-sm flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Eye className="w-4 h-4 text-[#2f9e44]" /> Content Context View
              </h3>
              <button onClick={() => setContextItem(null)} className={isLight ? 'text-gray-400 hover:text-slate-700' : 'text-gray-400 hover:text-white'}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-medium">
              <div className={`p-3 rounded-xl border space-y-2 ${
                isLight ? 'bg-slate-50 border-gray-200 text-slate-800' : 'bg-[#0a0d12] border-[#30363d] text-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{contextItem.targetRef?.authorRef?.name || 'Member'}</span>
                  <RoleBadge role={contextItem.targetRef?.authorRef?.role} />
                </div>
                {contextItem.targetRef?.title && <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{contextItem.targetRef.title}</p>}
                <p className={isLight ? 'text-slate-700' : 'text-gray-200'}>{contextItem.targetRef?.content}</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => handleKeepContent(contextItem.targetType, contextItem.targetId)}
                  className="px-4 py-1.5 rounded-xl bg-[#2f9e44] text-white font-bold shadow"
                >
                  Keep Content
                </button>
                <button
                  onClick={() => {
                    setActionModalItem({ targetType: contextItem.targetType, targetId: contextItem.targetId, action: 'hide' });
                  }}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 text-black font-bold shadow"
                >
                  Hide Content
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
