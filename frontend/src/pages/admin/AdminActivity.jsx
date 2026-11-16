import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Server, Database, ArrowLeft, 
  CheckCircle2, AlertCircle, Clock, Search, 
  RefreshCw, KeyRound, UserCheck, Stethoscope,
  ChevronRight, ChevronLeft, Eye, X, Filter, Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const AdminActivity = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All'); // 'All' | 'Verification' | 'Auth' | 'Doctor' | 'Patient'
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchAuditLogs = useCallback(async (pageToLoad = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('dentaai_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const params = new URLSearchParams({
        page: pageToLoad,
        limit: 20,
        search,
        category: categoryFilter
      });

      const res = await fetch(`${API_BASE}/api/admin/audit-logs?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAuditLogs(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchAuditLogs]);

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  const getActionBadge = (action) => {
    switch (action) {
      case 'DOCTOR_APPROVED':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', icon: <CheckCircle2 size={13} />, label: 'Doctor Approved' };
      case 'DOCTOR_REJECTED':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5', icon: <AlertCircle size={13} />, label: 'Doctor Rejected' };
      case 'DOCTOR_UNDER_REVIEW':
        return { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD', icon: <Clock size={13} />, label: 'Under Review' };
      case 'DOCTOR_RESUBMISSION_REQUESTED':
        return { bg: '#FFEDD5', text: '#C2410C', border: '#FDBA74', icon: <Clock size={13} />, label: 'Resubmission Requested' };
      case 'ACCOUNT_BLOCKED':
        return { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', icon: <Ban size={13} />, label: 'Account Suspended' };
      case 'ACCOUNT_ACTIVATED':
        return { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', icon: <UserCheck size={13} />, label: 'Account Activated' };
      case 'CREDENTIAL_VERIFIED':
        return { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', icon: <ShieldCheck size={13} />, label: 'Credential Verified' };
      default:
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', icon: <Clock size={13} />, label: action?.replace(/_/g, ' ') || 'Audit Event' };
    }
  };

  return (
    <div className="screening-history-wrapper" style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 16px 48px' }}>
      <motion.div initial="hidden" animate="show" variants={stagger}>
        
        {/* Navigation Breadcrumb */}
        <motion.div variants={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/dashboard/admin" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
              <ArrowLeft size={16} /> Admin Console
            </Link>
            <span style={{ color: '#CBD5E1' }}>/</span>
            <span style={{ color: '#17324D', fontWeight: 800, fontSize: '0.95rem' }}>Administrative Audit & Activity Trail</span>
          </div>

          <button 
            onClick={() => fetchAuditLogs(pagination.page)} 
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #BFD4E5', padding: '7px 14px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, color: '#17324D', cursor: 'pointer' }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} /> Refresh Logs
          </button>
        </motion.div>

        {/* Title Header Card */}
        <motion.div variants={item} className="screening-header-card admin-dark-header" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #0F2942 0%, #17324D 100%)', color: '#FFFFFF', padding: '28px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', padding: '5px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                <ShieldCheck size={13} color="#38BDF8" /> Immutable Audit Ledger
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '4px 0 6px', color: '#FFFFFF' }}>
                System Activity & Audit Logs
              </h2>
              <p style={{ color: '#93C5FD', margin: 0, fontSize: '0.92rem', maxWidth: '680px' }}>
                Permanent audit trail recording all practitioner approvals, rejections, account suspensions, and administrative actions. Records are immutable and tamper-resistant.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search and Category Filters */}
        <motion.div variants={item} className="card" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid #BFD4E5', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '8px 14px' }}>
              <Search size={16} color="#64748B" />
              <input
                type="text"
                placeholder="Search audit trail by administrator, target, action, or reason..."
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

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['All', 'Verification', 'Auth', 'Doctor', 'Patient', 'Consultation'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setCategoryFilter(tab)}
                  style={{
                    background: categoryFilter === tab ? '#17324D' : '#FFFFFF',
                    color: categoryFilter === tab ? '#FFFFFF' : '#475569',
                    border: categoryFilter === tab ? '1px solid #17324D' : '1px solid #CBD5E1',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
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

        {/* Audit Log Table */}
        <motion.div variants={item} className="card" style={{ padding: '0', borderRadius: '18px', border: '1px solid #BFD4E5', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Action</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Administrator</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Target Entity</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Reason / Notes</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Timestamp</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Dossier</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                      <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 12px', display: 'block', color: '#00A6A6' }} />
                      Loading immutable audit trail from MongoDB...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                      No audit records found matching the active criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const actionBadge = getActionBadge(log.action);
                    return (
                      <tr key={log._id || log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: actionBadge.bg, color: actionBadge.text, border: `1px solid ${actionBadge.border}`, padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                            {actionBadge.icon} {actionBadge.label}
                          </span>
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 700, color: '#17324D', fontSize: '0.9rem' }}>{log.adminName || 'Admin'}</div>
                          {log.adminEmail && <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{log.adminEmail}</div>}
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 700, color: '#17324D', fontSize: '0.88rem' }}>{log.targetName || 'Entity'}</div>
                          <div style={{ fontSize: '0.74rem', color: '#00A6A6', fontWeight: 600 }}>Type: {log.targetType}</div>
                        </td>

                        <td style={{ padding: '16px 20px', maxWidth: '280px' }}>
                          <div style={{ fontSize: '0.82rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.reason || log.details?.notes || 'Standard administrative operation'}
                          </div>
                        </td>

                        <td style={{ padding: '16px 20px', color: '#64748B', fontSize: '0.82rem' }}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recorded'}
                        </td>

                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedLog(log)}
                            style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, color: '#17324D', cursor: 'pointer' }}
                          >
                            <Eye size={13} /> View
                          </button>
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
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} audit records)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchAuditLogs(pagination.page - 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: pagination.page <= 1 ? '#94A3B8' : '#17324D', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchAuditLogs(pagination.page + 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: pagination.page >= pagination.pages ? '#94A3B8' : '#17324D', cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer' }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* AUDIT LOG DETAIL MODAL */}
        <AnimatePresence>
          {selectedLog && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 26, 51, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ width: '100%', maxWidth: '600px', padding: '28px', borderRadius: '22px', position: 'relative' }}>
                <button
                  onClick={() => setSelectedLog(null)}
                  style={{ position: 'absolute', top: '20px', right: '20px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={16} />
                </button>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F0FDFA', color: '#00A6A6', padding: '4px 12px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Audit Event Record
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#17324D', margin: '4px 0 16px' }}>
                  {selectedLog.action?.replace(/_/g, ' ')}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                  <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Administrator</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#17324D', marginTop: '2px' }}>{selectedLog.adminName}</div>
                    {selectedLog.adminEmail && <div style={{ fontSize: '0.76rem', color: '#64748B' }}>{selectedLog.adminEmail}</div>}
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Target Record</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#17324D', marginTop: '2px' }}>{selectedLog.targetName || selectedLog.targetType}</div>
                    <div style={{ fontSize: '0.76rem', color: '#00A6A6', fontWeight: 600 }}>Type: {selectedLog.targetType}</div>
                  </div>
                </div>

                {selectedLog.reason && (
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '18px' }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Reason / Clinical Justification</div>
                    <div style={{ fontSize: '0.88rem', color: '#17324D', marginTop: '4px', fontWeight: 600, lineHeight: 1.5 }}>{selectedLog.reason}</div>
                  </div>
                )}

                {selectedLog.details && (
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>Metadata Details</div>
                    <pre style={{ margin: 0, fontSize: '0.78rem', color: '#334155', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', color: '#94A3B8' }}>
                    Timestamp: {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : 'N/A'}
                  </span>
                  <button
                    onClick={() => setSelectedLog(null)}
                    style={{ background: '#17324D', color: '#FFFFFF', border: 'none', padding: '9px 18px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Close
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

export default AdminActivity;
