import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import api from '../../services/api';
import { MOCK_MANTRI_LIST } from '../../data/leadership';
import { Mail, Linkedin, Github, Instagram, ShieldCheck } from 'lucide-react';
import TechHeader from '../../components/common/TechHeader';
import TechCard from '../../components/common/TechCard';

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

    cacheService.dedupe('mantri', () => api.get('/mantri'))
      .then((res) => {
        const raw = res.data.data?.length ? res.data.data : MOCK_MANTRI_LIST;
        setMantris(raw);
        cacheService.set('mantri', raw);
      })
      .catch((err) => {
        console.warn(err);
        if (mantris.length === 0) setMantris(MOCK_MANTRI_LIST);
      })
      .finally(() => setLoading(false));

    return () => unsub();
  }, []);

  const sortedMantris = useMemo(() => {
    return [...mantris].sort((a, b) => {
      const getStartYear = (item) => {
        const str = item.tenure || item.session || '';
        const match = str.match(/\d{4}/);
        return match ? parseInt(match[0], 10) : 0;
      };
      return getStartYear(b) - getStartYear(a);
    });
  }, [mantris]);

  useEffect(() => {
    if (sortedMantris.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sortedMantris[0]._id);
    }
  }, [sortedMantris, selectedSessionId]);

  const activeMantri = sortedMantris.find((m) => m._id === selectedSessionId) || sortedMantris[0];
  const newestSessionId = sortedMantris[0]?._id;

  return (
    <div className="min-h-screen bg-transparent text-gray-100 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Page Header */}
        <TechHeader
          tag="CAMPUS MANTRI"
          title="Campus Mantri History"
          description="Chronological records of Campus Mantris leading student developer initiatives across academic sessions at Jamia Hamdard."
          count={sortedMantris.length}
          countLabel="Tenure Sessions"
        >
          {/* Segmented Control Session Selector */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2">
            {sortedMantris.map((m) => {
              const isSelected = activeMantri?._id === m._id;
              const isCurrentSession = m._id === newestSessionId;
              const tenureLabel = m.tenure || m.session;

              return (
                <button
                  key={m._id}
                  onClick={() => setSelectedSessionId(m._id)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 flex-shrink-0 ${
                    isSelected
                      ? 'bg-[#2f9e44] text-white shadow-lg shadow-[#2f9e44]/25 border border-[#2f9e44]'
                      : 'bg-[#121721] text-gray-300 border border-[#30363d] hover:border-[#2f9e44]/50'
                  }`}
                >
                  <span>Session {tenureLabel}</span>
                  {isCurrentSession && (
                    <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#2f9e44]/20 text-[#2f9e44] border border-[#2f9e44]/30'
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
              className="p-8 sm:p-10 border-[#2f9e44]/40 bg-gradient-to-br from-[#121721] via-[#0a0d12] to-[#142e16]/30 shadow-2xl space-y-8"
            >
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <img
                  src={activeMantri.photo || activeMantri.memberRef?.photo}
                  alt={`${activeMantri.name || activeMantri.memberRef?.name}, Campus Mantri`}
                  loading="lazy"
                  style={{ objectPosition: activeMantri.imagePosition || 'center top' }}
                  className="w-36 h-40 sm:w-44 sm:h-48 rounded-2xl object-cover border-2 border-[#2f9e44] shadow-xl flex-shrink-0"
                />
                
                <div className="space-y-4 flex-1 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="inline-block text-xs font-mono font-bold text-[#2f9e44] bg-[#2f9e44]/15 border border-[#2f9e44]/30 px-3 py-1 rounded-md uppercase tracking-wider">
                      CAMPUS MANTRI • Session {activeMantri.tenure || activeMantri.session}
                    </span>
                    {activeMantri._id === newestSessionId && (
                      <span className="text-xs font-bold text-white bg-[#2f9e44] px-3 py-1 rounded-md shadow-md flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Current Session
                      </span>
                    )}
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                    {activeMantri.name || activeMantri.memberRef?.name}
                  </h2>

                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed italic bg-[#0a0d12]/80 p-4 rounded-2xl border border-[#30363d]">
                    "{activeMantri.about || activeMantri.memberRef?.bio || activeMantri.memberRef?.about || 'Leading community initiatives and technical growth.'}"
                  </p>

                  {/* Verified Social Links */}
                  {(() => {
                    const soc = activeMantri.socials || activeMantri.memberRef?.socials || {
                      email: activeMantri.memberRef?.email || activeMantri.email,
                      linkedin: activeMantri.memberRef?.linkedin || activeMantri.linkedin,
                      github: activeMantri.memberRef?.github || activeMantri.github,
                      instagram: activeMantri.memberRef?.instagram || activeMantri.instagram
                    };

                    return (
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
                        {soc?.email && (
                          <a
                            href={`mailto:${soc.email}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-xl bg-[#18202c] text-gray-300 hover:text-white hover:bg-[#2f9e44] transition-colors border border-[#30363d] flex items-center gap-2 text-xs font-semibold"
                            title="Email"
                          >
                            <Mail className="w-4 h-4 text-[#2f9e44]" />
                            <span>{soc.email}</span>
                          </a>
                        )}
                        {soc?.linkedin && (
                          <a
                            href={soc.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-xl bg-[#18202c] text-gray-300 hover:text-white hover:bg-[#0077b5] transition-colors border border-[#30363d] flex items-center gap-2 text-xs font-semibold"
                            title="LinkedIn"
                          >
                            <Linkedin className="w-4 h-4 text-[#0077b5]" />
                            <span>LinkedIn</span>
                          </a>
                        )}
                        {soc?.github && (
                          <a
                            href={soc.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-xl bg-[#18202c] text-gray-300 hover:text-white hover:bg-gray-700 transition-colors border border-[#30363d] flex items-center gap-2 text-xs font-semibold"
                            title="GitHub"
                          >
                            <Github className="w-4 h-4 text-gray-100" />
                            <span>GitHub</span>
                          </a>
                        )}
                        {soc?.instagram && (
                          <a
                            href={soc.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-xl bg-[#18202c] text-gray-300 hover:text-white hover:bg-[#e1306c] transition-colors border border-[#30363d] flex items-center gap-2 text-xs font-semibold"
                            title="Instagram"
                          >
                            <Instagram className="w-4 h-4 text-[#e1306c]" />
                            <span>Instagram</span>
                          </a>
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
