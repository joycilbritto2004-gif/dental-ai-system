import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Clock, CheckCircle2, AlertTriangle, UserCircle, Activity, 
  BrainCircuit, Eye, LineChart as LineChartIcon, PieChart as PieChartIcon, 
  BarChart as BarChartIcon, MessageSquare, XCircle, X, Calendar, Lock,
  Stethoscope, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';
import './Dashboard.css';
import { API_BASE } from '../config';

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
    avgConfidence: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [rawConsultations, setRawConsultations] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Decline / Rejection Modal State
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  
  const [currentUser, setCurrentUser] = useState(() => {
    const userStr = localStorage.getItem('dentaai_user');
    return userStr ? JSON.parse(userStr) : null;
  });

  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const userStr = localStorage.getItem('dentaai_user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    if (user && (user._id || user.id)) {
      fetch(`${API_BASE}/api/doctors/${user._id || user.id}`, {
        headers: getAuthHeaders()
      })
        .then(res => res.json())
        .then(data => {
          if (!data.message) {
            setCurrentUser(prev => ({...prev, verificationStatus: data.verificationStatus, accountStatus: data.accountStatus}));
            
            // Also update localStorage so other pages have the latest status
            const storedStr = localStorage.getItem('dentaai_user');
            if (storedStr) {
              const storedUser = JSON.parse(storedStr);
              localStorage.setItem('dentaai_user', JSON.stringify({
                ...storedUser,
                verificationStatus: data.verificationStatus,
                accountStatus: data.accountStatus
              }));
            }
          }
        })
        .catch(console.error);
    }
  }, []);

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
      
      const res = await fetch(`${API_BASE}/api/consultations?doctorId=${DOCTOR_ID}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const myConsultations = await res.json();
      
      if (!isMountedRef.current) return;
      setRawConsultations(Array.isArray(myConsultations) ? myConsultations : []);

      let pending = 0;
      let active = 0;
      let completed = 0;
      let confidenceSum = 0;
      let confidenceCount = 0;

      (Array.isArray(myConsultations) ? myConsultations : []).forEach(c => {
        if (c.status === "Pending" || c.status === "Booked") pending++;
        else if (c.status === "Accepted" || c.status === "Confirmed" || c.status === "In Consultation" || c.status === "In Progress") active++;
        else if (c.status === "Completed" || c.status === "Verified") completed++;
        
        // Parse confidence
        const confStr = c.scanId?.confidence || c.confidence;
        if (confStr && confStr !== 'N/A') {
          const val = parseFloat(String(confStr).replace('%', ''));
          if (!isNaN(val)) {
            confidenceSum += val;
            confidenceCount++;
          }
        }
      });

      setStats({
        total: (Array.isArray(myConsultations) ? myConsultations : []).length,
        pending,
        active,
        completed,
        avgConfidence: confidenceCount > 0 ? Math.round(confidenceSum / confidenceCount) : 0
      });

      const sorted = [...(Array.isArray(myConsultations) ? myConsultations : [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setRecentActivity(sorted.slice(0, 8));

    } catch (e) {
      if (isMountedRef.current) {
        console.error("Failed to parse consultations", e);
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchConsultations();

    const intervalId = setInterval(() => {
      fetchConsultations();
    }, 5000);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [fetchConsultations]);

  // Handle consultation approval (Accept)
  const handleAccept = async (id) => {
    if (currentUser?.verificationStatus !== 'Approved') {
      alert('Your doctor account is pending administrative review. You cannot accept consultations yet.');
      return;
    }
    try {
      setActionLoadingId(id);
      const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch(`${API_BASE}/api/consultations/${id}/accept`, {
        method: 'PUT',
        headers
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to accept consultation');
      }

      // Update state locally for instantaneous UI reflection
      setRawConsultations(prev => prev.map(c => ((c.id === id || c._id === id) ? { ...c, status: 'Accepted' } : c)));
      setRecentActivity(prev => prev.map(c => ((c.id === id || c._id === id) ? { ...c, status: 'Accepted' } : c)));
      setStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        active: prev.active + 1
      }));
    } catch (err) {
      console.error('Accept consultation error:', err);
      alert(err.message || 'Failed to accept consultation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle consultation decline / reject
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

      // Update state locally
      setRawConsultations(prev => prev.map(c => ((c.id === targetId || c._id === targetId) ? { ...c, status: 'Rejected', rejectionReason: rejectionReason.trim() } : c)));
      setRecentActivity(prev => prev.map(c => ((c.id === targetId || c._id === targetId) ? { ...c, status: 'Rejected', rejectionReason: rejectionReason.trim() } : c)));
      setStats(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1)
      }));

      setRejectingItem(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Decline consultation error:', err);
      alert(err.message || 'Failed to decline consultation.');
    } finally {
      setIsRejecting(false);
    }
  };

  // Pending consultations list
  const pendingConsultations = useMemo(() => {
    return rawConsultations.filter(c => c.status === 'Pending' || c.status === 'Booked');
  }, [rawConsultations]);

  // Compute Chart Data
  const statusData = useMemo(() => {
    return [
      { name: 'Pending', value: stats.pending, color: '#F59E0B' },
      { name: 'Active', value: stats.active, color: '#1677FF' },
      { name: 'Completed', value: stats.completed, color: '#16A34A' }
    ].filter(d => d.value > 0);
  }, [stats]);

  const conditionData = useMemo(() => {
    const counts = {};
    rawConsultations.forEach(c => {
      const cond = c.scanId?.condition?.replace('_', ' ') || c.condition;
      if (cond && cond !== 'N/A') {
        const name = cond.charAt(0).toUpperCase() + cond.slice(1);
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
  }, [rawConsultations]);

  const timelineData = useMemo(() => {
    const dates = {};
    rawConsultations.forEach(c => {
      const date = c.createdAt ? c.createdAt.split('T')[0] : c.date;
      if (date) {
        dates[date] = (dates[date] || 0) + 1;
      }
    });
    
    // Sort chronologically and take last 7 active days
    return Object.entries(dates)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-7)
      .map(([date, count]) => {
        const d = new Date(date);
        const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : date;
        return { date: dateStr, Consultations: count };
      });
  }, [rawConsultations]);

  const doctorDisplayName = currentUser?.name 
    ? (currentUser.name.startsWith('Dr.') ? currentUser.name : `Dr. ${currentUser.name}`) 
    : 'Doctor';

  const getInitials = (name) => {
    if (!name) return 'PT';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="screening-history-wrapper">
      
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
              Your clinical profile is awaiting verification. You can view diagnostics but cannot accept new consultations until authorized.
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
              <Stethoscope size={14} /> Clinical Specialist Portal
            </div>
            <h1 className="screening-title">Doctor Analytics & Consultations</h1>
            <p className="screening-subtitle">
              Welcome back, {doctorDisplayName}. Triage incoming patient bookings, review neural screening diagnostics, and monitor clinical volume.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link 
              to="/dashboard/doctor/consultations" 
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
              <Calendar size={16} /> Consultations Queue
            </Link>
            <Link 
              to="/dashboard/doctor/profile" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 20px',
                borderRadius: '12px',
                background: '#FFFFFF',
                color: '#17324D',
                border: '1px solid #BFD4E5',
                fontWeight: 700,
                fontSize: '0.88rem',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(7, 26, 51, 0.04)',
                transition: 'all 0.2s ease'
              }}
            >
              <UserCircle size={16} color="#00A6A6" /> Clinical Profile
            </Link>
          </div>
        </div>
      </div>

      {/* 2. CLINICAL KPI SUMMARY GRID (4 SOLID CARDS) */}
      <div className="doctor-kpi-grid">
        
        {/* Card 1: Total Consultations */}
        <div className="doctor-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(22, 119, 255, 0.1)', color: '#1677FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Activity size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#17324D', lineHeight: 1.15 }}>
                {stats.total}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                Total Cases
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '6px' }}>
            All-Time
          </span>
        </div>

        {/* Card 2: Pending Approval */}
        <div className="doctor-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#17324D', lineHeight: 1.15 }}>
                {stats.pending}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                Awaiting Approval
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#FEF3C7', color: '#B45309', padding: '3px 8px', borderRadius: '6px', border: '1px solid #FDE68A' }}>
            Action Required
          </span>
        </div>

        {/* Card 3: Completed */}
        <div className="doctor-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#17324D', lineHeight: 1.15 }}>
                {stats.completed}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                Completed Cases
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#ECFDF5', color: '#059669', padding: '3px 8px', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
            Diagnosed
          </span>
        </div>

        {/* Card 4: Avg AI Confidence */}
        <div className="doctor-kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BrainCircuit size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#17324D', lineHeight: 1.15 }}>
                {stats.avgConfidence}%
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                Avg AI Confidence
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#F0FDFA', color: '#00A6A6', padding: '3px 8px', borderRadius: '6px', border: '1px solid #99F6E4' }}>
            Neural Model
          </span>
        </div>

      </div>

      {/* 3. PENDING CONSULTATION APPROVALS QUEUE */}
      {pendingConsultations.length > 0 && (
        <div className="doctor-queue-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#FEF3C7', padding: '8px', borderRadius: '10px', color: '#D97706' }}>
                <Clock size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#17324D' }}>
                  Pending Consultation Requests
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B', fontWeight: 500 }}>
                  These patients have booked consultations with you. Accept to confirm their appointment and unlock direct clinical messaging.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '4px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800 }}>
                {pendingConsultations.length} Action Required
              </span>
              <Link 
                to="/dashboard/doctor/consultations" 
                style={{ fontSize: '0.84rem', fontWeight: 700, color: '#00A6A6', textDecoration: 'none' }}
              >
                View All Queue →
              </Link>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {pendingConsultations.map((c) => {
              const targetId = c.id || c._id;
              const isLoading = actionLoadingId === targetId;

              return (
                <div 
                  key={targetId}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    boxShadow: '0 4px 14px rgba(7, 26, 51, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    {/* Patient Name + Pending Pill */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #00A6A6, #06C6E8)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                          {getInitials(c.patientName)}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#17324D' }}>
                            {c.patientName}
                          </h4>
                          <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Calendar size={12} color="#00A6A6" /> {c.date} {c.time && `at ${c.time}`}
                          </span>
                        </div>
                      </div>
                      <span style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
                        {c.status}
                      </span>
                    </div>

                    {/* Pre-Screening Findings Box */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 14px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>Condition:</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#17324D' }}>
                          {c.scanId?.condition?.replace('_', ' ') || c.condition || 'General Dental'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>AI Neural Score:</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#00A6A6' }}>
                          {c.scanId?.confidence || c.confidence || 'N/A'}%
                        </span>
                      </div>
                      {c.message && (
                        <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #E2E8F0', fontSize: '0.78rem', color: '#475569', fontStyle: 'italic' }}>
                          "{c.message}"
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#B45309', fontSize: '0.76rem', fontWeight: 600 }}>
                      <Lock size={12} /> Messaging locked until consultation is accepted
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                    <button
                      onClick={() => handleAccept(targetId)}
                      disabled={isLoading}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        background: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <CheckCircle2 size={14} /> Accept
                    </button>

                    <button
                      onClick={() => setRejectingItem(c)}
                      disabled={isLoading}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: '#FFFFFF',
                        color: '#DC2626',
                        border: '1px solid #FCA5A5',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <XCircle size={14} /> Decline
                    </button>

                    <Link
                      to={`/dashboard/doctor/consultation/${targetId}`}
                      style={{
                        marginLeft: 'auto',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: '#FFFFFF',
                        color: '#17324D',
                        border: '1px solid #CBD5E1',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Eye size={14} /> Pre-Screen
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. ANALYTICS CHARTS GRID (3 SOLID CARDS) */}
      <div className="doctor-charts-grid">
        
        {/* Status Distribution Donut */}
        <div className="doctor-chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{ background: 'rgba(0, 166, 166, 0.1)', padding: '8px', borderRadius: '10px', color: '#00A6A6' }}>
              <PieChartIcon size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#17324D' }}>
                Status Distribution
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>Case lifecycle proportions</span>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: '240px' }}>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: '0.9rem' }}>
                No case data available
              </div>
            )}
          </div>
        </div>

        {/* Condition Predictions Bar Chart */}
        <div className="doctor-chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{ background: 'rgba(0, 166, 166, 0.1)', padding: '8px', borderRadius: '10px', color: '#00A6A6' }}>
              <BarChartIcon size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#17324D' }}>
                Top Conditions Diagnosed
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>Most frequent AI findings</span>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: '240px' }}>
            {conditionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conditionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} tickMargin={8} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(0, 166, 166, 0.05)' }} />
                  <Bar dataKey="count" fill="#00A6A6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: '0.9rem' }}>
                No condition data available
              </div>
            )}
          </div>
        </div>

        {/* Timeline Line Chart */}
        <div className="doctor-chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{ background: 'rgba(0, 166, 166, 0.1)', padding: '8px', borderRadius: '10px', color: '#00A6A6' }}>
              <LineChartIcon size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#17324D' }}>
                Consultation Intake Volume
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>Active days intake trend</span>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: '240px' }}>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickMargin={8} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Consultations" stroke="#00A6A6" strokeWidth={3} dot={{ r: 4, fill: '#00A6A6' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: '0.9rem' }}>
                No timeline data available
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 5. RECENT PATIENT CONSULTATIONS TABLE (SOLID CARD) */}
      <div className="doctor-table-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#17324D', letterSpacing: '-0.3px' }}>
              Recent Patient Consultations
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>
              Audit clinical history, send messages, and review AI verified scans
            </p>
          </div>
          <Link 
            to="/dashboard/doctor/consultations" 
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1px solid #BFD4E5',
              background: '#FFFFFF',
              color: '#17324D',
              fontWeight: 700,
              fontSize: '0.82rem',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(7, 26, 51, 0.04)'
            }}
          >
            View All ({rawConsultations.length})
          </Link>
        </div>

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="payments-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={{ padding: '14px 18px', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>Patient</th>
                <th style={{ padding: '14px 18px', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>AI Prediction</th>
                <th style={{ padding: '14px 18px', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Date & Time</th>
                <th style={{ padding: '14px 18px', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0' }}>Status</th>
                <th style={{ padding: '14px 18px', background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', textAlign: 'right' }}>Workflow Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length > 0 ? recentActivity.map((req) => {
                const targetId = req.id || req._id;
                const isPending = req.status === 'Pending' || req.status === 'Booked';
                const isAccepted = req.status === 'Accepted' || req.status === 'Confirmed' || req.status === 'In Consultation' || req.status === 'In Progress';
                const isCompleted = req.status === 'Completed' || req.status === 'Verified';
                const isCancelled = req.status === 'Rejected' || req.status === 'Cancelled';

                return (
                  <tr key={targetId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.88rem', flexShrink: 0 }}>
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

                    <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                      <span style={{ fontWeight: 700, color: '#17324D', fontSize: '0.9rem', display: 'block' }}>
                        {req.scanId?.condition?.replace('_', ' ') || req.condition || 'General'}
                      </span>
                      <span style={{ fontSize: '0.76rem', color: '#00A6A6', fontWeight: 600 }}>
                        {req.scanId?.confidence || req.confidence || '0'}% AI certainty
                      </span>
                    </td>

                    <td style={{ padding: '16px 18px', verticalAlign: 'middle', color: '#475569', fontSize: '0.86rem' }}>
                      <div style={{ fontWeight: 600, color: '#17324D' }}>
                        {req.createdAt ? req.createdAt.split('T')[0] : req.date}
                      </div>
                      {req.time && <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{req.time}</div>}
                    </td>

                    <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                      <span 
                        style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 12px',
                          borderRadius: '999px',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          background: isCompleted ? '#ECFDF5' : isPending ? '#FFFBEB' : isCancelled ? '#FEF2F2' : '#F0FDFA',
                          color: isCompleted ? '#059669' : isPending ? '#B45309' : isCancelled ? '#DC2626' : '#00A6A6',
                          border: `1px solid ${isCompleted ? '#A7F3D0' : isPending ? '#FDE68A' : isCancelled ? '#FCA5A5' : '#99F6E4'}`
                        }}
                      >
                        {req.status}
                      </span>
                    </td>

                    <td style={{ padding: '16px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {/* 1. Pending: Accept, Decline, Workspace */}
                        {isPending && (
                          <>
                            <button 
                              onClick={() => handleAccept(targetId)}
                              disabled={actionLoadingId === targetId}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                background: '#10B981',
                                color: '#FFFFFF',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <CheckCircle2 size={13} /> Accept
                            </button>

                            <button 
                              onClick={() => setRejectingItem(req)}
                              disabled={actionLoadingId === targetId}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                background: '#FFFFFF',
                                color: '#DC2626',
                                border: '1px solid #FCA5A5',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <XCircle size={13} /> Decline
                            </button>

                            <Link 
                              to={`/dashboard/doctor/consultation/${targetId}`} 
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                background: '#FFFFFF',
                                color: '#17324D',
                                border: '1px solid #CBD5E1',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Eye size={13} /> View
                            </Link>
                          </>
                        )}

                        {/* 2. Accepted / In Progress: Message Patient & Workspace */}
                        {isAccepted && (
                          <>
                            <Link 
                              to={`/dashboard/doctor/consultation/${targetId}/messages`} 
                              state={{ consultationId: targetId }}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                background: '#00A6A6',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: '0 2px 8px rgba(0, 166, 166, 0.25)'
                              }}
                            >
                              <MessageSquare size={13} /> Message Patient
                            </Link>

                            <Link 
                              to={`/dashboard/doctor/consultation/${targetId}`} 
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                background: '#FFFFFF',
                                color: '#17324D',
                                border: '1px solid #CBD5E1',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Eye size={13} /> Workspace
                            </Link>
                          </>
                        )}

                        {/* 3. Completed: View Messages & Review Case */}
                        {isCompleted && (
                          <>
                            <Link 
                              to={`/dashboard/doctor/consultation/${targetId}/messages`} 
                              state={{ consultationId: targetId }}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                background: '#FFFFFF',
                                color: '#17324D',
                                border: '1px solid #CBD5E1',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <MessageSquare size={13} /> Messages
                            </Link>

                            <Link 
                              to={`/dashboard/doctor/consultation/${targetId}`} 
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                background: '#17324D',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Eye size={13} /> Case File
                            </Link>
                          </>
                        )}

                        {/* 4. Cancelled / Declined */}
                        {isCancelled && (
                          <span style={{ color: '#94A3B8', fontSize: '0.78rem', fontWeight: 600 }}>
                            Declined
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: '#64748B', fontSize: '0.92rem' }}>
                    No recent consultation activity found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decline Consultation Modal */}
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: '#FFFFFF',
                border: '1px solid #BFD4E5',
                borderRadius: '20px',
                padding: '28px',
                maxWidth: '480px',
                width: '100%',
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
                  onClick={() => { setRejectingItem(null); setRejectionReason(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '16px', lineHeight: 1.5 }}>
                Are you sure you want to decline the consultation request for <strong>{rejectingItem.patientName}</strong>?
              </p>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#17324D', marginBottom: '6px' }}>
                  Reason for declining (Optional, shared with patient)
                </label>
                <textarea 
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Doctor is fully booked at this time; please select another time slot or specialist."
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
                  onClick={() => { setRejectingItem(null); setRejectionReason(''); }}
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

export default DoctorDashboard;
