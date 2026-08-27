import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCircle, Calendar, Eye, Users } from 'lucide-react';
import '../Dashboard.css';

const DoctorPatientCases = () => {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    try {
      const DOCTOR_ID = "1";
      const stored = JSON.parse(localStorage.getItem('dental_consultations') || '[]');
      const myConsultations = stored.filter(c => c.doctorId === DOCTOR_ID);
      
      // Group by patient email or name to get unique patients
      const patientMap = {};
      myConsultations.forEach(c => {
        const pKey = c.patientName; // Using name as key since email isn't always present
        if (!patientMap[pKey]) {
          patientMap[pKey] = {
            name: c.patientName,
            casesCount: 0,
            latestCase: c
          };
        }
        patientMap[pKey].casesCount += 1;
        
        // Update latest case if this one is newer
        if (new Date(c.createdAt || 0) > new Date(patientMap[pKey].latestCase.createdAt || 0)) {
          patientMap[pKey].latestCase = c;
        }
      });

      const uniquePatients = Object.values(patientMap);
      uniquePatients.sort((a, b) => new Date(b.latestCase.createdAt || 0) - new Date(a.latestCase.createdAt || 0));
      setPatients(uniquePatients);
    } catch (e) {
      console.error("Error loading patient cases:", e);
    }
  }, []);

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header mb-6">
        <h2>Patient Cases</h2>
        <p>Overview of all active patients currently under your care.</p>
      </motion.div>

      <motion.div variants={item} className="dashboard-grid">
        {patients.length > 0 ? (
          patients.map((p, index) => (
            <motion.div key={index} variants={item} className="card glass-card" style={{ padding: '2rem' }}>
              <div className="flex-between mb-4 border-b pb-4">
                <div className="flex-align-center gap-3">
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <UserCircle size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary">{p.name}</h3>
                    <p className="text-sm text-muted">{p.casesCount} Total Cases</p>
                  </div>
                </div>
                <Link to={`/dashboard/doctor/consultation/${p.latestCase.id}`} className="btn btn-outline btn-sm flex-align-center gap-2">
                  <Eye size={14} /> Open Latest
                </Link>
              </div>

              <div>
                <h4 className="text-sm font-bold text-muted mb-2 uppercase tracking-wide">Latest Diagnosis</h4>
                <div className="bg-dark rounded-xl p-4 mb-4 border border-glass">
                  <div className="flex-between mb-2">
                    <span className="text-main font-bold">{p.latestCase.condition}</span>
                    <span className="confidence-pill" style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--secondary)' }}>{p.latestCase.confidence}</span>
                  </div>
                  <div className="flex-align-center gap-2 text-sm text-muted">
                    <Calendar size={14} /> {p.latestCase.date}
                  </div>
                </div>
                <div className="flex-between">
                  <span className="text-sm text-muted">Current Status:</span>
                  <span className="badge" style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--secondary)' }}>{p.latestCase.status}</span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="card glass-card col-span-full" style={{ padding: '3rem', textAlign: 'center' }}>
            <Users size={48} className="text-muted mx-auto mb-4" />
            <h3 className="font-bold text-primary mb-2">No Active Patients</h3>
            <p className="text-muted">You currently do not have any active patient cases.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default DoctorPatientCases;
