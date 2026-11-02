import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle, BrainCircuit, Scan, CheckCircle2, Send, ChevronLeft, ShieldCheck, Zap, AlertCircle, MessageSquare, Clock, XCircle, X, Lock } from 'lucide-react';
import { getCareSuggestions } from '../../utils/careSuggestions';
import { getSocket, joinConsultationRoom, leaveConsultationRoom } from '../../utils/socket';
import '../Dashboard.css';

const DoctorConsultationWorkspace = () => {
  const { id } = useParams();
  const [isCompleted, setIsCompleted] = useState(false);
  const [consultation, setConsultation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [finalDiagnosis, setFinalDiagnosis] = useState(() => localStorage.getItem(`draft_diagnosis_${id}`) || '');
  const [treatmentPlan, setTreatmentPlan] = useState(() => localStorage.getItem(`draft_treatment_${id}`) || '');
  const [verificationStatus, setVerificationStatus] = useState('Verified');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');

  // Approval / Decline state
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    localStorage.setItem(`draft_diagnosis_${id}`, finalDiagnosis);
  }, [finalDiagnosis, id]);

  useEffect(() => {
    localStorage.setItem(`draft_treatment_${id}`, treatmentPlan);
  }, [treatmentPlan, id]);

  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`http://localhost:5000/api/consultations/${id}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch');
        const record = await res.json();
        
        if (record) {
          setConsultation(record);
          setFinalDiagnosis(record.finalDiagnosis || localStorage.getItem(`draft_diagnosis_${id}`) || '');
          setTreatmentPlan(record.treatmentPlan || localStorage.getItem(`draft_treatment_${id}`) || '');
          setVerificationStatus(record.verificationStatus || 'Verified');
          setFollowUpDate(record.followUpDate || '');
          setFollowUpNote(record.followUpNote || '');
          if (record.status === 'Completed') setIsCompleted(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConsultation();

    joinConsultationRoom(id);
    const socket = getSocket();
    const handleAccepted = (payload) => {
      const targetId = payload.consultationId || payload.id;
      if (String(targetId) === String(id)) {
        setConsultation(prev => ({ ...(prev || {}), status: 'Accepted', ...(payload.consultation || {}) }));
      }
    };
    if (socket) {
      socket.on('consultation-accepted', handleAccepted);
    }

    const interval = setInterval(fetchConsultation, 4000);
    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('consultation-accepted', handleAccepted);
      }
      leaveConsultationRoom(id);
    };
  }, [id]);

  const handleAcceptConsultation = async () => {
    const consId = consultation?.id || consultation?._id;
    if (!consId) return;
    try {
      setIsActionLoading(true);
      const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch(`http://localhost:5000/api/consultations/${consId}/accept`, {
        method: 'PUT',
        headers
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to accept consultation');
      }
      setConsultation(prev => ({ ...prev, status: 'Accepted' }));
    } catch (err) {
      console.error('Accept consultation error:', err);
      alert(err.message || 'Failed to accept consultation.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectConsultation = async () => {
    const consId = consultation?.id || consultation?._id;
    if (!consId) return;
    try {
      setIsRejecting(true);
      const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch(`http://localhost:5000/api/consultations/${consId}/reject`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ reason: rejectionReason.trim() })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to decline consultation');
      }
      setConsultation(prev => ({ ...prev, status: 'Rejected', rejectionReason: rejectionReason.trim() }));
      setShowRejectModal(false);
    } catch (err) {
      console.error('Decline consultation error:', err);
      alert(err.message || 'Failed to decline consultation.');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleComplete = async () => {
    if (!finalDiagnosis || !treatmentPlan) {
      alert("Please enter both a final diagnosis and a treatment plan before completing.");
      return;
    }
    
    try {
      const consId = consultation?.id || consultation?._id;
      const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/consultations/${consId}/complete`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ finalDiagnosis, treatmentPlan, verificationStatus, followUpDate, followUpNote })
      });
      if (!res.ok) throw new Error('Failed to update');
      setIsCompleted(true);
      setConsultation(prev => ({ ...prev, status: 'Completed', finalDiagnosis, treatmentPlan, verificationStatus, followUpDate, followUpNote }));
      localStorage.removeItem(`draft_diagnosis_${id}`);
      localStorage.removeItem(`draft_treatment_${id}`);
      setShowCompleteModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save consultation data.');
    }
  };

  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  if (isLoading) {
    return (
      <div className="dashboard-view flex-align-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="spin-anim" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <BrainCircuit size={48} color="#00A6A6" />
        </div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="dashboard-view animate-fade-in flex-align-center justify-center" style={{ minHeight: '60vh', flexDirection: 'column' }}>
        <AlertCircle size={48} className="text-warning mb-4" />
        <h2 className="text-slate-900 font-bold mb-2" style={{ color: '#0f172a' }}>Record Not Found</h2>
        <p className="text-slate-600 mb-4" style={{ color: '#475569' }}>The consultation record you are trying to access does not exist or has been removed.</p>
        <Link to="/dashboard/doctor/consultations" className="btn btn-primary">Return to Dashboard</Link>
      </div>
    );
  }

  const scanRecord = consultation.scanId;
  const hasValidScan = !!(scanRecord && (scanRecord.condition || scanRecord.imagePath));
  const aiCondition = hasValidScan ? scanRecord.condition : (consultation.condition && consultation.condition !== 'N/A' ? consultation.condition : null);
  const careSuggestions = aiCondition ? getCareSuggestions(aiCondition).suggestions : [
    "No scan data linked to this consultation case.",
    "Perform an in-person clinical oral examination.",
    "Request an intraoral scan or updated dental imaging from the patient."
  ];

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header mb-6 flex-between flex-align-start bg-white border-slate-200" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '24px 32px' }}>
        <div>
          <div className="flex-align-center gap-2 mb-2">
            <Link to="/dashboard/doctor/consultations" className="text-slate-600 hover:text-primary flex-align-center gap-1 transition-colors font-semibold" style={{ color: '#475569', fontWeight: 600 }}>
              <ChevronLeft size={16} /> Dashboard
            </Link>
          </div>
          <h2 className="text-slate-900 font-extrabold" style={{ color: '#0f172a', margin: '0 0 6px 0' }}>Diagnostic Workspace</h2>
          <p className="text-slate-700 font-medium" style={{ color: '#334155', margin: 0 }}>Review AI imaging, verify diagnosis, and prescribe treatments.</p>
        </div>

        {/* Dynamic Consultation Chat Button */}
        {consultation.status === 'Pending' || consultation.status === 'Booked' ? (
          <Link 
            to={`/dashboard/doctor/consultation/${consultation.id || consultation._id}/messages`} 
            state={{ consultationId: consultation.id || consultation._id }} 
            className="btn btn-outline flex-align-center gap-2 border-slate-300 text-slate-900 bg-white" 
            style={{ background: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', fontWeight: 600 }}
          >
            <MessageSquare size={18} color="#1677FF" /> Open Chat (Pending)
          </Link>
        ) : consultation.status === 'Completed' || consultation.status === 'Verified' ? (
          <Link to={`/dashboard/doctor/consultation/${consultation.id || consultation._id}/messages`} state={{ consultationId: consultation.id || consultation._id }} className="btn btn-outline flex-align-center gap-2 border-slate-300 text-slate-900 bg-white" style={{ background: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', fontWeight: 600 }}>
            <MessageSquare size={18} color="#1677FF" /> View Chat History
          </Link>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to={`/dashboard/doctor/consultation/${consultation.id || consultation._id}/messages`} state={{ consultationId: consultation.id || consultation._id }} className="btn btn-outline flex-align-center gap-2 border-slate-300 text-slate-900 bg-white" style={{ background: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', fontWeight: 600 }}>
              <MessageSquare size={18} color="#1677FF" /> Chat with Patient
            </Link>
            <button
              onClick={() => {
                if (!finalDiagnosis || !treatmentPlan) {
                  alert("Please enter both a final diagnosis and a treatment plan before completing.");
                  return;
                }
                setShowCompleteModal(true);
              }}
              className="btn btn-success flex-align-center gap-1 font-bold"
              style={{ padding: '10px 18px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(22, 163, 74, 0.2)' }}
            >
              <CheckCircle2 size={16} /> Complete Consultation
            </button>
          </div>
        )}
      </motion.div>

      {/* Pending Approval Alert Banner */}
      {(consultation.status === 'Pending' || consultation.status === 'Booked') && (
        <motion.div variants={item} className="card mb-6" style={{ padding: '1.25rem 1.75rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={28} style={{ color: '#d97706', flexShrink: 0 }} />
            <div>
              <h4 className="font-bold text-slate-900" style={{ fontSize: '1.1rem', color: '#92400e', margin: '0 0 2px 0' }}>
                Consultation Request Pending Your Approval
              </h4>
              <p className="text-sm font-semibold" style={{ color: '#b45309', margin: 0 }}>
                Accept this booking to confirm the patient appointment and unlock real-time direct messaging.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleAcceptConsultation}
              disabled={isActionLoading}
              className="btn btn-success font-bold flex-align-center gap-1"
              style={{ padding: '8px 18px', borderRadius: '10px' }}
            >
              <CheckCircle2 size={16} /> Accept Consultation
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isActionLoading}
              className="btn btn-outline font-semibold flex-align-center gap-1"
              style={{ padding: '8px 16px', borderRadius: '10px', color: '#dc2626', borderColor: '#fca5a5' }}
            >
              <XCircle size={16} /> Reject Request
            </button>
          </div>
        </motion.div>
      )}

      {isCompleted && (
        <motion.div variants={item} className="card mb-6 flex-align-center gap-3" style={{ padding: '1rem 1.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px' }}>
          <CheckCircle2 size={28} className="text-success" style={{ color: '#16a34a' }} />
          <div className="flex-1">
            <h4 className="font-bold text-slate-900" style={{ fontSize: '1.1rem', color: '#15803d' }}>Clinical Assessment Completed</h4>
            <p className="text-sm font-semibold" style={{ color: '#166534', margin: 0 }}>The final diagnostic report and prescription have been securely transmitted to the patient.</p>
          </div>
        </motion.div>
      )}

      <div className="dashboard-grid">
        {/* LEFT SIDE: Patient Image & Info */}
        <div className="dashboard-left-col">
          <motion.div variants={item} className="patient-meta-box card bg-white border-slate-200 mb-6" style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)', marginBottom: '24px' }}>
            <div className="flex-between">
              <div className="patient-id-group flex-align-center gap-4">
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #1677FF, #00A6A6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                  <UserCircle size={34} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900" style={{ fontSize: '1.25rem', color: '#0f172a', margin: '0 0 4px 0' }}>{consultation.patientName || 'Unknown Patient'}</h4>
                  <p className="text-sm font-semibold text-slate-600" style={{ color: '#475569', margin: 0 }}>Internal UID: P-{consultation.id ? consultation.id.toString().substring(0,6) : '98214X'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800 bg-slate-100 border-slate-300" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#1e293b', padding: '6px 14px', borderRadius: '8px', display: 'inline-block', margin: 0 }}>
                  {consultation.date} @ {consultation.time}
                </p>
                <p className="text-sm font-semibold text-slate-600 mt-2 flex-align-center gap-1 justify-end" style={{ color: '#475569', margin: '6px 0 0 0' }}>
                  <ShieldCheck size={14} color="#1677FF" /> Secure Channel
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="xray-preview-large mb-6" style={{ background: '#0F172A', borderRadius: '16px', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)' }}>
            {scanRecord?.imagePath && scanRecord?.imagePath !== 'uploaded_image' ? (
              <img 
                src={scanRecord.imagePath.startsWith('http') ? scanRecord.imagePath : `http://localhost:5000${scanRecord.imagePath}`} 
                alt="Patient Dental Scan" 
                style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', background: '#0F172A', display: 'block' }} 
              />
            ) : consultation.imageReference ? (
              <img 
                src={consultation.imageReference} 
                alt="Patient Dental Scan" 
                style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', background: '#0F172A', display: 'block' }} 
              />
            ) : (
              <div className="xray-placeholder-scan" style={{ padding: '3.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', background: '#0F172A' }}>
                <Scan size={52} color="#94A3B8" className="mb-3" />
                <span style={{ color: '#F1F5F9', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.5px' }}>
                  Scan unavailable — select or link the correct scan
                </span>
                <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: '8px 0 0 0', maxWidth: '340px', lineHeight: 1.5 }}>
                  No verified intraoral scan could be reliably associated with this consultation case.
                </p>
              </div>
            )}
          </motion.div>

          <motion.div variants={item} className="card patient-complaint-card bg-white border-slate-200 mb-6" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '22px', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)' }}>
            <h4 className="font-bold text-slate-900 mb-3 flex-align-center gap-2" style={{ color: '#0f172a', fontSize: '1.1rem' }}>
              <Zap size={18} color="#1677FF" /> Patient's Primary Complaint
            </h4>
            <div className="bg-slate-50 border-slate-200 text-slate-700" style={{ fontStyle: 'italic', lineHeight: 1.6, padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#334155', fontSize: '0.95rem' }}>
              "{consultation.message || 'No additional concerns provided by the patient.'}"
            </div>
          </motion.div>
        </div>

        {/* RIGHT SIDE: AI & Verification */}
        <div className="dashboard-right-col">
          <motion.div 
            variants={item} 
            className="card ai-result-box bg-white border-slate-200 mb-6" 
            style={{ 
              background: '#ffffff', 
              color: '#0f172a', 
              borderRadius: '16px', 
              border: '1px solid #cbd5e1', 
              position: 'relative', 
              boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
              padding: '24px'
            }}
          >
            <div className="result-header mb-4 flex-between flex-align-center border-b border-slate-200" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div className="flex-align-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BrainCircuit size={24} color="#1677FF" />
                <span className="font-extrabold text-slate-900" style={{ color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '1.1rem', fontWeight: 800 }}>
                  Neural Net Diagnosis
                </span>
              </div>
              {consultation.isSafelyResolvedScan && (
                <span className="bg-sky-50 text-sky-800 border-sky-200 font-bold" style={{ fontSize: '11px', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  Associated Clinical Scan
                </span>
              )}
            </div>
            
            <div className="pathology-section bg-slate-50 border-slate-200" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <span className="text-slate-600 font-bold section-label" style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', fontWeight: 700 }}>
                Identified Pathology
              </span>
              <div className="text-slate-900 font-extrabold section-value disease-name" style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '6px', textTransform: 'capitalize' }}>
                {aiCondition ? aiCondition.replace(/_/g, ' ') : 'Scan unavailable'}
              </div>
            </div>
            
            <div className="confidence-section bg-slate-50 border-slate-200" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <span className="text-slate-600 font-bold section-label confidence-label" style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', fontWeight: 700 }}>
                Algorithmic Confidence
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                <div className="text-slate-900 font-extrabold section-value" style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', minWidth: '85px' }}>
                  {scanRecord?.confidence ? `${Number(scanRecord.confidence).toFixed(1)}%` : (consultation.confidence && consultation.confidence !== 'N/A' ? consultation.confidence : 'Unavailable')}
                </div>
                <div className="progress-bar" style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div 
                    className="progress-fill"
                    initial={{ width: 0 }} 
                    animate={{ width: (scanRecord?.confidence ? `${Math.min(100, Math.max(0, Number(scanRecord.confidence)))}%` : (consultation.confidence && consultation.confidence !== 'N/A' ? `${parseFloat(consultation.confidence) || 0}%` : '0%')) }} 
                    transition={{ duration: 1 }} 
                    style={{ height: '100%', background: 'linear-gradient(90deg, #1677FF 0%, #00A6A6 100%)', borderRadius: '4px' }}
                  />
                </div>
              </div>
            </div>

            {(scanRecord?.recommendation || consultation.recommendation) && (
              <div className="recommendation-section bg-sky-50 border-sky-200" style={{ background: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '16px' }}>
                <span className="text-sky-800 font-extrabold recommendation-title" style={{ fontSize: '12px', color: '#0369a1', textTransform: 'uppercase', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.5px' }}>
                  <ShieldCheck size={16} color="#0284c7" /> AI Clinical Recommendation
                </span>
                <p className="text-slate-700 font-medium recommendation-text" style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#334155', lineHeight: '1.6', fontWeight: 500 }}>
                  {scanRecord?.recommendation || consultation.recommendation}
                </p>
              </div>
            )}

            <div className="suggestions-section bg-slate-50 border-slate-200" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
              <span className="text-teal-800 font-extrabold suggestions-title" style={{ fontSize: '12px', color: '#0f766e', textTransform: 'uppercase', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.5px' }}>
                <AlertCircle size={16} color="#0d9488" /> AI Care Suggestions
              </span>
              <ul className="text-slate-700 font-medium suggestions-list" style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '14px', color: '#334155', lineHeight: '1.6', fontWeight: 500 }}>
                {careSuggestions.map((sug, i) => (
                  <li key={i} style={{ marginBottom: '6px', color: '#334155' }}>{sug}</li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* DOCTOR VERIFICATION */}
          <motion.div variants={item} className="card verification-form bg-white border-slate-200" style={{ padding: '24px', borderRadius: '16px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)' }}>
            <h4 className="form-section-title font-bold text-slate-900 mb-6" style={{ fontSize: '1.2rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>Physician Verification</h4>
            
            <div className="form-group mb-5">
              <label className="form-label font-semibold text-slate-700" style={{ color: '#334155', display: 'block', marginBottom: '6px' }}>Verification Status</label>
              <select 
                className="form-input text-slate-900 bg-white border-slate-300" 
                value={verificationStatus} 
                onChange={(e) => setVerificationStatus(e.target.value)} 
                disabled={isCompleted} 
                style={{ background: isCompleted ? '#f8fafc' : '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
              >
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Requires further examination">Requires further examination</option>
              </select>
            </div>

            <div className="form-group mb-5">
              <label className="form-label font-semibold text-slate-700" style={{ color: '#334155', display: 'block', marginBottom: '6px' }}>Final Diagnosis</label>
              <input 
                type="text" 
                className="form-input text-slate-900 bg-white border-slate-300" 
                placeholder="e.g. Early stage caries" 
                value={finalDiagnosis} 
                onChange={(e) => setFinalDiagnosis(e.target.value)} 
                disabled={isCompleted} 
                style={{ background: isCompleted ? '#f8fafc' : '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }} 
              />
            </div>
            
            <div className="form-group mb-5">
              <label className="form-label font-semibold text-slate-700" style={{ color: '#334155', display: 'block', marginBottom: '6px' }}>Treatment Plan & Prescription</label>
              <textarea 
                className="form-input text-slate-900 bg-white border-slate-300" 
                rows="4" 
                placeholder="Detail the clinical recommendations here..." 
                value={treatmentPlan} 
                onChange={(e) => setTreatmentPlan(e.target.value)} 
                disabled={isCompleted} 
                style={{ background: isCompleted ? '#f8fafc' : '#ffffff', color: '#0f172a', borderColor: '#cbd5e1', resize: 'vertical' }}
              ></textarea>
            </div>

            <div className="form-group mb-5">
              <label className="form-label font-semibold text-slate-700" style={{ color: '#334155', display: 'block', marginBottom: '6px' }}>Follow-up Date</label>
              <input 
                type="date" 
                className="form-input text-slate-900 bg-white border-slate-300" 
                value={followUpDate} 
                onChange={(e) => setFollowUpDate(e.target.value)} 
                disabled={isCompleted} 
                style={{ background: isCompleted ? '#f8fafc' : '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }} 
              />
            </div>

            <div className="form-group mb-6">
              <label className="form-label font-semibold text-slate-700" style={{ color: '#334155', display: 'block', marginBottom: '6px' }}>Follow-up Note (Optional)</label>
              <textarea 
                className="form-input text-slate-900 bg-white border-slate-300" 
                rows="2" 
                placeholder="e.g. Schedule a dental check-up." 
                value={followUpNote} 
                onChange={(e) => setFollowUpNote(e.target.value)} 
                disabled={isCompleted} 
                style={{ background: isCompleted ? '#f8fafc' : '#ffffff', color: '#0f172a', borderColor: '#cbd5e1', resize: 'vertical' }}
              ></textarea>
            </div>

            {!isCompleted && (
              <div className="action-buttons-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <button 
                  className="btn btn-primary flex-align-center justify-center gap-2 pulse-glow" 
                  style={{ padding: '14px', fontSize: '1.1rem' }} 
                  onClick={() => {
                    if (!finalDiagnosis || !treatmentPlan) {
                      alert("Please enter both a final diagnosis and a treatment plan before completing.");
                      return;
                    }
                    setShowCompleteModal(true);
                  }}
                >
                  <CheckCircle2 size={20} /> Complete Consultation & Dispatch Report
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Decline Consultation Modal */}
      <AnimatePresence>
        {showRejectModal && (
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
                  onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '14px', lineHeight: 1.5 }}>
                Are you sure you want to decline this consultation request for <strong>{consultation?.patientName || 'this patient'}</strong>?
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Reason for declining (Optional, sent to patient)
                </label>
                <textarea 
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Doctor schedule is full at this time; please select another time slot or specialist."
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
                  onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                  className="btn btn-outline font-semibold"
                  style={{ color: '#475569', borderColor: '#cbd5e1' }}
                  disabled={isRejecting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRejectConsultation}
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

      {/* Complete Consultation Confirmation Modal */}
      <AnimatePresence>
        {showCompleteModal && (
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
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="flex-between mb-3">
                <div className="flex-align-center gap-2">
                  <CheckCircle2 size={22} color="#16a34a" />
                  <h3 className="font-extrabold text-slate-900" style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
                    Confirm Consultation Completion
                  </h3>
                </div>
                <button 
                  onClick={() => setShowCompleteModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#991b1b', lineHeight: 1.5, fontWeight: 600 }}>
                  Completing this consultation will finalize the clinical assessment and make the patient-doctor chat read-only. No further messages can be sent.
                </p>
              </div>

              <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>
                  <strong>Patient:</strong> {consultation?.patientName}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>
                  <strong>Final Diagnosis:</strong> {finalDiagnosis}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  <strong>Treatment Plan:</strong> {treatmentPlan}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  onClick={() => setShowCompleteModal(false)}
                  className="btn btn-outline font-semibold"
                  style={{ color: '#475569', borderColor: '#cbd5e1' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleComplete}
                  className="btn btn-success font-bold flex-align-center gap-1"
                  style={{ padding: '8px 18px', borderRadius: '8px' }}
                >
                  <CheckCircle2 size={16} /> Confirm & Complete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DoctorConsultationWorkspace;
