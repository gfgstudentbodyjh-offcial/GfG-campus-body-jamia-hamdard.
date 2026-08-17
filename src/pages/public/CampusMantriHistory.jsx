import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import api from '../../services/api';
import { MOCK_MANTRI_LIST } from '../../data/leadership';
import { Mail, Linkedin, Github, Instagram, ShieldCheck, ArrowUpRight } from 'lucide-react';
import TechHeader from '../../components/common/TechHeader';
import TechCard from '../../components/common/TechCard';
import CampusMantriBadge from '../../components/common/CampusMantriBadge';

import cacheService from '../../services/cacheService';

export default function CampusMantriHistory() {
  const [mantris, setMantris] = useState(() => {
    const cached = cacheService.get('mantri', 1800000); // 30 mins TTL
    return cached?.data || [];
  });
  const [loading, setLoading] = useState(() => {
    const cached = cacheService.get('mantri', 1800000);
    return !(cached && cached.data && cached.data.length > 0);
  });
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    // Subscribe to cache updates (realtime sync when admin edits/sets mantri)
    const unsub = cacheService.subscribe('mantri', (data) => {
      if (Array.isArray(data) && data.length > 0) {
        setMantris(data);
        setLoading(false);
      }
    });

    // Background revalidation
    cacheService.dedupe('mantri', () => api.get('/mantri'))
      .then(res => {
        const data = res.data?.data || [];
        if (data.length > 0) {
          setMantris(data);
          cacheService.set('mantri', data);
        }
      })
      .catch(err => console.warn('[CampusMantriHistory] Failed to fetch mantri records:', err))
      .finally(() => setLoading(false));

    return () => unsub();
  }, []);

  const effectiveMantris = mantris.length > 0 ? mantris : MOCK_MANTRI_LIST;

  // Determine newest session ID as fallback for current
  const newestSessionId = useMemo(() => {
    if (!effectiveMantris || effectiveMantris.length === 0) return null;
    const currentObj = effectiveMantris.find(m => m.isCurrent);
    if (currentObj) return currentObj._id;
    return effectiveMantris[0]?._id;
  }, [effectiveMantris]);

  // Set default selected session ID to the currently active mantri
  useEffect(() => {
    if (!selectedSessionId && newestSessionId) {
      setSelectedSessionId(newestSessionId);
    }
  }, [selectedSessionId, newestSessionId]);

  const activeMantri = useMemo(() => {
    if (!selectedSessionId) return effectiveMantris[0];
    return effectiveMantris.find(m => m._id === selectedSessionId) || effectiveMantris[0];
  }, [effectiveMantris, selectedSessionId]);

  return (
    <div className="min-h-screen bg-transparent text-gray-100 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-12">
        
        {/* Header with Session Selector Filter Buttons */}
        <TechHeader
          tag="CAMPUS MANTRI"
          title="Campus Mantri History"
          description="Chronological records of Campus Mantris leading student developer initiatives across academic sessions at Jamia Hamdard."
        >
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin pt-2">
            {effectiveMantris.map((m) => {
              const isSelected = m._id === selectedSessionId;
              const isCurrentSession = m.isCurrent || m._id === newestSessionId;
              const tenureLabel = m.session || m.tenure || '2025–26';

              return (
                <button
                  key={m._id}
                  onClick={() => setSelectedSessionId(m._id)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 flex-shrink-0 cursor-pointer ${
                    isSelected
                      ? isCurrentSession
                        ? 'bg-[#D4A72C] text-black shadow-lg shadow-[#D4A72C]/25 border border-[#D4A72C]'
                        : 'bg-[#2f9e44] text-white shadow-lg shadow-[#2f9e44]/25 border border-[#2f9e44]'
                      : 'bg-[#121721] text-gray-300 border border-[#30363d] hover:border-[#2f9e44]/50'
                  }`}
                >
                  <span>Session {tenureLabel}</span>
                  {isCurrentSession && (
                    <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${
                      isSelected
                        ? 'bg-black/20 text-black'
                        : 'bg-[#D4A72C]/20 text-[#E6B83F] border border-[#D4A72C]/40'
                    }`}>
                      Current
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </TechHeader>

        {/* Profile Card View */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 font-mono">Loading Campus Mantri Records...</div>
        ) : activeMantri ? (
          <div className="max-w-4xl mx-auto">
            <TechCard
              key={activeMantri._id}
              className={`p-5 sm:p-8 md:p-10 shadow-2xl space-y-6 sm:space-y-8 transition-colors ${
                (activeMantri.isCurrent || activeMantri._id === newestSessionId)
                  ? 'border-[#D4A72C]/50 bg-gradient-to-br from-[#181611] via-[#0a0d12] to-[#2b2413]/30 shadow-[#D4A72C]/10'
                  : 'border-[#2f9e44]/40 bg-gradient-to-br from-[#121721] via-[#0a0d12] to-[#142e16]/30'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
                <img
                  src={activeMantri.photo || activeMantri.memberRef?.photo}
                  alt={`${activeMantri.name || activeMantri.memberRef?.name}, Campus Mantri`}
                  loading="lazy"
                  style={{ objectPosition: activeMantri.imagePosition || 'center top' }}
                  className={`w-32 h-36 sm:w-40 sm:h-44 md:w-44 md:h-48 rounded-2xl object-cover border-2 shadow-xl flex-shrink-0 ${
                    (activeMantri.isCurrent || activeMantri._id === newestSessionId)
                      ? 'border-[#D4A72C] shadow-[0_0_15px_rgba(212,167,44,0.3)]'
                      : 'border-[#2f9e44]'
                  }`}
                />
                
                <div className="space-y-3 sm:space-y-4 flex-1 text-center md:text-left min-w-0 w-full">
                  <div className="flex items-center justify-center md:justify-start">
                    <CampusMantriBadge
                      isCurrent={Boolean(activeMantri.isCurrent || activeMantri._id === newestSessionId)}
                      session={activeMantri.tenure || activeMantri.session}
                      showSession={true}
                      size="lg"
                    />
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
                    {activeMantri.name || activeMantri.memberRef?.name}
                  </h2>

                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed italic bg-[#0a0d12]/80 p-4 rounded-2xl border border-[#30363d]">
                    "{activeMantri.about || activeMantri.memberRef?.bio || activeMantri.memberRef?.about || 'Leading community initiatives and technical growth.'}"
                  </p>

                  {/* Verified Social Links & Public Profile CTA */}
                  {(() => {
                    const soc = activeMantri.socials || activeMantri.memberRef?.socials || {
                      email: activeMantri.memberRef?.email || activeMantri.email,
                      linkedin: activeMantri.memberRef?.linkedin || activeMantri.linkedin,
                      github: activeMantri.memberRef?.github || activeMantri.github,
                      instagram: activeMantri.memberRef?.instagram || activeMantri.instagram
                    };

                    const profileSlug =
                      activeMantri.username ||
                      activeMantri.memberRef?.username ||
                      activeMantri.memberRef?._id ||
                      activeMantri.memberRef ||
                      activeMantri._id;

                    const isCurrent = Boolean(activeMantri.isCurrent || activeMantri._id === newestSessionId);

                    return (
                      <div className="pt-3 border-t border-[#30363d]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Social Links */}
                        <div className="flex flex-wrap gap-2.5 justify-center md:justify-start">
                          {soc?.email && (
                            <a
                              href={`mailto:${soc.email}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-1.5 rounded-xl bg-[#18202c] text-gray-300 hover:text-white hover:bg-[#2f9e44] transition-colors border border-[#30363d] flex items-center gap-1.5 text-xs font-semibold"
                              title="Email"
                            >
                              <Mail className="w-3.5 h-3.5 text-[#2f9e44]" />
                              <span>{soc.email}</span>
                            </a>
                          )}
                          {soc?.linkedin && (
                            <a
                              href={soc.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-1.5 rounded-xl bg-[#18202c] text-gray-300 hover:text-white hover:bg-[#0077b5] transition-colors border border-[#30363d] flex items-center gap-1.5 text-xs font-semibold"
                              title="LinkedIn"
                            >
                              <Linkedin className="w-3.5 h-3.5 text-[#0077b5]" />
                              <span>LinkedIn</span>
                            </a>
                          )}
                          {soc?.github && (
                            <a
                              href={soc.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-1.5 rounded-xl bg-[#18202c] text-gray-300 hover:text-white hover:bg-gray-700 transition-colors border border-[#30363d] flex items-center gap-1.5 text-xs font-semibold"
                              title="GitHub"
                            >
                              <Github className="w-3.5 h-3.5 text-gray-100" />
                              <span>GitHub</span>
                            </a>
                          )}
                          {soc?.instagram && (
                            <a
                              href={soc.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-1.5 rounded-xl bg-[#18202c] text-gray-300 hover:text-white hover:bg-[#e1306c] transition-colors border border-[#30363d] flex items-center gap-1.5 text-xs font-semibold"
                              title="Instagram"
                            >
                              <Instagram className="w-3.5 h-3.5 text-[#e1306c]" />
                              <span>Instagram</span>
                            </a>
                          )}
                        </div>

                        {/* View Profile Button (Gold for Current, Green for Former) */}
                        {profileSlug && (
                          <Link
                            to={`/profile/${profileSlug}`}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-sm flex-shrink-0 group ${
                              isCurrent
                                ? 'bg-[#D4A72C]/15 hover:bg-[#D4A72C] text-[#E6B83F] hover:text-black border border-[#D4A72C]/50 shadow-[#D4A72C]/10'
                                : 'bg-[#2f9e44]/15 hover:bg-[#2f9e44] text-[#2f9e44] hover:text-white border border-[#2f9e44]/40 shadow-[#2f9e44]/10'
                            }`}
                          >
                            <span>View Profile</span>
                            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </Link>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </TechCard>
          </div>
        ) : null}

      </main>
      <Footer />
    </div>
  );
}
