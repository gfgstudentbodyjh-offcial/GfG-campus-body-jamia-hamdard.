import React, { useState, useEffect } from 'react';
import ContentCrudModule from '../../components/admin/ContentCrudModule';
import api from '../../services/api';
import { Plus, Trash2, Edit3, Eye, X, FileText, Check } from 'lucide-react';

export default function FormsAdmin() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isSubmissionsOpen, setIsSubmissionsOpen] = useState(false);
  const [activeSubmissions, setActiveSubmissions] = useState(null);

  const [formData, setFormData] = useState({
    _id: '',
    title: '',
    description: '',
    isPublished: true,
    fields: [
      { id: 'f1', label: 'Full Name', type: 'text', placeholder: 'Enter full name', required: true },
      { id: 'f2', label: 'Email Address', type: 'email', placeholder: 'student@jamiahamdard.ac.in', required: true }
    ]
  });

  useEffect(() => {
    loadForms(true);
  }, []);

  const loadForms = async (isInitial = false) => {
    if (isInitial && forms.length === 0) {
      setLoading(true);
    }
    try {
      const res = await api.get('/forms');
      setForms(res.data.data || []);
    } catch (err) {
      console.warn('[FormsAdmin] Error loading forms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      _id: '',
      title: '',
      description: '',
      isPublished: true,
      fields: [
        { id: 'f1', label: 'Full Name', type: 'text', placeholder: 'Enter full name', required: true },
        { id: 'f2', label: 'Email Address', type: 'email', placeholder: 'student@jamiahamdard.ac.in', required: true }
      ]
    });
    setIsBuilderOpen(true);
  };

  const handleOpenEdit = (f) => {
    setFormData({
      _id: f._id,
      title: f.title || '',
      description: f.description || '',
      isPublished: f.isPublished || true,
      fields: f.fields || []
    });
    setIsBuilderOpen(true);
  };

  const handleViewSubmissions = async (formId) => {
    try {
      const res = await api.get(`/forms/${formId}/submissions`);
      setActiveSubmissions(res.data);
      setIsSubmissionsOpen(true);
    } catch (err) {
      alert('Failed loading submissions');
    }
  };

  const addField = () => {
    setFormData(prev => ({
      ...prev,
      fields: [
        ...prev.fields,
        { id: 'f_' + Date.now(), label: 'New Field', type: 'text', placeholder: '', required: false, options: [] }
      ]
    }));
  };

  const removeField = (idx) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== idx)
    }));
  };

  const updateField = (idx, key, val) => {
    setFormData(prev => {
      const updated = [...prev.fields];
      updated[idx][key] = val;
      return { ...prev, fields: updated };
    });
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    try {
      if (formData._id) {
        await api.put(`/forms/${formData._id}`, formData);
      } else {
        await api.post('/forms', formData);
      }
      setIsBuilderOpen(false);
      loadForms();
    } catch (err) {
      alert('Save form failed');
    }
  };

  const handleDeleteForm = async (id) => {
    if (!window.confirm('Delete form and all responses?')) return;
    try {
      await api.delete(`/forms/${id}`);
      loadForms();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <ContentCrudModule
        title="Dynamic Form Builder"
        subtitle="Create event registrations, volunteer applications & custom surveys."
        items={forms}
        loading={loading}
        onAdd={handleOpenAdd}
        columns={['Form Title', 'Submissions Count', 'Publish Status', 'View Submissions']}
        renderRow={(f) => (
          <tr key={f._id} className="hover:bg-[#0d1117]/60 transition-colors">
            <td className="px-6 py-4">
              <div>
                <p className="font-bold text-white text-sm">{f.title}</p>
                <p className="text-[10px] text-gray-400 max-w-xs truncate">{f.description}</p>
              </div>
            </td>
            <td className="px-6 py-4 font-bold text-white text-sm">{f.submissionsCount || 0}</td>
            <td className="px-6 py-4">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                f.isPublished ? 'bg-[#2f9e44]/20 text-[#2f9e44] border border-[#2f9e44]/30' : 'bg-gray-800 text-gray-400'
              }`}>
                {f.isPublished ? 'Published' : 'Draft'}
              </span>
            </td>
            <td className="px-6 py-4">
              <button
                onClick={() => handleViewSubmissions(f._id)}
                className="px-3 py-1.5 rounded-lg bg-[#21262d] text-gray-200 border border-[#30363d] text-xs font-semibold hover:border-[#2f9e44] flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-[#2f9e44]" /> View Submissions
              </button>
            </td>
            <td className="px-6 py-4 text-right space-x-2">
              <button onClick={() => handleOpenEdit(f)} className="p-2 rounded-lg bg-[#21262d] text-gray-300 hover:text-white"><Edit3 className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDeleteForm(f._id)} className="p-2 rounded-lg bg-[#21262d] text-red-400 hover:bg-red-500/20"><Trash2 className="w-3.5 h-3.5" /></button>
            </td>
          </tr>
        )}
      />

      {/* Visual Form Builder Modal */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#30363d] pb-4">
              <h3 className="text-lg font-bold text-white">{formData._id ? 'Edit Dynamic Form' : 'Build Dynamic Form'}</h3>
              <button onClick={() => setIsBuilderOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-6 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Form Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#2f9e44]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Form Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-white focus:outline-none focus:border-[#2f9e44]"
                  />
                </div>
              </div>

              {/* Fields Builder */}
              <div className="space-y-3 border-t border-[#30363d] pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">Form Fields Builder</h4>
                  <button
                    type="button"
                    onClick={addField}
                    className="px-3 py-1.5 rounded-lg bg-[#2f9e44]/20 text-[#2f9e44] border border-[#2f9e44]/30 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Field Input
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.fields.map((fld, idx) => (
                    <div key={fld.id || idx} className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          value={fld.label}
                          onChange={e => updateField(idx, 'label', e.target.value)}
                          placeholder="Field Label (e.g. Phone Number)"
                          className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5 text-white font-semibold focus:outline-none"
                        />
                        <select
                          value={fld.type}
                          onChange={e => updateField(idx, 'type', e.target.value)}
                          className="bg-[#161b22] border border-[#30363d] rounded-lg px-2 py-1.5 text-white focus:outline-none"
                        >
                          <option value="text">Text Input</option>
                          <option value="email">Email</option>
                          <option value="phone">Phone</option>
                          <option value="select">Dropdown Select</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="textarea">Text Area</option>
                          <option value="date">Date</option>
                        </select>
                        <button type="button" onClick={() => removeField(idx)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {fld.type === 'select' && (
                        <div>
                          <label className="block text-[10px] text-gray-400 font-semibold mb-1">Select Options (comma separated)</label>
                          <input
                            type="text"
                            placeholder="Option 1, Option 2, Option 3"
                            value={Array.isArray(fld.options) ? fld.options.join(', ') : fld.options || ''}
                            onChange={e => updateField(idx, 'options', e.target.value.split(',').map(s => s.trim()))}
                            className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5 text-white focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full py-3 rounded-xl gradient-button font-bold text-sm">
                Save & Publish Form Builder
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Viewer Modal */}
      {isSubmissionsOpen && activeSubmissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-3xl p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#30363d] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Form Submissions Response Log</h3>
                <p className="text-xs text-[#2f9e44] font-semibold">{activeSubmissions.formTitle}</p>
              </div>
              <button onClick={() => setIsSubmissionsOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {activeSubmissions.submissions?.length === 0 ? (
              <p className="text-center py-8 text-xs text-gray-500">No submissions recorded yet for this form.</p>
            ) : (
              <div className="space-y-4">
                {activeSubmissions.submissions.map((sub, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs space-y-2">
                    <span className="text-[10px] text-gray-500 font-mono">
                      Submitted: {new Date(sub.submittedAt).toLocaleString()}
                    </span>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#30363d]">
                      {Object.entries(sub.answers || {}).map(([key, val]) => (
                        <div key={key}>
                          <span className="text-gray-400 font-semibold">{key}: </span>
                          <span className="text-white">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
