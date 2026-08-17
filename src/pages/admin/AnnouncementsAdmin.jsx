import React, { useState, useEffect } from 'react';
import ContentCrudModule from '../../components/admin/ContentCrudModule';
import api from '../../services/api';
import cacheService from '../../services/cacheService';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { formatEventDate } from '../../utils/dateUtils';
import { Edit3, Trash2, Pin, Bell, ExternalLink, X, Plus } from 'lucide-react';

export default function AnnouncementsAdmin() {
  const { isLight } = useAdminTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    _id: '',
    title: '',
    description: '',
    type: 'Announcement',
    priority: 'Medium',
    linkUrl: '',
    linkLabel: 'Learn More',
    status: 'Published'
  });

  const typesList = ['Announcement', 'Opportunity', 'Event', 'Update', 'Important'];

  useEffect(() => {
    loadAnnouncements(true);
  }, []);

  const loadAnnouncements = async (isInitial = false) => {
    if (isInitial && announcements.length === 0) {
      setLoading(true);
    }
    try {
      const res = await api.get('/announcements', { params: { scope: 'admin' } });
      setAnnouncements(res.data.data || []);
    } catch (err) {
      console.warn('[AnnouncementsAdmin] Error loading announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (a.title && a.title.toLowerCase().includes(term)) ||
      (a.description && a.description.toLowerCase().includes(term)) ||
      (a.type && a.type.toLowerCase().includes(term))
    );
  });

  const handleOpenAdd = () => {
    setFormData({
      _id: '',
      title: '',
      description: '',
      type: 'Announcement',
      priority: 'Medium',
      linkUrl: '',
      linkLabel: 'Learn More',
      status: 'Published'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a) => {
    setFormData({
      _id: a._id,
      title: a.title || '',
      description: a.description || '',
      type: a.type || 'Announcement',
      priority: a.priority || 'Medium',
      linkUrl: a.linkUrl || '',
      linkLabel: a.linkLabel || 'Learn More',
      status: a.status || 'Published'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData._id) {
        const res = await api.put(`/announcements/${formData._id}`, formData);
        const updated = res.data.data;
        setAnnouncements(prev => prev.map(a => a._id === formData._id ? (updated || { ...a, ...formData }) : a));
      } else {
        const res = await api.post('/announcements', formData);
        const created = res.data.data;
        if (created) setAnnouncements(prev => [created, ...prev]);
      }
      setIsModalOpen(false);
      cacheService.invalidate('announcements');
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTogglePin = async (id) => {
    try {
      await api.patch(`/announcements/${id}/pin`);
      setAnnouncements(prev => prev.map(a => {
        if (a._id === id) return { ...a, isPinned: !a.isPinned };
        return a.isPinned ? { ...a, isPinned: false } : a;
      }));
      cacheService.invalidate('announcements');
    } catch (err) {
      alert('Toggle pin failed');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = (currentStatus === 'Published' || currentStatus === 'Active') ? 'Draft' : 'Published';
    try {
      await api.put(`/announcements/${id}`, { status: newStatus });
      setAnnouncements(prev => prev.map(a => a._id === id ? { ...a, status: newStatus } : a));
      cacheService.invalidate('announcements');
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete announcement permanently?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
      cacheService.invalidate('announcements');
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <ContentCrudModule
        title="Latest Announcements & Bulletins"
        subtitle="Manage public announcements, opportunity links, and pinned bulletins."
        items={filteredAnnouncements}
        loading={loading}
        onAdd={handleOpenAdd}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        storageKey="admin_view_announcements"
        gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        columns={['Announcement Headline', 'Type & Link', 'Pin Status', 'Publication Status', 'Actions']}
        renderRow={(a) => (
          <tr key={a._id} className={`transition-colors ${
            isLight ? 'hover:bg-slate-50/80 border-b border-gray-200' : 'hover:bg-[#0d1117]/60 border-b border-[#30363d]'
          }`}>
            <td className="px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  {a.isPinned && <Pin className="w-3.5 h-3.5 text-[#2f9e44] fill-[#2f9e44]" />}
                  <p className={`font-bold text-xs sm:text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>{a.title}</p>
                </div>
                <p className={`text-[10px] max-w-md truncate ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{a.description}</p>
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-sky-600 bg-sky-50 border border-sky-200 uppercase">
                  {a.type || 'Announcement'}
                </span>
                {a.linkUrl && (
                  <p className="text-[10px] text-[#2f9e44] font-mono truncate max-w-xs">
                    {a.linkLabel || 'Link'}: {a.linkUrl}
                  </p>
                )}
              </div>
            </td>
            <td className="px-6 py-4">
              <button
                onClick={() => handleTogglePin(a._id)}
                className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-colors ${
                  a.isPinned
                    ? 'bg-[#2f9e44] text-white shadow-sm'
                    : isLight
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                    : 'bg-[#21262d] text-gray-400 hover:text-white border border-[#30363d]'
                }`}
              >
                <Pin className="w-3 h-3" /> {a.isPinned ? 'Pinned' : 'Pin'}
              </button>
            </td>
            <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
              <button
                onClick={() => handleToggleStatus(a._id, a.status)}
                title="Click to toggle Published / Unpublished"
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                  a.status === 'Published' || a.status === 'Active'
                    ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-[#2f9e44]/20 text-[#2f9e44] border-[#2f9e44]/30 hover:bg-[#2f9e44]/30'
                    : isLight ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' : 'bg-gray-800 text-gray-400 hover:text-white border-gray-700'
                }`}
              >
                {a.status === 'Published' || a.status === 'Active' ? '● Published' : '○ Unpublished (Draft)'}
              </button>
            </td>
            <td className="px-6 py-4 text-right space-x-2">
              <button
                onClick={() => handleOpenEdit(a)}
                className={`p-2 rounded-lg border transition-colors ${
                  isLight ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' : 'bg-[#21262d] text-gray-300 border-[#30363d] hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(a._id)}
                className={`p-2 rounded-lg border transition-colors ${
                  isLight ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-[#21262d] text-red-400 border-[#30363d] hover:bg-red-500/20'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
        )}
        renderCard={(a) => (
          <div
            key={a._id}
            className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all duration-200 hover:shadow-md ${
              isLight
                ? 'bg-white border-gray-200 hover:border-[#2f9e44]/60 shadow-xs'
                : 'bg-[#121721] border-[#30363d] hover:border-[#2f9e44]/50'
            }`}
          >
            {/* Header: Title, Pin Indicator, Type Badge */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-sky-600 bg-sky-50 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30 uppercase">
                    {a.type || 'Announcement'}
                  </span>
                  {a.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30">
                      <Pin className="w-3 h-3 fill-current" /> Pinned
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleTogglePin(a._id)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    a.isPinned
                      ? 'bg-[#2f9e44] text-white'
                      : isLight
                      ? 'bg-gray-100 text-gray-500 hover:text-gray-900 border-gray-200'
                      : 'bg-[#21262d] text-gray-400 hover:text-white border-[#30363d]'
                  }`}
                  title={a.isPinned ? 'Unpin' : 'Pin to top'}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className={`text-base font-extrabold line-clamp-2 leading-snug ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {a.title}
              </h3>

              <p className={`text-xs line-clamp-3 leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                {a.description}
              </p>
            </div>

            {/* Link Preview if exists */}
            {a.linkUrl && (
              <div className={`p-2.5 rounded-xl border text-xs font-mono truncate flex items-center gap-2 ${
                isLight ? 'bg-gray-50 text-gray-700 border-gray-200' : 'bg-[#0d1117] text-gray-300 border-[#30363d]/80'
              }`}>
                <ExternalLink className="w-3.5 h-3.5 text-[#2f9e44] flex-shrink-0" />
                <span className="truncate">{a.linkLabel || 'Link'}: {a.linkUrl}</span>
              </div>
            )}

            {/* Footer: Publication Status & Action Buttons */}
            <div className="pt-3 border-t border-gray-200 dark:border-[#30363d]/80 flex items-center justify-between gap-2">
              <button
                onClick={() => handleToggleStatus(a._id, a.status)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                  a.status === 'Published' || a.status === 'Active'
                    ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-[#2f9e44]/20 text-[#2f9e44] border-[#2f9e44]/30 hover:bg-[#2f9e44]/30'
                    : isLight ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' : 'bg-gray-800 text-gray-400 hover:text-white border-gray-700'
                }`}
              >
                {a.status === 'Published' || a.status === 'Active' ? '● Published' : '○ Draft'}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(a)}
                  className={`p-2 rounded-xl border transition-colors ${
                    isLight ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' : 'bg-[#21262d] text-gray-200 border-[#363b42] hover:bg-[#30363d]'
                  }`}
                  title="Edit Announcement"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(a._id)}
                  className={`p-2 rounded-xl border transition-colors ${
                    isLight ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-500/20'
                  }`}
                  title="Delete Announcement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      />

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`rounded-2xl border w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl transition-colors ${
            isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#161b22] border-[#30363d] text-white'
          }`}>
            <div className={`flex justify-between items-center border-b pb-4 ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
              <h3 className={`text-lg font-extrabold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {formData._id ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className={`${isLight ? 'text-gray-400 hover:text-gray-700' : 'text-gray-400 hover:text-white'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-medium">
              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Headline Title</label>
                <input
                  type="text"
                  required
                  placeholder="🚀 Flagship Campus Hackathon 2026 Announced"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full rounded-xl px-3.5 py-2.5 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Description / Content</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe announcement details, deadlines, or eligibility..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full rounded-xl p-3 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Category Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                      isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  >
                    {typesList.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
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
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Optional Link URL</label>
                  <input
                    type="text"
                    placeholder="https://docs.google.com/forms/..."
                    value={formData.linkUrl}
                    onChange={e => setFormData({ ...formData, linkUrl: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                      isLight ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Link Button Label</label>
                  <input
                    type="text"
                    placeholder="Apply Now / Learn More"
                    value={formData.linkLabel}
                    onChange={e => setFormData({ ...formData, linkLabel: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                      isLight ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-3 rounded-xl gradient-button font-bold text-xs shadow-lg">
                Publish Announcement
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
