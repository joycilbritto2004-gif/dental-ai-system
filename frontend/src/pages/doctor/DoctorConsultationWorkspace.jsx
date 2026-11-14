import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCircle, BrainCircuit, Scan, CheckCircle2, ChevronLeft, 
  ShieldCheck, Zap, AlertCircle, MessageSquare, Clock, XCircle, 
  X, Pill, Plus, Trash2, Calendar, Stethoscope, Check, Hash, Activity, Building2 
} from 'lucide-react';
import { getCareSuggestions } from '../../utils/careSuggestions';
import { getSocket, joinConsultationRoom, leaveConsultationRoom } from '../../utils/socket';
import '../Dashboard.css';
import { API_BASE } from '../../config';
import ScanImage from '../../components/ScanImage';
import { hasScanImage } from '../../utils/scanImage';

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

  // Personal Prescription State
  const [medications, setMedications] = useState([]);
  const [additionalCareInstructions, setAdditionalCareInstructions] = useState('');
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);
  const [prescriptionMessage, setPrescriptionMessage] = useState(null);
  const [prescriptionId, setPrescriptionId] = useState(null);

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
        const res = await fetch(`${API_BASE}/api/consultations/${id}`, { headers });
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

        // Fetch existing prescription for this consultation
        try {
          const prescRes = await fetch(`${API_BASE}/api/prescriptions/consultation/${id}`, { headers });
          if (prescRes.ok) {
            const prescData = await prescRes.json();
            if (prescData && prescData._id) {
              setPrescriptionId(prescData._id);
              if (Array.isArray(prescData.medications) && prescData.medications.length > 0) {
                setMedications(prescData.medications);
              }
              if (prescData.additionalInstructions) {
                setAdditionalCareInstructions(prescData.additionalInstructions);
              }
            }
          }
        } catch (pErr) {
          console.warn('No existing prescription or fetch error:', pErr.message);
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
      const res = await fetch(`${API_BASE}/api/consultations/${consId}/accept`, {
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
      const res = await fetch(`${API_BASE}/api/consultations/${consId}/reject`, {
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

  const handleAddMedication = () => {
    setMedications(prev => [
      ...prev,
      { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
  };

  const handleRemoveMedication = (index) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index, field, value) => {
    setMedications(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSavePrescription = async (e) => {
    if (e) e.preventDefault();
    const consId = consultation?.id || consultation?._id || id;
    if (!consId) return;

    const validMeds = medications.filter(m => m.medicineName?.trim() && m.dosage?.trim());
    if (validMeds.length === 0) {
      alert('Please add at least one medication with medicine name, dosage, frequency, and duration.');
      return;
    }

    try {
      setIsSavingPrescription(true);
      setPrescriptionMessage(null);
      const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`${API_BASE}/api/prescriptions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          consultationId: consId,
          medications: validMeds,
          additionalInstructions: additionalCareInstructions
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to save prescription');
      }

      const savedData = await res.json();
      setPrescriptionId(savedData._id);
      setPrescriptionMessage('Prescription successfully saved and issued to patient!');
      setTimeout(() => setPrescriptionMessage(null), 5000);
    } catch (err) {
      console.error('Save prescription error:', err);
      alert(err.message || 'Error saving prescription');
    } finally {
      setIsSavingPrescription(false);
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
      const res = await fetch(`${API_BASE}/api/consultations/${consId}/complete`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ finalDiagnosis, treatmentPlan, verificationStatus, followUpDate, followUpNote, medications: medications.filter(m => m.medicineName?.trim()), additionalInstructions: additionalCareInstructions })
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

  const getInitials = (name) => {
    if (!name) return 'PT';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  if (isLoading) {
    return (
      <div className="screening-history-wrapper" style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spin-anim" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
          <BrainCircuit size={48} color="#00A6A6" />
        </div>
        <p style={{ color: '#52677A', fontWeight: 600 }}>Loading diagnostic workspace...</p>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="screening-history-wrapper" style={{ maxWidth: '800px', margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
        <div className="workspace-card" style={{ padding: '48px 32px' }}>
          <AlertCircle size={52} color="#D97706" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ color: '#17324D', fontWeight: 800, marginBottom: '8px' }}>Consultation Case Not Found</h2>
          <p style={{ color: '#52677A', marginBottom: '24px' }}>The consultation record you are trying to access does not exist or has been removed.</p>
          <Link to="/dashboard/doctor/consultations" className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: 700 }}>
            Return to Consultations Queue
          </Link>
        </div>
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

  const consStatus = consultation.status || 'Pending';
  const isPending = consStatus === 'Pending' || consStatus === 'Booked';

  const rawSymptoms = consultation?.message
    ? consultation.message.split(',').map(s => s.trim()).filter(s => s.length > 0 && s.length < 40)
    : [];
  const symptomPills = rawSymptoms.length > 1 ? rawSymptoms : [];

  return (
    <div className="screening-history-wrapper" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px 48px' }}>
      <motion.div initial="hidden" animate="show" variants={stagger}>
        
        {/* EXECUTIVE HEADER CARD */}
        <motion.div variants={item} className="screening-header-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 166, 166, 0.08)', color: '#00A6A6', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                <BrainCircuit size={13} /> Clinical Diagnostic Workspace
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#17324D', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                Diagnostic &amp; Treatment Workspace
              </h1>
              <p style={{ color: '#52677A', margin: 0, fontSize: '0.92rem', fontWeight: 500 }}>
                Review intraoral radiograph, compare neural net differential analysis with clinical findings, and issue prescriptions.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <Link
                to="/dashboard/doctor/consultations"
                className="btn btn-outline"
                style={{ background: '#FFFFFF', borderColor: '#BFD4E5', color: '#17324D', fontWeight: 700, fontSize: '0.86rem', padding: '9px 16px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ChevronLeft size={16} /> Consultations Queue
              </Link>

              {/* Chat action button: Only for Online Chat consultations */}
              {String(consultation.consultationType || '').toLowerCase().includes('chat') ? (
                <Link
                  to={`/dashboard/doctor/consultation/${consultation.id || consultation._id}/messages`}
                  state={{ consultationId: consultation.id || consultation._id }}
                  className="btn btn-outline"
                  style={{ background: '#FFFFFF', borderColor: '#1677FF', color: '#1677FF', fontWeight: 700, fontSize: '0.86rem', padding: '9px 16px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <MessageSquare size={16} /> {isPending ? 'Open Chat (Pending)' : isCompleted ? 'View Chat History' : 'Chat with Patient'}
                </Link>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1', padding: '8px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700 }}>
                  <Building2 size={15} color="#00A6A6" /> In-Person Physical Clinic Case
                </div>
              )}

              {!isCompleted && !isPending && (
                <button
                  onClick={() => {
                    if (!finalDiagnosis || !treatmentPlan) {
                      alert("Please enter both a final diagnosis and a treatment plan before completing.");
                      return;
                    }
                    setShowCompleteModal(true);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '9px 18px',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  <CheckCircle2 size={16} /> Complete Consultation
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* PENDING APPROVAL ALERT BANNER */}
        {isPending && (
          <motion.div variants={item} style={{
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderLeft: '5px solid #F59E0B',
            borderRadius: '16px',
            padding: '18px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '1.05rem', fontWeight: 800, color: '#92400E' }}>
                  Consultation Request Pending Verification
                </h4>
                <p style={{ margin: 0, fontSize: '0.86rem', color: '#B45309', fontWeight: 500 }}>
                  Accept this booking to confirm the patient appointment and unlock real-time direct consultation messaging.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={handleAcceptConsultation}
                disabled={isActionLoading}
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 18px',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: isActionLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                }}
              >
                <CheckCircle2 size={16} /> Accept Consultation
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isActionLoading}
                style={{
                  background: '#FFFFFF',
                  color: '#DC2626',
                  border: '1px solid #FCA5A5',
                  borderRadius: '10px',
                  padding: '9px 16px',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: isActionLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <XCircle size={16} /> Decline Request
              </button>
            </div>
          </motion.div>
        )}

        {/* COMPLETED BANNER */}
        {isCompleted && (
          <motion.div variants={item} style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderLeft: '5px solid #10B981',
            borderRadius: '16px',
            padding: '16px 22px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.06)'
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 2px 0', fontSize: '1.02rem', fontWeight: 800, color: '#15803D' }}>
                Clinical Assessment Completed &amp; Dispatched
              </h4>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#166534', fontWeight: 500 }}>
                The final diagnostic report, recommendations, and prescription have been securely transmitted to the patient.
              </p>
            </div>
          </motion.div>
        )}

        {/* SECTION 1: TOP PATIENT OVERVIEW & HIGH-RES SCAN */}
        <div className="doctor-workspace-top-grid">

          {/* Left: Scan Viewport Card (420px) */}
          <motion.div variants={item} className="workspace-viewer-card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Scan size={16} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#17324D' }}>
                    Intraoral Radiograph Viewport
                  </h4>
                </div>
              </div>

              {consultation.isSafelyResolvedScan && (
                <span style={{ fontSize: '0.72rem', background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  Verified Clinical Scan
                </span>
              )}
            </div>

            {/* Viewport Box */}
            <div className="workspace-scan-viewport" style={{ maxHeight: '280px', minHeight: '260px' }}>
              {hasScanImage(scanRecord?.imagePath) ? (
                <ScanImage
                  imagePath={scanRecord.imagePath}
                  alt="Patient Dental Scan"
                  style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', display: 'block' }}
                />
              ) : consultation.imageReference ? (
                <img 
                  src={consultation.imageReference} 
                  alt="Patient Dental Scan" 
                  style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', display: 'block' }} 
                />
              ) : (
                <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Scan size={40} color="#64748B" style={{ marginBottom: '10px' }} />
                  <span style={{ color: '#F1F5F9', fontWeight: 800, fontSize: '0.94rem' }}>
                    Scan unavailable — link correct scan
                  </span>
                  <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: '4px 0 0 0', maxWidth: '280px', lineHeight: 1.4 }}>
                    No verified intraoral scan was reliably associated with this session.
                  </p>
                </div>
              )}

              {/* Overlay Badge */}
              {aiCondition && (
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  background: 'rgba(11, 19, 43, 0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.76rem',
                  fontWeight: 700
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00A6A6' }}></span>
                  <span style={{ textTransform: 'capitalize' }}>{aiCondition.replace(/_/g, ' ')}</span>
                  {scanRecord?.confidence && (
                    <span style={{ color: '#00A6A6', fontWeight: 800 }}>({Number(scanRecord.confidence).toFixed(1)}%)</span>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#64748B' }}>
              <span>DICOM / High-Res Intraoral Scan</span>
              <span style={{ fontWeight: 600 }}>Magnification 1.0x</span>
            </div>
          </motion.div>

          {/* Right: Patient Case Summary & Chief Complaint (1fr) */}
          <motion.div variants={item} className="workspace-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* Header: Avatar, Name, UID, Status Pill & Direct Chat */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #00A6A6 0%, #17324D 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1.25rem',
                    letterSpacing: '0.5px',
                    boxShadow: '0 4px 14px rgba(0, 166, 166, 0.22)',
                    flexShrink: 0
                  }}>
                    {getInitials(consultation.patientName)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#17324D', letterSpacing: '-0.01em' }}>
                        {consultation.patientName || 'Unknown Patient'}
                      </h3>
                      <span style={{
                        background: '#F1F5F9',
                        color: '#475569',
                        border: '1px solid #CBD5E1',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Hash size={11} color="#00A6A6" /> UID: P-{consultation.id ? consultation.id.toString().substring(0, 6) : '6aec46'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500, display: 'block', marginTop: '2px' }}>
                      Verified Patient Intake • Case #{consultation.id ? consultation.id.toString().substring(0, 6) : '6aec46'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    background: isCompleted ? '#DCFCE7' : isPending ? '#FEF3C7' : '#EFF6FF',
                    color: isCompleted ? '#15803D' : isPending ? '#B45309' : '#1D4ED8',
                    border: isCompleted ? '1px solid #86EFAC' : isPending ? '1px solid #FDE68A' : '1px solid #BFDBFE'
                  }}>
                    <span style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: isCompleted ? '#16A34A' : isPending ? '#D97706' : '#2563EB',
                      boxShadow: isCompleted ? '0 0 6px #16A34A' : isPending ? '0 0 6px #F59E0B' : '0 0 6px #3B82F6'
                    }} />
                    {consultation.status || 'In Consultation'}
                  </span>

                  <Link
                    to={`/dashboard/doctor/consultation/${consultation.id || consultation._id}/messages`}
                    state={{ consultationId: consultation.id || consultation._id }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#F0FDFA',
                      color: '#00A6A6',
                      border: '1px solid #99E3D8',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <MessageSquare size={13} /> Chat
                  </Link>
                </div>
              </div>

              {/* 3 Clinical Info Tiles */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '10px',
                marginBottom: '14px'
              }}>
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(0, 166, 166, 0.1)',
                    color: '#00A6A6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Calendar size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>
                      Appointment Slot
                    </span>
                    <span style={{ fontSize: '0.84rem', color: '#17324D', fontWeight: 700 }}>
                      {consultation.date} @ {consultation.time}
                    </span>
                  </div>
                </div>

                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>
                      Data Security
                    </span>
                    <span style={{ fontSize: '0.84rem', color: '#059669', fontWeight: 700 }}>
                      HIPAA End-to-End Secure
                    </span>
                  </div>
                </div>

                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(22, 119, 255, 0.1)',
                    color: '#1677FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Activity size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>
                      Consultation Mode
                    </span>
                    <span style={{ fontSize: '0.84rem', color: '#1E40AF', fontWeight: 700 }}>
                      Direct Clinical Triage
                    </span>
                  </div>
                </div>
              </div>

              {/* Patient Chief Complaint & Reported Symptoms Box */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderLeft: '4px solid #00A6A6',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: '#475569', textTransform: 'uppercase', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.6px' }}>
                    <Zap size={14} color="#00A6A6" /> Patient Chief Complaint &amp; Intake Symptoms
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748B', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '1px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    Self-Reported
                  </span>
                </div>

                {/* Symptom Tags */}
                {symptomPills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                    {symptomPills.map((symptom, idx) => (
                      <span 
                        key={idx}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #BFD4E5',
                          borderRadius: '6px',
                          padding: '3px 10px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          color: '#17324D',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 1px 3px rgba(7, 26, 51, 0.04)'
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00A6A6' }}></span>
                        {symptom}
                      </span>
                    ))}
                  </div>
                )}

                <p style={{
                  margin: 0,
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                  color: '#334155',
                  fontSize: '0.88rem'
                }}>
                  &ldquo;{consultation.message || 'No additional concerns or symptoms described by patient.'}&rdquo;
                </p>
              </div>
            </div>
          </motion.div>

        </div>

        {/* SECTION 2: SIDE-BY-SIDE OPPOSING DIAGNOSTIC PANELS */}
        <div className="doctor-workspace-diagnostic-grid">

          {/* LEFT COLUMN: NEURAL NET DIAGNOSTIC ANALYSIS (OPPOSITE OF PHYSICIAN VERIFICATION) */}
          <motion.div variants={item} className="workspace-card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#17324D' }}>
                    Neural Net Diagnostic Analysis
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
                    Deep learning 6-class dental pathology inference engine
                  </span>
                </div>
              </div>

              <span style={{ fontSize: '0.74rem', background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
                ResNet-Dental v2
              </span>
            </div>

            {/* Identified Pathology & Algorithmic Confidence */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '18px' }}>
              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', fontWeight: 800, marginBottom: '4px' }}>
                  Identified Primary Pathology
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#17324D', textTransform: 'capitalize' }}>
                  {aiCondition ? aiCondition.replace(/_/g, ' ') : 'Scan unavailable'}
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', fontWeight: 800, marginBottom: '4px' }}>
                  Algorithmic Confidence
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#00A6A6' }}>
                    {scanRecord?.confidence ? `${Number(scanRecord.confidence).toFixed(1)}%` : (consultation.confidence && consultation.confidence !== 'N/A' ? consultation.confidence : 'Unavailable')}
                  </div>
                  <div style={{ flex: 1, height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: (scanRecord?.confidence ? `${Math.min(100, Math.max(0, Number(scanRecord.confidence)))}%` : (consultation.confidence && consultation.confidence !== 'N/A' ? `${parseFloat(consultation.confidence) || 0}%` : '0%')) }} 
                      transition={{ duration: 1 }} 
                      style={{ height: '100%', background: 'linear-gradient(90deg, #00A6A6 0%, #1677FF 100%)', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SIX-CLASS DIFFERENTIAL PROBABILITIES BREAKDOWN */}
            {scanRecord?.classProbabilities && typeof scanRecord.classProbabilities === 'object' && Object.keys(scanRecord.classProbabilities).length > 0 ? (
              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 800 }}>
                    Neural Differential Probabilities (All 6 Classes)
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                    Sorted by probability
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(scanRecord.classProbabilities)
                    .sort(([, a], [, b]) => Number(b) - Number(a))
                    .map(([name, prob]) => {
                      const isTop = name.toLowerCase() === (aiCondition || '').replace(/_/g, ' ').toLowerCase() || name === aiCondition;
                      const numProb = Number(prob) || 0;
                      return (
                        <div 
                          key={name} 
                          style={{ 
                            background: isTop ? '#EFF6FF' : '#FFFFFF', 
                            padding: '9px 14px', 
                            borderRadius: '10px', 
                            border: isTop ? '1.5px solid #1677FF' : '1px solid #E2E8F0' 
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: isTop ? 800 : 600, color: isTop ? '#1E3A8A' : '#334155' }}>
                              {name.replace(/_/g, ' ')} {isTop && <span style={{ fontSize: '0.68rem', background: '#1677FF', color: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, marginLeft: '6px' }}>Highest</span>}
                            </span>
                            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: isTop ? '#1677FF' : '#0F172A' }}>
                              {numProb.toFixed(2)}%
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${Math.min(100, Math.max(0, numProb))}%` }} 
                              transition={{ duration: 0.8 }} 
                              style={{ height: '100%', background: isTop ? '#1677FF' : '#94A3B8', borderRadius: '3px' }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px dashed #CBD5E1', marginBottom: '18px', fontSize: '0.84rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} color="#64748B" style={{ flexShrink: 0 }} />
                <span>Detailed multi-class probability breakdown is unavailable for this historical scan.</span>
              </div>
            )}

            {/* AI Recommendation */}
            {(scanRecord?.recommendation || consultation.recommendation) && (
              <div style={{ background: '#F0FDF9', padding: '16px', borderRadius: '14px', border: '1.5px solid #99E3D8', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.76rem', color: '#0D9488', textTransform: 'uppercase', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.6px', marginBottom: '6px' }}>
                  <ShieldCheck size={16} color="#0D9488" /> AI Clinical Recommendation
                </span>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#134E4A', lineHeight: 1.6, fontWeight: 500 }}>
                  {scanRecord?.recommendation || consultation.recommendation}
                </p>
              </div>
            )}

            {/* AI Care Suggestions */}
            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.76rem', color: '#475569', textTransform: 'uppercase', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.6px', marginBottom: '8px' }}>
                <Check size={16} color="#00A6A6" /> Clinical Care Guidelines
              </span>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, fontWeight: 500 }}>
                {careSuggestions.map((sug, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{sug}</li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: PHYSICIAN VERIFICATION & PRESCRIPTION (OPPOSITE OF NEURAL NET DIAGNOSTIC ANALYSIS) */}
          <motion.div variants={item} className="workspace-card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '20px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stethoscope size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#17324D' }}>
                  Physician Verification &amp; Prescription
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
                  Certify clinical diagnosis, issue medication protocols, and set follow-ups
                </span>
              </div>
            </div>

            {/* Verification Status */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17324D', marginBottom: '6px' }}>
                Verification Status
              </label>
              <select 
                className="workspace-input" 
                value={verificationStatus} 
                onChange={(e) => setVerificationStatus(e.target.value)} 
                disabled={isCompleted}
              >
                <option value="Verified">Verified — Clinical Diagnosis Confirmed</option>
                <option value="Pending">Pending — Under Further Clinical Review</option>
                <option value="Requires further examination">Requires In-Person Clinical Oral Examination</option>
              </select>
            </div>

            {/* Final Diagnosis */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17324D', marginBottom: '6px' }}>
                Doctor's Final Diagnosis
              </label>
              <input 
                type="text" 
                className="workspace-input" 
                placeholder="e.g. Mild Marginal Gingivitis on Mandibular Anterior Region" 
                value={finalDiagnosis} 
                onChange={(e) => setFinalDiagnosis(e.target.value)} 
                disabled={isCompleted} 
              />
            </div>

            {/* Treatment Plan */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17324D', marginBottom: '6px' }}>
                Comprehensive Treatment Plan &amp; Recommendations
              </label>
              <textarea 
                className="workspace-input" 
                rows={4} 
                placeholder="Detail in-clinic procedures, cleaning regimens, hygiene instructions, and dietary recommendations..." 
                value={treatmentPlan} 
                onChange={(e) => setTreatmentPlan(e.target.value)} 
                disabled={isCompleted} 
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* PRESCRIPTION MANAGEMENT SECTION */}
            <div style={{
              background: '#F0FDF9',
              border: '1.5px solid #99E3D8',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ background: 'rgba(0, 166, 166, 0.15)', color: '#00A6A6', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                    <Pill size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#17324D' }}>
                      Personal Prescription (Rx)
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: '#52677A', fontWeight: 500 }}>
                      Add verified medications, precise dosages, and schedules
                    </span>
                  </div>
                </div>

                {prescriptionId && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#15803D', background: '#DCFCE7', border: '1px solid #86EFAC', padding: '4px 10px', borderRadius: '999px' }}>
                    ✓ Active Prescription
                  </span>
                )}
              </div>

              {/* Success Notification */}
              {prescriptionMessage && (
                <div style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '10px 14px', borderRadius: '10px', fontSize: '0.86rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} /> {prescriptionMessage}
                </div>
              )}

              {/* Medication List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
                {medications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', background: '#FFFFFF', borderRadius: '12px', border: '1px dashed #CBD5E1', color: '#64748B', fontSize: '0.86rem' }}>
                    No medications added yet. Click &quot;Add Medication&quot; below to prescribe drugs for this case.
                  </div>
                ) : (
                  medications.map((med, idx) => (
                    <div 
                      key={idx}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #BFD4E5',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: '0 2px 8px rgba(7, 26, 51, 0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#00A6A6' }}>
                          Medication #{idx + 1}
                        </span>
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedication(idx)}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                            title="Remove medication"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>Medicine Name</label>
                          <input 
                            type="text"
                            placeholder="e.g. Amoxicillin"
                            value={med.medicineName}
                            onChange={(e) => handleMedicationChange(idx, 'medicineName', e.target.value)}
                            disabled={isCompleted}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>Dosage</label>
                          <input 
                            type="text"
                            placeholder="e.g. 500mg"
                            value={med.dosage}
                            onChange={(e) => handleMedicationChange(idx, 'dosage', e.target.value)}
                            disabled={isCompleted}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>Frequency</label>
                          <input 
                            type="text"
                            placeholder="e.g. Twice daily after meals"
                            value={med.frequency}
                            onChange={(e) => handleMedicationChange(idx, 'frequency', e.target.value)}
                            disabled={isCompleted}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>Duration</label>
                          <input 
                            type="text"
                            placeholder="e.g. 5 days"
                            value={med.duration}
                            onChange={(e) => handleMedicationChange(idx, 'duration', e.target.value)}
                            disabled={isCompleted}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>Instructions &amp; Warnings</label>
                        <input 
                          type="text"
                          placeholder="e.g. Take with a full glass of water. Do not skip doses."
                          value={med.instructions}
                          onChange={(e) => handleMedicationChange(idx, 'instructions', e.target.value)}
                          disabled={isCompleted}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Medication & Save Prescription Buttons */}
              {!isCompleted && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#FFFFFF',
                      color: '#00A6A6',
                      border: '1.5px dashed #00A6A6',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={16} /> Add Medication
                  </button>

                    {medications.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSavePrescription}
                        disabled={isSavingPrescription}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#00A6A6',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '8px 18px',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          cursor: isSavingPrescription ? 'not-allowed' : 'pointer',
                          boxShadow: '0 2px 8px rgba(0, 166, 166, 0.25)'
                        }}
                      >
                        <Pill size={16} /> {isSavingPrescription ? 'Saving...' : 'Save & Issue Prescription'}
                      </button>
                    )}
                </div>
              )}

              {/* Additional Dental Care Instructions */}
              <div style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#17324D', display: 'block', marginBottom: '4px' }}>
                  Additional Dental Care Instructions (Patient Advice)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Rinse with warm saline water twice daily, avoid hard or sticky foods on affected side."
                  value={additionalCareInstructions}
                  onChange={(e) => setAdditionalCareInstructions(e.target.value)}
                  disabled={isCompleted}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.86rem',
                    background: isCompleted ? '#F8FAFC' : '#FFFFFF',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Follow-up Scheduling */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#17324D', display: 'block', marginBottom: '6px' }}>
                  Follow-up Date
                </label>
                <input 
                  type="date" 
                  className="workspace-input" 
                  value={followUpDate} 
                  onChange={(e) => setFollowUpDate(e.target.value)} 
                  disabled={isCompleted} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#17324D', display: 'block', marginBottom: '6px' }}>
                  Follow-up Note (Optional)
                </label>
                <input 
                  type="text" 
                  className="workspace-input" 
                  placeholder="e.g. Check gum healing progress" 
                  value={followUpNote} 
                  onChange={(e) => setFollowUpNote(e.target.value)} 
                  disabled={isCompleted} 
                />
              </div>
            </div>

            {/* Bottom Action Bar */}
            {!isCompleted && (
              <button 
                onClick={() => {
                  if (!finalDiagnosis || !treatmentPlan) {
                    alert("Please enter both a final diagnosis and a treatment plan before completing.");
                    return;
                  }
                  setShowCompleteModal(true);
                }}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                <CheckCircle2 size={20} /> Complete Consultation &amp; Dispatch Report
              </button>
            )}
          </motion.div>

        </div>

      </motion.div>

      {/* Decline Consultation Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
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
                background: '#FFFFFF',
                border: '1px solid #BFD4E5',
                borderRadius: '20px',
                padding: '28px 32px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 20px 30px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <XCircle size={22} color="#DC2626" />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    Decline Consultation Request
                  </h3>
                </div>
                <button 
                  onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '0.9rem', color: '#52677A', marginBottom: '16px', lineHeight: 1.5 }}>
                Are you sure you want to decline this consultation request for <strong>{consultation?.patientName || 'this patient'}</strong>?
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#17324D', marginBottom: '6px' }}>
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
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    color: '#17324D',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                    padding: '9px 18px',
                    fontWeight: 700,
                    color: '#52677A',
                    cursor: 'pointer'
                  }}
                  disabled={isRejecting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRejectConsultation}
                  style={{
                    background: '#DC2626',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '9px 20px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    cursor: isRejecting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
                  }}
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
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
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
                background: '#FFFFFF',
                border: '1px solid #BFD4E5',
                borderRadius: '20px',
                padding: '28px 32px',
                maxWidth: '520px',
                width: '100%',
                boxShadow: '0 20px 30px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={22} color="#10B981" />
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#17324D' }}>
                    Confirm Consultation Completion
                  </h3>
                </div>
                <button 
                  onClick={() => setShowCompleteModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
                <p style={{ margin: 0, fontSize: '0.86rem', color: '#991B1B', lineHeight: 1.5, fontWeight: 600 }}>
                  Completing this consultation will finalize the clinical assessment and conclude active doctor-patient messaging.
                </p>
              </div>

              <div style={{ marginBottom: '18px', background: '#F8FAFC', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.86rem', color: '#475569', marginBottom: '6px' }}>
                  <strong style={{ color: '#17324D' }}>Patient:</strong> {consultation?.patientName}
                </div>
                <div style={{ fontSize: '0.86rem', color: '#475569', marginBottom: '6px' }}>
                  <strong style={{ color: '#17324D' }}>Final Diagnosis:</strong> {finalDiagnosis}
                </div>
                <div style={{ fontSize: '0.86rem', color: '#475569' }}>
                  <strong style={{ color: '#17324D' }}>Treatment Plan:</strong> {treatmentPlan}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  onClick={() => setShowCompleteModal(false)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                    padding: '9px 18px',
                    fontWeight: 700,
                    color: '#52677A',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleComplete}
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '9px 22px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  <CheckCircle2 size={16} /> Confirm &amp; Complete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorConsultationWorkspace;
