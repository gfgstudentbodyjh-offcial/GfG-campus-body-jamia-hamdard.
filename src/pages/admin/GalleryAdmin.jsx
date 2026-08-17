import React, { useState, useEffect, useRef } from 'react';
import ContentCrudModule from '../../components/admin/ContentCrudModule';
import api from '../../services/api';
import cacheService from '../../services/cacheService';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { Edit3, Trash2, Camera, Star, X, UploadCloud, CheckCircle2, Image as ImageIcon, Crop, Loader2 } from 'lucide-react';
import ImageCropModal from '../../components/common/ImageCropModal';

export default function GalleryAdmin() {
  const { isLight } = useAdminTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [albumFilter, setAlbumFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Image Crop State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropSource, setCropSource] = useState(null);
  const [cropBatchIndex, setCropBatchIndex] = useState(null);

  // File Input Ref for native multi-image picker
  const multiFileInputRef = useRef(null);
  const singleFileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [targetAlbum, setTargetAlbum] = useState('Campus Activities');

  const albums = ['All', 'Event Gallery', 'Community Gallery', 'Hackathons', 'Workshops', 'Meetups', 'Campus Activities'];

  const [formData, setFormData] = useState({
    _id: '',
    title: '',
    url: '',
    album: 'Campus Activities',
    category: 'Hackathon',
    isFeatured: true
  });

  useEffect(() => {
    loadItems(true);
  }, []);

  const loadItems = async (isInitial = false) => {
    if (isInitial && items.length === 0) {
      setLoading(true);
    }
    try {
      const res = await api.get('/gallery');
      setItems(res.data.data || []);
    } catch (err) {
      console.warn('[GalleryAdmin] Error loading gallery items:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(g => {
    if (albumFilter !== 'All' && g.album !== albumFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (g.title && g.title.toLowerCase().includes(term)) ||
      (g.album && g.album.toLowerCase().includes(term))
    );
  });

  const handleSinglePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSource(file);
    setCropBatchIndex(null);
    setCropModalOpen(true);
  };

  const handleOpenAdjustCropSingle = () => {
    if (!formData.url) return;
    setCropSource(formData.url);
    setCropBatchIndex(null);
    setCropModalOpen(true);
  };

  const handleOpenAdjustCropBatch = (index) => {
    const item = selectedFiles[index];
    if (!item) return;
    setCropSource(item.file || item.preview);
    setCropBatchIndex(index);
    setCropModalOpen(true);
  };

  const handleApplyCroppedGalleryImage = async ({ croppedFile, croppedUrl }) => {
    if (!croppedFile) return;

    if (cropBatchIndex !== null && cropBatchIndex >= 0) {
      // Update item in batch upload list
      setSelectedFiles(prev => prev.map((item, idx) => {
        if (idx === cropBatchIndex) {
          return {
            ...item,
            file: croppedFile,
            preview: croppedUrl
          };
        }
        return item;
      }));
    } else {
      // Upload single cropped photo to Cloudinary directly
      setIsUploadingPhoto(true);
      try {
        const body = new FormData();
        body.append('file', croppedFile);
        body.append('folder', 'Gallery');

        const res = await api.post('/media/upload', body, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const cloudUrl = res.data?.media?.url || res.data?.data?.url || res.data?.url;
        const cloudPublicId = res.data?.media?.publicId || res.data?.data?.publicId || '';

        if (cloudUrl && cloudUrl.startsWith('http')) {
          setFormData(prev => ({ ...prev, url: cloudUrl, publicId: cloudPublicId }));
        } else {
          throw new Error('Upload failed');
        }
      } catch (err) {
        console.warn('Photo upload error:', err);
        alert('Photo upload failed. Please try again.');
      } finally {
        setIsUploadingPhoto(false);
        if (singleFileInputRef.current) singleFileInputRef.current.value = '';
      }
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      _id: '',
      title: '',
      url: '',
      publicId: '',
      album: 'Campus Activities',
      category: 'Workshops',
      isFeatured: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (g) => {
    setFormData({
      _id: g._id,
      title: g.title || '',
      url: g.url || '',
      publicId: g.publicId || '',
      album: g.album || 'Campus Activities',
      category: g.category || 'Workshops',
      isFeatured: g.isFeatured || false
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formData.url) {
      alert('Please upload a photo from your device or enter an image URL.');
      return;
    }
    try {
      const payload = { ...formData };
      if (!payload._id) delete payload._id;

      if (formData._id) {
        await api.put(`/gallery/${formData._id}`, payload);
      } else {
        await api.post('/gallery', payload);
      }
      setIsModalOpen(false);
      loadItems();
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // Native Multi-File Select Handler
  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    const fileObjects = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    setSelectedFiles(prev => [...prev, ...fileObjects]);
  };

  const handleRemoveFilePreview = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleBatchUploadSubmit = async () => {
    if (selectedFiles.length === 0) return;
    setUploadProgress(true);

    try {
      // 1. Upload files to backend media API
      const uploadedDocs = [];
      let successCount = 0;

      for (const item of selectedFiles) {
        try {
          const body = new FormData();
          body.append('file', item.file);
          body.append('folder', 'Gallery');

          const res = await api.post('/media/upload', body, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          const imgUrl = res.data?.media?.url || res.data?.data?.url || res.data?.url;
          const publicId = res.data?.media?.publicId || res.data?.data?.publicId || '';

          if (imgUrl && imgUrl.startsWith('http')) {
            uploadedDocs.push({
              title: item.name.replace(/\.[^/.]+$/, ''),
              url: imgUrl,
              publicId,
              album: targetAlbum,
              category: 'Community',
              isFeatured: true
            });
            successCount++;
          }
        } catch (fileErr) {
          console.error(`Failed to upload ${item.name}:`, fileErr);
        }
      }

      // 2. Insert batch gallery documents
      if (uploadedDocs.length > 0) {
        await api.post('/gallery/batch', { items: uploadedDocs });
        setIsUploadModalOpen(false);
        setSelectedFiles([]);
        cacheService.invalidate('gallery');
        loadItems();
      } else {
        alert('Batch upload failed. No images were uploaded.');
      }
    } catch (err) {
      alert('Batch upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadProgress(false);
    }
  };

  const handleDelete = async (id) => {
    const isLegacy = typeof id === 'string' && id.startsWith('gal_');
    if (isLegacy) {
      alert('Legacy historical gallery items are protected and cannot be deleted.');
      return;
    }
    if (!window.confirm('Delete gallery photo permanently?')) return;
    try {
      await api.delete(`/gallery/${id}`);
      setItems(prev => prev.filter(g => g._id !== id));
      cacheService.invalidate('gallery');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Native Single-File Picker Hidden */}
      <input
        type="file"
        ref={singleFileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleSinglePhotoUpload}
      />

      {/* Native Multi-File Picker Hidden */}
      <input
        type="file"
        ref={multiFileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFilesSelected}
      />

      {/* Header Bar Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2.5 rounded-xl gradient-button text-xs font-bold flex items-center gap-2 shadow-md"
        >
          <UploadCloud className="w-4 h-4" /> Upload Multiple Photos
        </button>
      </div>

      <ContentCrudModule
        title="Gallery Manager"
        subtitle="Upload multiple photos from your device, organize event memory albums, and manage featured homepage gallery spotlights."
        items={filteredItems}
        loading={loading}
        onAdd={handleOpenAdd}
        filterOptions={albums}
        activeFilter={albumFilter}
        onFilterChange={setAlbumFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        storageKey="admin_view_gallery"
        gridCols="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
        columns={['Media Preview', 'Asset Title', 'Album Category', 'Spotlight Status', 'Actions']}
        renderRow={(g) => (
          <tr key={g._id} className={`transition-colors ${
            isLight ? 'hover:bg-slate-50/80 border-b border-gray-200' : 'hover:bg-[#0d1117]/60 border-b border-[#30363d]'
          }`}>
            <td className="px-6 py-4">
              <img
                src={g.url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80'}
                alt={g.title}
                className="w-16 h-12 rounded-lg object-cover border flex-shrink-0 shadow-xs"
              />
            </td>
            <td className={`px-6 py-4 font-bold text-xs sm:text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>{g.title}</td>
            <td className={`px-6 py-4 text-xs font-mono font-medium ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>{g.album}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              {g.isFeatured ? (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#2f9e44]/20 text-[#2f9e44] border border-[#2f9e44]/30 inline-flex items-center gap-1">
                  <Star className="w-3 h-3 fill-[#2f9e44]" /> Featured Spotlight
                </span>
              ) : (
                <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Standard</span>
              )}
            </td>
            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
              <button
                onClick={() => handleOpenEdit(g)}
                className={`p-2 rounded-lg border transition-colors ${
                  isLight ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' : 'bg-[#21262d] text-gray-300 border-[#30363d] hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(g._id)}
                className={`p-2 rounded-lg border transition-colors ${
                  isLight ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-[#21262d] text-red-400 border-[#30363d] hover:bg-red-500/20'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
        )}
        renderCard={(g) => (
          <div
            key={g._id}
            className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
              isLight
                ? 'bg-white border-gray-200 hover:border-[#2f9e44]/60 shadow-xs'
                : 'bg-[#121721] border-[#30363d] hover:border-[#2f9e44]/50'
            }`}
          >
            {/* Image Preview */}
            <div className="relative aspect-video w-full bg-[#0d1117] overflow-hidden group">
              <img
                src={g.url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80'}
                alt={g.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              {/* Spotlight Badge */}
              {g.isFeatured && (
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2f9e44] text-white shadow-xs inline-flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> Featured
                  </span>
                </div>
              )}
            </div>

            {/* Content Details & Actions */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h4 className={`text-sm font-extrabold line-clamp-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {g.title}
                </h4>
                <p className="text-xs text-[#2f9e44] font-semibold mt-0.5">{g.album}</p>
              </div>

              <div className="pt-2.5 border-t border-gray-200 dark:border-[#30363d]/80 flex items-center justify-end gap-1.5">
                <button
                  onClick={() => handleOpenEdit(g)}
                  className={`p-2 rounded-xl border transition-colors ${
                    isLight ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' : 'bg-[#21262d] text-gray-200 border-[#363b42] hover:bg-[#30363d]'
                  }`}
                  title="Edit Photo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(g._id)}
                  className={`p-2 rounded-xl border transition-colors ${
                    isLight ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-500/20'
                  }`}
                  title="Delete Photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      />

      {/* MULTIPLE PHOTO UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className={`rounded-2xl border w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl transition-colors ${
            isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#161b22] border-[#30363d] text-white'
          }`}>
            <div className={`flex justify-between items-center border-b pb-4 ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
              <div>
                <h3 className={`text-lg font-extrabold ${isLight ? 'text-gray-900' : 'text-white'}`}>Batch Upload Photos</h3>
                <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Select multiple memory photos from your device.</p>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className={isLight ? 'text-gray-400 hover:text-gray-700' : 'text-gray-400 hover:text-white'}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium">
              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Target Album</label>
                <select
                  value={targetAlbum}
                  onChange={e => setTargetAlbum(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 border text-xs font-semibold focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                >
                  {albums.filter(a => a !== 'All').map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              {/* Native Dropzone */}
              <div
                onClick={() => multiFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                  isLight ? 'border-gray-300 bg-slate-50 hover:border-[#2f9e44]' : 'border-[#30363d] bg-[#0d1117] hover:border-[#2f9e44]'
                }`}
              >
                <UploadCloud className="w-10 h-10 text-[#2f9e44] mx-auto mb-2" />
                <p className={`text-xs font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Click to Select Multiple Photos</p>
                <p className={`text-[10px] mt-0.5 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>PNG, JPG, WEBP formats supported</p>
              </div>

              {/* Preview Grid */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <span className={`text-xs font-bold block ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                    Selected Photos ({selectedFiles.length})
                  </span>
                  <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto p-1">
                    {selectedFiles.map((item, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-[#30363d]">
                        <img src={item.preview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          <button
                            type="button"
                            onClick={() => handleOpenAdjustCropBatch(idx)}
                            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold shadow flex items-center gap-1"
                            title="Adjust Framing / Crop"
                          >
                            <Crop className="w-3.5 h-3.5" /> Crop
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFilePreview(idx)}
                            className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold shadow"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={selectedFiles.length === 0 || uploadProgress}
                onClick={handleBatchUploadSubmit}
                className="w-full py-3 rounded-xl gradient-button font-bold text-xs shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploadProgress && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {uploadProgress ? `Uploading ${selectedFiles.length} Photos to Cloudinary...` : `Upload ${selectedFiles.length} Photos to Album`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Single Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className={`rounded-2xl border w-full max-w-lg p-6 space-y-4 shadow-2xl transition-colors ${
            isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#161b22] border-[#30363d] text-white'
          }`}>
            <div className={`flex justify-between items-center border-b pb-4 ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
              <h3 className={`text-lg font-extrabold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {formData._id ? 'Edit Photo Details' : 'Add Single Photo'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className={isLight ? 'text-gray-400 hover:text-gray-700' : 'text-gray-400 hover:text-white'}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs font-medium">
              {/* Photo Upload Area */}
              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                  Gallery Photo <span className="text-red-400">*</span>
                </label>
                {formData.url ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[#30363d] aspect-video group bg-black/40">
                    <img src={formData.url} alt="Gallery Asset" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity p-2">
                      <button
                        type="button"
                        onClick={() => singleFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-[#2f9e44] hover:bg-[#258337] text-white text-xs font-bold shadow flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5" /> Change
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenAdjustCropSingle}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow flex items-center gap-1"
                      >
                        <Crop className="w-3.5 h-3.5" /> Adjust Crop
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, url: '', publicId: '' })}
                        className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => singleFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors ${
                      isLight ? 'border-gray-300 bg-slate-50 hover:border-[#2f9e44]' : 'border-[#30363d] bg-[#0d1117] hover:border-[#2f9e44]'
                    }`}
                  >
                    <Camera className="w-8 h-8 text-[#2f9e44] mx-auto mb-2" />
                    <p className={`text-xs font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      {isUploadingPhoto ? 'Uploading to Cloudinary...' : 'Click to Upload Photo from Device'}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>PNG, JPG, WEBP up to 10MB</p>
                  </div>
                )}
              </div>

              {/* Direct Image URL fallback */}
              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Or Paste Direct Image URL</label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  className={`w-full rounded-xl px-3 py-2 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Asset Caption Title <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. CodeMania Opening Ceremony"
                  className={`w-full rounded-xl px-3 py-2 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Album Category</label>
                <select
                  value={formData.album}
                  onChange={e => setFormData({ ...formData, album: e.target.value })}
                  className={`w-full rounded-xl px-3 py-2 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                >
                  {albums.filter(a => a !== 'All').map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 accent-[#2f9e44]"
                />
                <label htmlFor="isFeatured" className={`font-semibold cursor-pointer ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                  Feature on Public Homepage Showcase
                </label>
              </div>

              <button
                type="submit"
                disabled={isUploadingPhoto || isSaving}
                className="w-full py-3 rounded-xl gradient-button font-bold text-xs shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {(isUploadingPhoto || isSaving) && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isUploadingPhoto ? 'Uploading Photo...' : isSaving ? 'Saving Photo...' : 'Save Photo Details'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Image Crop Modal for Gallery */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={cropSource}
        presetKey="gallery"
        title="Adjust Gallery Photo Framing"
        onClose={() => {
          setCropModalOpen(false);
          setCropSource(null);
          setCropBatchIndex(null);
        }}
        onApplyCrop={handleApplyCroppedGalleryImage}
      />

    </div>
  );
}
