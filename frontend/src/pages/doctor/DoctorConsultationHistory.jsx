import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, History, Eye, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../Dashboard.css';

const DoctorConsultationHistory = () => {
  const [historyCases, setHistoryCases] = useState([]);

  useEffect(() => {
    try {
      const DOCTOR_ID = "1";
      const stored = JSON.parse(localStorage.getItem('dental_consultations') || '[]');
      
      const myHistory = stored.filter(c => c.doctorId === DOCTOR_ID && (
        c.status === "Completed" || 
        c.status === "Verified" || 
        c.status === "Rejected"
      ));
      
      myHistory.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setHistoryCases(myHistory);
    } catch (e) {
      console.error("Error loading history:", e);
    }
  }, []);

  const getStatusBadge = (status) => {
    if (status === 'Completed' || status === 'Verified') {
      return { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: 'rgba(16, 185, 129, 0.3)' };
    }
    if (status === 'Rejected') {
      return { bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: 'rgba(239, 68, 68, 0.3)' };
    }
    return { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: 'rgba(245, 158, 11, 0.3)' };
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header mb-6">
        <h2>Consultation History</h2>
        <p>A complete log of your past and finalized consultations.</p>
      </motion.div>

      <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
        <div className="card-header mb-6 flex-between">
          <h3 className="flex-align-center gap-2 text-primary">
            <History size={24} className="text-secondary" /> Past Consultations
          </h3>
        </div>

        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Diagnosis / Reason</th>
                <th>Date</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {historyCases.length > 0 ? (
                historyCases.map(req => {
                  const badge = getStatusBadge(req.status);
                  return (
                    <motion.tr key={req.id} whileHover={{ backgroundColor: 'rgba(0, 210, 255, 0.05)' }}>
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
                      <td className="text-main">{req.finalDiagnosis || req.condition}</td>
                      <td>
                        <div className="flex-align-center gap-1 text-muted">
                          <Calendar size={14} /> {req.date}
                        </div>
                      </td>
                      <td className="font-bold">₹{req.fee || req.totalAmount || 0}</td>
                      <td>
                        <span className="badge" style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/dashboard/doctor/consultation/${req.id}`} className="btn btn-outline btn-sm flex-align-center gap-1">
                          <Eye size={14} /> View
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted" style={{ padding: '3rem' }}>
                    No consultation history available.
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

export default DoctorConsultationHistory;
