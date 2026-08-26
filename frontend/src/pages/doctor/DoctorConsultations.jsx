import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCircle, Calendar, Eye, CheckCircle2, XCircle, BrainCircuit, MessageSquare, CreditCard, Activity } from 'lucide-react';
import '../Dashboard.css';

const initialRequests = [
  {
    id: 1,
    patient: "Jane Doe",
    condition: "Caries",
    confidence: "92%",
    date: "Today, 10:30 AM",
    status: "Pending Request",
    message: "I have been experiencing pain in my lower right tooth..."
  },
  {
    id: 2,
    patient: "Michael Johnson",
    condition: "Calculus",
    confidence: "85%",
    date: "Yesterday, 04:15 PM",
    status: "Accepted",
    message: "Routine checkup based on AI report."
  }
];

const DoctorConsultations = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const DOCTOR_ID = "1";
    const stored = JSON.parse(localStorage.getItem('dental_consultations') || '[]');
    const myConsultations = stored.filter(req => req.doctorId === DOCTOR_ID);
    
    const formatted = myConsultations.map(c => ({
      id: c.id,
      patient: c.patientName,
      condition: c.condition,
      confidence: c.confidence,
      date: `${c.date} at ${c.time}`,
      status: c.status,
      message: c.message
    }));

    // Sort to show newest first
    formatted.sort((a, b) => new Date(b.id) - new Date(a.id));

    if (formatted.length > 0) {
      setRequests(formatted);
    } else {
      setRequests(initialRequests);
    }
  }, []);

  const handleAction = (id, newStatus) => {
    setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
    
    const stored = JSON.parse(localStorage.getItem('dental_consultations') || '[]');
    const updated = stored.map(c => c.id === id ? { ...c, status: newStatus } : c);
    localStorage.setItem('dental_consultations', JSON.stringify(updated));
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header mb-6">
        <h2>Consultation Dashboard</h2>
        <p>Review incoming patient requests pre-screened by our diagnostic AI.</p>
      </motion.div>

      <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
        <div className="card-header mb-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={24} className="text-secondary" /> Active Patient Queue
          </h3>
          <span className="badge" style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--secondary)', border: '1px solid rgba(0, 210, 255, 0.3)' }}>
            {requests.length} Requests
          </span>
        </div>

        <div className="list-group" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {requests.map((req, index) => (
            <motion.div 
              key={req.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01, boxShadow: 'var(--shadow-md)' }}
              className="list-item glass-card" 
              style={{ alignItems: 'flex-start', padding: '1.5rem', border: '1px solid var(--border-glass)', borderRadius: '16px', background: 'var(--bg-card)' }}
            >
              <div className="flex-1">
                <div className="flex-between mb-3">
                  <div className="flex-align-center gap-3">
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 10px rgba(0, 210, 255, 0.2)' }}>
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
                    background: req.status === 'Pending Request' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: req.status === 'Pending Request' ? '#d97706' : '#059669',
                    border: `1px solid ${req.status === 'Pending Request' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    padding: '6px 12px', fontSize: '0.85rem'
                  }}>
                    {req.status}
                  </span>
                </div>
                
                <div style={{ background: 'var(--bg-dark)', borderRadius: '12px', padding: '16px', marginBottom: req.message ? '16px' : '0', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(0, 210, 255, 0.1)', padding: '10px', borderRadius: '8px' }}>
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
                  <div style={{ background: 'rgba(255,255,255,0.5)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)', borderLeft: '4px solid var(--secondary)' }}>
                    <p className="text-muted" style={{ fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>"{req.message}"</p>
                  </div>
                )}
              </div>

              <div className="action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '180px', marginLeft: '2rem' }}>
                {req.status === 'Pending Request' ? (
                  <>
                    <button onClick={() => handleAction(req.id, 'Accepted')} className="btn btn-success flex-align-center justify-center gap-2 pulse-glow" style={{ padding: '10px' }}>
                      <CheckCircle2 size={18} /> Accept Case
                    </button>
                    <button onClick={() => handleAction(req.id, 'Rejected')} className="btn btn-outline flex-align-center justify-center gap-2 text-danger" style={{ padding: '10px' }}>
                      <XCircle size={18} /> Decline
                    </button>
                  </>
                ) : (
                  <>
                    <Link to={`/dashboard/doctor/consultation/${req.id}`} className="btn btn-primary flex-align-center justify-center gap-2" style={{ padding: '10px' }}>
                      <Eye size={18} /> Open Workspace
                    </Link>
                    <Link to="/dashboard/doctor/messages" className="btn btn-outline flex-align-center justify-center gap-2" style={{ padding: '10px' }}>
                      <MessageSquare size={18} /> Message Patient
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DoctorConsultations;
