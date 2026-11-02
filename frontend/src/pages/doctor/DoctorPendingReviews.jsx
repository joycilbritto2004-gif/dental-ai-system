import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCircle, Calendar, Eye, Activity, CheckCircle2, XCircle, X, AlertTriangle } from 'lucide-react';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const DoctorPendingReviews = () => {
  const [requests, setRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    const userStr = localStorage.getItem('dentaai_user');
    return userStr ? JSON.parse(userStr) : null;
  });

  // Rejection modal state
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('dentaai_user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    if (user && (user._id || user.id)) {
      fetch(`${API_BASE}/api/doctors/${user._id || user.id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.message) {
            setCurrentUser(prev => ({ ...prev, verificationStatus: data.verificationStatus }));
          }
        })
        .catch(console.error);
    }
  }, []);

  const fetchPending = async () => {
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
      if (!res.ok) throw new Error('Failed to fetch');
      const stored = await res.json();
      const myPending = stored.filter(c => c.status === "Pending" || c.status === "Booked");
      
      myPending.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setRequests(myPending);
    } catch (e) {
      console.error("Error loading pending reviews:", e);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAccept = async (reqId) => {
    if (currentUser?.verificationStatus !== 'Approved') {
      alert('Your account is pending approval. You cannot accept new consultations yet.');
      return;
    }
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
      setRequests(prev => prev.map(r => ((r.id === reqId || r._id === reqId) ? { ...r, status: 'Accepted' } : r)));
    } catch (e) {
      console.error(e);
      alert('Failed to accept consultation.');
    }
  };

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

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header mb-6">
        <h2>Pending Reviews</h2>
        <p>Cases awaiting your clinical verification based on AI diagnostic results.</p>
      </motion.div>

      <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
        <div className="card-header mb-6 flex-between">
          <h3 className="flex-align-center gap-2 text-primary">
            <Activity size={24} className="text-secondary" /> Awaiting Verification
          </h3>
          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            {requests.length} Reviews Pending
          </span>
        </div>

        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>AI Prediction</th>
                <th>Confidence</th>
                <th>Requested On</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map(req => (
                  <motion.tr key={req.id} whileHover={{ backgroundColor: 'rgba(0, 166, 166, 0.05)' }}>
                    <td>
                      <div className="flex-align-center gap-3">
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                          <UserCircle size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-primary">{req.patientName}</div>
                          <div className="text-sm text-muted">ID: P-{req.id ? req.id.substring(0, 5) : '00000'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-main font-bold">{req.condition}</td>
                    <td>
                      <span className="confidence-pill" style={{ background: 'rgba(0, 166, 166, 0.1)', color: 'var(--secondary)' }}>{req.confidence}</span>
                    </td>
                    <td>
                      <div className="flex-align-center gap-1 text-muted">
                        <Calendar size={14} /> {req.date} {req.time}
                      </div>
                    </td>
                    <td><span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' }}>{req.status}</span></td>
                    <td>
                      {req.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => handleAccept(req.id)}
                            className={`btn btn-sm flex-align-center gap-1 ${currentUser?.verificationStatus === 'Approved' ? 'btn-primary' : 'btn-outline'}`}
                            disabled={currentUser?.verificationStatus !== 'Approved'}
                            style={{ opacity: currentUser?.verificationStatus !== 'Approved' ? 0.5 : 1 }}
                          >
                            <CheckCircle2 size={14} /> Accept
                          </button>
                          <button
                            onClick={() => {
                              setRejectingItem(req);
                              setRejectionReason('');
                            }}
                            className="btn btn-sm btn-outline flex-align-center gap-1"
                            style={{ borderColor: 'rgba(220, 38, 38, 0.4)', color: '#dc2626' }}
                          >
                            <XCircle size={14} /> Decline
                          </button>
                          <Link 
                            to={`/dashboard/doctor/consultation/${req.id || req._id}`} 
                            className="btn btn-sm btn-outline flex-align-center gap-1 font-semibold"
                            style={{ borderColor: '#cbd5e1', color: '#0f172a' }}
                          >
                            <Eye size={14} /> View Case
                          </Link>
                        </div>
                      ) : (
                        <Link 
                          to={`/dashboard/doctor/consultation/${req.id}`} 
                          className="btn btn-secondary btn-sm flex-align-center gap-1"
                        >
                          <Eye size={14} /> Review Case
                        </Link>
                      )}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted" style={{ padding: '3rem' }}>
                    Great job! You have no pending reviews at the moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* REJECTION CONFIRMATION MODAL */}
      {rejectingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card glass-card"
            style={{
              background: 'var(--bg-card)',
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="flex-between mb-4 pb-3 border-b">
              <h3 className="font-bold flex-align-center gap-2" style={{ color: '#dc2626', margin: 0 }}>
                <AlertTriangle size={22} /> Decline Consultation Request
              </h3>
              <button 
                onClick={() => setRejectingItem(null)} 
                className="btn btn-icon" 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-main)', marginBottom: '16px', lineHeight: 1.5 }}>
              Are you sure you want to decline the consultation request from <strong>{rejectingItem.patientName}</strong>?
            </p>

            <div className="form-group mb-4">
              <label className="form-label font-bold text-primary" style={{ display: 'block', marginBottom: '6px' }}>
                Reason for Declining (Optional):
              </label>
              <textarea 
                className="form-input" 
                rows="3"
                placeholder="e.g. Schedule conflict, case requires in-person examination, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{ width: '100%', resize: 'vertical', padding: '10px', borderRadius: '8px' }}
              />
            </div>

            <div className="flex-between gap-3 mt-6">
              <button 
                onClick={() => setRejectingItem(null)}
                className="btn btn-outline"
                style={{ flex: 1 }}
                disabled={isRejecting}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmReject}
                className="btn"
                style={{ flex: 1, background: '#dc2626', color: 'white', border: 'none', fontWeight: 'bold' }}
                disabled={isRejecting}
              >
                {isRejecting ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default DoctorPendingReviews;
