import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCircle, Calendar, Eye, Activity, CheckCircle2 } from 'lucide-react';
import '../Dashboard.css';

const DoctorPendingReviews = () => {
  const [requests, setRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    const userStr = localStorage.getItem('dentaai_user');
    return userStr ? JSON.parse(userStr) : null;
  });

  useEffect(() => {
    const userStr = localStorage.getItem('dentaai_user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    if (user && (user._id || user.id)) {
      fetch(`http://localhost:5000/api/doctors/${user._id || user.id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.message) {
            setCurrentUser(prev => ({ ...prev, verificationStatus: data.verificationStatus }));
          }
        })
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const userStr = localStorage.getItem('dentaai_user');
        let DOCTOR_ID = null;
        if (userStr) {
          const user = JSON.parse(userStr);
          DOCTOR_ID = user._id || user.id ;
        }
        const res = await fetch(`http://localhost:5000/api/consultations?doctorId=${DOCTOR_ID}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const stored = await res.json();
        const myPending = stored.filter(c => c.status === "Pending");
        
        myPending.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setRequests(myPending);
      } catch (e) {
        console.error("Error loading pending reviews:", e);
      }
    };
    fetchPending();
  }, []);

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
                          <div className="text-sm text-muted">ID: P-{req.id.substring(0, 5)}</div>
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
                        <button 
                          onClick={async () => {
                            if (currentUser?.verificationStatus !== 'Approved') {
                              alert('Your account is pending approval. You cannot accept new consultations yet.');
                              return;
                            }
                            try {
                              const res = await fetch(`http://localhost:5000/api/consultations/${req.id}/accept`, {
                                method: 'PUT'
                              });
                              if (!res.ok) throw new Error('Failed to accept consultation');
                              setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'Accepted' } : r));
                            } catch (e) {
                              console.error(e);
                              alert('Failed to accept consultation.');
                            }
                          }}
                          className={`btn btn-sm flex-align-center gap-1 ${currentUser?.verificationStatus === 'Approved' ? 'btn-primary' : 'btn-outline'}`}
                          disabled={currentUser?.verificationStatus !== 'Approved'}
                          style={{ opacity: currentUser?.verificationStatus !== 'Approved' ? 0.5 : 1 }}
                        >
                          <CheckCircle2 size={14} /> Accept Consultation
                        </button>
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
    </motion.div>
  );
};

export default DoctorPendingReviews;
