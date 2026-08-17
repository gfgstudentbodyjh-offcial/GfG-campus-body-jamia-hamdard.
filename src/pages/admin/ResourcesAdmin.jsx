import React, { useState, useEffect, useRef } from 'react';
import ContentCrudModule from '../../components/admin/ContentCrudModule';
import api from '../../services/api';
import cacheService from '../../services/cacheService';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { formatEventDate } from '../../utils/dateUtils';
import { Edit3, Trash2, X, Download, FileText, Link as LinkIcon, UploadCloud, Lock, Globe, CheckCircle2, FileCheck, RefreshCw } from 'lucide-react';

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

export default function ResourcesAdmin() {
  const { isLight } = useAdminTheme();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // PDF Upload state: local file + permanent server uploaded object
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadedPdf, setUploadedPdf] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const pdfInputRef = useRef(null);

  const categories = ['All', 'DSA', 'Development', 'Placement', 'Interview', 'Roadmaps', 'Notes', 'Other'];

  const [formData, setFormData] = useState({
    _id: '',
    title: '',
    description: '',
    fileUrl: '',
    publicId: '',
    resourceType: 'PDF',
    category: 'DSA',
    access: 'Public',
    tags: 'DSA, Arrays',
    status: 'Published'
  });

  useEffect(() => {
    loadResources(true);
  }, []);

  const loadResources = async (isInitial = false) => {
    if (isInitial && resources.length === 0) {
      setLoading(true);
    }
    try {
      const res = await api.get('/resources');
      setResources(res.data.data || []);
    } catch (err) {
      console.warn('[ResourcesAdmin] Error loading resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter(r => {
    if (categoryFilter !== 'All' && r.category !== categoryFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (r.title && r.title.toLowerCase().includes(term)) ||
      (r.category && r.category.toLowerCase().includes(term)) ||
      (r.tags && Array.isArray(r.tags) && r.tags.some(t => t.toLowerCase().includes(term)))
    );
  });

  const handleOpenAdd = () => {
    setPdfFile(null);
    setUploadedPdf(null);
    setUploadError('');
    setFormData({
      _id: '',
      title: '',
      description: '',
      fileUrl: '',
      publicId: '',
      resourceType: 'PDF',
      category: 'DSA',
      access: 'Public',
      tags: 'DSA, Arrays',
      status: 'Published'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r) => {
    setPdfFile(null);
    setUploadError('');
    const hasUrl = !!r.fileUrl;
    setUploadedPdf(hasUrl ? { url: r.fileUrl, publicId: r.publicId || '', originalName: r.title || 'Attached PDF Document' } : null);
    setFormData({
      _id: r._id,
      title: r.title || '',
      description: r.description || '',
      fileUrl: r.fileUrl || '',
      publicId: r.publicId || '',
      resourceType: r.resourceType || 'PDF',
      category: r.category || 'DSA',
      access: r.access || 'Public',
      tags: Array.isArray(r.tags) ? r.tags.join(', ') : r.tags || '',
      status: r.status || 'Published'
    });
    setIsModalOpen(true);
  };

  const handlePdfFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file (.pdf format).');
      return;
    }

    setPdfFile(file);
    setUploadingPdf(true);
    setUploadError('');

    const body = new FormData();
    body.append('file', file);
    body.append('folder', 'Resources');

    try {
      // IMPORTANT: Use /media/upload-pdf (resource_type:'raw') NOT /media/upload (resource_type:'auto')
      // Cloudinary with 'auto' classifies PDFs as 'image' and returns image/upload URLs,
      // which cause "Failed to load PDF document" because the browser receives wrong Content-Type.
      // /upload-pdf forces resource_type:'raw' producing raw/upload URLs with Content-Type: application/pdf.
      const res = await api.post('/media/upload-pdf', body, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Extract permanent URL from canonical response shape first
      const media = res.data?.media || res.data?.data;
      const permanentUrl = media?.url || res.data?.url;
      const publicId = media?.publicId || res.data?.publicId || '';
      const fileResourceType = media?.resourceType || 'raw';

      if (!permanentUrl) {
        throw new Error('Server returned no permanent PDF URL');
      }

      // Verify it is a real Cloudinary HTTPS URL (not a blob or localhost path)
      if (permanentUrl.startsWith('blob:') || permanentUrl.startsWith('file:')) {
        throw new Error('Server returned a temporary browser URL. PDF was not uploaded to Cloudinary.');
      }

      const uploadedObj = {
        url: permanentUrl,
        publicId,
        fileResourceType,
        originalName: file.name,
        bytes: file.size
      };

      setUploadedPdf(uploadedObj);
      setFormData(prev => ({
        ...prev,
        fileUrl: permanentUrl,
        publicId
      }));

    } catch (err) {
      console.error('[ResourcesAdmin] PDF Upload Error:', err);
      setUploadedPdf(null);
      setUploadError(err.response?.data?.message || err.message || 'PDF upload failed. Please try again.');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (uploadingPdf) {
      alert('Please wait for the PDF upload to finish before saving.');
      return;
    }

    const currentUrl = uploadedPdf?.url || formData.fileUrl;

    if (formData.resourceType === 'PDF' && !currentUrl) {
      alert('Please upload a PDF file from your device first.');
      return;
    }

    if ((formData.resourceType === 'Link' || formData.resourceType === 'Video') && !currentUrl) {
      alert('Please provide a valid Resource URL.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      fileUrl: currentUrl,
      publicId: uploadedPdf?.publicId || formData.publicId || '',
      fileResourceType: uploadedPdf?.fileResourceType || 'raw',  // stored for correct Cloudinary deletion
      resourceType: formData.resourceType || 'PDF',
      category: formData.category || 'DSA',
      access: formData.access || 'Public',
      status: formData.status || 'Published',
      tags: typeof formData.tags === 'string'
        ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : formData.tags || []
    };

    try {
      if (formData._id) {
        await api.put(`/resources/${formData._id}`, payload);
      } else {
        await api.post('/resources', payload);
      }
      setIsModalOpen(false);
      cacheService.invalidate('resources');
      loadResources();
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete learning resource permanently?')) return;
    try {
      await api.delete(`/resources/${id}`);
      setResources(prev => prev.filter(r => r._id !== id));
      cacheService.invalidate('resources');
    } catch (err) {
      alert('Delete failed');
    }
  };

  const currentFileUrl = uploadedPdf?.url || formData.fileUrl;

  return (
    <div className="space-y-6">
      
      {/* Hidden PDF Upload Input */}
      <input
        type="file"
        ref={pdfInputRef}
        className="hidden"
        accept="application/pdf,.pdf"
        onChange={handlePdfFileChange}
      />

      <ContentCrudModule
        title="Resources Manager"
        subtitle="Manage learning materials, DSA cheat sheets, roadmaps, and interview question vaults for the GFG Campus community."
        items={filteredResources}
        loading={loading}
        onAdd={handleOpenAdd}
        filterOptions={categories}
        activeFilter={categoryFilter}
        onFilterChange={setCategoryFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        storageKey="admin_view_resources"
        gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        columns={['Resource Title', 'Category & Type', 'Access Level', 'Downloads', 'Status', 'Actions']}
        renderRow={(r) => (
          <tr key={r._id} className={`transition-colors ${
            isLight ? 'hover:bg-slate-50/80 border-b border-gray-200' : 'hover:bg-[#0d1117]/60 border-b border-[#30363d]'
          }`}>
            <td className="px-6 py-4">
              <div className="space-y-0.5">
                <p className={`font-bold text-xs sm:text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>{r.title}</p>
                <p className={`text-[10px] max-w-xs truncate ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{r.description}</p>
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#2f9e44] block">{r.category}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-semibold uppercase">
                  {r.resourceType || 'PDF'}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {r.access === 'Members Only' ? (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30 flex items-center gap-1 w-fit">
                  <Lock className="w-3 h-3" /> Members Only
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 flex items-center gap-1 w-fit">
                  <Globe className="w-3 h-3" /> Public
                </span>
              )}
            </td>
            <td className={`px-6 py-4 text-xs font-mono font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{r.downloadsCount || 0}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${
                r.status === 'Published'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-[#2f9e44]/20 dark:text-[#2f9e44] dark:border-[#2f9e44]/30'
                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {r.status || 'Published'}
              </span>
            </td>
            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
              <button
                onClick={() => handleOpenEdit(r)}
                className={`p-2 rounded-lg border transition-colors ${
                  isLight ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' : 'bg-[#21262d] text-gray-300 border-[#30363d] hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(r._id)}
                className={`p-2 rounded-lg border transition-colors ${
                  isLight ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-[#21262d] text-red-400 border-[#30363d] hover:bg-red-500/20'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
        )}
        renderCard={(r) => (
          <div
            key={r._id}
            className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all duration-200 hover:shadow-md ${
              isLight
                ? 'bg-white border-gray-200 hover:border-[#2f9e44]/60 shadow-xs'
                : 'bg-[#121721] border-[#30363d] hover:border-[#2f9e44]/50'
            }`}
          >
            {/* Header: Category, Type & Access badge */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-[#2f9e44] uppercase tracking-wider">
                  {r.category || 'General'}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-bold uppercase">
                    {r.resourceType || 'PDF'}
                  </span>
                  {r.access === 'Members Only' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Members
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Public
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className={`text-base font-extrabold line-clamp-2 leading-snug ${
                  isLight ? 'text-gray-900' : 'text-white'
                }`}>
                  {r.title}
                </h3>
                <p className={`text-xs mt-1.5 line-clamp-3 leading-relaxed ${
                  isLight ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {r.description || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Tags if any */}
            {r.tags && r.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {r.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                      isLight ? 'bg-gray-50 text-gray-600 border-gray-200' : 'bg-[#0d1117] text-gray-400 border-[#30363d]'
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer: Downloads counter, Status badge & Actions */}
            <div className="pt-3 border-t border-gray-200 dark:border-[#30363d]/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                  r.status === 'Published'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-[#2f9e44]/20 dark:text-[#2f9e44] dark:border-[#2f9e44]/30'
                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {r.status || 'Published'}
                </span>
                <span className={`text-[10px] font-mono ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                  📥 {r.downloadsCount || 0}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {r.fileUrl && (
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${
                      isLight ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200' : 'bg-[#21262d] text-gray-300 border-[#30363d] hover:text-white'
                    }`}
                    title="View / Download PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => handleOpenEdit(r)}
                  className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${
                    isLight ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' : 'bg-[#21262d] text-gray-200 border-[#363b42] hover:bg-[#30363d]'
                  }`}
                  title="Edit Resource"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(r._id)}
                  className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${
                    isLight ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-500/20'
                  }`}
                  title="Delete Resource"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      />

      {/* CREATE / EDIT RESOURCE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className={`rounded-2xl border w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl transition-colors ${
            isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#161b22] border-[#30363d] text-white'
          }`}>
            <div className={`flex justify-between items-center border-b pb-4 ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
              <h3 className={`text-lg font-extrabold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {formData._id ? 'Edit Resource' : 'Add New Learning Resource'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className={isLight ? 'text-gray-400 hover:text-gray-700' : 'text-gray-400 hover:text-white'}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-medium">
              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Resource Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete DSA Roadmap 2026"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full rounded-xl px-3 py-2 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Summary of learning material contents..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full rounded-xl p-3 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 border text-xs font-semibold focus:outline-none focus:border-[#2f9e44] ${
                      isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  >
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Resource Type</label>
                  <select
                    value={formData.resourceType}
                    onChange={e => {
                      const newType = e.target.value;
                      setFormData({ ...formData, resourceType: newType });
                      if (newType !== 'PDF') {
                        setPdfFile(null);
                        setUploadedPdf(null);
                      }
                    }}
                    className={`w-full rounded-xl px-3 py-2 border text-xs font-semibold focus:outline-none focus:border-[#2f9e44] ${
                      isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  >
                    <option value="PDF">PDF File</option>
                    <option value="Link">Web Link</option>
                    <option value="Video">Video Link</option>
                    <option value="Document">Document</option>
                  </select>
                </div>
              </div>

              {/* PDF FILE UPLOAD vs EXTERNAL LINK */}
              {formData.resourceType === 'PDF' ? (
                <div className={`p-4 rounded-xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-gray-200' : 'bg-[#0d1117] border-[#30363d]'
                }`}>
                  <label className={`block font-semibold ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                    Upload PDF File from Device
                  </label>

                  {uploadError && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
                      {uploadError}
                    </div>
                  )}

                  {uploadingPdf ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#2f9e44]">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <div className="space-y-0.5">
                        <p className="font-bold text-xs">Uploading PDF to Cloudinary...</p>
                        <p className="text-[10px] text-gray-400">Please wait before publishing</p>
                      </div>
                    </div>
                  ) : currentFileUrl ? (
                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30'
                    }`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileCheck className="w-6 h-6 text-[#2f9e44] flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-[#2f9e44] block truncate">
                            ✓ PDF Uploaded Successfully
                          </span>
                          <span className={`text-[11px] truncate block ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                            {uploadedPdf?.originalName || pdfFile?.name || formData.title || 'Document.pdf'}
                            {pdfFile?.size ? ` (${formatFileSize(pdfFile.size)})` : ''}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition-colors ${
                          isLight ? 'bg-white border-gray-300 text-slate-700 hover:bg-gray-100' : 'bg-[#18202c] border-[#30363d] text-gray-300 hover:text-white'
                        }`}
                      >
                        Change PDF
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl gradient-button text-xs font-bold flex items-center gap-2 shadow-md"
                      >
                        <UploadCloud className="w-4 h-4" /> Select PDF File
                      </button>
                      <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                        Supports PDF up to 20MB
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Resource URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://geeksforgeeks.org/... or https://youtube.com/..."
                    value={formData.fileUrl}
                    onChange={e => setFormData({ ...formData, fileUrl: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                      isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Access Control</label>
                  <select
                    value={formData.access}
                    onChange={e => setFormData({ ...formData, access: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 border text-xs font-semibold focus:outline-none focus:border-[#2f9e44] ${
                      isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  >
                    <option value="Public">Public Access</option>
                    <option value="Members Only">Members Only 🔒</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Publication Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 border text-xs font-semibold focus:outline-none focus:border-[#2f9e44] ${
                      isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="DSA, Arrays, Graphs, System Design"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  className={`w-full rounded-xl px-3 py-2 border text-xs font-medium focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={uploadingPdf}
                className="w-full py-3 rounded-xl gradient-button font-bold text-xs shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploadingPdf ? 'Uploading PDF...' : 'Save Learning Resource'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
