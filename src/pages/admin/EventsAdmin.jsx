import React, { useState, useEffect, useRef } from 'react';
import ContentCrudModule from '../../components/admin/ContentCrudModule';
import api from '../../services/api';
import cacheService from '../../services/cacheService';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { formatEventDate } from '../../utils/dateUtils';
import { Edit3, Trash2, Camera, CheckCircle2, Calendar, Link as LinkIcon, Plus, X, Crop, Loader2 } from 'lucide-react';
import ImageCropModal from '../../components/common/ImageCropModal';

export default function EventsAdmin() {
  const { isLight } = useAdminTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const bannerInputRef = useRef(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSource, setCropImageSource] = useState(null);

  const statuses = ['All', 'Upcoming', 'Registration Open', 'Announced', 'Planning', 'Live', 'Completed', 'Draft', 'Archived'];

  const [formData, setFormData] = useState({
    _id: '',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    venue: '',
    banner: '',
    registrationLink: '',
    status: 'Registration Open'
  });

  useEffect(() => {
    loadData(true);
  }, []);

  const loadData = async (isInitial = false) => {
    if (isInitial && events.length === 0) {
      setLoading(true);
    }
    try {
      const res = await api.get('/events');
      const freshData = res.data.data || [];
      setEvents(freshData);
      cacheService.set('events', freshData);
    } catch (err) {
      console.warn('[EventsAdmin] Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(ev => {
    if (statusFilter !== 'All' && ev.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (ev.title && ev.title.toLowerCase().includes(term)) ||
      (ev.description && ev.description.toLowerCase().includes(term)) ||
      (ev.venue && ev.venue.toLowerCase().includes(term))
    );
  });

  const handleOpenAdd = () => {
    setFormData({
      _id: '',
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      venue: 'Jamia Hamdard Campus',
      banner: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      registrationLink: '',
      status: 'Registration Open'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ev) => {
    let rawDate = '';
    if (ev.date) {
      const parsed = new Date(ev.date);
      if (!isNaN(parsed.getTime())) {
        rawDate = parsed.toISOString().split('T')[0];
      }
    }
    setFormData({
      _id: ev._id,
      title: ev.title || '',
      description: ev.description || '',
      date: rawDate || new Date().toISOString().split('T')[0],
      venue: ev.venue || '',
      banner: ev.banner || '',
      registrationLink: ev.registrationLink || '',
      status: ev.status || 'Registration Open'
    });
    setIsModalOpen(true);
  };

  const handleBannerSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropImageSource(file);
    setCropModalOpen(true);
  };

  const handleOpenAdjustCrop = () => {
    if (!formData.banner) return;
    setCropImageSource(formData.banner);
    setCropModalOpen(true);
  };

  const handleApplyCroppedBanner = async ({ croppedFile }) => {
    if (!croppedFile) return;
    setIsUploadingBanner(true);

    try {
      const body = new FormData();
      body.append('file', croppedFile);
      body.append('folder', 'Events');

      const res = await api.post('/media/upload', body, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const cloudUrl = res.data?.media?.url || res.data?.data?.url || res.data?.url;
      const cloudPublicId = res.data?.media?.publicId || res.data?.data?.publicId || '';

      if (cloudUrl && cloudUrl.startsWith('http')) {
        setFormData(prev => ({ ...prev, banner: cloudUrl, bannerPublicId: cloudPublicId }));
      } else {
        throw new Error('Upload finished but returned invalid URL');
      }
    } catch (err) {
      console.warn('Banner upload error:', err);
      alert('Event thumbnail upload failed. Please try again.');
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const refreshEventData = async () => {
    cacheService.invalidate('events');
    try {
      const res = await api.get('/events');
      const freshData = res.data?.data || [];
      setEvents(freshData);
      cacheService.set('events', freshData);
    } catch (e) {
      console.warn('Failed to refresh event cache:', e);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSaving || isUploadingBanner) return;

    setIsSaving(true);
    try {
      const payload = { ...formData };
      if (!payload._id) delete payload._id;

      if (formData._id) {
        await api.put(`/events/${formData._id}`, payload);
      } else {
        await api.post('/events', payload);
      }
      setIsModalOpen(false);
      await refreshEventData();
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.message || err.response?.data?.error || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkCompleted = async (id) => {
    if (!window.confirm('Mark this event as completed? It will move to past events.')) return;
    try {
      await api.patch(`/events/${id}/complete`);
      await refreshEventData();
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleDelete = async (id) => {
    const isLegacy = typeof id === 'string' && (id.startsWith('evt_up_') || id.startsWith('evt_past_'));
    if (isLegacy) {
      alert('Legacy historical events are protected and cannot be deleted.');
      return;
    }
    if (!window.confirm('Delete event permanently?')) return;
    try {
      await api.delete(`/events/${id}`);
      await refreshEventData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Delete failed');
    }
  };

  const renderStatusBadge = (status) => {
    const st = status || 'Upcoming';
    if (isLight) {
      if (st === 'Completed') return 'bg-slate-100 text-slate-700 border-slate-200';
      if (st === 'Draft') return 'bg-amber-50 text-amber-700 border-amber-200';
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else {
      if (st === 'Completed') return 'bg-gray-800 text-gray-400 border-gray-700';
      if (st === 'Draft') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      return 'bg-[#2f9e44]/20 text-[#2f9e44] border-[#2f9e44]/40';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Hidden File Input */}
      <input
        type="file"
        ref={bannerInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleBannerSelect}
      />

      <ContentCrudModule
        title="Events & Lifecycle Manager"
        subtitle="Create, edit, and mark events as Completed. Upload thumbnails directly from your device."
        items={filteredEvents}
        loading={loading}
        onAdd={handleOpenAdd}
        filterOptions={statuses}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        renderCard={(ev) => {
          const isCompleted = ev.status === 'Completed';

          return (
            <div
              key={ev._id}
              className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                isLight
                  ? 'bg-white border-gray-200 hover:border-[#2f9e44]/60 shadow-xs'
                  : 'bg-[#121721] border-[#30363d] hover:border-[#2f9e44]/50'
              }`}
            >
              {/* Event Thumbnail Banner */}
              <div className="relative h-44 w-full bg-[#0d1117] overflow-hidden group">
                <img
                  src={ev.banner || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80'}
                  alt={ev.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                {/* Floating Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border shadow-md ${renderStatusBadge(ev.status)}`}>
                    {ev.status || 'Upcoming'}
                  </span>
                </div>

                {/* Schedule Date on bottom left */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] font-mono font-bold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                  <Calendar className="w-3.5 h-3.5 text-[#2f9e44]" />
                  <span>{formatEventDate(ev.date)}</span>
                </div>
              </div>

              {/* Event Content Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className={`text-base font-extrabold line-clamp-1 leading-snug ${
                    isLight ? 'text-gray-900' : 'text-white'
                  }`}>
                    {ev.title}
                  </h3>

                  {ev.venue && (
                    <p className={`text-xs mt-1 flex items-center gap-1.5 truncate ${
                      isLight ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      <span className="text-[#2f9e44]">📍</span> {ev.venue}
                    </p>
                  )}

                  <p className={`text-xs mt-2 line-clamp-2 leading-relaxed ${
                    isLight ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {ev.description || 'No event description provided.'}
                  </p>
                </div>

                {/* Action Bar Footer: [Mark Completed] [Edit] [Delete] */}
                <div className="pt-3 border-t border-gray-200 dark:border-[#30363d]/80 flex items-center justify-between gap-2">
                  {!isCompleted ? (
                    <button
                      onClick={() => handleMarkCompleted(ev._id)}
                      className={`py-1.5 px-3 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 transition-all active:scale-95 ${
                        isLight
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-[#2f9e44]/15 text-emerald-400 border-[#2f9e44]/30 hover:bg-[#2f9e44] hover:text-white'
                      }`}
                      title="Mark Event Completed"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Done</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-gray-500 italic">
                      Archived in Past Events
                    </span>
                  )}

                  <div className="flex items-center gap-1.5 ml-auto">
                    {ev.registrationLink && (
                      <a
                        href={ev.registrationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${
                          isLight
                            ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                            : 'bg-[#21262d] text-gray-300 border-[#30363d] hover:text-white'
                        }`}
                        title="Open Registration Link"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      onClick={() => handleOpenEdit(ev)}
                      className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${
                        isLight
                          ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                          : 'bg-[#21262d] text-gray-200 border-[#363b42] hover:bg-[#30363d]'
                      }`}
                      title="Edit Event"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(ev._id)}
                      className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${
                        isLight
                          ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                          : 'bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-500/20'
                      }`}
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      />

      {/* Create / Edit Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`rounded-2xl border w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl transition-colors ${
            isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#161b22] border-[#30363d] text-white'
          }`}>
            
            <div className={`flex justify-between items-center border-b pb-4 ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
              <h3 className={`text-lg font-extrabold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {formData._id ? 'Edit Event Details' : 'Create New Event'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className={`${isLight ? 'text-gray-400 hover:text-gray-700' : 'text-gray-400 hover:text-white'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-medium">
              
              {/* Event Thumbnail Native Device Picker */}
              <div className="space-y-1.5">
                <label className={`block font-semibold ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Event Thumbnail Banner</label>
                <div className={`relative h-36 w-full rounded-xl overflow-hidden border group ${
                  isLight ? 'border-gray-300 bg-gray-50' : 'border-[#30363d] bg-[#0d1117]'
                }`}>
                  {formData.banner ? (
                    <img src={formData.banner} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-mono text-xs">
                      No Thumbnail Selected
                    </div>
                  )}

                  {isUploadingBanner && (
                    <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-xs font-mono text-[#2f9e44] font-bold">
                      Uploading Thumbnail...
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-[#2f9e44] hover:bg-[#258337] text-white font-bold flex items-center gap-1 shadow text-[11px]"
                    >
                      <Camera className="w-3.5 h-3.5" /> {formData.banner ? 'Change' : 'Upload'}
                    </button>
                    {formData.banner && (
                      <button
                        type="button"
                        onClick={handleOpenAdjustCrop}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 shadow text-[11px]"
                      >
                        <Crop className="w-3.5 h-3.5" /> Adjust Crop
                      </button>
                    )}
                    {formData.banner && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, banner: '' }))}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow text-[11px]"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Event Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. AI & Machine Learning Workshop 2026"
                  className={`w-full rounded-xl px-3.5 py-2.5 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Description / Caption</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe event agenda, speakers, and topics..."
                  className={`w-full rounded-xl p-3 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Schedule Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                      isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Venue Location</label>
                  <input
                    type="text"
                    required
                    value={formData.venue}
                    onChange={e => setFormData({ ...formData, venue: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                      isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Google Form / External Registration Link</label>
                <input
                  type="text"
                  value={formData.registrationLink}
                  onChange={e => setFormData({ ...formData, registrationLink: e.target.value })}
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                  className={`w-full rounded-xl px-3 py-2 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className={`w-full rounded-xl px-3 py-2 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                >
                  <option value="Registration Open">Registration Open</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Live">Live</option>
                  <option value="Completed">Completed</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isUploadingBanner || isSaving}
                className={`w-full py-3 rounded-xl gradient-button font-bold text-xs shadow-lg flex items-center justify-center gap-2 ${
                  isUploadingBanner || isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-95'
                }`}
              >
                {(isUploadingBanner || isSaving) && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {isUploadingBanner
                    ? 'Uploading Thumbnail...'
                    : isSaving
                    ? 'Saving Event...'
                    : formData._id
                    ? 'Save Changes'
                    : 'Save Event Record'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={cropImageSource}
        presetKey="eventThumbnail"
        title="Adjust Event Thumbnail (16:9)"
        onClose={() => {
          setCropModalOpen(false);
          setCropImageSource(null);
        }}
        onApplyCrop={handleApplyCroppedBanner}
      />

    </div>
  );
}
