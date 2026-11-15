import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  BrainCircuit, Activity, Search, ArrowLeft, X, 
  Calendar, CheckCircle2, Clock, Sparkles, Filter, 
  Layers, User, Eye, ShieldCheck, AlertCircle, RefreshCw,
  XCircle, ChevronRight, ChevronLeft, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const CONDITION_COLORS = {
  gingivitis: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', dot: '#10B981' },
  caries: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', dot: '#EF4444' },
  calculus: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', dot: '#F59E0B' },
  hypodontia: { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE', dot: '#6366F1' },
  mouth_ulcer: { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8', dot: '#EC4899' },
  'mouth ulcer': { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8', dot: '#EC4899' },
  tooth_discoloration: { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE', dot: '#8B5CF6' },
  'tooth discoloration': { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE', dot: '#8B5CF6' }
};

const AdminPredictions = () => {
  const [scans, setScans] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, pending: 0, verified: 0, rejected: 0, needsRescan: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'Verified' | 'Rejected' | 'Needs Rescan'
  const [selectedScan, setSelectedScan] = useState(null);

  const fetchScans = useCallback(async (pageToLoad = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('dentaai_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const params = new URLSearchParams({
        page: pageToLoad,
        limit: 15,
        search,
        condition: conditionFilter,
        status: statusFilter
      });

      const res = await fetch(`${API_BASE}/api/admin/scans?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setScans(data.scans || []);
        if (data.metrics) setMetrics(data.metrics);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch scans:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, conditionFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchScans(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchScans]);

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Verified':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', icon: <CheckCircle2 size={13} />, label: 'Doctor Verified' };
      case 'Pending':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D', icon: <Clock size={13} />, label: 'Pending Review' };
      case 'Rejected':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5', icon: <XCircle size={13} />, label: 'Diagnosis Rejected' };
      case 'Needs Rescan':
        return { bg: '#FFEDD5', text: '#C2410C', border: '#FDBA74', icon: <AlertCircle size={13} />, label: 'Needs Rescan' };
      default:
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', icon: <Clock size={13} />, label: status || 'Pending' };
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
            <span style={{ color: '#17324D', fontWeight: 800, fontSize: '0.95rem' }}>Dental Scan Management</span>
          </div>

          <button 
            onClick={() => fetchScans(pagination.page)} 
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #BFD4E5', padding: '7px 14px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, color: '#17324D', cursor: 'pointer' }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} /> Refresh Scans
          </button>
        </motion.div>

        {/* Title Header Card */}
        <motion.div variants={item} className="screening-header-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #0F2942 0%, #17324D 100%)', color: '#FFFFFF', padding: '28px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', padding: '5px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                <BrainCircuit size={13} color="#38BDF8" /> AI Inferences & Clinical Triage Log
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '4px 0 6px', color: '#FFFFFF' }}>
                Dental Scan Management
              </h2>
              <p style={{ color: '#93C5FD', margin: 0, fontSize: '0.92rem', maxWidth: '680px' }}>
                Audit oral scans, MobileNetV2 classification scores, and doctor clinical verification assessments.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Strict Medical Disclaimer Notice */}
        <motion.div variants={item} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={20} color="#00A6A6" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
            <strong>Clinical Boundary Advisory:</strong> All deep learning predictions shown are preliminary AI screening indicators. In accordance with medical ethics and regulatory standards, administrative users cannot confirm or override diagnoses. Clinical sign-off is restricted strictly to licensed, verified dentists.
          </div>
        </motion.div>

        {/* Metrics Row */}
        <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>Total Scans</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#17324D' }}>{metrics.total}</div>
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Inferred by MobileNetV2</span>
          </div>

          <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #FCD34D', background: '#FFFBEB' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', marginBottom: '6px' }}>Pending Reviews</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#B45309' }}>{metrics.pending}</div>
            <span style={{ fontSize: '0.76rem', color: '#92400E', fontWeight: 600 }}>Awaiting doctor verification</span>
          </div>

          <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #86EFAC', background: '#F0FDF4' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: '6px' }}>Doctor Verified</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#15803D' }}>{metrics.verified}</div>
            <span style={{ fontSize: '0.76rem', color: '#166534', fontWeight: 600 }}>Clinically authenticated</span>
          </div>

          <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #FECACA', background: '#FEF2F2' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', marginBottom: '6px' }}>Rejected / Needs Rescan</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#B91C1C' }}>{(metrics.rejected || 0) + (metrics.needsRescan || 0)}</div>
            <span style={{ fontSize: '0.76rem', color: '#991B1B', fontWeight: 600 }}>Requires fresh intraoral image</span>
          </div>
        </motion.div>

        {/* Filter and Search */}
        <motion.div variants={item} className="card" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid #BFD4E5', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '8px 14px' }}>
              <Search size={16} color="#64748B" />
              <input
                type="text"
                placeholder="Search by scan ID or condition..."
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

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Condition:</span>
                <select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                  style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px 12px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600, color: '#17324D', outline: 'none' }}
                >
                  <option value="All">All Conditions</option>
                  <option value="Calculus">Calculus</option>
                  <option value="Caries">Caries</option>
                  <option value="Gingivitis">Gingivitis</option>
                  <option value="Hypodontia">Hypodontia</option>
                  <option value="Mouth_Ulcer">Mouth Ulcer</option>
                  <option value="Tooth_Discoloration">Tooth Discoloration</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px 12px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600, color: '#17324D', outline: 'none' }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Verified">Doctor Verified</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Needs Rescan">Needs Rescan</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scans Table */}
        <motion.div variants={item} className="card" style={{ padding: '0', borderRadius: '18px', border: '1px solid #BFD4E5', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Scan Reference</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>AI Predicted Condition</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Confidence</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Verification Status</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Inference Date</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                      <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 12px', display: 'block', color: '#00A6A6' }} />
                      Loading dental scan records from MongoDB...
                    </td>
                  </tr>
                ) : scans.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                      No dental scan records match the current filters.
                    </td>
                  </tr>
                ) : (
                  scans.map(scan => {
                    const condKey = (scan.condition || '').toLowerCase().replace('_', ' ');
                    const colorStyle = CONDITION_COLORS[condKey] || { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
                    const statusBadge = getStatusBadge(scan.status);

                    return (
                      <tr key={scan._id || scan.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#17324D', fontSize: '0.88rem' }}>
                            {scan.scanId || `#${String(scan._id).slice(-8)}`}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                            Patient: {scan.patientId?.name || (typeof scan.patientId === 'string' ? scan.patientId.slice(-6) : 'Intake')}
                          </div>
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: colorStyle.bg, color: colorStyle.text, border: `1px solid ${colorStyle.border}`, padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 800 }}>
                            {scan.condition?.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontWeight: 800, color: '#17324D', fontSize: '0.9rem' }}>
                              {scan.confidence}%
                            </div>
                            <div style={{ width: '48px', height: '6px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ width: `${scan.confidence}%`, height: '100%', background: '#00A6A6', borderRadius: '999px' }} />
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: statusBadge.bg, color: statusBadge.text, border: `1px solid ${statusBadge.border}`, padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                            {statusBadge.icon} {statusBadge.label}
                          </span>
                          {scan.verifiedBy && (
                            <div style={{ fontSize: '0.72rem', color: '#00A6A6', fontWeight: 600, marginTop: '2px' }}>
                              by {scan.verifiedBy.name || 'Doctor'}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '16px 20px', color: '#64748B', fontSize: '0.84rem' }}>
                          {scan.createdAt ? new Date(scan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recorded'}
                        </td>

                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedScan(scan)}
                            style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, color: '#17324D', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={13} /> View Dossier
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
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} scans)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchScans(pagination.page - 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: pagination.page <= 1 ? '#94A3B8' : '#17324D', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchScans(pagination.page + 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: pagination.page >= pagination.pages ? '#94A3B8' : '#17324D', cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer' }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* SCAN DOSSIER MODAL */}
        <AnimatePresence>
          {selectedScan && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 26, 51, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', borderRadius: '22px', position: 'relative' }}>
                <button
                  onClick={() => setSelectedScan(null)}
                  style={{ position: 'absolute', top: '20px', right: '20px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={16} />
                </button>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F0FDFA', color: '#00A6A6', padding: '4px 12px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Intraoral Screening Dossier
                </div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#17324D', margin: '4px 0 16px' }}>
                  {selectedScan.scanId || `#${String(selectedScan._id).slice(-8)}`}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>AI Predicted Condition</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#00A6A6', marginTop: '2px' }}>{selectedScan.condition?.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Confidence: {selectedScan.confidence}%</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Verification Status</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: selectedScan.status === 'Verified' ? '#059669' : '#D97706', marginTop: '2px' }}>
                      {selectedScan.status || 'Pending'}
                    </div>
                    {selectedScan.verifiedBy && (
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>By {selectedScan.verifiedBy.name}</div>
                    )}
                  </div>
                </div>

                {/* Class Probabilities Bar */}
                {selectedScan.classProbabilities && (
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#17324D', marginBottom: '10px' }}>
                      MobileNetV2 Softmax Class Probabilities
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(selectedScan.classProbabilities).map(([cls, prob]) => (
                        <div key={cls}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                            <span style={{ fontWeight: 600, color: '#17324D' }}>{cls.replace('_', ' ')}</span>
                            <span style={{ fontWeight: 800, color: '#64748B' }}>{prob}%</span>
                          </div>
                          <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${prob}%`, height: '100%', background: '#00A6A6', borderRadius: '999px' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                {selectedScan.recommendation && (
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Preliminary Recommendation</div>
                    <div style={{ fontSize: '0.86rem', color: '#334155', marginTop: '4px', lineHeight: 1.5 }}>{selectedScan.recommendation}</div>
                  </div>
                )}

                {/* Doctor Clinical Notes */}
                {selectedScan.doctorNotes && (
                  <div style={{ background: '#F0FDF4', padding: '14px', borderRadius: '12px', border: '1px solid #BBF7D0', marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.74rem', color: '#15803D', fontWeight: 800, textTransform: 'uppercase' }}>Practitioner Assessment Notes</div>
                    <div style={{ fontSize: '0.9rem', color: '#14532D', marginTop: '4px', fontWeight: 600 }}>{selectedScan.doctorNotes}</div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setSelectedScan(null)}
                    style={{ background: '#17324D', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Close Dossier
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

export default AdminPredictions;
