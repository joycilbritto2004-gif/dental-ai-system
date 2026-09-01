import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCircle, Calendar, Eye, CheckCircle2, XCircle, BrainCircuit, MessageSquare, CreditCard, Activity } from 'lucide-react';
import '../Dashboard.css';

const DoctorConsultations = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const DOCTOR_ID = "3";
        const res = await fetch(`http://localhost:5000/api/consultations?doctorId=${DOCTOR_ID}`);
        if (!res.ok) throw new Error('Failed to fetch consultations');
        const myConsultations = await res.json();
        
        const formatted = myConsultations
          .filter(c => c.status === 'Accepted' || c.status === 'In Consultation')
          .map(c => ({
            id: c.id,
            patient: c.patientName,
            condition: c.condition,
            confidence: c.confidence,
            date: `${c.date} at ${c.time}`,
            status: c.status,
            message: c.message
          }));

        formatted.sort((a, b) => new Date(b.id) - new Date(a.id));
        setRequests(formatted);
      } catch (err) {
        console.error(err);
      }
    };
    fetchConsultations();
  }, []);

  const handleAction = async (id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/consultations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
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
            {requests.length > 0 ? (
              requests.map((req, index) => (
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
                        background: req.status === 'Accepted' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: req.status === 'Accepted' ? '#2563eb' : '#059669',
                        border: `1px solid ${req.status === 'Accepted' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
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
                    {req.status === 'Accepted' ? (
                      <button 
                        onClick={async () => {
                          try {
                            const res = await fetch(`http://localhost:5000/api/consultations/${req.id}/start`, { method: 'PUT' });
                            if (!res.ok) throw new Error('Failed to start');
                            window.location.href = `/dashboard/doctor/consultation/${req.id}`;
                          } catch (e) {
                            console.error(e);
                            alert('Failed to start consultation.');
                          }
                        }}
                        className="btn btn-success flex-align-center justify-center gap-2 pulse-glow" 
                        style={{ padding: '10px' }}
                      >
                        <CheckCircle2 size={18} /> Start Consultation
                      </button>
                    ) : (
                      <>
                        <Link to={`/dashboard/doctor/consultation/${req.id}`} className="btn btn-primary flex-align-center justify-center gap-2" style={{ padding: '10px' }}>
                          <Eye size={18} /> Open Workspace
                        </Link>
                        <Link to="/dashboard/doctor/messages" state={{ consultationId: req.id }} className="btn btn-outline flex-align-center justify-center gap-2" style={{ padding: '10px' }}>
                          <MessageSquare size={18} /> Message Patient
                        </Link>
                      </>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center text-muted" style={{ padding: '3rem', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
                <CheckCircle2 size={48} className="text-success mx-auto mb-4 opacity-50" />
                <h3 className="font-bold text-primary mb-2">No Active Requests</h3>
                <p>You have caught up with all patient consultation requests.</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  export default DoctorConsultations;
