import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import api from '../../services/api';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Award, Medal, Info, Sparkles, RefreshCw } from 'lucide-react';
import TechHeader from '../../components/common/TechHeader';
import TechCard from '../../components/common/TechCard';
import AuthorIdentity from '../../components/common/AuthorIdentity';
import RoleBadge from '../../components/common/RoleBadge';
import { useAuth } from '../../context/AuthContext';
import cacheService from '../../services/cacheService';

export default function LeaderboardPage() {
  const { user, member: authMember } = useAuth();
  const currentMemberId = authMember?._id || user?.id || user?._id;

  const [timeframe, setTimeframe] = useState('month'); // 'month' (default), 'week', 'all'
  const [board, setBoard] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);
  loadingMoreRef.current = loadingMore;

  // Initial Load (Page 1) when timeframe changes
  useEffect(() => {
    setBoard([]);
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);
    setFetchError(null);

    const cacheKey = `leaderboard_${timeframe}_p1`;
    const cached = cacheService.get(cacheKey, 30000);

    if (cached && cached.data && cached.data.length > 0) {
      setBoard(cached.data);
      if (cached.pagination) {
        setHasMore(cached.pagination.hasMore);
        setTotalMembers(cached.pagination.total);
      }
      setInitialLoading(false);
    }

    cacheService
      .dedupe(cacheKey, () => api.get('/leaderboard', { params: { timeframe, page: 1, limit: 10 } }))
      .then((res) => {
        const items = res.data?.data || [];
        const pagination = res.data?.pagination || {};
        setBoard(items);
        setHasMore(pagination.hasMore ?? false);
        setTotalMembers(pagination.total || items.length);
        cacheService.set(cacheKey, { data: items, pagination });
      })
      .catch((err) => {
        console.warn('[Leaderboard fetch error]:', err);
        setFetchError('Failed to load leaderboard data.');
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, [timeframe]);

  // Load next page function
  const loadNextPage = useCallback(() => {
    if (loadingMoreRef.current || !hasMore || initialLoading) return;

    setLoadingMore(true);
    setFetchError(null);

    const nextPage = page + 1;
    const cacheKey = `leaderboard_${timeframe}_p${nextPage}`;

    cacheService
      .dedupe(cacheKey, () => api.get('/leaderboard', { params: { timeframe, page: nextPage, limit: 10 } }))
      .then((res) => {
        const newItems = res.data?.data || [];
        const pagination = res.data?.pagination || {};

        setBoard((prev) => {
          const existingIds = new Set(prev.map((i) => i.member?._id || itemKey(i)));
          const filteredNew = newItems.filter((i) => !existingIds.has(i.member?._id || itemKey(i)));
          return [...prev, ...filteredNew];
        });

        setPage(nextPage);
        setHasMore(pagination.hasMore ?? false);
        if (pagination.total) setTotalMembers(pagination.total);
        cacheService.set(cacheKey, { data: newItems, pagination });
      })
      .catch((err) => {
        console.warn('[Leaderboard pagination error]:', err);
        setFetchError('Could not load more members.');
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, [page, hasMore, initialLoading, timeframe]);

  // Sentinel Intersection Observer for infinite scrolling inside container
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMoreRef.current && !initialLoading) {
          loadNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, initialLoading, loadNextPage]);

  const itemKey = (item) => item.member?._id || item.member?.id || item.rank;

  // Find user's own rank card data
  const userRankItem = board.find((item) => {
    const mId = item.member?._id || item.member?.id;
    return String(mId) === String(currentMemberId) || (user?.username && item.member?.username === user.username);
  });

  const nextRankItem = userRankItem && userRankItem.rank > 1 ? board.find((i) => i.rank === userRankItem.rank - 1) : null;
  const ptsToNextRank = nextRankItem ? nextRankItem.points - userRankItem.points + 1 : 0;

  // Podium order: 2nd (Silver), 1st (Gold), 3rd (Bronze)
  const rank1 = board.find((i) => i.rank === 1);
  const rank2 = board.find((i) => i.rank === 2);
  const rank3 = board.find((i) => i.rank === 3);

  const restRankList = board.filter((i) => i.rank > 3);

  // Helper for determining Card Visual Treatments
  const getCardStyle = (member) => {
    if (!member) return { type: 'standard', className: 'hover:bg-[#0a0d12]/60' };
    const role = (member.role || '').toLowerCase();
    const team = (member.teamName || '').toLowerCase();

    const isLead = /lead|mantri|president|faculty|coordinator|head|director/i.test(role) || /executive|lead/i.test(team);
    if (isLead) {
      return {
        type: 'lead',
        className: 'bg-gradient-to-r from-[#1b1710] via-[#141922] to-[#121721] border-l-4 border-l-[#d4af37] border-y border-r border-[#d4af37]/30 hover:border-[#d4af37]/60 shadow-lg shadow-amber-950/20',
        badgeLabel: '✨ LEADERSHIP',
        badgeClass: 'bg-[#d4af37]/15 text-[#f3e5ab] border-[#d4af37]/40'
      };
    }

    const isCampusMember = member.accountType === 'Member' || member.membershipStatus === 'active' || Boolean(member.membershipId);
    if (isCampusMember) {
      return {
        type: 'campus',
        className: 'bg-gradient-to-r from-[#211b0e] via-[#161f2a] to-[#121721] border-l-4 border-l-amber-500 border-y border-r border-amber-500/30 hover:border-amber-400 shadow-md shadow-amber-950/30',
        badgeLabel: '🟡 CAMPUS MEMBER',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40'
      };
    }

    return {
      type: 'standard',
      className: 'hover:bg-[#0a0d12]/60'
    };
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-100 flex flex-col font-sans">
      <style>{`
        .leaderboard-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .leaderboard-scrollbar::-webkit-scrollbar-track {
          background: #0a0d12;
          border-radius: 9999px;
        }
        .leaderboard-scrollbar::-webkit-scrollbar-thumb {
          background: #30363d;
          border-radius: 9999px;
        }
        .leaderboard-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2f9e44;
        }
      `}</style>

      <Navbar />
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-8">
        <TechHeader
          tag="COMMUNITY REPUTATION"
          title="Campus Contribution & Reputation Ranks"
          description="Real-time score based on published posts, valuable discussions, likes received, and peer bookmarks."
          count={totalMembers || board.length}
          countLabel="Ranked Contributors"
        />

        {/* Timeframe Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#121721] p-3 rounded-2xl border border-[#30363d]">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-mono font-bold text-gray-400 mr-2 hidden sm:inline">TIMEFRAME:</span>
            {[
              { id: 'month', label: 'This Month (Default)' },
              { id: 'week', label: 'This Week' },
              { id: 'all', label: 'All Time' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  timeframe === t.id
                    ? 'bg-[#2f9e44] text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-[#18202c]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* LOGGED IN USER STICKY RANK CARD */}
        {userRankItem && (
          <TechCard className="p-5 bg-gradient-to-r from-[#121721] via-[#162218] to-[#121721] border-[#2f9e44] shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-[#2f9e44]/20 border-2 border-[#2f9e44] flex flex-col items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-[10px] font-mono text-gray-400 leading-none">RANK</span>
                  <span className="text-xl font-black font-mono text-[#2f9e44]">#{userRankItem.rank}</span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                    <h3 className="text-base font-extrabold text-white">Your Community Rank</h3>
                    {userRankItem.trend > 0 && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold inline-flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> ↑ {userRankItem.trend} this week
                      </span>
                    )}
                  </div>
                  <AuthorIdentity member={userRankItem.member} size="small" className="mt-1" />
                </div>
              </div>

              {/* Total Score & Progress to next rank */}
              <div className="flex items-center gap-6 flex-shrink-0">
                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-[#2f9e44]">{userRankItem.points} <span className="text-xs font-normal text-gray-400">pts</span></div>
                  {nextRankItem && ptsToNextRank > 0 && (
                    <p className="text-[10px] font-mono text-gray-400 pt-0.5">
                      <strong className="text-white">{ptsToNextRank} pts</strong> to reach #{nextRankItem.rank}
                    </p>
                  )}
                </div>

                {/* Score Breakdown Pills */}
                {userRankItem.breakdown && (
                  <div className="hidden lg:flex items-center gap-2 border-l border-[#30363d] pl-6 text-[10px] font-mono">
                    <span className="px-2.5 py-1 rounded-lg bg-[#0a0d12] border border-[#30363d] text-gray-300">
                      Posts: <strong className="text-white">{userRankItem.breakdown.postsPoints}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#0a0d12] border border-[#30363d] text-gray-300">
                      Discussion: <strong className="text-white">{userRankItem.breakdown.commentsPoints + userRankItem.breakdown.repliesPoints}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#0a0d12] border border-[#30363d] text-gray-300">
                      Engagement: <strong className="text-[#2f9e44]">{userRankItem.breakdown.likesPoints + userRankItem.breakdown.savesPoints + userRankItem.breakdown.bonuses}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </TechCard>
        )}

        {initialLoading ? (
          <div className="text-center py-16 text-gray-400 font-mono space-y-2">
            <Trophy className="w-8 h-8 text-[#2f9e44] animate-bounce mx-auto" />
            <p>Calculating Real-Time Community Reputation...</p>
          </div>
        ) : (
          <div className="space-y-10 max-w-5xl mx-auto">
            {/* 🏆 TOP 3 PODIUM DISPLAY */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pt-12 pb-4">
              {/* #2 SILVER (Left) */}
              {rank2 && (
                <TechCard className="p-6 text-center space-y-3 relative bg-[#121721] border-[#30363d] hover:border-gray-400 transition-all order-2 sm:order-1 !overflow-visible">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-500 font-mono text-[10px] font-bold flex items-center gap-1.5 shadow-xl z-10 whitespace-nowrap">
                    <Medal className="w-3.5 h-3.5 text-slate-300" /> #2 SILVER
                  </div>
                  <AuthorIdentity member={rank2.member} size="normal" className="justify-center pt-3" />
                  <span className="text-xs font-semibold text-slate-300 block">{rank2.badge}</span>

                  <div className="pt-3 border-t border-[#30363d] flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-400">Score</span>
                    <span className="text-base font-black text-white">{rank2.points} pts</span>
                  </div>
                </TechCard>
              )}

              {/* #1 GOLD CHAMPION (Center - Elevated) */}
              {rank1 && (
                <TechCard className="p-7 text-center space-y-4 relative bg-gradient-to-b from-[#162218] via-[#121721] to-[#0a0d12] border-[#2f9e44] shadow-2xl shadow-green-950/60 scale-105 order-1 sm:order-2 !overflow-visible">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-mono text-xs font-black flex items-center gap-1.5 shadow-2xl z-10 whitespace-nowrap">
                    <Crown className="w-4 h-4 text-black fill-black" /> #1 CHAMPION
                  </div>
                  <AuthorIdentity member={rank1.member} size="normal" className="justify-center pt-4" />
                  <span className="text-xs font-bold text-[#2f9e44] bg-[#2f9e44]/15 px-3 py-1 rounded-full border border-[#2f9e44]/30 inline-block">
                    {rank1.badge}
                  </span>

                  <div className="pt-3 border-t border-[#30363d] flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-400">Total Contribution</span>
                    <span className="text-xl font-black text-[#2f9e44]">{rank1.points} pts</span>
                  </div>
                </TechCard>
              )}

              {/* #3 BRONZE (Right) */}
              {rank3 && (
                <TechCard className="p-6 text-center space-y-3 relative bg-[#121721] border-[#30363d] hover:border-amber-700/60 transition-all order-3 !overflow-visible">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700 font-mono text-[10px] font-bold flex items-center gap-1.5 shadow-xl z-10 whitespace-nowrap">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> #3 BRONZE
                  </div>
                  <AuthorIdentity member={rank3.member} size="normal" className="justify-center pt-3" />
                  <span className="text-xs font-semibold text-amber-400 block">{rank3.badge}</span>

                  <div className="pt-3 border-t border-[#30363d] flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-400">Score</span>
                    <span className="text-base font-black text-white">{rank3.points} pts</span>
                  </div>
                </TechCard>
              )}
            </div>

            {/* FULL RANKINGS LIST WITH FIXED INTERNAL SCROLL CONTAINER */}
            <div className="bg-[#121721] border border-[#30363d] rounded-2xl overflow-hidden shadow-xl tech-corner">
              {/* Header Panel */}
              <div className="p-5 border-b border-[#30363d] flex flex-wrap items-center justify-between gap-3 bg-[#0a0d12]">
                <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#2f9e44]" /> Community Contributor Ranks
                </h3>
                <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
                  <span>
                    Showing <strong className="text-white">{board.length}</strong> of{' '}
                    <strong className="text-[#2f9e44]">{totalMembers || board.length}</strong>
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#2f9e44] animate-pulse" title="Progressive stream active" />
                </div>
              </div>

              {/* Controlled Max-Height Internal Scroll Container */}
              <div className="leaderboard-scrollbar max-h-[580px] sm:max-h-[500px] overflow-y-auto overflow-x-hidden divide-y divide-[#30363d]/50">
                {(restRankList.length > 0 ? restRankList : board).map((item) => {
                  const isUser = String(item.member?._id) === String(currentMemberId);
                  const cardStyle = getCardStyle(item.member);

                  return (
                    <div
                      key={item.rank}
                      className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${cardStyle.className} ${
                        isUser ? '!bg-[#2f9e44]/10 !border-l-4 !border-l-[#2f9e44]' : ''
                      }`}
                    >
                      {/* Rank Number & Trend Delta */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex items-center gap-2 w-12 flex-shrink-0 font-mono">
                          <span className="font-black text-base text-white">#{item.rank}</span>
                          {item.trend > 0 ? (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center" title="Rising">
                              <TrendingUp className="w-3 h-3" />
                            </span>
                          ) : item.trend < 0 ? (
                            <span className="text-[10px] font-bold text-red-400 flex items-center" title="Falling">
                              <TrendingDown className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-600" title="Steady">
                              <Minus className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        {/* Contributor Profile */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <AuthorIdentity member={item.member} size="normal" className="min-w-0" />
                          {cardStyle.badgeLabel && (
                            <div className="pt-0.5">
                              <span
                                className={`inline-flex items-center font-mono font-bold rounded-full border text-[9px] px-2 py-0.5 ${cardStyle.badgeClass}`}
                              >
                                {cardStyle.badgeLabel}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Badge & Points Breakdown */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#30363d]/40">
                        <div className="text-left sm:text-right min-w-0">
                          <span className="text-xs font-semibold text-gray-300 block truncate">{item.badge}</span>
                          {item.breakdown && (
                            <span className="text-[10px] font-mono text-gray-400 block truncate">
                              {item.breakdown.posts} Posts • {item.breakdown.comments + item.breakdown.replies} Replies • {item.breakdown.postLikesReceived} Likes
                            </span>
                          )}
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-base font-black font-mono text-[#2f9e44] block">{item.points} pts</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* IntersectionObserver Trigger Sentinel */}
                <div ref={sentinelRef} className="h-6 w-full" />

                {/* Bottom Progressive Loading Skeletons */}
                {loadingMore && (
                  <div className="p-4 space-y-3 bg-[#0a0d12]/40">
                    {[1, 2, 3].map((s) => (
                      <div
                        key={s}
                        className="flex items-center justify-between gap-4 animate-pulse p-3.5 rounded-xl bg-[#121721]/70 border border-[#30363d]/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-6 bg-gray-700/50 rounded" />
                          <div className="w-10 h-10 bg-gray-700/50 rounded-full" />
                          <div className="space-y-1.5">
                            <div className="w-32 h-3.5 bg-gray-700/50 rounded" />
                            <div className="w-20 h-2.5 bg-gray-700/50 rounded" />
                          </div>
                        </div>
                        <div className="w-16 h-5 bg-gray-700/50 rounded" />
                      </div>
                    ))}
                    <p className="text-center text-xs font-mono text-gray-400 pt-1 flex items-center justify-center gap-2">
                      <RefreshCw className="w-3 h-3 text-[#2f9e44] animate-spin" /> Loading more members...
                    </p>
                  </div>
                )}

                {/* Retry UI on page fetch failure */}
                {fetchError && !loadingMore && (
                  <div className="p-4 text-center space-y-2 bg-red-950/20 border-t border-red-900/30">
                    <p className="text-xs font-mono text-red-400">{fetchError}</p>
                    <button
                      onClick={loadNextPage}
                      className="px-4 py-1.5 rounded-lg bg-red-900/40 text-red-200 border border-red-700 text-xs font-mono font-bold hover:bg-red-800/50 transition-colors"
                    >
                      Retry Loading
                    </button>
                  </div>
                )}

                {/* Stream complete message */}
                {!hasMore && board.length > 0 && !loadingMore && (
                  <div className="p-4 text-center text-xs font-mono text-gray-400 border-t border-[#30363d]/30 bg-[#0a0d12]/50">
                    ✨ End of community leaderboard ({totalMembers || board.length} members loaded)
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

