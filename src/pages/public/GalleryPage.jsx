import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import api from '../../services/api';
import { MOCK_GALLERY } from '../../data/gallery';
import { ArrowUpRight } from 'lucide-react';
import GalleryLightbox from '../../components/common/GalleryLightbox';
import TechHeader from '../../components/common/TechHeader';

import cacheService from '../../services/cacheService';

export default function GalleryPage() {
  const [items, setItems] = useState(() => {
    const cached = cacheService.get('gallery');
    return cached?.data || [];
  });
  const [albumFilter, setAlbumFilter] = useState('All');
  const [loading, setLoading] = useState(() => {
    const cached = cacheService.get('gallery');
    return !(cached && cached.data && cached.data.length > 0);
  });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Album tabs are derived from the gallery data so newly created albums appear automatically.
  // Legacy albums keep their familiar leading position.
  const PINNED_ALBUMS = ['Event Gallery', 'Community Gallery'];
  const dynamicAlbums = Array.from(new Set(items.map((i) => (i.album || '').trim()).filter(Boolean)));
  const albums = [
    'All',
    ...PINNED_ALBUMS,
    ...dynamicAlbums.filter((a) => !PINNED_ALBUMS.includes(a))
  ];

  useEffect(() => {
    const unsub = cacheService.subscribe('gallery', (data) => {
      if (Array.isArray(data)) setItems(data);
    });

    cacheService.dedupe('gallery', () => api.get('/gallery'))
      .then((res) => {
        const data = res.data.data?.length ? res.data.data : MOCK_GALLERY;
        setItems(data);
        cacheService.set('gallery', data);
      })
      .catch((err) => {
        console.warn(err);
        if (items.length === 0) setItems(MOCK_GALLERY);
      })
      .finally(() => setLoading(false));

    return unsub;
  }, []);

  const filteredItems = albumFilter === 'All'
    ? items
    : items.filter((item) => item.album === albumFilter);

  const handleOpenLightbox = (index) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* ─── 1. COMPACT GALLERY HERO ────────────────────────────────────── */}
        <TechHeader
          tag="OUR COMMUNITY"
          title="Moments that define our journey."
          description="Workshops, competitions, collaborations and memories from GeeksforGeeks Campus Body · Jamia Hamdard."
          count={items.length}
          countLabel="Unique Moments"
        />

        {/* ─── 2. STICKY FILTER TABS ──────────────────────────────────────── */}
        <div className="sticky top-[72px] z-40 bg-[#0a0d12]/90 backdrop-blur-md py-3.5 px-2 border-b border-[#30363d]/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            {albums.map((alb) => {
              const count = alb === 'All'
                ? items.length
                : items.filter((i) => i.album === alb).length;

              const active = albumFilter === alb;

              return (
                <button
                  key={alb}
                  onClick={() => {
                    setAlbumFilter(alb);
                    setLightboxOpen(false);
                  }}
                  className={`text-xs sm:text-sm font-semibold transition-all duration-200 py-1.5 relative whitespace-nowrap flex items-center gap-2 ${
                    active
                      ? 'text-white font-bold'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span>{alb}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    active ? 'bg-[#2f9e44] text-white font-bold' : 'bg-[#18202c] text-gray-400 border border-[#30363d]'
                  }`}>
                    {count}
                  </span>
                  {active && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2f9e44] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          <span className="text-xs font-mono text-gray-400 hidden md:inline">
            Showing {filteredItems.length} moments
          </span>
        </div>

        {/* ─── 3. ASYMMETRIC EDITORIAL MASONRY GALLERY ───────────────────── */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 font-mono">Loading Gallery Archive...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-mono">No moments found under "{albumFilter}"</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 auto-rows-[200px]">
            {filteredItems.map((g, idx) => {
              // Editorial Grid Layout Logic
              let spanClass = 'col-span-1 row-span-1';

              if (idx === 0) {
                // Featured Anchor Tile (First Viewport)
                spanClass = 'sm:col-span-2 sm:row-span-2';
              } else if (idx % 7 === 3) {
                // Wide Tile
                spanClass = 'sm:col-span-2 sm:row-span-1';
              } else if (idx % 7 === 5) {
                // Tall Tile
                spanClass = 'sm:col-span-1 sm:row-span-2';
              }

              return (
                <div
                  key={g._id || idx}
                  onClick={() => handleOpenLightbox(idx)}
                  className={`relative rounded-2xl overflow-hidden border border-[#30363d]/80 bg-[#121721] group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-[#2f9e44]/60 shadow-lg tech-corner ${spanClass}`}
                >
                  <img
                    src={g.url}
                    alt={g.title || `Gallery Moment ${idx + 1}`}
                    loading={idx < 6 ? 'eager' : 'lazy'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Editorial Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-extrabold text-[#2f9e44] uppercase tracking-wider block">
                          {g.album || 'Community Gallery'}
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-white truncate">
                          {g.title || `GFG Moment #${idx + 1}`}
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-[#2f9e44] text-white flex-shrink-0 shadow-md">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Lightbox Modal */}
      <GalleryLightbox
        images={filteredItems}
        currentIndex={activeImageIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onPrev={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1))}
        onNext={() => setActiveImageIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0))}
      />

      <Footer />
    </div>
  );
}
