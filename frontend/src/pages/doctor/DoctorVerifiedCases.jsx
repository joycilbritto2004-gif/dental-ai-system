import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCircle, Calendar, Eye, CheckCircle2 } from 'lucide-react';
import '../Dashboard.css';

const DoctorVerifiedCases = () => {
  const [verifiedCases, setVerifiedCases] = useState([]);

  useEffect(() => {
    const fetchVerified = async () => {
      try {
        const DOCTOR_ID = "3";
        const res = await fetch(`http://localhost:5000/api/consultations?doctorId=${DOCTOR_ID}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const stored = await res.json();
        
        const myVerified = stored.filter(c => c.status === "Verified" || c.status === "Completed");
        
        myVerified.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setVerifiedCases(myVerified);
      } catch (e) {
        console.error("Error loading verified cases:", e);
      }
    };
    fetchVerified();
  }, []);

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header mb-6">
        <h2>Verified Cases</h2>
        <p>A history of all AI predictions you have clinically reviewed and finalized.</p>
      </motion.div>

      <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
        <div className="card-header mb-6 flex-between">
          <h3 className="flex-align-center gap-2 text-primary">
            <CheckCircle2 size={24} className="text-success" /> Verified Diagnostics
          </h3>
          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            {verifiedCases.length} Total Verified
          </span>
        </div>

        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Final Diagnosis</th>
                <th>Original AI Suggestion</th>
                <th>Date Verified</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {verifiedCases.length > 0 ? (
                verifiedCases.map(req => (
                  <motion.tr key={req.id} whileHover={{ backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
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
                    <td className="text-success font-bold">{req.finalDiagnosis || req.condition}</td>
                    <td className="text-muted text-sm">{req.condition} ({req.confidence})</td>
                    <td>
                      <div className="flex-align-center gap-1 text-muted">
                        <Calendar size={14} /> {req.date}
                      </div>
                    </td>
                    <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' }}>{req.status}</span></td>
                    <td>
                      <Link to={`/dashboard/doctor/consultation/${req.id}`} className="btn btn-outline btn-sm flex-align-center gap-1">
                        <Eye size={14} /> View Report
                      </Link>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted" style={{ padding: '3rem' }}>
                    No verified cases found. Cases will appear here once you approve a pending review.
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

export default DoctorVerifiedCases;
