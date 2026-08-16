import React, { useState, useEffect } from 'react';
import MediaPicker from '../../components/admin/MediaPicker';
import api from '../../services/api';
import { FolderOpen, UploadCloud, Trash2, Search, ExternalLink } from 'lucide-react';

export default function MediaLibraryAdmin() {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [folder, setFolder] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const folders = ['All', 'Faculty', 'Campus Mantri', 'Members', 'Teams', 'Events', 'Gallery', 'Resources', 'General'];

  useEffect(() => {
    loadAssets(true);
  }, []);

  const loadAssets = async (isInitial = false) => {
    if (isInitial && assets.length === 0) {
      setLoading(true);
    }
    try {
      const res = await api.get('/media');
      setAssets(res.data.data || []);
    } catch (err) {
      console.warn('[MediaLibraryAdmin] Error loading assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter(a => {
    if (folder !== 'All' && a.folder !== folder) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = (a.name || '').toLowerCase().includes(q);
      const matchFolder = (a.folder || '').toLowerCase().includes(q);
      if (!matchName && !matchFolder) return false;
    }
    return true;
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Delete media asset?')) return;
    try {
      await api.delete(`/media/${id}`);
      loadAssets();
    } catch (err) {
      alert('Delete asset failed');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#161b22] border border-[#30363d] p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Cloudinary & Media Asset Hub</h1>
          <p className="text-sm text-gray-400 mt-1">Upload, search, reuse, and organize community images & media assets by folder tags.</p>
        </div>
        <button
          onClick={() => setIsPickerOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-button text-sm font-bold shadow-lg shadow-green-900/20"
        >
          <UploadCloud className="w-4 h-4" /> Open Media Uploader
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto max-w-full pb-1">
          {folders.map(f => (
            <button
              key={f}
              onClick={() => setFolder(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                folder === f
                  ? 'bg-[#2f9e44] text-white'
                  : 'bg-[#161b22] text-gray-400 hover:text-white border border-[#30363d]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search media filename..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2f9e44]"
          />
        </div>
      </div>

      {/* Asset Grid */}
      <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-2xl">
        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading Media Library Assets...</div>
        ) : filteredAssets.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">No media assets stored under "{folder}"</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredAssets.map(item => (
              <div key={item._id} className="group relative rounded-xl overflow-hidden border border-[#30363d] aspect-square bg-[#0d1117]">
                <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                  <span className="text-[10px] text-white font-bold truncate">{item.filename}</span>
                  <span className="text-[9px] text-[#2f9e44] font-semibold">{item.folder}</span>
                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/20">
                    <a href={item.url} target="_blank" rel="noreferrer" className="text-white hover:text-[#2f9e44]">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button onClick={() => handleDelete(item._id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MediaPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectMedia={(url) => loadAssets()}
        currentFolder={folder === 'All' ? 'General' : folder}
      />

    </div>
  );
}
