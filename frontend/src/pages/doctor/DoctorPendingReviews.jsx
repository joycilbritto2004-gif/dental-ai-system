import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCircle, Calendar, Eye, Activity, CheckCircle2, XCircle, X, 
  AlertTriangle, Clock, Sparkles, Search, ShieldCheck, Stethoscope, 
  ArrowRight, Check, LayoutDashboard, Filter, CheckCircle, FileText,
  ChevronRight, Sliders, RefreshCw, AlertCircle
} from 'lucide-react';
import '../Dashboard.css';
import { API_BASE } from '../../config';
import ScanImage from '../../components/ScanImage';

const CONDITIONS = ['All', 'Calculus', 'Caries', 'Gingivitis', 'Hypodontia', 'Mouth Ulcer', 'Tooth Discoloration'];

const DENTAL_CONDITIONS = [
  'Calculus',
  'Caries',
  'Gingivitis',
  'Hypodontia',
  'Mouth_Ulcer',
  'Tooth_Discoloration'
];

const COMMON_SECONDARY_FINDINGS = [
  'Gingival Recession',
  'Cervical Tartar / Plaque',
  'Extrinsic Staining',
  'Enamel Demineralization',
  'Interdental Food Impaction',
  'Mild Halitosis',
  'Localized Mucosal Erythema'
];

const DoctorPendingReviews = () => {
  // Tab toggle: 'scans' (Dental Scans Queue) vs 'consultations' (Appointment Requests)
  const [activeTab, setActiveTab] = useState('scans');

  // Consultation requests state (preserved)
  const [requests, setRequests] = useState([]);
  const [consultationsLoading, setConsultationsLoading] = useState(true);

  // Dental Scans state (Phase 4)
  const [pendingScans, setPendingScans] = useState([]);
  const [scansLoading, setScansLoading] = useState(true);

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Current logged in user / doctor
  const [currentUser, setCurrentUser] = useState(() => {
    const userStr = localStorage.getItem('dentaai_user');
    return userStr ? JSON.parse(userStr) : null;
  });

  // Rejection modal state for consultations (preserved)
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Verification modal state for dental scans (Phase 4)
  const [reviewingScan, setReviewingScan] = useState(null);
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [secondaryFindings, setSecondaryFindings] = useState([]);
  const [customSecondary, setCustomSecondary] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [verificationStatusAction, setVerificationStatusAction] = useState('Verified');
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Fetch current doctor's latest profile verification status
  useEffect(() => {
    const userStr = localStorage.getItem('dentaai_user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    if (user && (user._id || user.id)) {
      fetch(`${API_BASE}/api/doctors/${user._id || user.id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.message && data.verificationStatus) {
            setCurrentUser(prev => ({ ...prev, verificationStatus: data.verificationStatus }));
          }
        })
        .catch(console.error);
    }
  }, []);

  // Fetch pending dental scans from secure backend API
  const fetchPendingScans = async () => {
    setScansLoading(true);
    try {
      const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/api/scans/pending`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPendingScans(Array.isArray(data) ? data : []);
      } else {
        // Fallback endpoint if needed
        const altRes = await fetch(`${API_BASE}/api/ai/pending-reviews`, { headers });
        if (altRes.ok) {
          const altData = await altRes.json();
          setPendingScans(Array.isArray(altData) ? altData : []);
        }
      }
    } catch (err) {
      console.warn("Notice: Live pending scans query unavailable:", err.message);
    } finally {
      setScansLoading(false);
    }
  };

  // Fetch pending consultations (preserved)
  const fetchPendingConsultations = async () => {
    setConsultationsLoading(true);
    try {
      const userStr = localStorage.getItem('dentaai_user');
      let DOCTOR_ID = null;
      if (userStr) {
        const user = JSON.parse(userStr);
        DOCTOR_ID = user._id || user.id;
      }
      const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/api/consultations?doctorId=${DOCTOR_ID}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch consultations');
      const stored = await res.json();
      const myPending = stored.filter(c => c.status === "Pending" || c.status === "Booked");
      myPending.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setRequests(myPending);
    } catch (e) {
      console.error("Error loading pending consultations:", e);
    } finally {
      setConsultationsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingScans();
    fetchPendingConsultations();
  }, []);

  // Open the Clinical Verification Modal for a selected scan
  const openReviewModal = (scan) => {
    setReviewingScan(scan);
    setFinalDiagnosis(scan.condition || scan.predictedCondition || 'Calculus');
    setSecondaryFindings(Array.isArray(scan.secondaryFindings) ? scan.secondaryFindings : []);
    setCustomSecondary('');
    setDoctorNotes(scan.doctorNotes || '');
    setTreatmentPlan(scan.treatmentPlan || '');
    setVerificationStatusAction('Verified');
    setVerificationError(null);
  };

  const closeReviewModal = () => {
    setReviewingScan(null);
    setVerificationError(null);
  };

  // Submit doctor clinical assessment via secure verification API
  const handleFinalizeVerification = async () => {
    if (!reviewingScan) return;

    if (currentUser?.verificationStatus !== 'Approved') {
      setVerificationError('Your doctor account is pending administrative approval. You cannot clinically verify scans yet.');
      return;
    }

    if (!finalDiagnosis || !finalDiagnosis.trim()) {
      setVerificationError('Please select a final clinical diagnosis.');
      return;
    }

    setIsSubmittingVerification(true);
    setVerificationError(null);

    const targetId = reviewingScan._id || reviewingScan.scanId;

    try {
      const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const payload = {
        finalDiagnosis: finalDiagnosis.trim(),
        secondaryFindings: secondaryFindings,
        doctorNotes: doctorNotes.trim(),
        treatmentPlan: treatmentPlan.trim(),
        status: verificationStatusAction,
      };

      const res = await fetch(`${API_BASE}/api/scans/verify/${targetId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Verification submission failed');
      }

      // Success: Remove verified scan from pending list immediately
      setPendingScans(prev => prev.filter(s => (s._id !== targetId && s.scanId !== targetId)));

      const wasOverridden = (finalDiagnosis.toLowerCase() !== (reviewingScan.condition || '').toLowerCase());
      setSuccessToast({
        title: wasOverridden ? 'Clinical Override Finalized' : 'AI Diagnosis Confirmed',
        message: `Case ${reviewingScan.scanId || ''} finalized as ${finalDiagnosis}. Assessment saved to clinical history.`,
      });

      setTimeout(() => setSuccessToast(null), 6000);
      closeReviewModal();
    } catch (err) {
      console.error('Clinical verification error:', err);
      setVerificationError(err.message || 'Network error verifying scan. Please check your connection.');
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  // Consultation accept handler (preserved)
  const handleAccept = async (reqId) => {
    if (currentUser?.verificationStatus !== 'Approved') {
      alert('Your account is pending approval. You cannot accept new consultations yet.');
      return;
    }
    setActionLoadingId(reqId);
    try {
      const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch(`${API_BASE}/api/consultations/${reqId}/accept`, {
        method: 'PUT',
        headers
      });
      if (!res.ok) throw new Error('Failed to accept consultation');
      setRequests(prev => prev.filter(r => (r.id !== reqId && r._id !== reqId)));
    } catch (e) {
      console.error(e);
      alert('Failed to accept consultation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Consultation decline handler (preserved)
  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    const targetId = rejectingItem.id || rejectingItem._id;
    setIsRejecting(true);
    try {
      const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch(`${API_BASE}/api/consultations/${targetId}/reject`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ reason: rejectionReason.trim() })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to reject consultation');
      }
      setRequests(prev => prev.filter(r => (r.id !== targetId && r._id !== targetId)));
      setRejectingItem(null);
      setRejectionReason('');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to decline consultation.');
    } finally {
      setIsRejecting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'PT';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatDateTime = (item) => {
    const rawDate = item.date || item.createdAt;
    if (rawDate) {
      const d = new Date(rawDate);
      return !isNaN(d.getTime()) 
        ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Recent';
    }
    return 'Recent';
  };

  // Filtered scans
  const filteredScans = useMemo(() => {
    return pendingScans.filter(scan => {
      const pName = (scan.patientId?.name || scan.patientName || '').toLowerCase();
      const cond = (scan.condition || scan.predictedCondition || '').toLowerCase();
      const idStr = (scan.scanId || scan._id || '').toLowerCase();
      const query = searchTerm.toLowerCase().trim();

      const matchesSearch = !query || pName.includes(query) || cond.includes(query) || idStr.includes(query);
      const matchesCondition = conditionFilter === 'All' || cond.includes(conditionFilter.toLowerCase().replace(/\s+/g, '_'));

      return matchesSearch && matchesCondition;
    });
  }, [pendingScans, searchTerm, conditionFilter]);

  // Filtered consultation requests
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const pName = (req.patientName || '').toLowerCase();
      const cond = (req.scanId?.condition || req.condition || '').toLowerCase();
      const idStr = (req.id || req._id || '').toLowerCase();
      const query = searchTerm.toLowerCase().trim();

      const matchesSearch = !query || pName.includes(query) || cond.includes(query) || idStr.includes(query);
      const reqCondition = (req.scanId?.condition || req.condition || '').toLowerCase();
      const matchesCondition = conditionFilter === 'All' || reqCondition.includes(conditionFilter.toLowerCase());

      return matchesSearch && matchesCondition;
    });
  }, [requests, searchTerm, conditionFilter]);

  return (
    <div className="screening-history-wrapper">
      
      {/* SUCCESS NOTIFICATION TOAST */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 2000,
              background: '#065F46',
              color: '#FFFFFF',
              padding: '16px 22px',
              borderRadius: '16px',
              boxShadow: '0 12px 28px rgba(6, 95, 70, 0.28)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              maxWidth: '440px'
            }}
          >
            <CheckCircle2 size={24} color="#34D399" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '0.94rem', display: 'block' }}>{successToast.title}</strong>
              <span style={{ fontSize: '0.82rem', opacity: 0.9 }}>{successToast.message}</span>
            </div>
            <button 
              onClick={() => setSuccessToast(null)}
              style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', marginLeft: 'auto', padding: '4px' }}
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 0. ACCOUNT PENDING APPROVAL WARNING */}
      {currentUser?.verificationStatus !== 'Approved' && (
        <div 
          style={{ 
            background: '#FFFBEB', 
            border: '1px solid #FDE68A', 
            borderLeft: '5px solid #F59E0B', 
            color: '#92400E', 
            padding: '16px 20px', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '14px',
            marginBottom: '24px',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.08)'
          }}
        >
          <AlertTriangle size={24} color="#D97706" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '0.96rem', color: '#B45309' }}>Doctor Account Pending Administrative Review</strong>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.86rem', color: '#78350F' }}>
              Your clinical profile is awaiting verification. You can view case diagnostics but cannot finalize clinical scan verifications until authorized.
            </p>
          </div>
        </div>
      )}

      {/* 1. CLINICAL HEADER CARD */}
      <div className="screening-header-card">
        <div className="screening-header-stripe"></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div className="screening-badge">
              <Clock size={14} /> Clinical Triage Portal
            </div>
            <h1 className="screening-title">Pending Clinical Reviews</h1>
            <p className="screening-subtitle">
              Verify AI preliminary dental scan screenings and triage patient consultation booking requests.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link 
              to="/dashboard/doctor" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                background: '#FFFFFF',
                color: '#17324D',
                border: '1px solid #BFD4E5',
                fontWeight: 700,
                fontSize: '0.86rem',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(7, 26, 51, 0.04)',
                transition: 'all 0.2s ease'
              }}
            >
              <LayoutDashboard size={16} color="#00A6A6" /> Doctor Dashboard
            </Link>
            <Link 
              to="/dashboard/doctor/verified" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 20px',
                borderRadius: '12px',
                background: '#00A6A6',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.88rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0, 166, 166, 0.28)',
                transition: 'all 0.2s ease'
              }}
            >
              <CheckCircle2 size={16} /> Verified Cases Archive
            </Link>
          </div>
        </div>
      </div>

      {/* 2. STATS ROW */}
      <div className="screening-stats-grid">
        <div className="screening-stat-card">
          <div className="screening-stat-left">
            <div className="screening-stat-icon" style={{ background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6' }}>
              <Activity size={24} />
            </div>
            <div>
              <div className="screening-stat-value">{pendingScans.length}</div>
              <div className="screening-stat-label">Scans Awaiting Verification</div>
            </div>
          </div>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, background: '#F0FDFA', color: '#00A6A6', padding: '3px 8px', borderRadius: '6px', border: '1px solid #99F6E4' }}>
            AI Triage
          </span>
        </div>

        <div className="screening-stat-card">
          <div className="screening-stat-left">
            <div className="screening-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}>
              <Clock size={24} />
            </div>
            <div>
              <div className="screening-stat-value">{requests.length}</div>
              <div className="screening-stat-label">Consultation Bookings</div>
            </div>
          </div>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, background: '#FEF3C7', color: '#B45309', padding: '3px 8px', borderRadius: '6px', border: '1px solid #FDE68A' }}>
            Bookings
          </span>
        </div>

        <div className="screening-stat-card">
          <div className="screening-stat-left">
            <div className="screening-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="screening-stat-value">100%</div>
              <div className="screening-stat-label">Human-in-the-Loop</div>
            </div>
          </div>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, background: '#ECFDF5', color: '#059669', padding: '3px 8px', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
            Clinical Safety
          </span>
        </div>
      </div>

      {/* 3. WORKSPACE TAB SELECTOR */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('scans')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 22px',
            borderRadius: '14px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '0.92rem',
            background: activeTab === 'scans' ? '#17324D' : '#FFFFFF',
            color: activeTab === 'scans' ? '#FFFFFF' : '#64748B',
            boxShadow: activeTab === 'scans' ? '0 4px 14px rgba(23, 50, 77, 0.2)' : '0 2px 6px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease'
          }}
        >
          <Activity size={18} color={activeTab === 'scans' ? '#00A6A6' : '#64748B'} />
          <span>Dental Scans Verification Queue</span>
          <span style={{
            fontSize: '0.74rem',
            background: activeTab === 'scans' ? '#00A6A6' : '#F1F5F9',
            color: '#FFFFFF',
            padding: '2px 8px',
            borderRadius: '999px',
            fontWeight: 800
          }}>
            {pendingScans.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('consultations')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 22px',
            borderRadius: '14px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '0.92rem',
            background: activeTab === 'consultations' ? '#17324D' : '#FFFFFF',
            color: activeTab === 'consultations' ? '#FFFFFF' : '#64748B',
            boxShadow: activeTab === 'consultations' ? '0 4px 14px rgba(23, 50, 77, 0.2)' : '0 2px 6px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease'
          }}
        >
          <Calendar size={18} color={activeTab === 'consultations' ? '#00A6A6' : '#64748B'} />
          <span>Patient Appointment Bookings</span>
          <span style={{
            fontSize: '0.74rem',
            background: activeTab === 'consultations' ? '#D97706' : '#F1F5F9',
            color: '#FFFFFF',
            padding: '2px 8px',
            borderRadius: '999px',
            fontWeight: 800
          }}>
            {requests.length}
          </span>
        </button>
      </div>

      {/* 4. SEARCH & CONDITION FILTER CONTROLS */}
      <div className="screening-controls-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={18} color="#64748B" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input 
              type="text"
              placeholder={activeTab === 'scans' ? "Search scans by patient name, condition, or scan ID..." : "Search appointments by patient name or case ID..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="screening-search-input"
              style={{ width: '100%', paddingLeft: '44px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => { fetchPendingScans(); fetchPendingConsultations(); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#475569',
                cursor: 'pointer'
              }}
              title="Refresh queue"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
              Showing {activeTab === 'scans' ? filteredScans.length : filteredRequests.length} pending
            </span>
          </div>

        </div>

        {/* Condition Filter Chips */}
        <div className="screening-chips-bar" style={{ marginTop: '8px' }}>
          {CONDITIONS.map(cond => {
            const isSelected = conditionFilter === cond;
            return (
              <button
                key={cond}
                onClick={() => setConditionFilter(cond)}
                className={`screening-chip ${isSelected ? 'active' : ''}`}
                style={{
                  background: isSelected ? '#00A6A6' : '#F8FAFC',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  borderColor: isSelected ? '#00A6A6' : '#E2E8F0',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid'
                }}
              >
                {cond}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. TAB CONTENT: DENTAL SCANS VERIFICATION TABLE */}
      {activeTab === 'scans' && (
        <div className="doctor-table-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(0, 166, 166, 0.1)', padding: '8px', borderRadius: '10px', color: '#00A6A6' }}>
                <Stethoscope size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#17324D' }}>
                  AI Dental Scans Awaiting Doctor Verification
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>
                  Review preliminary neural network classifications, confirm or override findings, and finalize clinical treatment plans.
                </p>
              </div>
            </div>

            <span style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', padding: '4px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800 }}>
              {filteredScans.length} Scans Pending
            </span>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="payments-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ padding: '14px 18px', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>Patient</th>
                  <th style={{ padding: '14px 18px', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>AI Preliminary Screening</th>
                  <th style={{ padding: '14px 18px', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>AI Model Score</th>
                  <th style={{ padding: '14px 18px', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Uploaded Date</th>
                  <th style={{ padding: '14px 18px', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Status</th>
                  <th style={{ padding: '14px 18px', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scansLoading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      <Activity size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                      <p style={{ margin: 0, fontWeight: 700 }}>Loading pending scans queue...</p>
                    </td>
                  </tr>
                ) : filteredScans.length > 0 ? (
                  filteredScans.map((scan) => {
                    const scanIdVal = scan.scanId || scan._id;
                    const patientName = scan.patientId?.name || scan.patientName || 'Patient';
                    const conditionDisplay = (scan.condition || scan.predictedCondition || 'Unknown').replace(/_/g, ' ');
                    const confVal = scan.confidence;

                    return (
                      <tr key={scan._id || scan.scanId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        {/* Patient */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #00A6A6, #06C6E8)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                              {getInitials(patientName)}
                            </div>
                            <div>
                              <span style={{ fontWeight: 800, color: '#17324D', display: 'block', fontSize: '0.92rem' }}>
                                {patientName}
                              </span>
                              <span style={{ fontSize: '0.76rem', color: '#64748B', fontFamily: 'monospace' }}>
                                {scan.scanId || 'SCAN-0000'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* AI Prediction */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                          <span style={{ fontWeight: 800, color: '#17324D', fontSize: '0.92rem', display: 'block' }}>
                            {conditionDisplay}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                            Preliminary AI Classifier
                          </span>
                        </td>

                        {/* Confidence Score */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                          <span 
                            style={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#F0FDFA', 
                              color: '#00A6A6', 
                              border: '1px solid #99F6E4',
                              padding: '4px 10px', 
                              borderRadius: '999px',
                              fontSize: '0.78rem',
                              fontWeight: 800
                            }}
                            title="Statistical AI classification score. Not clinical proof."
                          >
                            ⚡ {confVal !== undefined && confVal !== null ? `${Number(confVal).toFixed(1)}%` : 'Analyzed'}
                          </span>
                        </td>

                        {/* Uploaded Date */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle', color: '#475569', fontSize: '0.86rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#17324D' }}>
                            <Calendar size={14} color="#00A6A6" /> {formatDateTime(scan)}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                          <span 
                            style={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '4px 12px',
                              borderRadius: '999px',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              background: '#FFFBEB',
                              color: '#B45309',
                              border: '1px solid #FDE68A'
                            }}
                          >
                            Awaiting Doctor Review
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <button
                            onClick={() => openReviewModal(scan)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '10px',
                              background: '#00A6A6',
                              color: '#FFFFFF',
                              border: 'none',
                              fontWeight: 700,
                              fontSize: '0.84rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 10px rgba(0, 166, 166, 0.28)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Stethoscope size={15} /> Review & Verify
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
                        <CheckCircle size={28} />
                      </div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: 800, color: '#17324D' }}>
                        {searchTerm || conditionFilter !== 'All' ? 'No matching pending scans' : 'Triage Queue Empty!'}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B', maxWidth: '420px', marginInline: 'auto' }}>
                        {searchTerm || conditionFilter !== 'All' 
                          ? 'Try clearing your search query or condition filters.' 
                          : 'There are no dental scans currently awaiting clinical verification.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT: CONSULTATION REQUESTS TABLE (PRESERVED) */}
      {activeTab === 'consultations' && (
        <div className="doctor-table-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '10px', color: '#D97706' }}>
                <Calendar size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#17324D' }}>
                  Patient Appointment Requests
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>
                  Accept consultation bookings to connect with patients via video or clinical chat.
                </p>
              </div>
            </div>

            <span style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', padding: '4px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800 }}>
              {filteredRequests.length} Bookings Pending
            </span>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="payments-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ padding: '14px 18px', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>Patient</th>
                  <th style={{ padding: '14px 18px', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>AI Finding / Notes</th>
                  <th style={{ padding: '14px 18px', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Confidence</th>
                  <th style={{ padding: '14px 18px', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Requested For</th>
                  <th style={{ padding: '14px 18px', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Status</th>
                  <th style={{ padding: '14px 18px', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {consultationsLoading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      <Activity size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                      <p style={{ margin: 0, fontWeight: 700 }}>Loading consultation requests...</p>
                    </td>
                  </tr>
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => {
                    const targetId = req.id || req._id;
                    const isLoading = actionLoadingId === targetId;
                    const conditionName = req.scanId?.condition?.replace('_', ' ') || req.condition;
                    const displayCondition = conditionName && conditionName !== 'N/A' ? conditionName : 'General Consultation';
                    const confVal = req.scanId?.confidence || req.confidence;
                    const hasConf = confVal && confVal !== 'N/A';

                    return (
                      <tr key={targetId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        {/* Patient */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #00A6A6, #06C6E8)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                              {getInitials(req.patientName)}
                            </div>
                            <div>
                              <span style={{ fontWeight: 800, color: '#17324D', display: 'block', fontSize: '0.92rem' }}>
                                {req.patientName}
                              </span>
                              <span style={{ fontSize: '0.76rem', color: '#64748B', fontFamily: 'monospace' }}>
                                ID: P-{targetId ? targetId.toString().substring(0, 6) : '00000'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Finding */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                          <span style={{ fontWeight: 700, color: '#17324D', fontSize: '0.9rem', display: 'block' }}>
                            {displayCondition}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                            {hasConf ? 'Neural Scan Finding' : 'Intake Booking'}
                          </span>
                        </td>

                        {/* Confidence */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                          {hasConf ? (
                            <span 
                              style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#F0FDFA', 
                                color: '#00A6A6', 
                                border: '1px solid #99F6E4',
                                padding: '4px 10px', 
                                borderRadius: '999px',
                                fontSize: '0.78rem',
                                fontWeight: 800
                              }}
                            >
                              ⚡ {confVal}%
                            </span>
                          ) : (
                            <span style={{ color: '#94A3B8', fontSize: '0.78rem', fontStyle: 'italic' }}>
                              Intake Form
                            </span>
                          )}
                        </td>

                        {/* Requested On */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle', color: '#475569', fontSize: '0.86rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#17324D' }}>
                            <Calendar size={14} color="#00A6A6" /> {formatDateTime(req)}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                          <span 
                            style={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '4px 12px',
                              borderRadius: '999px',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              background: '#FFFBEB',
                              color: '#B45309',
                              border: '1px solid #FDE68A'
                            }}
                          >
                            Awaiting Triage
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '16px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button 
                              onClick={() => handleAccept(targetId)}
                              disabled={isLoading || currentUser?.verificationStatus !== 'Approved'}
                              style={{
                                padding: '7px 14px',
                                borderRadius: '10px',
                                background: '#10B981',
                                color: '#FFFFFF',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: (isLoading || currentUser?.verificationStatus !== 'Approved') ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                                opacity: currentUser?.verificationStatus !== 'Approved' ? 0.6 : 1,
                                transition: 'all 0.2s ease'
                              }}
                              title="Accept consultation and schedule appointment"
                            >
                              <CheckCircle2 size={14} /> Accept
                            </button>

                            <button 
                              onClick={() => {
                                setRejectingItem(req);
                                setRejectionReason('');
                              }}
                              disabled={isLoading}
                              style={{
                                padding: '7px 12px',
                                borderRadius: '10px',
                                background: '#FFFFFF',
                                color: '#DC2626',
                                border: '1px solid #FCA5A5',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.2s ease'
                              }}
                              title="Decline consultation request"
                            >
                              <XCircle size={14} /> Decline
                            </button>

                            <Link 
                              to={`/dashboard/doctor/consultation/${targetId}`} 
                              style={{
                                padding: '7px 12px',
                                borderRadius: '10px',
                                background: '#FFFFFF',
                                color: '#17324D',
                                border: '1px solid #CBD5E1',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 1px 4px rgba(7, 26, 51, 0.04)',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Eye size={14} /> View Case
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
                        <CheckCircle size={28} />
                      </div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: 800, color: '#17324D' }}>
                        {searchTerm || conditionFilter !== 'All' ? 'No matching bookings' : 'All Caught Up!'}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B', maxWidth: '420px', marginInline: 'auto' }}>
                        You currently have no patient appointment requests awaiting triage.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. INTERACTIVE DOCTOR VERIFICATION & OVERRIDE MODAL (PHASE 4) */}
      <AnimatePresence>
        {reviewingScan && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(7, 26, 51, 0.72)',
              backdropFilter: 'blur(8px)',
              zIndex: 1100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.25rem',
              overflowY: 'auto'
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: '#FFFFFF',
                maxWidth: '920px',
                width: '100%',
                maxHeight: '92vh',
                overflowY: 'auto',
                borderRadius: '24px',
                border: '1px solid #BFD4E5',
                boxShadow: '0 24px 60px rgba(7, 26, 51, 0.25)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '20px 28px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#F8FAFC',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Stethoscope size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#17324D' }}>
                      Clinical Scan Verification & Finalization
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      Case {reviewingScan.scanId || 'SCAN'} • Patient: {reviewingScan.patientId?.name || reviewingScan.patientName || 'Verified Patient'}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={closeReviewModal}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', padding: '6px', borderRadius: '8px' }}
                >
                  <X size={22} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '24px' }}>
                
                {/* Left Column: Image & AI Screening Baseline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Scan Image Preview */}
                  <div style={{
                    width: '100%',
                    height: '240px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #CBD5E1',
                    position: 'relative'
                  }}>
                    {reviewingScan.imagePath ? (
                      <ScanImage 
                        imagePath={reviewingScan.imagePath} 
                        alt="Patient dental scan" 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        fallback={
                          <div style={{ color: '#94A3B8', fontSize: '0.84rem', textAlign: 'center', padding: '20px' }}>
                            <FileText size={32} style={{ margin: '0 auto 8px' }} />
                            <span>Scan image loaded</span>
                          </div>
                        }
                      />
                    ) : (
                      <div style={{ color: '#94A3B8', fontSize: '0.84rem' }}>No image path registered</div>
                    )}
                  </div>

                  {/* AI Baseline Card */}
                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>
                        AI Baseline Screening
                      </span>
                      <span style={{ fontSize: '0.72rem', background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        MobileNetV2
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '1.05rem', color: '#17324D' }}>
                        {(reviewingScan.condition || reviewingScan.predictedCondition || 'Unknown').replace(/_/g, ' ')}
                      </strong>
                      <span style={{
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        color: '#00A6A6',
                        background: 'rgba(0, 166, 166, 0.1)',
                        padding: '3px 10px',
                        borderRadius: '8px'
                      }}>
                        ⚡ {Number(reviewingScan.confidence || 0).toFixed(1)}% AI Score
                      </span>
                    </div>

                    <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4 }}>
                      ⚠️ <em>AI confidence indicates neural network feature similarity, not a clinical diagnosis. Qualified doctor evaluation is required.</em>
                    </p>

                    {/* 6-Class Probabilities Breakdown */}
                    {reviewingScan.classProbabilities && (
                      <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                          Model Class Probabilities Breakdown:
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {Object.entries(reviewingScan.classProbabilities).map(([cName, cScore]) => (
                            <div key={cName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#475569' }}>
                              <span>{cName.replace(/_/g, ' ')}</span>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{Number(cScore).toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Doctor Assessment & Override Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Error Banner */}
                  {verificationError && (
                    <div style={{
                      background: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      color: '#B91C1C',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <AlertCircle size={18} style={{ flexShrink: 0 }} />
                      <span>{verificationError}</span>
                    </div>
                  )}

                  {/* 1. Final Clinical Diagnosis (Confirm or Override) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17324D', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                      Final Clinical Diagnosis <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select
                      value={finalDiagnosis}
                      onChange={(e) => setFinalDiagnosis(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '12px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        color: '#17324D',
                        outline: 'none',
                        background: '#FFFFFF'
                      }}
                    >
                      {DENTAL_CONDITIONS.map(cond => (
                        <option key={cond} value={cond}>
                          {cond.replace(/_/g, ' ')} {cond.toLowerCase() === (reviewingScan.condition || '').toLowerCase() ? '(AI Predicted)' : ''}
                        </option>
                      ))}
                    </select>

                    {/* Override Alert Notification */}
                    {finalDiagnosis && (reviewingScan.condition || '').toLowerCase() !== finalDiagnosis.toLowerCase() ? (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: '8px',
                        color: '#B45309',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <AlertTriangle size={15} color="#D97706" />
                        <span>Clinical Override Active: Changing diagnosis from <u>{(reviewingScan.condition || '').replace(/_/g, ' ')}</u> to <u>{finalDiagnosis.replace(/_/g, ' ')}</u>.</span>
                      </div>
                    ) : (
                      <div style={{
                        marginTop: '6px',
                        fontSize: '0.76rem',
                        color: '#059669',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Check size={14} /> Confirming AI prediction as final diagnosis.
                      </div>
                    )}
                  </div>

                  {/* 2. Secondary Clinical Findings (Multi-Select Chips) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17324D', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                      Secondary Clinical Findings (Optional)
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {COMMON_SECONDARY_FINDINGS.map(finding => {
                        const isSelected = secondaryFindings.includes(finding);
                        return (
                          <button
                            key={finding}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSecondaryFindings(prev => prev.filter(f => f !== finding));
                              } else {
                                setSecondaryFindings(prev => [...prev, finding]);
                              }
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '999px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: '1px solid',
                              borderColor: isSelected ? '#00A6A6' : '#E2E8F0',
                              background: isSelected ? '#F0FDFA' : '#F8FAFC',
                              color: isSelected ? '#00A6A6' : '#475569',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isSelected ? '✓ ' : '+ '} {finding}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Secondary Finding input */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text"
                        placeholder="Add other secondary finding..."
                        value={customSecondary}
                        onChange={(e) => setCustomSecondary(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customSecondary.trim()) {
                            e.preventDefault();
                            if (!secondaryFindings.includes(customSecondary.trim())) {
                              setSecondaryFindings(prev => [...prev, customSecondary.trim()]);
                            }
                            setCustomSecondary('');
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.8rem',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customSecondary.trim() && !secondaryFindings.includes(customSecondary.trim())) {
                            setSecondaryFindings(prev => [...prev, customSecondary.trim()]);
                            setCustomSecondary('');
                          }
                        }}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          background: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* 3. Doctor Clinical Notes */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17324D', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                      Doctor's Clinical Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Visible supragingival calculus deposits along mandibular anterior teeth with localized 1-2mm gingival recession..."
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.86rem',
                        color: '#17324D',
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* 4. Prescribed Treatment Plan */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17324D', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                      Prescribed Treatment Plan
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Schedule ultrasonic scaling and root planing. Daily interdental flossing and 3-month periodontal recall..."
                      value={treatmentPlan}
                      onChange={(e) => setTreatmentPlan(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '0.86rem',
                        color: '#17324D',
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* 5. Status Action Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 14px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Final Action:</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#059669', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="verStatus" 
                        value="Verified" 
                        checked={verificationStatusAction === 'Verified'} 
                        onChange={() => setVerificationStatusAction('Verified')} 
                      />
                      Approve & Verify
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#D97706', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="verStatus" 
                        value="Needs Rescan" 
                        checked={verificationStatusAction === 'Needs Rescan'} 
                        onChange={() => setVerificationStatusAction('Needs Rescan')} 
                      />
                      Request Rescan (Blurry/Unclear)
                    </label>
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '18px 28px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#F8FAFC',
                borderBottomLeftRadius: '24px',
                borderBottomRightRadius: '24px'
              }}>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  Verifying as: <strong>{currentUser?.name || 'Dr. Specialist'}</strong>
                </span>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={closeReviewModal}
                    disabled={isSubmittingVerification}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '12px',
                      background: '#FFFFFF',
                      color: '#475569',
                      border: '1px solid #CBD5E1',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalizeVerification}
                    disabled={isSubmittingVerification || currentUser?.verificationStatus !== 'Approved'}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '12px',
                      background: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: (isSubmittingVerification || currentUser?.verificationStatus !== 'Approved') ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
                      opacity: (isSubmittingVerification || currentUser?.verificationStatus !== 'Approved') ? 0.7 : 1
                    }}
                  >
                    {isSubmittingVerification ? (
                      <>
                        <Activity size={16} className="animate-spin" /> Finalizing Assessment...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} /> Verify & Finalize Report
                      </>
                    )}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REJECTION CONFIRMATION MODAL FOR CONSULTATIONS (PRESERVED) */}
      <AnimatePresence>
        {rejectingItem && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(7, 26, 51, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: '#FFFFFF',
                maxWidth: '480px',
                width: '100%',
                padding: '28px',
                borderRadius: '20px',
                border: '1px solid #BFD4E5',
                boxShadow: '0 20px 40px rgba(7, 26, 51, 0.15)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <XCircle size={22} color="#DC2626" />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    Decline Consultation Request
                  </h3>
                </div>
                <button 
                  onClick={() => setRejectingItem(null)} 
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '16px', lineHeight: 1.5 }}>
                Are you sure you want to decline the consultation request from <strong>{rejectingItem.patientName}</strong>?
              </p>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#17324D', marginBottom: '6px' }}>
                  Reason for Declining (Optional, shared with patient):
                </label>
                <textarea 
                  rows={3}
                  placeholder="e.g. Doctor is fully booked at this time; please select another time slot or specialist."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #BFD4E5',
                    fontSize: '0.88rem',
                    color: '#17324D',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  onClick={() => setRejectingItem(null)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    background: '#FFFFFF',
                    color: '#475569',
                    border: '1px solid #CBD5E1',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                  disabled={isRejecting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmReject}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '10px',
                    background: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: isRejecting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
                  }}
                  disabled={isRejecting}
                >
                  {isRejecting ? 'Declining...' : 'Confirm Decline'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DoctorPendingReviews;
