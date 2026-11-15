import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Stethoscope, ShieldCheck, Search, ArrowLeft, X, 
  CheckCircle2, XCircle, Clock, Award, FileText, 
  Building, Phone, Mail, Activity, AlertTriangle, Users,
  ExternalLink, Check, AlertCircle, RefreshCw, Eye, MapPin,
  ChevronRight, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const AdminDoctors = () => {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'All';

  const [doctors, setDoctors] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    requiresResubmission: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedDoctor, setSelectedDoctor] = useState(null); // Full dossier modal
  const [actionModal, setActionModal] = useState(null); // { doctor, targetStatus }
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('dentaai_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const params = new URLSearchParams({
        search,
        status: statusFilter,
        limit: 50
      });

      const res = await fetch(`${API_BASE}/api/admin/doctors?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setDoctors(data.doctors || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleStatusSubmit = async () => {
    if (!actionModal) return;
    const { doctor, targetStatus } = actionModal;

    if (['Rejected', 'Requires Resubmission'].includes(targetStatus) && !actionReason.trim()) {
      showToast('A clear clinical or regulatory reason must be provided.', 'error');
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('dentaai_token');
      const headers = { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`${API_BASE}/api/admin/doctors/${doctor._id || doctor.id}/verify`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          status: targetStatus,
          reason: actionReason.trim(),
          notes: actionNotes.trim()
        })
      });

      if (res.ok) {
        showToast(`Practitioner status set to ${targetStatus} successfully.`, 'success');
        setActionModal(null);
        setSelectedDoctor(null);
        setActionReason('');
        setActionNotes('');
        await fetchDoctors();
      } else {
        const data = await res.json();
        showToast(`Failed: ${data.message || 'Verification error'}`, 'error');
      }
    } catch (err) {
      console.error("Error updating doctor verification status:", err);
      showToast("Network error updating verification status.", 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'DR';
    const clean = name.replace(/^Dr\.\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', icon: <CheckCircle2 size={13} />, label: 'Verified Dentist' };
      case 'Under Review':
        return { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD', icon: <Activity size={13} />, label: 'Under Review' };
      case 'Pending':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D', icon: <Clock size={13} />, label: 'Pending Review' };
      case 'Rejected':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5', icon: <XCircle size={13} />, label: 'Application Rejected' };
      case 'Requires Resubmission':
        return { bg: '#FFEDD5', text: '#C2410C', border: '#FDBA74', icon: <AlertTriangle size={13} />, label: 'Resubmission Requested' };
      default:
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', icon: <Clock size={13} />, label: status || 'Pending' };
    }
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="screening-history-wrapper" style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 16px 48px' }}>
      <motion.div initial="hidden" animate="show" variants={stagger}>
        
        {/* Toast Alert */}
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
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {toastMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
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
            <span style={{ color: '#17324D', fontWeight: 800, fontSize: '0.95rem' }}>Doctor Verification & Credentialing</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href="https://dciindia.gov.in/DentistCouncil.aspx"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F0FDFA', color: '#0F766E', border: '1px solid #99E3D8', padding: '7px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none' }}
            >
              <ExternalLink size={13} /> Official DCI Register
            </a>
            <button 
              onClick={fetchDoctors} 
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #BFD4E5', padding: '7px 14px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, color: '#17324D', cursor: 'pointer' }}
            >
              <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} /> Refresh
            </button>
          </div>
        </motion.div>

        {/* Title Header Card */}
        <motion.div variants={item} className="screening-header-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #0F2942 0%, #17324D 100%)', color: '#FFFFFF', padding: '28px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', padding: '5px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                <Award size={13} color="#38BDF8" /> Statutory Credential Verification
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '4px 0 6px', color: '#FFFFFF' }}>
                Doctor Management & Credential Verification
              </h2>
              <p style={{ color: '#93C5FD', margin: 0, fontSize: '0.92rem', maxWidth: '680px' }}>
                Review dental degrees, BDS/MDS qualifications, State Dental Council registration numbers, and certificates. Only genuine, verified dentists gain clinical access.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Metrics Row */}
        <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>Total Registered</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#17324D' }}>{metrics.total}</div>
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>All doctor accounts</span>
          </div>

          <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #FCD34D', background: '#FFFBEB' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', marginBottom: '6px' }}>Pending Review</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#B45309' }}>{metrics.pending}</div>
            <span style={{ fontSize: '0.76rem', color: '#92400E', fontWeight: 600 }}>Awaiting verification</span>
          </div>

          <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #93C5FD', background: '#EFF6FF' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase', marginBottom: '6px' }}>Under Review</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#1D4ED8' }}>{metrics.underReview}</div>
            <span style={{ fontSize: '0.76rem', color: '#1E40AF', fontWeight: 600 }}>Council lookup in progress</span>
          </div>

          <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #86EFAC', background: '#F0FDF4' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: '6px' }}>Approved & Active</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#15803D' }}>{metrics.approved}</div>
            <span style={{ fontSize: '0.76rem', color: '#166534', fontWeight: 600 }}>Verified Dentist Badge</span>
          </div>

          <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #FECACA', background: '#FEF2F2' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', marginBottom: '6px' }}>Rejected</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#B91C1C' }}>{metrics.rejected}</div>
            <span style={{ fontSize: '0.76rem', color: '#991B1B', fontWeight: 600 }}>Invalid credentials</span>
          </div>
        </motion.div>

        {/* Search & Status Filter Strip */}
        <motion.div variants={item} className="card" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid #BFD4E5', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '8px 14px' }}>
              <Search size={16} color="#64748B" />
              <input
                type="text"
                placeholder="Search by doctor name, email, dental council number, or clinic..."
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
              {['All', 'Pending', 'Under Review', 'Approved', 'Rejected', 'Requires Resubmission'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  style={{
                    background: statusFilter === tab ? '#17324D' : '#FFFFFF',
                    color: statusFilter === tab ? '#FFFFFF' : '#475569',
                    border: statusFilter === tab ? '1px solid #17324D' : '1px solid #CBD5E1',
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

        {/* Doctor Roster Grid / Cards */}
        <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {isLoading ? (
            <div className="card" style={{ gridColumn: '1 / -1', padding: '48px 20px', textAlign: 'center', color: '#64748B', borderRadius: '16px' }}>
              <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 12px', display: 'block', color: '#00A6A6' }} />
              Loading practitioner credentials from MongoDB...
            </div>
          ) : doctors.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1', padding: '48px 20px', textAlign: 'center', color: '#64748B', borderRadius: '16px' }}>
              No doctor applications found matching the selected filter.
            </div>
          ) : (
            doctors.map(doc => {
              const statusBadge = getStatusBadge(doc.verificationStatus);
              const isApproved = doc.verificationStatus === 'Approved';

              return (
                <div 
                  key={doc._id || doc.id} 
                  className="card" 
                  style={{ 
                    padding: '22px', 
                    borderRadius: '18px', 
                    border: isApproved ? '1px solid #86EFAC' : '1px solid #BFD4E5',
                    background: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 16px rgba(7, 26, 51, 0.04)'
                  }}
                >
                  <div>
                    {/* Header: Photo + Name + Status */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#F0FDFA', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', border: '1px solid #99F6E4', flexShrink: 0 }}>
                          {doc.profileImage ? (
                            <img src={doc.profileImage} alt={doc.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
                          ) : (
                            getInitials(doc.name)
                          )}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: '#17324D', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {doc.name}
                          </h4>
                          <span style={{ fontSize: '0.78rem', color: '#00A6A6', fontWeight: 700 }}>
                            {doc.qualifications || 'BDS'} • {doc.specialization || 'General Dentistry'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Verified Dentist Badge */}
                    <div style={{ marginBottom: '14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: statusBadge.bg, color: statusBadge.text, border: `1px solid ${statusBadge.border}`, padding: '4px 10px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 800 }}>
                        {statusBadge.icon} {statusBadge.label}
                      </span>
                    </div>

                    {/* Metadata Specs */}
                    <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '12px', border: '1px solid #E2E8F0', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>DCI Reg #:</span>
                        <strong style={{ color: '#17324D', fontFamily: 'monospace' }}>{doc.dentalCouncilNumber || 'Not submitted'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>State Council:</span>
                        <strong style={{ color: '#17324D' }}>{doc.stateDentalCouncil || 'State Council Pending'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Clinic:</span>
                        <strong style={{ color: '#17324D' }}>{doc.clinic || 'Private Practice'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Account:</span>
                        <strong style={{ color: doc.accountStatus === 'Blocked' ? '#DC2626' : '#059669' }}>
                          {doc.accountStatus || 'Active'}
                        </strong>
                      </div>
                    </div>

                    {/* Audit note preview if rejected or verified */}
                    {doc.rejectionReason && (
                      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '8px 10px', marginBottom: '14px', fontSize: '0.76rem', color: '#991B1B' }}>
                        <strong>Rejection Reason:</strong> {doc.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      onClick={() => setSelectedDoctor(doc)}
                      style={{ flex: 1, background: '#FFFFFF', border: '1px solid #BFD4E5', padding: '8px 12px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, color: '#17324D', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Eye size={13} /> View Dossier
                    </button>

                    {!isApproved ? (
                      <button
                        onClick={() => {
                          setActionModal({ doctor: doc, targetStatus: 'Approved' });
                          setActionReason('');
                          setActionNotes('');
                        }}
                        style={{ background: '#059669', border: 'none', padding: '8px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Check size={14} /> Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setActionModal({ doctor: doc, targetStatus: 'Under Review' });
                          setActionReason('');
                          setActionNotes('');
                        }}
                        style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '8px 12px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                      >
                        Re-evaluate
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </motion.div>

        {/* FULL DOCTOR CREDENTIAL DOSSIER MODAL */}
        <AnimatePresence>
          {selectedDoctor && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 26, 51, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', borderRadius: '22px', position: 'relative' }}>
                <button
                  onClick={() => setSelectedDoctor(null)}
                  style={{ position: 'absolute', top: '20px', right: '20px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={16} />
                </button>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F0FDFA', color: '#00A6A6', padding: '4px 12px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Practitioner Credential Dossier
                </div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#17324D', margin: '4px 0 16px' }}>
                  {selectedDoctor.name}
                </h3>

                {/* Primary Info Strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Email</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#17324D', marginTop: '2px' }}>{selectedDoctor.email}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Phone</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#17324D', marginTop: '2px' }}>{selectedDoctor.phone || 'Not provided'}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Degree & Qualifications</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#17324D', marginTop: '2px' }}>{selectedDoctor.qualifications || 'BDS'}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Dental Council Number</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#00A6A6', marginTop: '2px', fontFamily: 'monospace' }}>
                      {selectedDoctor.dentalCouncilNumber || 'Awaiting entry'}
                    </div>
                  </div>
                </div>

                {/* Clinic and Address */}
                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Clinic & Location</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#17324D', marginTop: '2px' }}>{selectedDoctor.clinic || 'Practice Clinic'} • {selectedDoctor.location || 'Location Not Specified'}</div>
                  {selectedDoctor.clinicAddress && (
                    <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '4px' }}>{selectedDoctor.clinicAddress}</div>
                  )}
                </div>

                {/* Uploaded Professional Certificates */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#17324D', marginBottom: '10px' }}>
                    Uploaded Professional Certificates & Degrees
                  </div>
                  {(selectedDoctor.certificates || []).length === 0 ? (
                    <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '12px', padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '0.84rem' }}>
                      No digital certificate uploads attached. Verify credentials directly through state council register.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedDoctor.certificates.map((cert, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: '10px' }}>
                          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F766E' }}>{cert.title || `Certificate #${idx + 1}`}</span>
                          <a href={cert.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00A6A6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ExternalLink size={13} /> View Document
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Official Council Verification Cross-Check Helper */}
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E40AF', fontSize: '0.82rem', fontWeight: 800, marginBottom: '4px' }}>
                    <ShieldCheck size={16} /> Official Dental Council Verification Requirement
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#1E3A8A', lineHeight: 1.5 }}>
                    Never treat document uploads alone as verification. Cross-check the practitioner&apos;s registration number (<strong>{selectedDoctor.dentalCouncilNumber || 'N/A'}</strong>) against the Dental Council of India register before finalizing approval.
                  </p>
                  <a
                    href="https://dciindia.gov.in/DentistCouncil.aspx"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: '#2563EB', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none' }}
                  >
                    Open DCI National Dentist Register <ExternalLink size={13} />
                  </a>
                </div>

                {/* Verification History & Audit Trail */}
                {(selectedDoctor.verificationHistory || []).length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#17324D', marginBottom: '8px' }}>
                      Verification Audit Trail
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {selectedDoctor.verificationHistory.map((hist, i) => (
                        <div key={i} style={{ fontSize: '0.78rem', background: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                          <span>
                            <strong>{hist.status}</strong> by {hist.adminName || 'Admin'}
                            {hist.reason && <span style={{ color: '#B91C1C' }}> — {hist.reason}</span>}
                          </span>
                          <span style={{ color: '#94A3B8' }}>{new Date(hist.date).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Workflow Actions */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setActionModal({ doctor: selectedDoctor, targetStatus: 'Requires Resubmission' });
                      setActionReason('');
                      setActionNotes('');
                    }}
                    style={{ background: '#FFF7ED', border: '1px solid #FDBA74', color: '#C2410C', padding: '9px 16px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Request Resubmission
                  </button>

                  <button
                    onClick={() => {
                      setActionModal({ doctor: selectedDoctor, targetStatus: 'Rejected' });
                      setActionReason('');
                      setActionNotes('');
                    }}
                    style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '9px 16px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Reject Application
                  </button>

                  <button
                    onClick={() => {
                      setActionModal({ doctor: selectedDoctor, targetStatus: 'Approved' });
                      setActionReason('');
                      setActionNotes('');
                    }}
                    style={{ background: '#059669', border: 'none', color: '#FFFFFF', padding: '9px 18px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Approve Genuine Credentials
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* DECISION ACTION MODAL (APPROVE / REJECT / RESUBMIT) */}
        <AnimatePresence>
          {actionModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 26, 51, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ width: '100%', maxWidth: '520px', padding: '26px', borderRadius: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#17324D', margin: '0 0 8px' }}>
                  Confirm Verification: {actionModal.targetStatus}
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#64748B', margin: '0 0 16px', lineHeight: 1.5 }}>
                  Setting status for <strong>{actionModal.doctor.name}</strong> to <strong>{actionModal.targetStatus}</strong>.
                </p>

                {['Rejected', 'Requires Resubmission'].includes(actionModal.targetStatus) && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#17324D', marginBottom: '6px' }}>
                      Reason for Decision <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Specify why the application was rejected or what certificates need resubmission..."
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.86rem', color: '#17324D', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#17324D', marginBottom: '6px' }}>
                    Internal Administrative Audit Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="e.g., Verified against DCI Maharashtra state register volume 2024"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.86rem', color: '#17324D', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    onClick={() => setActionModal(null)}
                    disabled={isUpdating}
                    style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '9px 16px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusSubmit}
                    disabled={isUpdating}
                    style={{
                      background: actionModal.targetStatus === 'Approved' ? '#059669' : actionModal.targetStatus === 'Rejected' ? '#DC2626' : '#D97706',
                      border: 'none',
                      color: '#FFFFFF',
                      padding: '9px 20px',
                      borderRadius: '10px',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      cursor: isUpdating ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {isUpdating ? <RefreshCw size={14} className="spin-icon" /> : null}
                    Confirm Status Change
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

export default AdminDoctors;
