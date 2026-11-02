import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle, Calendar, Eye, CheckCircle2, BrainCircuit, MessageSquare, Activity, Lock, XCircle, X } from 'lucide-react';
import { getConsultationStatusMeta } from '../../utils/consultationStatus';
import { getSocket } from '../../utils/socket';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const DoctorConsultations = () => {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'completed', 'all'
  const [actionLoadingId, setActionLoadingId] = useState(null);
  
  // Decline modal state
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const navigate = useNavigate();
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

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

  const displayedRequests = requests.filter(r => {
    if (activeTab === 'active') {
      return ['Pending', 'Booked', 'Accepted', 'Confirmed', 'In Consultation', 'In Progress'].includes(r.status);
    } else if (activeTab === 'completed') {
      return ['Completed', 'Verified'].includes(r.status);
    }
    return true; // 'all'
  });

  const activeCount = requests.filter(r => ['Pending', 'Booked', 'Accepted', 'Confirmed', 'In Consultation', 'In Progress'].includes(r.status)).length;
  const completedCount = requests.filter(r => ['Completed', 'Verified'].includes(r.status)).length;

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header mb-6">
        <h2>Consultation Management</h2>
        <p>Review incoming patient requests, approve bookings, and communicate with patients.</p>
      </motion.div>

      <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
        <div className="card-header mb-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={24} className="text-secondary" />
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Patient Consultation Queue</h3>
          </div>

          {/* Tab Filter Controls */}
          <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-primary)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('active')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'active' ? 'var(--secondary)' : 'transparent',
                color: activeTab === 'active' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Active Queue ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'completed' ? 'var(--secondary)' : 'transparent',
                color: activeTab === 'completed' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'all' ? 'var(--secondary)' : 'transparent',
                color: activeTab === 'all' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              All Records ({requests.length})
            </button>
          </div>
        </div>

        <div className="list-group" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayedRequests.length > 0 ? (
            displayedRequests.map((req, index) => {
              const statusMeta = getConsultationStatusMeta(req.status);
              const isPending = req.status === 'Pending' || req.status === 'Booked';
              const isAccepted = req.status === 'Accepted' || req.status === 'Confirmed';
              const isInProgress = req.status === 'In Consultation' || req.status === 'In Progress';
              const isCompleted = req.status === 'Completed' || req.status === 'Verified';
              const isCancelled = req.status === 'Rejected' || req.status === 'Cancelled';
              const isLoading = actionLoadingId === req.id;

              return (
                <motion.div 
                  key={req.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.005, boxShadow: 'var(--shadow-md)' }}
                  className="list-item glass-card" 
                  style={{ alignItems: 'flex-start', padding: '1.75rem', border: '1px solid var(--border-glass)', borderRadius: '16px', background: 'var(--bg-card)' }}
                >
                  <div className="flex-1" style={{ width: '100%' }}>
                    <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: '12px' }}>
                      <div className="flex-align-center gap-3">
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 10px rgba(0, 166, 166, 0.2)' }}>
                          <UserCircle size={28} />
                        </div>
                        <div>
                          <h4 className="font-bold text-primary" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{req.patient}</h4>
                          <div className="flex-align-center gap-2 text-sm text-muted">
                            <Calendar size={14} className="text-secondary" /> {req.date}
                          </div>
                        </div>
                      </div>
                      <span className="badge" style={{ 
                        background: statusMeta.bg,
                        color: statusMeta.color,
                        border: `1px solid ${statusMeta.border}`,
                        padding: '6px 14px', fontSize: '0.85rem', fontWeight: 800
                      }}>
                        {statusMeta.label}
                      </span>
                    </div>
                    
                    <div style={{ background: 'var(--bg-dark)', borderRadius: '12px', padding: '16px', marginBottom: req.message || req.rejectionReason ? '14px' : '0', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'rgba(0, 166, 166, 0.1)', padding: '10px', borderRadius: '8px' }}>
                          <BrainCircuit size={20} className="text-secondary" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>AI Diagnosis</div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{req.condition}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Confidence</div>
                        <div style={{ fontWeight: 800, color: 'var(--secondary)', fontSize: '1.2rem' }}>{req.confidence}</div>
                      </div>
                    </div>

                    {req.message && (
                      <div style={{ background: 'rgba(255,255,255,0.5)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-glass)', borderLeft: '4px solid var(--secondary)', marginBottom: req.rejectionReason ? '12px' : '0' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Patient Note:</span>
                        <p className="text-muted" style={{ fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>"{req.message}"</p>
                      </div>
                    )}

                    {req.rejectionReason && (
                      <div style={{ background: '#fef2f2', padding: '14px 16px', borderRadius: '12px', border: '1px solid #fecaca', borderLeft: '4px solid #dc2626' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#991b1b', display: 'block', marginBottom: '4px' }}>Decline Reason:</span>
                        <p style={{ color: '#991b1b', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>"{req.rejectionReason}"</p>
                      </div>
                    )}
                  </div>

                  {/* Consultation Card Workflow Action Buttons */}
                  <div className="action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '190px', marginLeft: '2rem' }}>
                    
                    {/* 1. Pending: Confirm Request, Reject Request, Open Workspace, Open Chat */}
                    {isPending && (
                      <>
                        <button 
                          onClick={() => handleAccept(req.id)}
                          disabled={isLoading}
                          className="btn btn-primary flex-align-center justify-center gap-2 font-bold" 
                          style={{ padding: '10px' }}
                        >
                          <CheckCircle2 size={18} /> Accept Consultation
                        </button>

                        <button 
                          onClick={() => setRejectingItem(req)}
                          disabled={isLoading}
                          className="btn btn-outline flex-align-center justify-center gap-2 font-semibold" 
                          style={{ padding: '10px', color: '#dc2626', borderColor: '#fca5a5' }}
                        >
                          <XCircle size={18} /> Reject Request
                        </button>

                        <Link 
                          to={`/dashboard/doctor/consultation/${req.id}`} 
                          className="btn btn-outline flex-align-center justify-center gap-2 font-semibold" 
                          style={{ padding: '10px', color: '#0f172a', borderColor: '#cbd5e1' }}
                        >
                          <Eye size={18} /> Open Workspace
                        </Link>

                        <Link 
                          to={`/dashboard/doctor/consultation/${req.id}/messages`} 
                          state={{ consultationId: req.id }} 
                          className="btn btn-outline flex-align-center justify-center gap-2 font-semibold" 
                          style={{ padding: '10px', color: '#1677FF', borderColor: '#93c5fd' }}
                        >
                          <MessageSquare size={18} /> Open Chat
                        </Link>
                      </>
                    )}

                    {/* 2. Accepted: Start Consultation & Message Patient */}
                    {isAccepted && (
                      <>
                        <button 
                          onClick={() => handleStartConsultation(req.id)}
                          disabled={isLoading}
                          className="btn btn-success flex-align-center justify-center gap-2 pulse-glow font-bold" 
                          style={{ padding: '10px' }}
                        >
                          <CheckCircle2 size={18} /> Start Consultation
                        </button>

                        <Link 
                          to={`/dashboard/doctor/consultation/${req.id}/messages`} 
                          state={{ consultationId: req.id }} 
                          className="btn btn-primary flex-align-center justify-center gap-2 font-bold" 
                          style={{ padding: '10px' }}
                        >
                          <MessageSquare size={18} /> Message Patient
                        </Link>
                      </>
                    )}

                    {/* 3. In Progress: Workspace & Message Patient */}
                    {isInProgress && (
                      <>
                        <Link 
                          to={`/dashboard/doctor/consultation/${req.id}`} 
                          className="btn btn-success flex-align-center justify-center gap-2 font-bold" 
                          style={{ padding: '10px' }}
                        >
                          <Activity size={18} /> Continue Workspace
                        </Link>

                        <Link 
                          to={`/dashboard/doctor/consultation/${req.id}/messages`} 
                          state={{ consultationId: req.id }} 
                          className="btn btn-primary flex-align-center justify-center gap-2 font-bold" 
                          style={{ padding: '10px' }}
                        >
                          <MessageSquare size={18} /> Message Patient
                        </Link>
                      </>
                    )}

                    {/* 4. Completed: Open Workspace & View Messages */}
                    {isCompleted && (
                      <>
                        <Link 
                          to={`/dashboard/doctor/consultation/${req.id}`} 
                          className="btn btn-primary flex-align-center justify-center gap-2 font-bold" 
                          style={{ padding: '10px' }}
                        >
                          <Eye size={18} /> View Summary
                        </Link>

                        <Link 
                          to={`/dashboard/doctor/consultation/${req.id}/messages`} 
                          state={{ consultationId: req.id }} 
                          className="btn btn-outline flex-align-center justify-center gap-2 font-semibold" 
                          style={{ padding: '10px' }}
                        >
                          <MessageSquare size={18} /> View Messages
                        </Link>
                      </>
                    )}

                    {/* Cancelled / Rejected: View details and chat history */}
                    {isCancelled && (
                      <>
                        <Link 
                          to={`/dashboard/doctor/consultation/${req.id}`} 
                          className="btn btn-outline flex-align-center justify-center gap-2 font-semibold" 
                          style={{ padding: '10px', color: '#0f172a', borderColor: '#cbd5e1' }}
                        >
                          <Eye size={18} /> View Case
                        </Link>

                        <Link 
                          to={`/dashboard/doctor/consultation/${req.id}/messages`} 
                          state={{ consultationId: req.id }} 
                          className="btn btn-outline flex-align-center justify-center gap-2 font-semibold" 
                          style={{ padding: '10px', color: '#64748b', borderColor: '#cbd5e1' }}
                        >
                          <MessageSquare size={18} /> View Messages
                        </Link>
                      </>
                    )}

                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center text-muted" style={{ padding: '3rem', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
              <CheckCircle2 size={48} className="text-success mx-auto mb-4 opacity-50" />
              <h3 className="font-bold text-primary mb-2">No Consultations Found</h3>
              <p>There are no consultation records currently in this category.</p>
            </div>
          )}
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
                Are you sure you want to decline the consultation request for <strong>{rejectingItem.patient}</strong>?
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Reason for declining (Optional, sent to patient)
                </label>
                <textarea 
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Doctor is unavailable at this scheduled time; please select another time slot or doctor."
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

export default DoctorConsultations;
