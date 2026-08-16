import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAdminTheme } from '../../context/AdminThemeContext';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  UserPlus, 
  KeyRound, 
  ShieldAlert, 
  Copy, 
  Check, 
  AlertTriangle, 
  Lock, 
  UserX, 
  RefreshCw, 
  Eye, 
  Shield, 
  CheckCircle2, 
  X,
  History,
  Trash2,
  Loader2,
  Info
} from 'lucide-react';

export default function AdministratorsAdmin() {
  const { isLight } = useAdminTheme();
  const { adminAccess: currentAdminAccess } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('admins'); // 'admins' | 'logs'
  const [searchTerm, setSearchTerm] = useState('');

  // Grant Admin Modal
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [grantRole, setGrantRole] = useState('ADMIN');
  const [selectedPermissions, setSelectedPermissions] = useState(['manage_members', 'manage_events']);
  const [customPin, setCustomPin] = useState('');
  const [submittingGrant, setSubmittingGrant] = useState(false);
  const [grantError, setGrantError] = useState('');

  // Generated PIN Display Modal (SHOWN ONLY ONCE!)
  const [onceModalOpen, setOnceModalOpen] = useState(false);
  const [oncePin, setOncePin] = useState('');
  const [onceTitle, setOnceTitle] = useState('');
  const [copied, setCopied] = useState(false);

  // Self-Service PIN Change Modal
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [selfPinForm, setSelfPinForm] = useState({ currentPin: '', newPin: '', confirmPin: '' });
  const [selfPinMsg, setSelfPinMsg] = useState({ type: '', text: '' });

  // Audit Log Retention & Cleanup State (Root Super Admin Only)
  const { user } = useAuth();
  const isRootSuperAdmin = currentAdminAccess?.adminRole === 'ROOT_SUPER_ADMIN' || user?.role === 'Super Admin';

  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [retentionSummary, setRetentionSummary] = useState(null);
  const [fetchingRetention, setFetchingRetention] = useState(false);
  const [cleaningUpLogs, setCleaningUpLogs] = useState(false);
  const [toastMessage, setToastMessage] = useState({ show: false, type: 'info', title: '', text: '' });

  const showToast = (type, title, text) => {
    setToastMessage({ show: true, type, title, text });
    setTimeout(() => setToastMessage({ show: false, type: 'info', title: '', text: '' }), 5000);
  };

  const handleCleanOldLogsClick = async () => {
    if (fetchingRetention) return;
    setFetchingRetention(true);
    try {
      const res = await api.get('/admin/audit-logs/retention-summary');
      const summary = res.data;
      setRetentionSummary(summary);

      if (!summary.eligibleForCleanup || summary.eligibleForCleanup === 0) {
        showToast(
          'info',
          'No old logs to clean.',
          `All audit logs are within the ${summary.retentionDays || 30}-day retention period.`
        );
      } else {
        setIsCleanupModalOpen(true);
      }
    } catch (err) {
      showToast('error', 'Cleanup Check Failed', err.response?.data?.message || err.message || 'Failed to fetch retention status.');
    } finally {
      setFetchingRetention(false);
    }
  };

  const handleConfirmCleanup = async () => {
    if (cleaningUpLogs) return;
    setCleaningUpLogs(true);
    try {
      const res = await api.delete('/admin/audit-logs/cleanup');
      if (res.data.success) {
        const count = res.data.deletedCount || 0;
        setIsCleanupModalOpen(false);
        showToast(
          'success',
          'Cleanup Successful',
          `${count} old audit log${count === 1 ? '' : 's'} deleted successfully.`
        );
        loadData(); // Refreshes audit logs list and count immediately
      }
    } catch (err) {
      showToast('error', 'Cleanup Failed', err.response?.data?.message || err.message || 'Failed to delete audit logs.');
    } finally {
      setCleaningUpLogs(false);
    }
  };

  const allPermissions = [
    { id: 'manage_members', label: 'Manage Members & Directory' },
    { id: 'manage_events', label: 'Manage Events & Workshops' },
    { id: 'manage_gallery', label: 'Manage Photo & Video Gallery' },
    { id: 'manage_resources', label: 'Manage Resources & Documents' },
    { id: 'manage_admins', label: 'Manage Administrators & Security' }
  ];

  useEffect(() => {
    loadData(true);
  }, []);

  const loadData = async (isInitial = false) => {
    if (isInitial && admins.length === 0) {
      setLoading(true);
    }
    try {
      const [adminsRes, membersRes, logsRes] = await Promise.all([
        api.get('/admin/administrators').catch(() => ({ data: { data: [] } })),
        api.get('/members').catch(() => ({ data: { data: [] } })),
        api.get('/admin/audit-logs').catch(() => ({ data: { data: [] } }))
      ]);

      setAdmins(adminsRes.data.data || []);
      setMembersList(membersRes.data.data || []);
      setAuditLogs(logsRes.data.data || []);
    } catch (err) {
      console.warn('Failed loading administrators data:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId) => {
    setSelectedPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleGrantAdmin = async (e) => {
    e.preventDefault();
    setSubmittingGrant(true);
    setGrantError('');

    try {
      const res = await api.post('/admin/administrators', {
        email: selectedUserEmail,
        adminRole: grantRole,
        permissions: selectedPermissions,
        customPin: customPin.trim() || undefined
      });

      if (res.data.success) {
        setIsGrantModalOpen(false);
        setOnceTitle(`Administrative Access Granted to ${selectedUserEmail}`);
        setOncePin(res.data.generatedPin);
        setOnceModalOpen(true);
        setSelectedUserEmail('');
        setCustomPin('');
        loadData();
      }
    } catch (err) {
      setGrantError(err.response?.data?.message || 'Failed to grant administrative access.');
    }
    setSubmittingGrant(false);
  };

  const handleResetPin = async (adminObj) => {
    const confirm = window.confirm(`Reset Admin PIN for ${adminObj.userRef?.username || adminObj.userRef?.email}?`);
    if (!confirm) return;

    try {
      const res = await api.post(`/admin/administrators/${adminObj._id}/reset-pin`);
      if (res.data.success) {
        setOnceTitle(`New Admin PIN for ${adminObj.userRef?.username}`);
        setOncePin(res.data.generatedPin);
        setOnceModalOpen(true);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset PIN.');
    }
  };

  const handleToggleSuspend = async (adminObj) => {
    const newStatus = adminObj.status === 'Active' ? 'Suspended' : 'Active';
    try {
      const res = await api.patch(`/admin/administrators/${adminObj._id}`, { status: newStatus });
      if (res.data.success) {
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update admin status.');
    }
  };

  const handleRevoke = async (adminObj) => {
    const confirm = window.confirm(`Revoke administrative access permanently for ${adminObj.userRef?.username}?`);
    if (!confirm) return;

    try {
      const res = await api.delete(`/admin/administrators/${adminObj._id}`);
      if (res.data.success) {
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revoke admin access.');
    }
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(oncePin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelfPinChange = async (e) => {
    e.preventDefault();
    setSelfPinMsg({ type: '', text: '' });

    if (selfPinForm.newPin !== selfPinForm.confirmPin) {
      setSelfPinMsg({ type: 'error', text: 'New PIN and Confirm PIN do not match.' });
      return;
    }

    try {
      const res = await api.patch('/auth/change-admin-pin', selfPinForm);
      if (res.data.success) {
        setSelfPinMsg({ type: 'success', text: '✓ Admin PIN updated successfully.' });
        setSelfPinForm({ currentPin: '', newPin: '', confirmPin: '' });
      }
    } catch (err) {
      setSelfPinMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change PIN.' });
    }
  };

  const filteredAdmins = admins.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.userRef?.username?.toLowerCase().includes(term) ||
      a.userRef?.email?.toLowerCase().includes(term) ||
      a.adminRole?.toLowerCase().includes(term)
    );
  });

  return (
    <div className={`space-y-6 font-sans ${isLight ? 'text-slate-900' : 'text-gray-100'}`}>
      
      {/* Top Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5 ${
        isLight ? 'border-gray-200' : 'border-[#30363d]'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-[#2f9e44] uppercase tracking-wider bg-[#2f9e44]/15 border border-[#2f9e44]/30 px-2 py-0.5 rounded">
              SYSTEM SECURITY
            </span>
          </div>
          <h1 className={`text-2xl font-bold tracking-tight mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Administrators & Security
          </h1>
          <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
            Manage administrative access, individual 6-digit PINs, permissions, and security audit logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsChangePinOpen(true)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
              isLight 
                ? 'bg-white border-gray-300 text-slate-800 hover:bg-gray-50 shadow-sm' 
                : 'bg-[#18202c] border-[#30363d] text-gray-300 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4 text-[#2f9e44]" />
            <span>Change My Admin PIN</span>
          </button>

          <button
            onClick={() => setIsGrantModalOpen(true)}
            className="px-4 py-2 rounded-xl gradient-button text-xs font-bold text-white flex items-center gap-2 shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            <span>Grant Admin Access</span>
          </button>
        </div>
      </div>

      {/* Tabs Control */}
      <div className={`flex items-center gap-2 border-b ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
        <button
          onClick={() => setActiveTab('admins')}
          className={`px-4 py-2.5 text-xs font-mono font-bold transition-colors border-b-2 ${
            activeTab === 'admins'
              ? 'border-[#2f9e44] text-[#2f9e44]'
              : isLight ? 'border-transparent text-slate-600 hover:text-slate-900' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Active Administrators ({admins.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 text-xs font-mono font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'border-[#2f9e44] text-[#2f9e44]'
              : isLight ? 'border-transparent text-slate-600 hover:text-slate-900' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Security Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: ADMINISTRATORS TABLE */}
      {activeTab === 'admins' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <input
              type="text"
              placeholder="Search by name, email, role..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`rounded-xl px-4 py-2 text-xs border focus:outline-none focus:border-[#2f9e44] w-72 ${
                isLight ? 'bg-white border-gray-300 text-slate-900 placeholder-gray-400' : 'bg-[#121721] border-[#30363d] text-white placeholder-gray-500'
              }`}
            />
          </div>

          {loading ? (
            <div className={`text-center py-12 font-mono text-xs ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>Loading administrators data...</div>
          ) : filteredAdmins.length === 0 ? (
            <div className={`text-center py-12 font-mono text-xs ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>No administrators found.</div>
          ) : (
            <div className={`overflow-x-auto rounded-2xl border ${
              isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#121721] border-[#30363d]'
            }`}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[10px] font-mono uppercase ${
                    isLight ? 'border-gray-200 text-slate-600 bg-gray-50' : 'border-[#30363d] text-gray-400 bg-[#0d1117]/60'
                  }`}>
                    <th className="py-3 px-4">Administrator</th>
                    <th className="py-3 px-4">Community Role</th>
                    <th className="py-3 px-4">Admin Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Login</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-xs ${isLight ? 'divide-gray-200' : 'divide-[#30363d]/60'}`}>
                  {filteredAdmins.map((adm) => {
                    const isRoot = adm.adminRole === 'ROOT_SUPER_ADMIN';

                    return (
                      <tr key={adm._id} className={isLight ? 'hover:bg-slate-50 transition-colors' : 'hover:bg-[#18202c]/50 transition-colors'}>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={adm.userRef?.avatar || 'https://ui-avatars.com/api/?name=Admin'}
                              alt=""
                              className={`w-8 h-8 rounded-full object-cover border ${isLight ? 'border-gray-300' : 'border-[#30363d]'}`}
                            />
                            <div>
                              <div className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                <span>{adm.userRef?.username || 'User'}</span>
                                {isRoot && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40">
                                    ROOT
                                  </span>
                                )}
                              </div>
                              <div className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{adm.userRef?.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                            isLight ? 'bg-gray-100 text-slate-700 border-gray-200' : 'bg-[#18202c] text-gray-300 border-[#30363d]'
                          }`}>
                            {adm.userRef?.memberRef?.role || adm.userRef?.role || 'Member'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                            isRoot 
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40' 
                              : adm.adminRole === 'SUPER_ADMIN'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                              : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/40'
                          }`}>
                            {adm.adminRole}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold ${
                            adm.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              adm.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                            }`} />
                            {adm.status}
                          </span>
                        </td>

                        <td className={`py-3.5 px-4 font-mono text-[11px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                          {adm.lastLoginAt ? new Date(adm.lastLoginAt).toLocaleString() : 'Never'}
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleResetPin(adm)}
                            className={`p-1.5 rounded-lg border transition-all inline-flex items-center gap-1 text-[11px] ${
                              isLight ? 'bg-white hover:bg-gray-100 text-slate-800 border-gray-300' : 'bg-[#18202c] hover:bg-[#30363d] text-gray-300 border-[#30363d]'
                            }`}
                            title="Reset 6-digit Admin PIN"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                            <span>Reset PIN</span>
                          </button>

                          {!isRoot && (
                            <button
                              onClick={() => handleToggleSuspend(adm)}
                              className={`p-1.5 rounded-lg text-[11px] font-semibold border transition-all inline-flex items-center gap-1 ${
                                adm.status === 'Active'
                                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 border-rose-500/30'
                                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border-emerald-500/30'
                              }`}
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>{adm.status === 'Active' ? 'Suspend' : 'Unsuspend'}</span>
                            </button>
                          )}

                          {!isRoot && (
                            <button
                              onClick={() => handleRevoke(adm)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 transition-all inline-flex items-center"
                              title="Revoke Access"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-3">
          {/* Action Header with Clean Old Logs button for Root Super Admin */}
          <div className="flex items-center justify-between px-1">
            <div className={`text-xs font-mono font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              Security Audit Event Log History ({auditLogs.length})
            </div>
            {isRootSuperAdmin && (
              <button
                onClick={handleCleanOldLogsClick}
                disabled={fetchingRetention}
                className="px-3.5 py-2 rounded-xl text-xs font-bold font-mono inline-flex items-center gap-2 border bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 transition-all disabled:opacity-50"
                title="Clean logs older than configured retention period (30 days)"
              >
                {fetchingRetention ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                )}
                <span>{fetchingRetention ? 'Checking...' : 'Clean Old Logs'}</span>
              </button>
            )}
          </div>

          <div className={`overflow-x-auto rounded-2xl border ${
            isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#121721] border-[#30363d]'
          }`}>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b text-[10px] font-mono uppercase ${
                  isLight ? 'border-gray-200 text-slate-600 bg-gray-50' : 'border-[#30363d] text-gray-400 bg-[#0d1117]/60'
                }`}>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target User</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono text-[11px] ${isLight ? 'divide-gray-200 text-slate-800' : 'divide-[#30363d]/60'}`}>
                {auditLogs.map((log) => (
                  <tr key={log._id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-[#18202c]/50'}>
                    <td className={`py-3 px-4 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td className={`py-3 px-4 font-bold ${isLight ? 'text-slate-900' : 'text-gray-200'}`}>{log.operatorEmail || 'System'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        log.action.includes('SUCCESS') ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                        log.action.includes('FAILED') ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400' :
                        'bg-blue-500/20 text-blue-700 dark:text-blue-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className={`py-3 px-4 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>{log.targetEmail || 'N/A'}</td>
                    <td className={`py-3 px-4 max-w-xs truncate ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: GRANT ADMIN ACCESS */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative border ${
            isLight ? 'bg-white border-gray-200 text-slate-900' : 'bg-[#121721] border-[#30363d] text-white'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
              <div className={`flex items-center gap-2 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <UserPlus className="w-5 h-5 text-[#2f9e44]" />
                <span>Grant Administrative Access</span>
              </div>
              <button onClick={() => setIsGrantModalOpen(false)} className={isLight ? 'text-gray-400 hover:text-slate-700' : 'text-gray-400 hover:text-white'}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {grantError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-300">
                {grantError}
              </div>
            )}

            <form onSubmit={handleGrantAdmin} className="space-y-4 text-xs">
              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>User Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="Select or enter user email..."
                  value={selectedUserEmail}
                  onChange={e => setSelectedUserEmail(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs border focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>Administrative Role</label>
                <select
                  value={grantRole}
                  onChange={e => setGrantRole(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs border focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                >
                  <option value="ADMIN">ADMIN (Module Limited)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full CMS Access)</option>
                </select>
              </div>

              <div>
                <label className={`block font-semibold mb-2 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>Module Permissions</label>
                <div className="space-y-2">
                  {allPermissions.map(p => (
                    <label key={p.id} className={`flex items-center gap-2.5 cursor-pointer ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(p.id)}
                        onChange={() => togglePermission(p.id)}
                        className="rounded border-gray-300 text-[#2f9e44] focus:ring-0"
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`block font-semibold ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>Admin PIN (Optional)</label>
                  <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>Leave blank to auto-generate 6 digits</span>
                </div>
                <input
                  type="text"
                  maxLength={8}
                  placeholder="Auto-generated if empty"
                  value={customPin}
                  onChange={e => setCustomPin(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-mono border focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGrantModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${
                    isLight ? 'bg-gray-100 text-slate-700 hover:bg-gray-200' : 'bg-[#18202c] text-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGrant}
                  className="px-5 py-2.5 rounded-xl gradient-button text-xs font-bold text-white shadow-lg"
                >
                  {submittingGrant ? 'Granting...' : 'Grant Admin Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GENERATED PIN DISPLAY MODAL (SHOWN ONCE ONLY) */}
      {onceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`border-2 border-[#2f9e44] rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl relative ${
            isLight ? 'bg-white text-slate-900' : 'bg-[#121721] text-white'
          }`}>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#2f9e44]/20 border border-[#2f9e44]/40 text-[#2f9e44]">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{onceTitle}</h3>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Individual Administrative Security Credentials</p>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-gray-200' : 'bg-[#0d1117] border-[#30363d]'
            }`}>
              <span className="text-3xl font-mono font-black text-[#2f9e44] tracking-widest pl-2">
                {oncePin}
              </span>
              <button
                onClick={handleCopyPin}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                  isLight ? 'bg-white border-gray-300 text-slate-700 hover:bg-gray-100' : 'bg-[#18202c] hover:bg-[#30363d] border-[#30363d] text-white'
                }`}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className={`w-4 h-4 ${isLight ? 'text-slate-600' : 'text-gray-300'}`} />}
                <span>{copied ? 'Copied!' : 'Copy PIN'}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">Save/Share this PIN securely!</span>
                <span className="text-[11px] text-amber-700/80 dark:text-amber-300/80">It is encrypted with bcrypt in the database and will NOT be displayed again.</span>
              </div>
            </div>

            <button
              onClick={() => setOnceModalOpen(false)}
              className="w-full py-3 rounded-xl gradient-button text-xs font-bold text-white shadow-lg"
            >
              Done (I Have Saved This PIN)
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: SELF-SERVICE CHANGE PIN */}
      {isChangePinOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative border ${
            isLight ? 'bg-white border-gray-200 text-slate-900' : 'bg-[#121721] border-[#30363d] text-white'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-gray-200' : 'border-[#30363d]'}`}>
              <div className={`flex items-center gap-2 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <KeyRound className="w-5 h-5 text-[#2f9e44]" />
                <span>Change My Admin PIN</span>
              </div>
              <button onClick={() => setIsChangePinOpen(false)} className={isLight ? 'text-gray-400 hover:text-slate-700' : 'text-gray-400 hover:text-white'}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {selfPinMsg.text && (
              <div className={`p-3 rounded-xl text-xs font-medium ${
                selfPinMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300'
              }`}>
                {selfPinMsg.text}
              </div>
            )}

            <form onSubmit={handleSelfPinChange} className="space-y-4 text-xs">
              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>Current Admin PIN</label>
                <input
                  type="password"
                  required
                  maxLength={8}
                  placeholder="• • • • • •"
                  value={selfPinForm.currentPin}
                  onChange={e => setSelfPinForm({ ...selfPinForm, currentPin: e.target.value })}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-mono border focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>New Admin PIN (6 Digits)</label>
                <input
                  type="password"
                  required
                  maxLength={8}
                  placeholder="• • • • • •"
                  value={selfPinForm.newPin}
                  onChange={e => setSelfPinForm({ ...selfPinForm, newPin: e.target.value })}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-mono border focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>Confirm New Admin PIN</label>
                <input
                  type="password"
                  required
                  maxLength={8}
                  placeholder="• • • • • •"
                  value={selfPinForm.confirmPin}
                  onChange={e => setSelfPinForm({ ...selfPinForm, confirmPin: e.target.value })}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-mono border focus:outline-none focus:border-[#2f9e44] ${
                    isLight ? 'bg-white border-gray-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangePinOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${
                    isLight ? 'bg-gray-100 text-slate-700 hover:bg-gray-200' : 'bg-[#18202c] text-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl gradient-button text-xs font-bold text-white shadow-lg"
                >
                  Update PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: AUDIT LOG CLEANUP CONFIRMATION (ROOT SUPER ADMIN ONLY) */}
      {isCleanupModalOpen && retentionSummary && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`border-2 border-rose-500/40 rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl relative ${
            isLight ? 'bg-white text-slate-900' : 'bg-[#121721] text-white'
          }`}>
            <button
              onClick={() => setIsCleanupModalOpen(false)}
              className={`absolute top-4 right-4 ${isLight ? 'text-gray-400 hover:text-slate-700' : 'text-gray-400 hover:text-white'}`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-500">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Delete old audit logs?
              </h3>
              <p className="text-xs font-mono mt-2 text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 py-2.5 px-3 rounded-xl border border-rose-500/20">
                {retentionSummary.eligibleForCleanup} audit log{retentionSummary.eligibleForCleanup === 1 ? '' : 's'} older than {retentionSummary.retentionDays || 30} days will be permanently deleted.
              </p>
              <p className={`text-xs mt-2 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                This action cannot be undone.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCleanupModalOpen(false)}
                disabled={cleaningUpLogs}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${
                  isLight ? 'bg-gray-100 text-slate-700 hover:bg-gray-200' : 'bg-[#18202c] text-gray-300 hover:bg-[#30363d]'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCleanup}
                disabled={cleaningUpLogs}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-xs font-bold text-white shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                {cleaningUpLogs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{cleaningUpLogs ? 'Deleting...' : `Delete ${retentionSummary.eligibleForCleanup} Logs`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION POPUP */}
      {toastMessage.show && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl border shadow-2xl flex items-start gap-3 max-w-sm transition-all font-sans ${
          toastMessage.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' :
          toastMessage.type === 'error' ? 'bg-rose-950/90 border-rose-500/50 text-rose-200' :
          'bg-blue-950/90 border-blue-500/50 text-blue-200'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" /> :
           toastMessage.type === 'error' ? <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" /> :
           <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />}
          <div>
            <div className="font-bold text-xs">{toastMessage.title}</div>
            <div className="text-[11px] mt-0.5 opacity-90">{toastMessage.text}</div>
          </div>
        </div>
      )}

    </div>
  );
}
