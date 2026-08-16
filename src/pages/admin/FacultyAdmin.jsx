import React, { useState, useEffect } from 'react';
import ContentCrudModule from '../../components/admin/ContentCrudModule';
import api from '../../services/api';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { Edit3, Trash2, X, GraduationCap } from 'lucide-react';

export default function FacultyAdmin() {
  const { isLight } = useAdminTheme();
  const [coordinators, setCoordinators] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    _id: '',
    memberRef: '',
    designation: '',
    department: '',
    displayOrder: 1,
    status: 'Active'
  });

  useEffect(() => {
    loadData(true);
  }, []);

  const loadData = async (isInitial = false) => {
    if (isInitial && coordinators.length === 0) {
      setLoading(true);
    }
    try {
      const [facRes, memRes] = await Promise.all([
        api.get('/faculty'),
        api.get('/members')
      ]);
      setCoordinators(facRes.data.data || []);
      setMembers(memRes.data.data || []);
    } catch (err) {
      console.warn('[FacultyAdmin] Error loading faculty coordinators:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      _id: '',
      memberRef: members[0]?._id || '',
      designation: 'Faculty Advisor',
      department: 'Dept. of Computer Science & Engineering',
      displayOrder: coordinators.length + 1,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f) => {
    setFormData({
      _id: f._id,
      memberRef: f.memberRef?._id || f.memberRef || '',
      designation: f.designation || '',
      department: f.department || '',
      displayOrder: f.displayOrder || 1,
      status: f.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData._id) {
        await api.put(`/faculty/${formData._id}`, formData);
      } else {
        await api.post('/faculty', formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert('Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete faculty coordinator?')) return;
    try {
      await api.delete(`/faculty/${id}`);
      loadData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <ContentCrudModule
        title="Faculty Advisors & Guidance"
        subtitle="Manage mentors and institutional coordinators guiding the GeeksforGeeks Campus Body."
        items={coordinators}
        loading={loading}
        onAdd={handleOpenAdd}
        columns={['Faculty Coordinator', 'Designation', 'Department', 'Status', 'Actions']}
        renderRow={(f) => (
          <tr key={f._id} className={`transition-colors ${isLight ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-[#121721] text-gray-300'}`}>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <img
                  src={f.photo || f.memberRef?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                  alt={f.name || f.memberRef?.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#2f9e44] flex-shrink-0"
                />
                <div>
                  <p className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{f.name || f.memberRef?.name || 'Faculty Member'}</p>
                  <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{f.email || f.memberRef?.email}</p>
                </div>
              </div>
            </td>
            <td className={`px-6 py-4 text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>{f.designation}</td>
            <td className={`px-6 py-4 text-xs ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{f.department || 'Jamia Hamdard'}</td>
            <td className="px-6 py-4">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#2f9e44]/15 text-[#2f9e44] border border-[#2f9e44]/30">
                Active Mentor
              </span>
            </td>
            <td className="px-6 py-4 text-right space-x-2">
              <button
                onClick={() => handleOpenEdit(f)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-gray-300' : 'bg-[#21262d] hover:bg-[#30363d] text-gray-300 border-[#30363d]'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(f._id)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isLight ? 'bg-white hover:bg-red-50 text-red-600 border-red-200' : 'bg-[#21262d] hover:bg-red-500/20 text-red-400 border-[#30363d]'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
        )}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl transition-colors ${
            isLight ? 'bg-white border-gray-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
          }`}>
            <div className={`flex justify-between items-center border-b pb-4 ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
              <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formData._id ? 'Edit Faculty Record' : 'Add Faculty Advisor'}</h3>
              <button onClick={() => setIsModalOpen(false)} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-[#21262d]'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>Select Faculty Profile (Member Ref)</label>
                <select
                  value={formData.memberRef}
                  onChange={e => setFormData({ ...formData, memberRef: e.target.value })}
                  className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-slate-50 border-gray-300 text-slate-900' : 'bg-[#0a0d12] border-[#30363d] text-white'
                  }`}
                >
                  <option value="">Select Member...</option>
                  {members.map(m => <option key={m._id} value={m._id}>{m.name} ({m.email})</option>)}
                </select>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>Academic Designation</label>
                <input
                  type="text"
                  required
                  value={formData.designation}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })}
                  className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-slate-50 border-gray-300 text-slate-900' : 'bg-[#0a0d12] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>Department</label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-slate-50 border-gray-300 text-slate-900' : 'bg-[#0a0d12] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div className={`flex justify-end gap-3 pt-3 border-t ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-xl border transition-colors ${
                    isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-gray-300' : 'bg-[#21262d] text-gray-300 hover:text-white border-[#30363d]'
                  }`}
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#2f9e44] hover:bg-[#288439] text-white font-bold font-mono shadow-md shadow-[#2f9e44]/20">
                  Save Faculty Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
