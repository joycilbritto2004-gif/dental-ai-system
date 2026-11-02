import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Clock, CheckCircle2, AlertTriangle, UserCircle, Activity, 
  BrainCircuit, Eye, LineChart as LineChartIcon, PieChart as PieChartIcon, 
  BarChart as BarChartIcon, MessageSquare, XCircle, X, Calendar, Lock 
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

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view animate-fade-in" initial="hidden" animate="show" variants={stagger}>
      {currentUser?.verificationStatus !== 'Approved' && (
        <div className="alert mb-6" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #F59E0B', color: '#F59E0B', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={20} />
          <div>
            <strong>Account Pending Approval</strong>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Your doctor account is currently pending administrative review. You cannot accept new consultations until you are approved.</p>
          </div>
        </div>
      )}

      {/* 1. Header */}
      <motion.div variants={item} className="dashboard-header mb-6">
        <h2>Doctor Analytics & Consultations</h2>
        <p>Welcome back, Dr. {currentUser?.name?.split(' ')[1] || 'Doctor'}. Review incoming consultation requests and patient diagnostics.</p>
      </motion.div>

      {/* 2. Statistics Cards */}
      <motion.div variants={item} className="kpi-grid mb-6">
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid #1677FF' }}>
          <div className="kpi-icon text-white" style={{ borderRadius: '12px', background: 'rgba(22, 119, 255, 0.1)', color: '#1677FF' }}><Activity size={28} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">{stats.total}</span>
            <span className="kpi-label">Total Cases</span>
          </div>
        </div>
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid #F59E0B' }}>
          <div className="kpi-icon bg-warning-light text-warning" style={{ borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}><Clock size={28} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">{stats.pending}</span>
            <span className="kpi-label">Pending Approval</span>
          </div>
        </div>
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid #16A34A' }}>
          <div className="kpi-icon bg-success-light text-success" style={{ borderRadius: '12px', background: 'rgba(22, 163, 74, 0.1)', color: '#16A34A' }}><CheckCircle2 size={28} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">{stats.completed}</span>
            <span className="kpi-label">Completed</span>
          </div>
        </div>
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid #00A6A6' }}>
          <div className="kpi-icon text-white" style={{ borderRadius: '12px', background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6' }}><BrainCircuit size={28} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">{stats.avgConfidence}%</span>
            <span className="kpi-label">Avg AI Confidence</span>
          </div>
        </div>
      </motion.div>

      {/* 3. Dedicated Pending Consultation Approvals Queue */}
      {pendingConsultations.length > 0 && (
        <motion.div variants={item} className="mb-6">
          <div className="card glass-card" style={{ padding: '1.75rem', border: '1px solid rgba(245, 158, 11, 0.35)', background: 'linear-gradient(180deg, rgba(254, 243, 199, 0.25) 0%, rgba(255, 255, 255, 0.8) 100%)', borderRadius: '18px' }}>
            <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <div className="flex-align-center gap-2">
                <Clock size={22} color="#d97706" />
                <h3 className="font-extrabold text-slate-900" style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
                  Pending Consultation Requests
                </h3>
                <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 800 }}>
                  {pendingConsultations.length} Awaiting Approval
                </span>
              </div>
              <Link to="/dashboard/doctor/consultations" className="btn btn-outline btn-sm font-semibold" style={{ color: '#0f172a', borderColor: '#cbd5e1' }}>
                View All Consultations
              </Link>
            </div>

            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 16px 0' }}>
              These patients have booked consultations with you. Accept to confirm their booking and unlock direct messaging.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {pendingConsultations.map((c) => {
                const targetId = c.id || c._id;
                const isLoading = actionLoadingId === targetId;

                return (
                  <div 
                    key={targetId}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '16px 18px',
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div className="flex-between mb-2">
                        <div className="flex-align-center gap-2">
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserCircle size={22} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900" style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>{c.patientName}</h4>
                            <span className="text-xs text-slate-500" style={{ color: '#64748b' }}>
                              <Calendar size={12} style={{ display: 'inline', marginRight: '3px' }} />
                              {c.date} {c.time && `at ${c.time}`}
                            </span>
                          </div>
                        </div>
                        <span className="badge" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.75rem', fontWeight: 700 }}>
                          {c.status}
                        </span>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                        <div className="flex-between">
                          <span className="text-xs font-semibold text-slate-500">Condition:</span>
                          <span className="text-xs font-bold text-slate-800">{c.scanId?.condition?.replace('_', ' ') || c.condition || 'General Dental'}</span>
                        </div>
                        <div className="flex-between" style={{ marginTop: '4px' }}>
                          <span className="text-xs font-semibold text-slate-500">AI Confidence:</span>
                          <span className="text-xs font-bold text-teal-600" style={{ color: '#00A6A6' }}>{c.scanId?.confidence || c.confidence || 'N/A'}%</span>
                        </div>
                        {c.message && (
                          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', fontStyle: 'italic' }}>
                              "{c.message}"
                            </p>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontSize: '0.78rem', fontStyle: 'italic' }}>
                        <Lock size={12} /> Messaging locked until acceptance
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                      <button
                        onClick={() => handleAccept(targetId)}
                        disabled={isLoading}
                        className="btn btn-success btn-sm flex-align-center gap-1 font-bold"
                        style={{ padding: '8px 14px', borderRadius: '8px' }}
                      >
                        <CheckCircle2 size={16} /> Accept Consultation
                      </button>

                      <button
                        onClick={() => setRejectingItem(c)}
                        disabled={isLoading}
                        className="btn btn-outline btn-sm flex-align-center gap-1 font-semibold"
                        style={{ padding: '8px 12px', borderRadius: '8px', color: '#dc2626', borderColor: '#fca5a5' }}
                      >
                        <XCircle size={16} /> Decline
                      </button>

                      <Link
                        to={`/dashboard/doctor/consultation/${targetId}`}
                        className="btn btn-outline btn-sm flex-align-center gap-1 font-semibold"
                        style={{ marginLeft: 'auto', padding: '8px 12px', borderRadius: '8px', color: '#0f172a', borderColor: '#cbd5e1' }}
                      >
                        <Eye size={15} /> Workspace
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* 4. Analytics Charts Grid */}
      <motion.div variants={item} className="dashboard-grid mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        
        {/* Status Distribution */}
        <div className="card glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 className="font-bold text-primary mb-4 flex-align-center gap-2" style={{ fontSize: '1.1rem' }}>
            <PieChartIcon size={20} className="text-secondary" /> Status Distribution
          </h3>
          <div style={{ flex: 1, minHeight: '250px' }}>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-align-center justify-center text-muted" style={{ height: '100%' }}>No data available</div>
            )}
          </div>
        </div>

        {/* Top Conditions */}
        <div className="card glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 className="font-bold text-primary mb-4 flex-align-center gap-2" style={{ fontSize: '1.1rem' }}>
            <BarChartIcon size={20} className="text-secondary" /> Common Conditions
          </h3>
          <div style={{ flex: 1, minHeight: '250px' }}>
            {conditionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conditionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(0, 166, 166, 0.05)' }} />
                  <Bar dataKey="count" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-align-center justify-center text-muted" style={{ height: '100%' }}>No data available</div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="card glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 className="font-bold text-primary mb-4 flex-align-center gap-2" style={{ fontSize: '1.1rem' }}>
            <LineChartIcon size={20} className="text-secondary" /> Case Volume
          </h3>
          <div style={{ flex: 1, minHeight: '250px' }}>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Consultations" stroke="var(--secondary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--secondary)' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-align-center justify-center text-muted" style={{ height: '100%' }}>No data available</div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 5. Recent Activity Table with Interactive Actions */}
      <motion.div variants={item}>
        <div className="card glass-card" style={{ padding: '2rem' }}>
          <div className="card-header mb-6 flex-between">
            <h3 className="font-bold text-primary" style={{ fontSize: '1.25rem' }}>Recent Patient Consultations</h3>
            <Link to="/dashboard/doctor/consultations" className="btn btn-outline btn-sm">View All</Link>
          </div>
          
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>AI Prediction</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Workflow Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.length > 0 ? recentActivity.map(req => {
                  const targetId = req.id || req._id;
                  const isPending = req.status === 'Pending' || req.status === 'Booked';
                  const isAccepted = req.status === 'Accepted' || req.status === 'Confirmed' || req.status === 'In Consultation' || req.status === 'In Progress';
                  const isCompleted = req.status === 'Completed' || req.status === 'Verified';
                  const isCancelled = req.status === 'Rejected' || req.status === 'Cancelled';

                  return (
                    <motion.tr key={targetId} whileHover={{ backgroundColor: 'rgba(0, 166, 166, 0.05)' }}>
                      <td>
                        <div className="flex-align-center gap-3">
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0, 166, 166, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A6A6' }}>
                            <UserCircle size={20} />
                          </div>
                          <div>
                            <span className="font-bold text-primary block">{req.patientName}</span>
                            <span className="text-xs text-muted">ID: P-{targetId ? targetId.toString().substring(0, 6) : '00000'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-main font-bold">{req.scanId?.condition?.replace('_', ' ') || req.condition || 'N/A'}</span>
                        <div className="text-xs text-muted">{req.scanId?.confidence || req.confidence || '0'}% conf.</div>
                      </td>
                      <td className="text-muted">
                        <div>{req.createdAt ? req.createdAt.split('T')[0] : req.date}</div>
                        {req.time && <div className="text-xs text-slate-500">{req.time}</div>}
                      </td>
                      <td>
                        <span className={`badge badge-${isCompleted ? 'success' : isPending ? 'warning' : isCancelled ? 'danger' : 'primary'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {/* 1. Pending: Accept, Decline, Workspace */}
                          {isPending && (
                            <>
                              <button 
                                onClick={() => handleAccept(targetId)}
                                disabled={actionLoadingId === targetId}
                                className="btn btn-success btn-sm flex-align-center gap-1 font-bold"
                                style={{ padding: '6px 10px' }}
                                title="Accept consultation request"
                              >
                                <CheckCircle2 size={14} /> Accept
                              </button>

                              <button 
                                onClick={() => setRejectingItem(req)}
                                disabled={actionLoadingId === targetId}
                                className="btn btn-outline btn-sm flex-align-center gap-1 font-semibold"
                                style={{ padding: '6px 10px', color: '#dc2626', borderColor: '#fca5a5' }}
                                title="Decline consultation request"
                              >
                                <XCircle size={14} /> Decline
                              </button>

                              <Link 
                                to={`/dashboard/doctor/consultation/${targetId}`} 
                                className="btn btn-outline btn-sm flex-align-center gap-1 font-semibold"
                                style={{ padding: '6px 10px', color: '#0f172a', borderColor: '#cbd5e1' }}
                              >
                                <Eye size={14} /> View
                              </Link>
                            </>
                          )}

                          {/* 2. Accepted / In Progress: Message Patient & Workspace */}
                          {isAccepted && (
                            <>
                              <Link 
                                to={`/dashboard/doctor/consultation/${targetId}/messages`} 
                                state={{ consultationId: targetId }}
                                className="btn btn-primary btn-sm flex-align-center gap-1 font-bold"
                                style={{ padding: '6px 12px' }}
                              >
                                <MessageSquare size={14} /> Message Patient
                              </Link>

                              <Link 
                                to={`/dashboard/doctor/consultation/${targetId}`} 
                                className="btn btn-outline btn-sm flex-align-center gap-1 font-semibold"
                                style={{ padding: '6px 10px', color: '#0f172a', borderColor: '#cbd5e1' }}
                              >
                                <Eye size={14} /> Workspace
                              </Link>
                            </>
                          )}

                          {/* 3. Completed: View Messages & Review Case */}
                          {isCompleted && (
                            <>
                              <Link 
                                to={`/dashboard/doctor/consultation/${targetId}/messages`} 
                                state={{ consultationId: targetId }}
                                className="btn btn-outline btn-sm flex-align-center gap-1 font-semibold"
                                style={{ padding: '6px 10px', color: '#0f172a', borderColor: '#cbd5e1' }}
                              >
                                <MessageSquare size={14} /> View Messages
                              </Link>

                              <Link 
                                to={`/dashboard/doctor/consultation/${targetId}`} 
                                className="btn btn-primary btn-sm flex-align-center gap-1 font-bold"
                                style={{ padding: '6px 12px' }}
                              >
                                <Eye size={14} /> View Case
                              </Link>
                            </>
                          )}

                          {/* 4. Cancelled / Rejected */}
                          {isCancelled && (
                            <span className="text-muted text-xs font-semibold" style={{ color: '#94a3b8' }}>
                              Declined
                            </span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted" style={{ padding: '2rem' }}>No recent activity.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Decline Consultation Modal */}
      <AnimatePresence>
        {rejectingItem && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
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
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '16px',
                padding: '24px 28px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="flex-between mb-3">
                <div className="flex-align-center gap-2">
                  <XCircle size={22} color="#dc2626" />
                  <h3 className="font-extrabold text-slate-900" style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                    Decline Consultation Request
                  </h3>
                </div>
                <button 
                  onClick={() => { setRejectingItem(null); setRejectionReason(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '14px', lineHeight: 1.5 }}>
                Are you sure you want to decline the consultation request for <strong>{rejectingItem.patientName}</strong>?
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Reason for declining (Optional, shared with patient)
                </label>
                <textarea 
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Doctor is fully booked at this time; please select another time slot or specialist."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  onClick={() => { setRejectingItem(null); setRejectionReason(''); }}
                  className="btn btn-outline font-semibold"
                  style={{ color: '#475569', borderColor: '#cbd5e1' }}
                  disabled={isRejecting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmReject}
                  className="btn btn-primary font-bold"
                  style={{ background: '#dc2626', borderColor: '#dc2626', color: '#ffffff' }}
                  disabled={isRejecting}
                >
                  {isRejecting ? 'Declining...' : 'Confirm Decline'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default DoctorDashboard;
