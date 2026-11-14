import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCircle, Calendar, Eye, CheckCircle2, BrainCircuit, 
  MessageSquare, Activity, XCircle, X, Search, Filter, 
  Stethoscope, Clock, ShieldCheck, Zap, LayoutDashboard, 
  Sparkles, Hash, Building2 
} from 'lucide-react';
import { getConsultationStatusMeta } from '../../utils/consultationStatus';
import { getSocket } from '../../utils/socket';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const CONDITIONS = ['All', 'Gingivitis', 'Caries', 'Calculus', 'Mouth Ulcer', 'Tooth Discoloration', 'Hypodontia'];

const DoctorConsultations = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'completed', 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  
  // Decline modal state
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const navigate = useNavigate();
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  const getInitials = (name) => {
    if (!name) return 'PT';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const fetchConsultations = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

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
      const myConsultations = await res.json();
      
      const formatted = (Array.isArray(myConsultations) ? myConsultations : [])
        .map(c => ({
          id: c.id || c._id,
          _id: c._id || c.id,
          patient: c.patientName,
          condition: c.scanId?.condition?.replace('_', ' ') || c.condition || 'General Checkup',
          confidence: c.scanId?.confidence || c.confidence || 'N/A',
          date: c.date ? `${c.date}${c.time ? ` at ${c.time}` : ''}` : (c.createdAt ? c.createdAt.split('T')[0] : 'Scheduled'),
          status: c.status,
          message: c.message,
          rejectionReason: c.rejectionReason,
          rawCreatedAt: c.createdAt
        }));

      formatted.sort((a, b) => new Date(b.rawCreatedAt || 0) - new Date(a.rawCreatedAt || 0));
      if (isMountedRef.current) {
        setRequests(formatted);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Error fetching consultations:', err);
      }
    } finally {
      isFetchingRef.current = false;
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchConsultations();

    const socket = getSocket();
    const handleAccepted = (payload) => {
      const targetId = payload.consultationId || payload.id;
      setRequests(prev => prev.map(r => (r.id === targetId ? { ...r, status: 'Accepted' } : r)));
      fetchConsultations();
    };

    if (socket) {
      socket.on('consultation-accepted', handleAccepted);
    }

    const intervalId = setInterval(() => {
      fetchConsultations();
    }, 4000);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
      if (socket) {
        socket.off('consultation-accepted', handleAccepted);
      }
    };
  }, [fetchConsultations]);

  const handleStartConsultation = async (id) => {
    try {
      setActionLoadingId(id);
      const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch(`${API_BASE}/api/consultations/${id}/start`, { method: 'PUT', headers });
      if (!res.ok) throw new Error('Failed to start consultation');
      navigate(`/dashboard/doctor/consultation/${id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to start consultation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAccept = async (id) => {
    try {
      setActionLoadingId(id);
      const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch(`${API_BASE}/api/consultations/${id}/accept`, { method: 'PUT', headers });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to accept consultation');
      }
      setRequests(prev => prev.map(r => (r.id === id ? { ...r, status: 'Accepted' } : r)));
    } catch (e) {
      console.error('Accept consultation error:', e);
      alert(e.message || 'Failed to accept consultation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    const targetId = rejectingItem.id || rejectingItem._id;
    try {
      setIsRejecting(true);
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
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to decline consultation');
      }

      setRequests(prev => prev.map(r => (r.id === targetId ? { ...r, status: 'Rejected', rejectionReason: rejectionReason.trim() } : r)));
      setRejectingItem(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Decline consultation error:', err);
      alert(err.message || 'Failed to decline consultation.');
    } finally {
      setIsRejecting(false);
    }
  };

  // Counts
  const activeCount = requests.filter(r => ['Pending', 'Booked', 'Accepted', 'Confirmed', 'In Consultation', 'In Progress'].includes(r.status)).length;
  const completedCount = requests.filter(r => ['Completed', 'Verified'].includes(r.status)).length;
  const inProgressCount = requests.filter(r => ['In Consultation', 'In Progress', 'Accepted', 'Confirmed'].includes(r.status)).length;

  // Filtered requests
  const displayedRequests = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return requests.filter(r => {
      // Tab filter
      let matchesTab = true;
      if (activeTab === 'active') {
        matchesTab = ['Pending', 'Booked', 'Accepted', 'Confirmed', 'In Consultation', 'In Progress'].includes(r.status);
      } else if (activeTab === 'completed') {
        matchesTab = ['Completed', 'Verified'].includes(r.status);
      }

      if (!matchesTab) return false;

      // Condition filter
      const cond = (r.condition || '').toLowerCase();
      const matchesCondition = conditionFilter === 'All' || cond.includes(conditionFilter.toLowerCase());
      if (!matchesCondition) return false;

      // Search query
      if (!query) return true;
      const pName = (r.patient || '').toLowerCase();
      const idStr = (r.id || '').toLowerCase();
      const msg = (r.message || '').toLowerCase();

      return pName.includes(query) || idStr.includes(query) || cond.includes(query) || msg.includes(query);
    });
  }, [requests, activeTab, conditionFilter, searchTerm]);

  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="screening-history-wrapper" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px 48px' }}>
      <motion.div initial="hidden" animate="show" variants={stagger}>
        
        {/* 1. CLINICAL HEADER CARD */}
        <motion.div variants={item} className="screening-header-card" style={{ marginBottom: '24px' }}>
          <div className="screening-header-stripe"></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div className="screening-badge">
                <Stethoscope size={14} /> Clinical Consultation Suite
              </div>
              <h1 className="screening-title">Consultation Management</h1>
              <p className="screening-subtitle">
                Review incoming patient booking requests, conduct live clinical consultations, and manage verified treatment records.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <Link 
                to="/dashboard/doctor" 
                className="btn btn-outline"
                style={{
                  background: '#FFFFFF',
                  borderColor: '#BFD4E5',
                  color: '#17324D',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <LayoutDashboard size={16} color="#00A6A6" /> Doctor Dashboard
              </Link>
              <Link 
                to="/dashboard/doctor/reviews" 
                className="btn btn-outline"
                style={{
                  background: '#FFFFFF',
                  borderColor: '#00A6A6',
                  color: '#00A6A6',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Clock size={16} /> Pending Reviews
              </Link>
            </div>
          </div>
        </motion.div>

        {/* 2. KPI SUMMARY METRIC CARDS */}
        <motion.div variants={item} className="doctor-kpi-grid" style={{ marginBottom: '24px' }}>
          {/* Active Queue */}
          <div className="doctor-kpi-card">
            <div>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '4px' }}>
                Active Queue
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#00A6A6', lineHeight: 1.1 }}>
                {activeCount}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#00A6A6', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                Awaiting / In Consultation
              </span>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Activity size={24} />
            </div>
          </div>

          {/* In Progress & Ready */}
          <div className="doctor-kpi-card">
            <div>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '4px' }}>
                Live &amp; Confirmed
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#1677FF', lineHeight: 1.1 }}>
                {inProgressCount}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#1677FF', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                Direct Messaging Ready
              </span>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(22, 119, 255, 0.1)', color: '#1677FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={24} />
            </div>
          </div>

          {/* Completed Sessions */}
          <div className="doctor-kpi-card">
            <div>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '4px' }}>
                Completed Cases
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#10B981', lineHeight: 1.1 }}>
                {completedCount}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                Dispatched Reports
              </span>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={24} />
            </div>
          </div>

          {/* Total Ledger */}
          <div className="doctor-kpi-card">
            <div>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '4px' }}>
                Total Records
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                {requests.length}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                Lifetime Consultations
              </span>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(23, 50, 77, 0.08)', color: '#17324D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Stethoscope size={24} />
            </div>
          </div>
        </motion.div>

        {/* 3. WORKSPACE CONTROL BAR: TABS, SEARCH & FILTERS */}
        <motion.div variants={item} className="workspace-card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '14px' }}>
            
            {/* Tab Filter Controls */}
            <div style={{ display: 'inline-flex', gap: '6px', background: '#F1F5F9', padding: '5px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <button
                onClick={() => setActiveTab('active')}
                style={{
                  padding: '7px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'active' ? '#00A6A6' : 'transparent',
                  color: activeTab === 'active' ? '#FFFFFF' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === 'active' ? '0 2px 8px rgba(0, 166, 166, 0.25)' : 'none'
                }}
              >
                Active Queue ({activeCount})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                style={{
                  padding: '7px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'completed' ? '#00A6A6' : 'transparent',
                  color: activeTab === 'completed' ? '#FFFFFF' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === 'completed' ? '0 2px 8px rgba(0, 166, 166, 0.25)' : 'none'
                }}
              >
                Completed ({completedCount})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                style={{
                  padding: '7px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'all' ? '#00A6A6' : 'transparent',
                  color: activeTab === 'all' ? '#FFFFFF' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === 'all' ? '0 2px 8px rgba(0, 166, 166, 0.25)' : 'none'
                }}
              >
                All Records ({requests.length})
              </button>
            </div>

            {/* Omni Search Bar */}
            <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
              <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search patient, ID, note, or pathology..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 32px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  color: '#17324D',
                  fontSize: '0.86rem',
                  fontWeight: 500,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Condition Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
              <Filter size={13} /> Pathology:
            </span>
            {CONDITIONS.map(cond => {
              const active = conditionFilter === cond;
              return (
                <button
                  key={cond}
                  onClick={() => setConditionFilter(cond)}
                  style={{
                    padding: '4px 11px',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: active ? '1.5px solid #00A6A6' : '1px solid #E2E8F0',
                    background: active ? '#F0FDFA' : '#FFFFFF',
                    color: active ? '#00A6A6' : '#52677A',
                    boxShadow: active ? '0 2px 6px rgba(0, 166, 166, 0.12)' : 'none'
                  }}
                >
                  {cond}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* 4. SOLID PATIENT CONSULTATION QUEUE LIST */}
        <motion.div variants={item} className="doctor-table-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                  Patient Consultation Queue
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
                  Showing {displayedRequests.length} active triage cases
                </span>
              </div>
            </div>

            <span style={{
              background: '#F0FDFA',
              color: '#00A6A6',
              border: '1px solid #99E3D8',
              padding: '4px 14px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 800
            }}>
              {displayedRequests.length} Cases in Queue
            </span>
          </div>

          {/* Queue Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {loading ? (
              <div style={{ padding: '48px 16px', textAlign: 'center' }}>
                <div className="spin-anim" style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', marginBottom: '12px' }}>
                  <BrainCircuit size={36} color="#00A6A6" />
                </div>
                <p style={{ color: '#64748B', margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>Loading consultations queue...</p>
              </div>
            ) : displayedRequests.length > 0 ? (
              displayedRequests.map((req, index) => {
                const statusMeta = getConsultationStatusMeta(req.status);
                const isPending = req.status === 'Pending' || req.status === 'Booked';
                const isAccepted = req.status === 'Accepted' || req.status === 'Confirmed';
                const isInProgress = req.status === 'In Consultation' || req.status === 'In Progress';
                const isCompleted = req.status === 'Completed' || req.status === 'Verified';
                const isCancelled = req.status === 'Rejected' || req.status === 'Cancelled';
                const isLoading = actionLoadingId === req.id;

                const rawSymptoms = req.message
                  ? req.message.split(',').map(s => s.trim()).filter(s => s.length > 0 && s.length < 35)
                  : [];
                const symptomPills = rawSymptoms.length > 1 ? rawSymptoms : [];
                const isReqChat = String(req.consultationType || '').toLowerCase().includes('chat');

                return (
                  <motion.div 
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #BFD4E5',
                      borderRadius: '18px',
                      padding: '22px 24px',
                      boxShadow: '0 4px 18px rgba(7, 26, 51, 0.03)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '20px',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Left Info Body */}
                    <div style={{ flex: '1 1 520px', minWidth: '0' }}>
                      
                      {/* Patient Meta Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #00A6A6 0%, #17324D 100%)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '1.05rem',
                            boxShadow: '0 3px 10px rgba(0, 166, 166, 0.2)',
                            flexShrink: 0
                          }}>
                            {getInitials(req.patient)}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#17324D' }}>
                                {req.patient || 'Unknown Patient'}
                              </h4>
                              <span style={{
                                background: '#F1F5F9',
                                color: '#475569',
                                border: '1px solid #CBD5E1',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700
                              }}>
                                ID: P-{req.id ? req.id.toString().substring(0, 6) : '00000'}
                              </span>
                              <span style={{
                                background: isReqChat ? '#EFF6FF' : '#F0FDFA',
                                color: isReqChat ? '#1677FF' : '#00A6A6',
                                border: `1px solid ${isReqChat ? '#BFDBFE' : '#CCFBF1'}`,
                                padding: '1px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700
                              }}>
                                {isReqChat ? 'Online Chat' : 'In-Person Clinic Visit'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                              <Calendar size={13} color="#00A6A6" /> {req.date}
                            </div>
                          </div>
                        </div>

                        {/* Status Chip */}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: statusMeta.bg,
                          color: statusMeta.color,
                          border: `1px solid ${statusMeta.border}`,
                          padding: '5px 12px',
                          borderRadius: '999px',
                          fontSize: '0.78rem',
                          fontWeight: 800
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusMeta.color }} />
                          {statusMeta.label}
                        </span>
                      </div>

                      {/* AI Diagnostic Finding Box (Clean Clinical Design replacing black slab) */}
                      <div style={{
                        background: '#F8FAFC',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        padding: '12px 18px',
                        marginBottom: req.message || req.rejectionReason ? '12px' : '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'rgba(0, 166, 166, 0.1)',
                            color: '#00A6A6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <BrainCircuit size={18} />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 800, display: 'block' }}>
                              AI Preliminary Finding
                            </span>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#17324D', textTransform: 'capitalize' }}>
                              {req.condition && req.condition !== 'N/A' ? req.condition.replace(/_/g, ' ') : 'General Oral Checkup'}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 800, display: 'block' }}>
                              Algorithmic Confidence
                            </span>
                            <div style={{ fontWeight: 800, color: '#00A6A6', fontSize: '1.05rem' }}>
                              {req.confidence && req.confidence !== 'N/A' 
                                ? (typeof req.confidence === 'number' ? `${req.confidence.toFixed(1)}%` : req.confidence.includes('%') ? req.confidence : `${req.confidence}%`)
                                : 'Pending Scan'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Patient Note / Symptoms */}
                      {req.message && (
                        <div style={{
                          background: '#F0FDFA',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: '1px solid #99E3D8',
                          borderLeft: '4px solid #00A6A6',
                          marginBottom: req.rejectionReason ? '10px' : '0'
                        }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#0D9488', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                            <Zap size={12} color="#00A6A6" /> Patient Chief Complaint &amp; Intake Notes:
                          </span>

                          {/* Symptom Tags if comma separated */}
                          {symptomPills.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '4px 0 6px 0' }}>
                              {symptomPills.map((symptom, sIdx) => (
                                <span 
                                  key={sIdx}
                                  style={{
                                    background: '#FFFFFF',
                                    border: '1px solid #BFD4E5',
                                    borderRadius: '6px',
                                    padding: '2px 8px',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    color: '#17324D',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00A6A6' }}></span>
                                  {symptom}
                                </span>
                              ))}
                            </div>
                          )}

                          <p style={{ fontStyle: 'italic', margin: 0, lineHeight: 1.5, color: '#134E4A', fontSize: '0.88rem' }}>
                            &ldquo;{req.message}&rdquo;
                          </p>
                        </div>
                      )}

                      {/* Decline Reason if rejected */}
                      {req.rejectionReason && (
                        <div style={{
                          background: '#FEF2F2',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: '1px solid #FECACA',
                          borderLeft: '4px solid #DC2626'
                        }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#991B1B', display: 'block', marginBottom: '3px' }}>
                            Decline Reason:
                          </span>
                          <p style={{ color: '#991B1B', fontStyle: 'italic', margin: 0, lineHeight: 1.5, fontSize: '0.86rem' }}>
                            &ldquo;{req.rejectionReason}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right Workflow Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px', flexShrink: 0 }}>
                      
                      {/* 1. Pending: Accept, Decline, Open Workspace, Open Chat */}
                      {isPending && (
                        <>
                          <button 
                            onClick={() => handleAccept(req.id)}
                            disabled={isLoading}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '10px 16px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              color: '#FFFFFF',
                              border: 'none',
                              fontWeight: 800,
                              fontSize: '0.86rem',
                              cursor: isLoading ? 'not-allowed' : 'pointer',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                            }}
                          >
                            <CheckCircle2 size={16} /> Accept Consultation
                          </button>

                          <button 
                            onClick={() => setRejectingItem(req)}
                            disabled={isLoading}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '9px 16px',
                              borderRadius: '10px',
                              background: '#FFFFFF',
                              color: '#DC2626',
                              border: '1px solid #FCA5A5',
                              fontWeight: 700,
                              fontSize: '0.86rem',
                              cursor: isLoading ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <XCircle size={16} /> Decline Request
                          </button>

                          <Link 
                            to={`/dashboard/doctor/consultation/${req.id}`} 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '9px 16px',
                              borderRadius: '10px',
                              background: '#FFFFFF',
                              color: '#17324D',
                              border: '1px solid #BFD4E5',
                              fontWeight: 700,
                              fontSize: '0.86rem',
                              textDecoration: 'none'
                            }}
                          >
                            <Eye size={16} color="#00A6A6" /> Open Workspace
                          </Link>

                          {isReqChat && (
                            <Link 
                              to={`/dashboard/doctor/consultation/${req.id}/messages`} 
                              state={{ consultationId: req.id }} 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '9px 16px',
                                borderRadius: '10px',
                                background: '#F0FDFA',
                                color: '#1677FF',
                                border: '1px solid #BFDBFE',
                                fontWeight: 700,
                                fontSize: '0.86rem',
                                textDecoration: 'none'
                              }}
                            >
                              <MessageSquare size={16} /> Open Chat
                            </Link>
                          )}
                        </>
                      )}

                      {/* 2. Accepted: Start Consultation & Message Patient */}
                      {isAccepted && (
                        <>
                          <button 
                            onClick={() => handleStartConsultation(req.id)}
                            disabled={isLoading}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '10px 16px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              color: '#FFFFFF',
                              border: 'none',
                              fontWeight: 800,
                              fontSize: '0.86rem',
                              cursor: isLoading ? 'not-allowed' : 'pointer',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                            }}
                          >
                            <CheckCircle2 size={16} /> Start Consultation
                          </button>

                          {isReqChat && (
                            <Link 
                              to={`/dashboard/doctor/consultation/${req.id}/messages`} 
                              state={{ consultationId: req.id }} 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '9px 16px',
                                borderRadius: '10px',
                                background: '#1677FF',
                                color: '#FFFFFF',
                                fontWeight: 800,
                                fontSize: '0.86rem',
                                textDecoration: 'none',
                                boxShadow: '0 2px 8px rgba(22, 119, 255, 0.2)'
                              }}
                            >
                              <MessageSquare size={16} /> Message Patient
                            </Link>
                          )}
                        </>
                      )}

                      {/* 3. In Progress: Continue Workspace & Message Patient */}
                      {isInProgress && (
                        <>
                          <Link 
                            to={`/dashboard/doctor/consultation/${req.id}`} 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '10px 16px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              color: '#FFFFFF',
                              fontWeight: 800,
                              fontSize: '0.86rem',
                              textDecoration: 'none',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                            }}
                          >
                            <Activity size={16} /> Continue Workspace
                          </Link>

                          {isReqChat && (
                            <Link 
                              to={`/dashboard/doctor/consultation/${req.id}/messages`} 
                              state={{ consultationId: req.id }} 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '9px 16px',
                                borderRadius: '10px',
                                background: '#1677FF',
                                color: '#FFFFFF',
                                fontWeight: 800,
                                fontSize: '0.86rem',
                                textDecoration: 'none',
                                boxShadow: '0 2px 8px rgba(22, 119, 255, 0.2)'
                              }}
                            >
                              <MessageSquare size={16} /> Message Patient
                            </Link>
                          )}
                        </>
                      )}

                      {/* 4. Completed: View Summary & View Messages */}
                      {isCompleted && (
                        <>
                          <Link 
                            to={`/dashboard/doctor/consultation/${req.id}`} 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '10px 16px',
                              borderRadius: '10px',
                              background: '#00A6A6',
                              color: '#FFFFFF',
                              fontWeight: 800,
                              fontSize: '0.86rem',
                              textDecoration: 'none',
                              boxShadow: '0 2px 8px rgba(0, 166, 166, 0.2)'
                            }}
                          >
                            <Eye size={16} /> View Summary
                          </Link>

                          {isReqChat && (
                            <Link 
                              to={`/dashboard/doctor/consultation/${req.id}/messages`} 
                              state={{ consultationId: req.id }} 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '9px 16px',
                                borderRadius: '10px',
                                background: '#FFFFFF',
                                color: '#17324D',
                                border: '1px solid #BFD4E5',
                                fontWeight: 700,
                                fontSize: '0.86rem',
                                textDecoration: 'none'
                              }}
                            >
                              <MessageSquare size={16} /> View Messages
                            </Link>
                          )}
                        </>
                      )}

                      {/* 5. Cancelled / Rejected */}
                      {isCancelled && (
                        <>
                          <Link 
                            to={`/dashboard/doctor/consultation/${req.id}`} 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '9px 16px',
                              borderRadius: '10px',
                              background: '#FFFFFF',
                              color: '#17324D',
                              border: '1px solid #BFD4E5',
                              fontWeight: 700,
                              fontSize: '0.86rem',
                              textDecoration: 'none'
                            }}
                          >
                            <Eye size={16} color="#00A6A6" /> View Case
                          </Link>

                          <Link 
                            to={`/dashboard/doctor/consultation/${req.id}/messages`} 
                            state={{ consultationId: req.id }} 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '9px 16px',
                              borderRadius: '10px',
                              background: '#FFFFFF',
                              color: '#64748B',
                              border: '1px solid #CBD5E1',
                              fontWeight: 700,
                              fontSize: '0.86rem',
                              textDecoration: 'none'
                            }}
                          >
                            <MessageSquare size={16} /> View Messages
                          </Link>
                        </>
                      )}

                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div style={{ padding: '48px 16px', textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#94A3B8' }}>
                  <CheckCircle2 size={28} />
                </div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 800, color: '#17324D' }}>
                  No Consultations Found
                </h4>
                <p style={{ margin: '0 auto 16px', fontSize: '0.88rem', color: '#64748B', maxWidth: '420px', lineHeight: 1.5 }}>
                  {searchTerm || conditionFilter !== 'All' 
                    ? 'No consultation records match your search or condition filters.' 
                    : 'There are no active consultation records currently in this category.'}
                </p>
                {(searchTerm || conditionFilter !== 'All') && (
                  <button
                    onClick={() => { setSearchTerm(''); setConditionFilter('All'); }}
                    style={{
                      background: '#00A6A6',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 18px',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer'
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>

      </motion.div>

      {/* Decline Consultation Modal */}
      <AnimatePresence>
        {rejectingItem && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: '#FFFFFF',
                border: '1px solid #BFD4E5',
                borderRadius: '20px',
                padding: '28px 32px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 20px 30px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <XCircle size={22} color="#DC2626" />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    Decline Consultation Request
                  </h3>
                </div>
                <button 
                  onClick={() => { setRejectingItem(null); setRejectionReason(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '0.9rem', color: '#52677A', marginBottom: '16px', lineHeight: 1.5 }}>
                Are you sure you want to decline the consultation request for <strong>{rejectingItem.patient}</strong>?
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17324D', marginBottom: '6px' }}>
                  Reason for declining (Optional, sent to patient)
                </label>
                <textarea 
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Doctor schedule is full at this time; please select another time slot or specialist."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    color: '#17324D',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  onClick={() => { setRejectingItem(null); setRejectionReason(''); }}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                    padding: '9px 18px',
                    fontWeight: 700,
                    color: '#52677A',
                    cursor: 'pointer'
                  }}
                  disabled={isRejecting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmReject}
                  style={{
                    background: '#DC2626',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '9px 20px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    cursor: isRejecting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
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

export default DoctorConsultations;
