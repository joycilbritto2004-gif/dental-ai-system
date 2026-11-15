import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, UserCheck, ShieldCheck, Search, ArrowLeft, X, 
  Calendar, Mail, Activity, Eye, ChevronRight, ChevronLeft, 
  FileText, Ban, CheckCircle2, Phone, RefreshCw, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const AdminPatients = () => {
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Blocked'
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [confirmStatusModal, setConfirmStatusModal] = useState(null); // { patient, targetStatus }
  const [statusReason, setStatusReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchPatients = useCallback(async (pageToLoad = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('dentaai_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const params = new URLSearchParams({
        page: pageToLoad,
        limit: 15,
        search,
        status: statusFilter
      });

      const res = await fetch(`${API_BASE}/api/admin/patients?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch patients", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchPatients]);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAccountStatusChange = async () => {
    if (!confirmStatusModal) return;
    const { patient, targetStatus } = confirmStatusModal;
    setIsUpdating(true);

    try {
      const token = localStorage.getItem('dentaai_token');
      const headers = { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`${API_BASE}/api/admin/users/${patient._id || patient.id}/account-status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ 
          status: targetStatus,
          reason: statusReason.trim()
        })
      });

      if (res.ok) {
        showToast(`Patient account marked as ${targetStatus}.`, 'success');
        setConfirmStatusModal(null);
        setSelectedPatient(null);
        setStatusReason('');
        await fetchPatients(pagination.page);
      } else {
        const data = await res.json();
        showToast(`Error: ${data.message || 'Failed to update status'}`, 'error');
      }
    } catch (err) {
      console.error("Error updating account status:", err);
      showToast("Network error updating account status.", 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'PT';
    const clean = name.trim();
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="screening-history-wrapper" style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 16px 48px' }}>
      <motion.div initial="hidden" animate="show" variants={stagger}>
        
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                position: 'fixed',
                top: '24px',
                right: '24px',
                zIndex: 2000,
                background: toastMessage.type === 'error' ? '#EF4444' : '#10B981',
                color: '#FFFFFF',
                padding: '12px 22px',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(7, 26, 51, 0.2)',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}
            >
              {toastMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Breadcrumb */}
        <motion.div variants={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/dashboard/admin" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
              <ArrowLeft size={16} /> Admin Console
            </Link>
            <span style={{ color: '#CBD5E1' }}>/</span>
            <span style={{ color: '#17324D', fontWeight: 800, fontSize: '0.95rem' }}>Patient Management</span>
          </div>

          <button 
            onClick={() => fetchPatients(pagination.page)} 
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #BFD4E5', padding: '7px 14px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, color: '#17324D', cursor: 'pointer' }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} /> Refresh Patients
          </button>
        </motion.div>

        {/* Title Header Card */}
        <motion.div variants={item} className="screening-header-card" style={{ marginBottom: '24px' }}>
          <div className="screening-header-stripe"></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div>
              <div className="screening-badge">
                <Users size={14} /> Patient Intake & Registry
              </div>
              <h1 className="screening-title">
                Patient Management
              </h1>
              <p className="screening-subtitle">
                View registered patient profiles, registration dates, diagnostic scan history, appointment activity, and activate or suspend accounts.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search & Status Filter Strip */}
        <motion.div variants={item} className="card" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid #BFD4E5', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '8px 14px' }}>
              <Search size={16} color="#64748B" />
              <input
                type="text"
                placeholder="Search patient by name, email, or phone number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.88rem', color: '#17324D', fontWeight: 500 }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {['All', 'Active', 'Blocked'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  style={{
                    background: statusFilter === tab ? '#17324D' : '#FFFFFF',
                    color: statusFilter === tab ? '#FFFFFF' : '#475569',
                    border: statusFilter === tab ? '1px solid #17324D' : '1px solid #CBD5E1',
                    padding: '7px 16px',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Patients Table Card */}
        <motion.div variants={item} className="card" style={{ padding: '0', borderRadius: '18px', border: '1px solid #BFD4E5', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Patient Name</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Contact Info</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Registration Date</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Scans & Appts</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Account Status</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                      <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 12px', display: 'block', color: '#00A6A6' }} />
                      Loading patient records from MongoDB...
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                      No registered patients found matching the active search.
                    </td>
                  </tr>
                ) : (
                  patients.map((p) => {
                    const isBlocked = p.accountStatus === 'Blocked';
                    return (
                      <tr key={p._id || p.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                              {getInitials(p.name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#17324D', fontSize: '0.92rem' }}>{p.name}</div>
                              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>ID: #{String(p._id).slice(-8)}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontSize: '0.86rem', color: '#17324D', fontWeight: 600 }}>{p.email}</div>
                          <div style={{ fontSize: '0.76rem', color: '#64748B' }}>{p.phone || 'No phone recorded'}</div>
                        </td>

                        <td style={{ padding: '16px 20px', fontSize: '0.84rem', color: '#64748B' }}>
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recorded'}
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span style={{ background: '#F0FDFA', color: '#0F766E', border: '1px solid #99E3D8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700 }}>
                              {p.totalScans || 0} Scans
                            </span>
                            <span style={{ background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700 }}>
                              {p.totalAppointments || 0} Appts
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: isBlocked ? '#FEE2E2' : '#DCFCE7', color: isBlocked ? '#B91C1C' : '#15803D', border: `1px solid ${isBlocked ? '#FCA5A5' : '#86EFAC'}`, padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                            {isBlocked ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                            {isBlocked ? 'Suspended' : 'Active'}
                          </span>
                        </td>

                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => setSelectedPatient(p)}
                              style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, color: '#17324D', cursor: 'pointer' }}
                            >
                              <Eye size={13} /> Details
                            </button>

                            {isBlocked ? (
                              <button
                                onClick={() => setConfirmStatusModal({ patient: p, targetStatus: 'Active' })}
                                style={{ background: '#059669', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, color: '#FFFFFF', cursor: 'pointer' }}
                              >
                                Activate
                              </button>
                            ) : (
                              <button
                                onClick={() => setConfirmStatusModal({ patient: p, targetStatus: 'Blocked' })}
                                style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, color: '#B91C1C', cursor: 'pointer' }}
                              >
                                Block
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} patients)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchPatients(pagination.page - 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: pagination.page <= 1 ? '#94A3B8' : '#17324D', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchPatients(pagination.page + 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: pagination.page >= pagination.pages ? '#94A3B8' : '#17324D', cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer' }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* PATIENT DETAIL MODAL */}
        <AnimatePresence>
          {selectedPatient && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 26, 51, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ width: '100%', maxWidth: '580px', padding: '28px', borderRadius: '22px', position: 'relative' }}>
                <button
                  onClick={() => setSelectedPatient(null)}
                  style={{ position: 'absolute', top: '20px', right: '20px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={16} />
                </button>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EFF6FF', color: '#2563EB', padding: '4px 12px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Patient Identity Dossier
                </div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#17324D', margin: '4px 0 16px' }}>
                  {selectedPatient.name}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Email</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#17324D', marginTop: '2px' }}>{selectedPatient.email}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Phone</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#17324D', marginTop: '2px' }}>{selectedPatient.phone || 'Not recorded'}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Registration Date</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#17324D', marginTop: '2px' }}>
                      {selectedPatient.createdAt ? new Date(selectedPatient.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Account Status</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: selectedPatient.accountStatus === 'Blocked' ? '#DC2626' : '#059669', marginTop: '2px' }}>
                      {selectedPatient.accountStatus || 'Active'}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#F0FDFA', border: '1px solid #99E3D8', borderRadius: '14px', padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F766E' }}>{selectedPatient.totalScans || 0}</div>
                    <div style={{ fontSize: '0.76rem', color: '#0F766E', fontWeight: 700 }}>AI Intraoral Scans</div>
                  </div>
                  <div style={{ width: '1px', background: '#99E3D8' }}></div>
                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F766E' }}>{selectedPatient.totalAppointments || 0}</div>
                    <div style={{ fontSize: '0.76rem', color: '#0F766E', fontWeight: 700 }}>Booked Consultations</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    onClick={() => setSelectedPatient(null)}
                    style={{ background: '#17324D', color: '#FFFFFF', border: 'none', padding: '9px 18px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Close Dossier
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* STATUS CONFIRMATION DIALOG (BLOCK / ACTIVATE) */}
        <AnimatePresence>
          {confirmStatusModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 26, 51, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ width: '100%', maxWidth: '480px', padding: '26px', borderRadius: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#17324D', margin: '0 0 8px' }}>
                  {confirmStatusModal.targetStatus === 'Blocked' ? 'Suspend Patient Account?' : 'Activate Patient Account?'}
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#64748B', margin: '0 0 16px', lineHeight: 1.5 }}>
                  Are you sure you want to mark <strong>{confirmStatusModal.patient.name}</strong> as <strong>{confirmStatusModal.targetStatus}</strong>? Suspended accounts cannot book new consultations or upload diagnostic scans.
                </p>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#17324D', marginBottom: '6px' }}>
                    Reason for Status Action
                  </label>
                  <input
                    type="text"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="e.g., Requested by user or violation of terms"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.86rem', color: '#17324D', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    onClick={() => setConfirmStatusModal(null)}
                    disabled={isUpdating}
                    style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '9px 16px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAccountStatusChange}
                    disabled={isUpdating}
                    style={{
                      background: confirmStatusModal.targetStatus === 'Blocked' ? '#DC2626' : '#059669',
                      border: 'none',
                      color: '#FFFFFF',
                      padding: '9px 20px',
                      borderRadius: '10px',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      cursor: isUpdating ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isUpdating ? 'Saving...' : 'Confirm Action'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};

export default AdminPatients;
