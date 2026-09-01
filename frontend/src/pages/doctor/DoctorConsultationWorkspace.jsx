import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCircle, BrainCircuit, Scan, CheckCircle2, AlertTriangle, Send, CreditCard, ChevronLeft, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import '../Dashboard.css';

const DoctorConsultationWorkspace = () => {
  const { id } = useParams();
  const [isCompleted, setIsCompleted] = useState(false);
  const [consultation, setConsultation] = useState(null);
  
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');

  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/consultations/${id}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const record = await res.json();
        
        if (record) {
          setConsultation(record);
          setFinalDiagnosis(record.finalDiagnosis || '');
          setTreatmentPlan(record.treatmentPlan || '');
          if (record.status === 'Completed' || record.status === 'Verified') setIsCompleted(true);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchConsultation();
  }, [id]);

  const handleComplete = async () => {
    if (!finalDiagnosis || !treatmentPlan) {
      alert("Please enter both a final diagnosis and a treatment plan before completing.");
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:5000/api/consultations/${consultation.id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalDiagnosis, treatmentPlan })
      });
      if (!res.ok) throw new Error('Failed to update');
      setIsCompleted(true);
      setConsultation(prev => ({ ...prev, status: 'Completed', finalDiagnosis, treatmentPlan }));
    } catch (err) {
      console.error(err);
      alert('Failed to save consultation data.');
    }
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  if (!consultation) {
    return (
      <div className="dashboard-view animate-fade-in flex-align-center justify-center" style={{ minHeight: '60vh', flexDirection: 'column' }}>
        <AlertCircle size={48} className="text-warning mb-4" />
        <h2 className="text-primary font-bold mb-2">Record Not Found</h2>
        <p className="text-muted mb-4">The consultation record you are trying to access does not exist or has been removed.</p>
        <Link to="/dashboard/doctor/consultations" className="btn btn-primary">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header mb-6">
        <div className="flex-align-center gap-2 mb-2">
          <Link to="/dashboard/doctor/consultations" className="text-muted hover:text-primary flex-align-center gap-1 transition-colors">
            <ChevronLeft size={16} /> Dashboard
          </Link>
        </div>
        <h2>Diagnostic Workspace</h2>
        <p>Review AI imaging, verify diagnosis, and prescribe treatments.</p>
      </motion.div>

      {isCompleted && (
        <motion.div variants={item} className="card mb-6 flex-align-center gap-3" style={{ padding: '1rem 1.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px' }}>
          <CheckCircle2 size={28} className="text-success" />
          <div className="flex-1">
            <h4 className="text-success font-bold" style={{ fontSize: '1.1rem' }}>Clinical Assessment Completed</h4>
            <p className="text-sm text-success" style={{ opacity: 0.9 }}>The final diagnostic report and prescription have been securely transmitted to the patient.</p>
          </div>
        </motion.div>
      )}



      <div className="dashboard-grid">
        {/* LEFT SIDE: Patient Image & Info */}
        <div className="dashboard-left-col">
          <motion.div variants={item} className="patient-meta-box glass-card" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-glass)', marginBottom: '24px' }}>
            <div className="flex-between">
              <div className="patient-id-group flex-align-center gap-4">
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 10px rgba(0, 210, 255, 0.2)' }}>
                  <UserCircle size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-primary" style={{ fontSize: '1.25rem' }}>{consultation.patientName || 'Unknown Patient'}</h4>
                  <p className="text-sm text-muted">Internal UID: P-{consultation.id ? consultation.id.toString().substring(0,6) : '98214X'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary" style={{ background: 'rgba(0, 210, 255, 0.1)', padding: '6px 12px', borderRadius: '8px' }}>{consultation.date} @ {consultation.time}</p>
                <p className="text-sm text-muted mt-2 flex-align-center gap-1 justify-end"><ShieldCheck size={14}/> Secure Channel</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="xray-preview-large mb-6" style={{ background: 'var(--bg-dark)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0, 210, 255, 0.2)', position: 'relative' }}>
            {(consultation.scanId?.imagePath && consultation.scanId?.imagePath !== 'uploaded_image') || consultation.imageReference ? (
              <img 
                src={(consultation.scanId?.imagePath?.startsWith('http') ? consultation.scanId.imagePath : (consultation.scanId?.imagePath ? `http://localhost:5000${consultation.scanId.imagePath}` : null)) || consultation.imageReference} 
                alt="Patient Dental Scan" 
                style={{ width: '100%', height: 'auto', objectFit: 'cover' }} 
              />
            ) : (
              <div className="xray-placeholder-scan" style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(0, 210, 255, 0.1) 0%, transparent 60%)', zIndex: 0 }}></div>
                <Scan size={64} color="#00f0ff" className="mb-4" style={{ filter: 'drop-shadow(0 0 10px rgba(0, 210, 255, 0.5))', zIndex: 1 }} />
                <span className="text-white font-bold" style={{ zIndex: 1, textTransform: 'uppercase', letterSpacing: '2px' }}>Encrypted Imaging Data</span>
                <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '2px', background: 'rgba(0, 240, 255, 0.4)', boxShadow: '0 0 20px #00f0ff', zIndex: 2, animation: 'scanBounce 4s infinite linear' }}></div>
              </div>
            )}
          </motion.div>

          <motion.div variants={item} className="card glass-card" style={{ background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.2)', borderRadius: '12px', padding: '20px' }}>
            <h4 className="font-bold text-primary mb-2 flex-align-center gap-2"><Zap size={18} className="text-secondary"/> Patient's Primary Complaint</h4>
            <p className="text-main" style={{ fontStyle: 'italic', lineHeight: 1.6, padding: '12px', background: 'rgba(255,255,255,0.6)', borderRadius: '8px' }}>
              "{consultation.message || 'No additional concerns provided by the patient.'}"
            </p>
          </motion.div>
        </div>

        {/* RIGHT SIDE: AI & Verification */}
        <div className="dashboard-right-col">
          {/* AI Analysis Result */}
          <motion.div variants={item} className="card ai-result-box mb-6" style={{ background: 'var(--bg-dark)', color: 'white', borderRadius: '16px', border: '1px solid rgba(0, 210, 255, 0.4)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', background: 'radial-gradient(circle at right, rgba(0, 210, 255, 0.15), transparent 70%)', pointerEvents: 'none' }}></div>
            
            <div className="result-header mb-4 flex-align-center gap-2">
              <BrainCircuit size={24} color="#00f0ff" />
              <span className="font-bold" style={{ color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '1px' }}>Neural Net Diagnosis</span>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px', position: 'relative', zIndex: 2 }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Identified Pathology</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'white', marginTop: '4px', textTransform: 'capitalize' }}>
                {consultation.scanId?.condition?.replace('_', ' ') || consultation.condition || 'N/A'}
              </div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px', position: 'relative', zIndex: 2 }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Algorithmic Confidence</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#00f0ff' }}>
                  {consultation.scanId?.confidence ? `${consultation.scanId.confidence}%` : (consultation.confidence || '0%')}
                </div>
                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: (consultation.scanId?.confidence ? `${consultation.scanId.confidence}%` : (consultation.confidence === 'N/A' || !consultation.confidence ? '0%' : consultation.confidence)) }} transition={{ duration: 1 }} style={{ height: '100%', background: '#00f0ff', boxShadow: '0 0 10px #00f0ff' }}></motion.div>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(0, 210, 255, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(0, 210, 255, 0.2)', position: 'relative', zIndex: 2 }}>
              <span style={{ fontSize: '12px', color: '#00f0ff', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> AI Recommendation
              </span>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                {consultation.scanId?.recommendation || consultation.recommendation || 'No specific recommendations provided.'}
              </p>
            </div>
          </motion.div>

          {/* DOCTOR VERIFICATION */}
          <motion.div variants={item} className="card verification-form glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
            <h4 className="form-section-title font-bold text-primary mb-6" style={{ fontSize: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Physician Verification</h4>
            
            <div className="form-group mb-5">
              <label className="form-label font-bold text-primary">Final Diagnosis</label>
              <input 
                type="text"
                className="form-input"
                placeholder="e.g. Early stage caries"
                value={finalDiagnosis}
                onChange={(e) => setFinalDiagnosis(e.target.value)}
                disabled={isCompleted}
                style={{ background: 'rgba(255,255,255,0.8)' }}
              />
            </div>
            
            <div className="form-group mb-6">
              <label className="form-label font-bold text-primary">Treatment Plan & Prescription</label>
              <textarea 
                className="form-input" 
                rows="5" 
                placeholder="Detail the clinical recommendations here..."
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                disabled={isCompleted}
                style={{ background: 'rgba(255,255,255,0.8)', resize: 'vertical' }}
              ></textarea>
            </div>

            {!isCompleted && (
              <div className="action-buttons-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button className="btn btn-outline flex-align-center justify-center gap-2" style={{ padding: '12px' }}>
                  <AlertTriangle size={18} /> Flag False Positive
                </button>
                <button 
                  className="btn btn-primary flex-align-center justify-center gap-2 pulse-glow" 
                  style={{ padding: '14px', fontSize: '1.1rem' }}
                  onClick={handleComplete}
                >
                  <Send size={20} /> Authorize & Dispatch Report
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default DoctorConsultationWorkspace;
