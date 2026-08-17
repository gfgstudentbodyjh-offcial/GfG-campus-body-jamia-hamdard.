import React, { useState, useEffect } from 'react';
import RoleBadge from '../../components/common/RoleBadge';
import api from '../../services/api';
import cacheService from '../../services/cacheService';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { formatEventDate } from '../../utils/dateUtils';
import {
  ShieldAlert, ShieldCheck, Eye, EyeOff, Trash2, CheckCircle2,
  AlertTriangle, Flag, MessageSquare, Heart, RefreshCw, X,
  FileText, ExternalLink, User, Clock, Check, AlertCircle,
  CornerDownRight, Image as ImageIcon, FileCode, Layers
} from 'lucide-react';

export default function FeedModerationAdmin() {
  const { isLight } = useAdminTheme();
  const [activeTab, setActiveTab] = useState('review'); // review | reported | all
  const [summary, setSummary] = useState({ needsReviewCount: 0, totalReportsCount: 0, hiddenCount: 0 });
  const [reviewQueue, setReviewQueue] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Drawer State
  const [reviewModalData, setReviewModalData] = useState(null); // { targetType, targetId, reportId }
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewContent, setReviewContent] = useState(null);
  const [reviewError, setReviewError] = useState(null);

  // Moderator Action Confirmation State
  const [actionConfirm, setActionConfirm] = useState(null); // { action: 'hide'|'delete'|'keep'|'restore', targetType, targetId }
  const [moderatorReason, setModeratorReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, text: '', type: 'info' });

  const showToast = (text, type = 'success') => {
    setToast({ show: true, text, type });
    setTimeout(() => setToast({ show: false, text: '', type: 'info' }), 4000);
  };

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
      console.warn('[FeedModerationAdmin] Error loading moderation queue:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open Full Moderation Review Drawer
  const openReviewDrawer = async (targetType, targetId, initialReport = null) => {
    const safeTargetType = (targetType || 'post').toLowerCase();
    setReviewModalData({
      targetType: safeTargetType,
      targetId,
      initialReport
    });
    setReviewLoading(true);
    setReviewContent(null);
    setReviewError(null);

    try {
      const res = await api.get(`/reports/admin/${safeTargetType}/${targetId}`);
      if (res.data.success) {
        setReviewContent(res.data);
      } else {
        setReviewError(res.data.message || 'Failed to fetch content details');
      }
    } catch (err) {
      console.warn('[FeedModerationAdmin] Error fetching report target:', err);
      setReviewError(err.response?.data?.message || 'Could not connect to server to fetch reported content.');
    } finally {
      setReviewLoading(false);
    }
  };

  // Execute Moderation Action (Keep / Hide / Delete / Restore)
  const handleExecuteAction = async () => {
    if (!actionConfirm) return;
    const { action, targetType, targetId } = actionConfirm;

    if (['hide', 'delete'].includes(action) && !moderatorReason.trim()) {
      showToast('Please enter a moderator reason before taking this action.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.patch(`/reports/admin/${targetType}/${targetId}/review`, {
        action,
        moderatorReason: moderatorReason.trim()
      });

      if (res.data.success) {
        showToast(res.data.message || `Action ${action.toUpperCase()} completed successfully.`);
        
        // Optimistic UI updates
        setReviewQueue(prev => prev.filter(item => !(item.targetId === targetId && item.targetType === targetType)));
        setAllReports(prev => prev.map(rep => {
          if (rep.targetRef === targetId || (rep.targetRef?._id === targetId)) {
            return {
              ...rep,
              status: action === 'keep' ? 'dismissed' : 'resolved',
              resolutionAction: action,
              moderatorNotes: moderatorReason.trim()
            };
          }
          return rep;
        }));

        // Invalidate community feed cache
        cacheService.invalidate('feed');

        // Close action dialog & drawer
        setActionConfirm(null);
        setModeratorReason('');
        setReviewModalData(null);

        // Silent background refresh to re-sync counts
        loadModerationData(false);
      } else {
        throw new Error(res.data.message || 'Moderation action failed');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Moderation action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-mono animate-in fade-in slide-in-from-top-2 ${
          toast.type === 'error'
            ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Moderation Summary Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Needs Review Metric */}
        <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-xs transition-colors ${
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
        <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-xs transition-colors ${
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
        <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-xs transition-colors ${
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
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'review'
              ? isLight ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-xs'
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
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'reported'
              ? isLight ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs' : 'bg-[#2f9e44]/20 text-[#2f9e44] border border-[#2f9e44]/40 shadow-xs'
              : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-[#161b22]'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>All Reported Items ({allReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'all'
              ? isLight ? 'bg-white text-slate-900 border border-gray-300 shadow-xs' : 'bg-[#18202c] text-white border border-[#30363d] shadow-md'
              : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-[#161b22]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Community Posts ({allPosts.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: REVIEW QUEUE (ITEMS NEEDING ACTION) ───────────────────── */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          {loading ? (
            <div className={`p-12 text-center rounded-2xl border font-mono text-xs ${
              isLight ? 'bg-white border-gray-200 text-slate-500' : 'bg-[#121721] border-[#30363d] text-gray-400'
            }`}>
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#2f9e44]" />
              <span>Loading moderation queue...</span>
            </div>
          ) : reviewQueue.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border transition-colors ${
              isLight ? 'bg-white border-gray-200' : 'bg-[#121721] border-[#30363d]'
            }`}>
              <div className="p-4 rounded-full bg-[#2f9e44]/15 text-[#2f9e44] w-fit mx-auto border border-[#2f9e44]/30 mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Review Queue Clear
              </h3>
              <p className={`text-xs max-w-sm mx-auto mt-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                No reported community posts or comments currently exceed the review threshold.
              </p>
            </div>
          ) : (
            reviewQueue.map((item, idx) => (
              <div key={item.targetId || idx} className={`p-5 sm:p-6 rounded-2xl border space-y-4 shadow-xs transition-colors ${
                isLight ? 'bg-white border-amber-300' : 'bg-[#121721] border-amber-500/50'
              }`}>
                {/* Item Header */}
                <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 ${
                  isLight ? 'border-gray-200' : 'border-[#30363d]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase ${
                      isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    }`}>
                      ⚠️ UNDER REVIEW
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                      item.targetType === 'post'
                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                    }`}>
                      {item.targetType}
                    </span>
                    <span className={`text-xs font-mono font-bold flex items-center gap-1 ${
                      isLight ? 'text-red-700' : 'text-red-400'
                    }`}>
                      <Flag className="w-3.5 h-3.5" /> {item.reportCount} REPORTS
                    </span>
                  </div>

                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    {formatEventDate(item.createdAt)}
                  </span>
                </div>

                {/* Author Lockup & Content Snippet */}
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
                    <h5 className={`font-bold text-sm leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {item.targetRef.title}
                    </h5>
                  )}
                  
                  <div className={`p-4 rounded-xl border leading-relaxed text-xs font-medium line-clamp-3 ${
                    isLight ? 'bg-slate-50 border-gray-200 text-slate-800' : 'bg-[#0a0d12] border-[#30363d] text-gray-200'
                  }`}>
                    {item.targetRef?.content || '[No Content Available]'}
                  </div>
                </div>

                {/* Footer Controls with Primary REVIEW Button */}
                <div className={`flex flex-wrap items-center justify-between gap-3 pt-3 border-t ${
                  isLight ? 'border-gray-200' : 'border-[#30363d]'
                }`}>
                  <button
                    onClick={() => openReviewDrawer(item.targetType, item.targetId, item)}
                    className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-[#2f9e44] hover:bg-[#28863a] text-white shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Review & Take Action</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActionConfirm({ action: 'keep', targetType: item.targetType, targetId: item.targetId })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-gray-300'
                          : 'bg-[#18202c] hover:bg-[#21262d] text-gray-300 border-[#30363d]'
                      }`}
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => setActionConfirm({ action: 'hide', targetType: item.targetType, targetId: item.targetId })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        isLight
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border-amber-300'
                          : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      Hide
                    </button>
                    <button
                      onClick={() => setActionConfirm({ action: 'delete', targetType: item.targetType, targetId: item.targetId })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        isLight
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-700 border-red-300'
                          : 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border-red-500/30'
                      }`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── TAB 2: ALL REPORTED ITEMS (REPORT LOGS) ────────────────────── */}
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
              {allReports.map((rep) => {
                const targetRefId = rep.targetRef?._id || rep.targetRef;
                return (
                  <div key={rep._id} className={`p-4 sm:p-5 rounded-2xl border space-y-3 text-xs transition-colors ${
                    isLight ? 'bg-white border-gray-200' : 'bg-[#121721] border-[#30363d]'
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-700 dark:text-red-400 px-2.5 py-0.5 rounded bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 uppercase text-[10px] font-mono">
                          {rep.reason}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          rep.targetType === 'post'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        }`}>
                          {rep.targetType}
                        </span>
                        <span className={isLight ? 'text-slate-600' : 'text-gray-400'}>
                          Reported by: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{rep.reporterRef?.name || 'Member'}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                          rep.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                            : rep.status === 'dismissed'
                            ? 'bg-gray-500/15 text-gray-400 border-gray-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {rep.status}
                        </span>
                        <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                          {formatEventDate(rep.createdAt)}
                        </span>
                      </div>
                    </div>

                    {rep.details && (
                      <p className={`italic p-2.5 rounded-xl border ${
                        isLight ? 'bg-slate-50 text-slate-800 border-gray-200' : 'bg-[#0a0d12] text-gray-300 border-[#30363d]/50'
                      }`}>
                        "{rep.details}"
                      </p>
                    )}

                    {/* Quick Actions Footer with REVIEW Button */}
                    <div className={`flex items-center justify-between pt-2 border-t text-[11px] ${
                      isLight ? 'border-gray-200' : 'border-[#30363d]'
                    }`}>
                      <span className={isLight ? 'text-slate-500' : 'text-gray-400'}>
                        Action: <strong className="font-mono">{rep.resolutionAction || 'none'}</strong>
                      </span>

                      <button
                        onClick={() => openReviewDrawer(rep.targetType, targetRefId, rep)}
                        className="px-3 py-1.5 rounded-lg font-mono font-bold text-xs bg-[#2f9e44]/15 hover:bg-[#2f9e44] text-[#2f9e44] hover:text-white border border-[#2f9e44]/30 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review Reported Content</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: ALL COMMUNITY POSTS ──────────────────────────────────── */}
      {activeTab === 'all' && (
        <div className="space-y-3">
          {allPosts.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border ${
              isLight ? 'bg-white border-gray-200' : 'bg-[#121721] border-[#30363d]'
            }`}>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>No community posts found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allPosts.map((post) => (
                <div key={post._id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  isLight ? 'bg-white border-gray-200' : 'bg-[#121721] border-[#30363d]'
                }`}>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{post.authorRef?.name || 'Member'}</span>
                      <RoleBadge role={post.authorRef?.role} />
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        post.moderationStatus === 'clean'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : post.moderationStatus === 'hidden'
                          ? 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {post.moderationStatus}
                      </span>
                    </div>
                    {post.title && <p className="font-bold text-xs text-gray-200 truncate">{post.title}</p>}
                    <p className="text-xs text-gray-400 line-clamp-1">{post.content}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openReviewDrawer('post', post._id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#18202c] hover:bg-[#21262d] text-gray-200 border border-[#30363d] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#2f9e44]" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── MODERATION REVIEW DRAWER / MODAL ────────────────────────────── */}
      {reviewModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div
            className={`w-full max-w-2xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
              isLight ? 'bg-white border-gray-300 text-slate-900' : 'bg-[#121721] border-[#30363d] text-white'
            }`}
          >
            {/* Drawer Header */}
            <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
              isLight ? 'border-gray-200 bg-gray-50/80' : 'border-[#30363d] bg-[#0d1117]/80'
            }`}>
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-8 h-8 rounded-xl bg-[#2f9e44]/15 text-[#2f9e44] flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold flex items-center gap-2">
                    <span>Moderation Review</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      {reviewModalData.targetType}
                    </span>
                  </h3>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    ID: {reviewModalData.targetId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReviewModalData(null)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isLight ? 'hover:bg-gray-200 text-slate-500' : 'hover:bg-[#18202c] text-gray-400 hover:text-white'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              
              {reviewLoading ? (
                <div className="p-12 text-center font-mono text-xs flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#2f9e44]" />
                  <span>Fetching live post content & report logs...</span>
                </div>
              ) : reviewError ? (
                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-mono space-y-1">
                  <p className="font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Error loading content
                  </p>
                  <p>{reviewError}</p>
                </div>
              ) : !reviewContent?.exists ? (
                /* Missing / Deleted Target State */
                <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                  <h4 className="font-bold text-sm text-amber-400">Content No Longer Available</h4>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    {reviewContent?.message || 'This post or comment was removed or deleted before review.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* 1. Report Metadata & Reasons Strip */}
                  <div className={`p-4 rounded-xl border space-y-3 ${
                    isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-[#181a20] border-amber-500/30'
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                        <Flag className="w-3.5 h-3.5" />
                        {reviewContent.totalReportsCount || reviewContent.reports?.length || 1} Member Reports Filed
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        reviewContent.target?.moderationStatus === 'under_review'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : reviewContent.target?.moderationStatus === 'hidden'
                          ? 'bg-gray-500/20 text-gray-400 border border-gray-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        Status: {reviewContent.target?.moderationStatus || 'flagged'}
                      </span>
                    </div>

                    {/* Reason Breakdown Pills */}
                    {reviewContent.reasonBreakdown && (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(reviewContent.reasonBreakdown).map(([reason, count]) => (
                          <span
                            key={reason}
                            className="px-2 py-0.5 rounded-md bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold"
                          >
                            {reason} ({count})
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Details from latest report if available */}
                    {reviewContent.reports?.[0]?.details && (
                      <div className={`p-2.5 rounded-lg border text-xs italic ${
                        isLight ? 'bg-white border-amber-200 text-slate-700' : 'bg-[#0d1117] border-[#30363d] text-gray-300'
                      }`}>
                        <span className="font-bold not-italic text-[10px] uppercase font-mono block text-gray-400 mb-0.5">
                          Reporter Note ({reviewContent.reports[0]?.reporterRef?.name || 'Member'}):
                        </span>
                        "{reviewContent.reports[0].details}"
                      </div>
                    )}
                  </div>

                  {/* 2. Parent Post Context (For Comments) */}
                  {reviewModalData.targetType === 'comment' && reviewContent.parentPost && (
                    <div className={`p-4 rounded-xl border space-y-2 ${
                      isLight ? 'bg-gray-50 border-gray-200' : 'bg-[#0d1117] border-[#30363d]'
                    }`}>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <CornerDownRight className="w-3.5 h-3.5 text-[#2f9e44]" />
                        Parent Post Context
                      </span>
                      <div className="flex items-center gap-2">
                        <img
                          src={reviewContent.parentPost.authorRef?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                          alt="Post author"
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="font-bold text-xs">{reviewContent.parentPost.authorRef?.name || 'Author'}</span>
                      </div>
                      {reviewContent.parentPost.title && (
                        <p className="font-bold text-xs text-gray-200">{reviewContent.parentPost.title}</p>
                      )}
                      <p className="text-xs text-gray-400 line-clamp-2">{reviewContent.parentPost.content}</p>
                    </div>
                  )}

                  {/* 3. The Reported Content Itself (The Hero) */}
                  <div className={`p-5 rounded-2xl border space-y-3.5 ${
                    isLight ? 'bg-slate-50 border-gray-300' : 'bg-[#07090e] border-[#30363d]'
                  }`}>
                    {/* Author Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={reviewContent.target?.authorRef?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'}
                          alt="Author"
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#2f9e44]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm">{reviewContent.target?.authorRef?.name || 'Member'}</h4>
                            <RoleBadge role={reviewContent.target?.authorRef?.role} />
                          </div>
                          <p className="text-[11px] font-mono text-gray-400">
                            @{reviewContent.target?.authorRef?.username || 'user'} • {formatEventDate(reviewContent.target?.createdAt)}
                          </p>
                        </div>
                      </div>

                      {reviewContent.target?.postType && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2f9e44]/15 text-[#2f9e44] border border-[#2f9e44]/30 uppercase">
                          {reviewContent.target.postType}
                        </span>
                      )}
                    </div>

                    {/* Post Title */}
                    {reviewContent.target?.title && (
                      <h4 className="text-base font-bold text-white pt-1">
                        {reviewContent.target.title}
                      </h4>
                    )}

                    {/* Text Body */}
                    <div className={`p-4 rounded-xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      isLight ? 'bg-white text-slate-800 border border-gray-200' : 'bg-[#121721] text-gray-200 border border-[#30363d]'
                    }`}>
                      {reviewContent.target?.content}
                    </div>

                    {/* Media Attachments Preview (Images / PDF / Links) */}
                    {Array.isArray(reviewContent.target?.media) && reviewContent.target.media.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-mono font-bold uppercase text-gray-400 block">
                          Media Attachments ({reviewContent.target.media.length}):
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {reviewContent.target.media.map((m, idx) => (
                            <div key={idx} className="relative rounded-xl overflow-hidden border border-[#30363d] bg-black/40 group">
                              {m.type === 'image' ? (
                                <img
                                  src={m.url}
                                  alt="Post attachment"
                                  className="w-full h-28 object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="p-3 h-28 flex flex-col items-center justify-center text-center gap-1.5 text-xs text-gray-300">
                                  <FileCode className="w-6 h-6 text-[#2f9e44]" />
                                  <span className="truncate max-w-full text-[10px] font-mono">{m.fileName || 'Attachment.pdf'}</span>
                                </div>
                              )}
                              <a
                                href={m.url}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-mono font-bold transition-opacity"
                              >
                                View Full ↗
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>

            {/* Drawer Actions Footer */}
            <div className={`p-4 sm:p-5 border-t flex flex-wrap items-center justify-between gap-3 ${
              isLight ? 'border-gray-200 bg-gray-50' : 'border-[#30363d] bg-[#0d1117]'
            }`}>
              <button
                type="button"
                onClick={() => setReviewModalData(null)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  isLight ? 'bg-white border-gray-300 text-slate-700 hover:bg-gray-100' : 'bg-[#18202c] border-[#30363d] text-gray-300 hover:text-white'
                }`}
              >
                Close Review
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {/* Dismiss / Keep */}
                <button
                  type="button"
                  onClick={() => setActionConfirm({ action: 'keep', targetType: reviewModalData.targetType, targetId: reviewModalData.targetId })}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#2f9e44] hover:bg-[#28863a] text-white shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Dismiss Report (Keep Content)</span>
                </button>

                {/* Hide Content */}
                <button
                  type="button"
                  onClick={() => setActionConfirm({ action: 'hide', targetType: reviewModalData.targetType, targetId: reviewModalData.targetId })}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                    isLight
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                      : 'bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black border-amber-500/40'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide Content</span>
                </button>

                {/* Remove Content */}
                <button
                  type="button"
                  onClick={() => setActionConfirm({ action: 'delete', targetType: reviewModalData.targetType, targetId: reviewModalData.targetId })}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Content</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODERATOR ACTION CONFIRMATION MODAL ─────────────────────────── */}
      {actionConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-md p-6 rounded-2xl space-y-4 shadow-2xl border ${
            isLight ? 'bg-white border-gray-300 text-slate-900' : 'bg-[#121721] border-[#30363d] text-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                actionConfirm.action === 'keep'
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : actionConfirm.action === 'hide'
                  ? 'bg-amber-500/15 text-amber-500'
                  : 'bg-red-500/15 text-red-500'
              }`}>
                {actionConfirm.action === 'keep' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-extrabold capitalize">
                  {actionConfirm.action === 'keep' ? 'Dismiss Reports & Keep' : `${actionConfirm.action} Content?`}
                </h3>
                <p className="text-xs text-gray-400">
                  Target: {actionConfirm.targetType.toUpperCase()}
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-gray-300">
              {actionConfirm.action === 'keep'
                ? 'This will mark the content as clean and dismiss all active member reports.'
                : actionConfirm.action === 'hide'
                ? 'This will soft-hide the content from the public community feed and resolve pending reports.'
                : 'This will permanently remove the content and resolve all associated reports.'}
            </p>

            {['hide', 'delete'].includes(actionConfirm.action) && (
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-300 block">
                  Moderator Reason (Required):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Violates Community Guidelines regarding inappropriate media, offensive remarks, or spam."
                  value={moderatorReason}
                  onChange={(e) => setModeratorReason(e.target.value)}
                  className={`w-full rounded-xl p-3 text-xs border focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-slate-900' : 'bg-[#0a0d12] border-[#30363d] text-white'
                  }`}
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => { setActionConfirm(null); setModeratorReason(''); }}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold border cursor-pointer ${
                  isLight ? 'bg-gray-100 hover:bg-gray-200 text-slate-700 border-gray-300' : 'bg-[#18202c] hover:bg-[#21262d] text-gray-300 border-[#30363d]'
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={actionLoading}
                className={`px-5 py-2 rounded-xl text-xs font-mono font-bold text-white shadow-md cursor-pointer transition-all ${
                  actionConfirm.action === 'keep'
                    ? 'bg-[#2f9e44] hover:bg-[#28863a]'
                    : actionConfirm.action === 'hide'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoading ? 'Processing...' : `Confirm ${actionConfirm.action.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
