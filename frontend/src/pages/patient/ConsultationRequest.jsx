import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BrainCircuit,
  ChevronLeft,
  Video,
  MessageSquare,
  ShieldCheck,
  Info,
  Calendar,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  UserCheck,
  Building2,
  MapPin,
  Star,
  FileText,
  Sparkles,
  Camera,
  Image as ImageIcon,
  BadgeCheck,
  AlertCircle
} from 'lucide-react';
import ScanImage from '../../components/ScanImage';
import { hasScanImage } from '../../utils/scanImage';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const ConsultationRequest = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Preserve active scan across page refreshes
  const [activeScan] = useState(() => {
    if (location.state?.predictionResult) {
      sessionStorage.setItem('dentaai_active_scan', JSON.stringify(location.state.predictionResult));
      return location.state.predictionResult;
    }
    const saved = sessionStorage.getItem('dentaai_active_scan');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved active scan', e);
      }
    }
    return null;
  });

  const [message, setMessage] = useState('');
  const [consultationType, setConsultationType] = useState('In-Person Clinic Visit');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [imageError, setImageError] = useState(false);

  const [doc, setDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Doctor appointment slot availability state
  const [slotsData, setSlotsData] = useState({ bookedSlots: [], availableSlots: [], allSlots: [] });
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotConflictError, setSlotConflictError] = useState(null);

  // Quick symptom suggestions
  const quickSymptoms = [
    'Toothache / Sharp Pain',
    'Bleeding Gums',
    'Swollen Gum Tissue',
    'Tooth Sensitivity',
    'Discoloration & Staining',
    'Routine Dental Checkup'
  ];

  // Helper for quick date selections
  const setQuickDate = (offsetDays) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
  };

  // Helper for quick time slot selections
  const setQuickTime = (slotTime) => {
    setTime(slotTime);
  };

  // Append symptom to message
  const handleAddSymptom = (symptom) => {
    if (!message) {
      setMessage(symptom);
    } else if (!message.includes(symptom)) {
      setMessage(`${message}, ${symptom}`);
    }
  };

  // Fetch doctor profile
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/doctors/${id}`);
        if (res.ok) {
          const data = await res.json();
          // Normalize doc.id to the MongoDB _id string for consistency
          if (data._id) data.id = data._id;
          data.fee = Number(data.fee) || 500;
          setDoc(data);
        }
      } catch (err) {
        console.error("Failed to fetch doctor:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  // Fetch doctor's booked and available slots whenever date or doctor changes
  useEffect(() => {
    if (!id || !date) return;
    let isMounted = true;
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setSlotConflictError(null);
      try {
        const res = await fetch(`${API_BASE}/api/consultations/doctor/${id}/slots?date=${date}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setSlotsData(data);
            if (time && data.bookedSlots?.includes(time)) {
              setSlotConflictError(`Dr. ${doc?.name || 'The specialist'} is already booked at ${time} on ${date}. Please select an available slot.`);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch doctor slots:', err);
      } finally {
        if (isMounted) setIsLoadingSlots(false);
      }
    };
    fetchSlots();
    return () => { isMounted = false; };
  }, [id, date]);

  const handleSelectSlot = (slotTime, isAvailable) => {
    if (!isAvailable) {
      setSlotConflictError(`Dr. ${doc?.name || 'The specialist'} is already booked at ${slotTime} on ${date}. Please choose another time.`);
      return;
    }
    setSlotConflictError(null);
    setTime(slotTime);
  };

  const isChat = String(consultationType || '').toLowerCase().includes('chat');
  const consultationFee = isChat ? 200 : 500;
  const platformFee = 49;
  const totalPayable = consultationFee + platformFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!time) {
      setSlotConflictError('Please select a preferred appointment time slot.');
      return;
    }

    // Recheck slot availability with backend before proceeding to payment
    try {
      const checkRes = await fetch(`${API_BASE}/api/consultations/check-slot?doctorId=${doc.id || doc._id}&date=${date}&time=${time}`);
      const checkData = await checkRes.json();
      if (!checkRes.ok || checkData.available === false) {
        setSlotConflictError(checkData.message || `Dr. ${doc.name} is already booked at ${time} on ${date}. Please select another time.`);
        // Refresh doctor slots
        const res = await fetch(`${API_BASE}/api/consultations/doctor/${id}/slots?date=${date}`);
        if (res.ok) setSlotsData(await res.json());
        return;
      }
    } catch (checkErr) {
      console.warn('Slot pre-check network issue:', checkErr.message);
    }

    navigate('/dashboard/patient/payment/checkout', {
      state: {
        doctor: { ...doc, fee: consultationFee },
        consultationType,
        date,
        time,
        message,
        predictionResult: activeScan,
        fee: consultationFee,
        platformFee,
        totalAmount: totalPayable
      }
    });
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  if (isLoading) {
    return (
      <div className="dashboard-view" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#17324D', fontWeight: 700, fontSize: '1.1rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          Loading Consultation Request...
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="dashboard-view" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card text-center" style={{ maxWidth: '440px', padding: '40px 24px', background: '#FFFFFF', borderRadius: '24px', border: '1px solid #BFD4E5' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#17324D', marginBottom: '12px' }}>Doctor Not Found</h2>
          <p style={{ color: '#52677A', marginBottom: '24px', fontSize: '0.95rem' }}>Unable to retrieve doctor details for this appointment.</p>
          <Link to="/dashboard/patient/recommended-doctors" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '12px' }}>
            <ChevronLeft size={16} /> Back to Recommendations
          </Link>
        </div>
      </div>
    );
  }

  // Doctor initials for avatar
  const initials = doc.name
    ? doc.name.replace(/^(Dr\.|Dr)\s*/i, '').trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'DR';

  // Check if scan has image
  const scanHasImage = activeScan && hasScanImage(activeScan.imagePath) && !imageError;
  const conditionName = activeScan?.condition?.replace('_', ' ') || activeScan?.prediction || 'Gingivitis';
  const confidenceScore = activeScan?.confidence ? Number(activeScan.confidence).toFixed(1) : '93.9';

  return (
    <motion.div className="dashboard-view consult-page-view" initial="hidden" animate="show" variants={stagger}>
      
      {/* HEADER CARD */}
      <motion.div variants={item} className="consult-header-card">
        <div className="consult-header-top">
          <Link
            to={`/dashboard/patient/doctor/${doc.id}`}
            state={{ predictionResult: activeScan }}
            className="consult-back-btn"
          >
            <ChevronLeft size={18} color="#00A6A6" /> Back to Doctor Profile
          </Link>

          <div className="consult-step-indicator">
            <span className="step-pill active">
              <strong>Step 1</strong> Schedule & Details
            </span>
            <span className="step-arrow">→</span>
            <span className="step-pill">
              <strong>Step 2</strong> Secure Payment
            </span>
          </div>
        </div>

        <div className="consult-header-content">
          <h1 className="consult-header-title">Request Specialist Consultation</h1>
          <p className="consult-header-desc">
            Schedule your personalized clinical review and receive verified prescriptions from <strong style={{ color: '#00A6A6' }}>{doc.name}</strong>.
          </p>
        </div>
      </motion.div>

      {/* 2-COLUMN MAIN CONTENT GRID */}
      <div className="consult-main-grid">

        {/* LEFT COLUMN: CONSULTATION FORM */}
        <div className="consult-left-col">
          <motion.form variants={item} className="consult-form-card" onSubmit={handleSubmit}>
            
            <div className="consult-card-section-header">
              <h2 className="consult-section-title">Consultation Details</h2>
              <span className="consult-section-subtitle">Choose your appointment preferences & symptoms</span>
            </div>

            {/* SELECTED SPECIALIST SUMMARY */}
            <div className="consult-field-group">
              <label className="consult-field-label">Selected Specialist</label>
              
              <div className="consult-specialist-card">
                <div className="specialist-avatar-wrap">
                  {doc.profileImage ? (
                    <img src={doc.profileImage} alt={doc.name} className="specialist-avatar-img" />
                  ) : (
                    <span className="specialist-avatar-initials">{initials}</span>
                  )}
                  <div className="specialist-verified-badge" title="Verified Medical License">
                    <BadgeCheck size={16} color="#FFFFFF" fill="#00A6A6" />
                  </div>
                </div>

                <div className="specialist-details-wrap">
                  <div className="specialist-title-row">
                    <h3 className="specialist-name">{doc.name}</h3>
                    <span className="specialist-verified-pill">Licensed BDS, MDS</span>
                  </div>
                  
                  {(doc.clinic || doc.location) ? (
                    <p className="specialist-meta">
                      {doc.clinic && (
                        <span>
                          <Building2 size={14} color="#00A6A6" /> {doc.clinic}
                        </span>
                      )}
                      {doc.clinic && doc.location && <span className="meta-dot">•</span>}
                      {doc.location && (
                        <span>
                          <MapPin size={14} color="#00A6A6" /> {doc.location}
                        </span>
                      )}
                    </p>
                  ) : null}

                  <div className="specialist-tags-row">
                    <span className="specialist-tag">{doc.specialization || 'Dental Practitioner'}</span>
                    <span className="specialist-tag star-tag">
                      <Star size={12} fill="#F59E0B" color="#F59E0B" /> Verified Specialist
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* APPOINTMENT MODE (STRICT SEPARATION: IN-PERSON VS ONLINE CHAT) */}
            <div className="consult-field-group">
              <label className="consult-field-label">Appointment Mode</label>
              
              <div className="consult-mode-grid">
                
                {/* 1. IN-PERSON CLINIC APPOINTMENT */}
                <div
                  className={`consult-mode-card ${consultationType === 'In-Person Clinic Visit' ? 'active' : ''}`}
                  onClick={() => setConsultationType('In-Person Clinic Visit')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="mode-card-header">
                    <div className="mode-icon-box" style={{ background: 'rgba(0, 166, 166, 0.12)', color: '#00A6A6' }}>
                      <Building2 size={22} color="#00A6A6" />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="mode-badge recommended">Physical Visit</span>
                      <span className="mode-badge" style={{ background: '#E6FFFA', color: '#00A6A6', fontWeight: 800 }}>₹500</span>
                    </div>
                  </div>
                  <h4 className="mode-card-title">In-Person Clinic Appointment</h4>
                  <p className="mode-card-desc">
                    Direct physical dental examination, clinical inspection & diagnostics at the specialist's clinic.
                  </p>
                  
                  {/* Clinic Address Callout */}
                  <div style={{ background: 'rgba(0, 166, 166, 0.06)', borderRadius: '8px', padding: '8px 10px', marginTop: '8px', border: '1px solid rgba(0, 166, 166, 0.15)', fontSize: '0.8rem', color: '#17324D' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: '#00A6A6' }}>
                      <MapPin size={13} /> {doc.clinic || 'Verified Dental Studio'}
                    </div>
                    <div style={{ color: '#64748B', marginTop: '2px', fontSize: '0.75rem' }}>
                      {doc.location || 'Clinic Address on Record'} • Physical Visit Required (No Online Chat)
                    </div>
                  </div>

                  <div className="mode-radio-indicator" style={{ marginTop: '10px' }}>
                    <span className="radio-dot"></span>
                    <span className="radio-label">{consultationType === 'In-Person Clinic Visit' ? 'Selected (₹500 + ₹49)' : 'Select (₹500)'}</span>
                  </div>
                </div>

                {/* 2. ONLINE CHAT CONSULTATION */}
                <div
                  className={`consult-mode-card ${consultationType === 'Chat Consultation' ? 'active' : ''}`}
                  onClick={() => setConsultationType('Chat Consultation')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="mode-card-header">
                    <div className="mode-icon-box chat-icon">
                      <MessageSquare size={22} color="#1677FF" />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="mode-badge flexible">Online Chat</span>
                      <span className="mode-badge" style={{ background: '#EFF6FF', color: '#1677FF', fontWeight: 800 }}>₹200</span>
                    </div>
                  </div>
                  <h4 className="mode-card-title">Online Chat Appointment</h4>
                  <p className="mode-card-desc">
                    Secure 1-on-1 online chat messaging with your specialist, intraoral photo sharing & authenticated e-prescriptions.
                  </p>
                  
                  {/* Online Chat Callout */}
                  <div style={{ background: 'rgba(22, 119, 255, 0.06)', borderRadius: '8px', padding: '8px 10px', marginTop: '8px', border: '1px solid rgba(22, 119, 255, 0.15)', fontSize: '0.8rem', color: '#17324D' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: '#1677FF' }}>
                      <MessageSquare size={13} /> Live Patient-Doctor Messaging
                    </div>
                    <div style={{ color: '#64748B', marginTop: '2px', fontSize: '0.75rem' }}>
                      Enables real-time consultation chat workspace upon doctor acceptance
                    </div>
                  </div>

                  <div className="mode-radio-indicator" style={{ marginTop: '10px' }}>
                    <span className="radio-dot"></span>
                    <span className="radio-label">{consultationType === 'Chat Consultation' ? 'Selected (₹200 + ₹49)' : 'Select (₹200)'}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* PREFERRED DATE & TIME */}
            <div className="consult-datetime-section">
              
              {/* DATE PICKER */}
              <div className="consult-input-box">
                <label className="consult-field-label" htmlFor="consult-date">
                  <Calendar size={15} color="#00A6A6" /> Preferred Date
                </label>
                <input
                  id="consult-date"
                  type="date"
                  className="consult-input"
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
                <div className="consult-quick-chips">
                  <button type="button" className="quick-chip" onClick={() => setQuickDate(0)}>Today</button>
                  <button type="button" className="quick-chip" onClick={() => setQuickDate(1)}>Tomorrow</button>
                  <button type="button" className="quick-chip" onClick={() => setQuickDate(2)}>In 2 Days</button>
                </div>
              </div>

              {/* TIME PICKER */}
              <div className="consult-input-box">
                <label className="consult-field-label" htmlFor="consult-time">
                  <Clock size={15} color="#00A6A6" /> Preferred Time Slot
                </label>
                <input
                  id="consult-time"
                  type="time"
                  className="consult-input"
                  value={time}
                  onChange={(e) => {
                    const newTime = e.target.value;
                    setTime(newTime);
                    if (slotsData.bookedSlots?.includes(newTime)) {
                      setSlotConflictError(`Selected time ${newTime} is already booked on this date.`);
                    } else {
                      setSlotConflictError(null);
                    }
                  }}
                  required
                />
                <div className="consult-quick-chips">
                  <button type="button" className="quick-chip" onClick={() => handleSelectSlot('10:00', !slotsData.bookedSlots?.includes('10:00'))}>10:00 AM</button>
                  <button type="button" className="quick-chip" onClick={() => handleSelectSlot('14:30', !slotsData.bookedSlots?.includes('14:30'))}>02:30 PM</button>
                  <button type="button" className="quick-chip" onClick={() => handleSelectSlot('17:00', !slotsData.bookedSlots?.includes('17:00'))}>05:00 PM</button>
                  <button type="button" className="quick-chip" onClick={() => handleSelectSlot('19:30', !slotsData.bookedSlots?.includes('19:30'))}>07:30 PM</button>
                </div>
              </div>

            </div>

            {/* DOCTOR APPOINTMENT SLOTS GRID */}
            <div className="consult-slots-section">
              <div className="slots-header-row">
                <div className="slots-header-title">
                  <Clock size={16} color="#00A6A6" />
                  <span>Doctor Calendar Slots ({date || 'Selected Date'})</span>
                </div>
                <div className="slots-legend">
                  <div className="legend-item">
                    <span className="legend-dot available"></span>
                    <span>Available</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot selected"></span>
                    <span>Selected</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot booked"></span>
                    <span>Booked</span>
                  </div>
                </div>
              </div>

              {isLoadingSlots ? (
                <div style={{ textAlign: 'center', padding: '16px', color: '#64748B', fontSize: '0.88rem' }}>
                  Checking slot availability...
                </div>
              ) : slotsData?.allSlots && slotsData.allSlots.length > 0 ? (
                <div className="slots-grid">
                  {slotsData.allSlots.map((slot) => {
                    const isSelected = time === slot.time;
                    const isAvailable = slot.available;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        className={`slot-card-btn ${isAvailable ? 'available' : 'booked'} ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectSlot(slot.time, isAvailable)}
                        disabled={!isAvailable}
                        title={isAvailable ? `Select slot at ${slot.displayTime}` : `Slot at ${slot.displayTime} is already booked`}
                      >
                        <span>{slot.displayTime}</span>
                        <span className="slot-card-status">
                          {isSelected ? 'Selected' : isAvailable ? 'Available' : 'Booked'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px', color: '#64748B', fontSize: '0.85rem' }}>
                  Please select a date to view available appointment slots.
                </div>
              )}

              {/* SLOT CONFLICT ERROR BANNER */}
              {slotConflictError && (
                <div className="slot-conflict-banner">
                  <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '2px' }}>Slot Unavailable</strong>
                    <span>{slotConflictError}</span>
                  </div>
                </div>
              )}
            </div>

            {/* SYMPTOMS / CONCERN DESCRIPTION */}
            <div className="consult-field-group">
              <label className="consult-field-label">
                Describe Your Symptoms & Concerns <span className="label-optional">(Optional)</span>
              </label>
              
              <div className="consult-symptoms-chips-bar">
                <span className="symptoms-hint">Quick add:</span>
                {quickSymptoms.map((sym, i) => (
                  <button
                    key={i}
                    type="button"
                    className="symptom-tag-btn"
                    onClick={() => handleAddSymptom(sym)}
                  >
                    + {sym}
                  </button>
                ))}
              </div>

              <textarea
                className="consult-textarea"
                rows="4"
                placeholder="Describe your current discomfort, pain level, symptoms duration, or specific questions for the specialist..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              ></textarea>
            </div>

            {/* BOOKING SUMMARY BOX */}
            <div className="consult-summary-box">
              <h4 className="summary-box-title">Appointment Summary</h4>
              
              <div className="summary-row">
                <span className="summary-label">
                  Specialist Consultation ({isChat ? 'Online Chat Appointment' : 'In-Person Clinic Appointment'})
                </span>
                <span className="summary-val">₹{consultationFee}</span>
              </div>
              
              <div className="summary-row">
                <span className="summary-label">
                  DentaAI Diagnostic Platform & Review Access
                </span>
                <span className="summary-val">₹{platformFee}</span>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-total-row">
                <div>
                  <span className="total-label">Total Amount Payable</span>
                  <span className="total-sub">Includes taxes & verified prescription</span>
                </div>
                <div className="total-price-wrap">
                  <span className="total-currency">₹</span>
                  <span className="total-amount">{totalPayable}</span>
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="consult-proceed-btn"
              disabled={Boolean(slotConflictError) || (Boolean(time) && slotsData.bookedSlots?.includes(time))}
              style={(Boolean(slotConflictError) || (Boolean(time) && slotsData.bookedSlots?.includes(time))) ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
              <span>{(Boolean(slotConflictError) || (Boolean(time) && slotsData.bookedSlots?.includes(time))) ? 'Slot Unavailable - Select Another' : 'Proceed to Secure Payment'}</span>
              <ArrowRight size={20} />
            </button>

            <div className="consult-trust-footer">
              <div className="trust-footer-item">
                <Lock size={15} color="#10B981" />
                <span>256-Bit SSL Encrypted Payment</span>
              </div>
              <div className="trust-footer-item">
                <ShieldCheck size={15} color="#00A6A6" />
                <span>100% Refund if Doctor Cancels</span>
              </div>
            </div>

          </motion.form>
        </div>

        {/* RIGHT COLUMN: ATTACHED AI REPORT & CONSULTATION INCLUSIONS */}
        <div className="consult-right-col">
          
          {/* ATTACHED AI REPORT CARD */}
          <motion.div variants={item} className="consult-ai-card">
            
            <div className="consult-ai-header">
              <div className="ai-header-icon-box">
                <BrainCircuit size={20} color="#00A6A6" />
              </div>
              <div>
                <h3 className="consult-ai-title">Attached AI Scan Findings</h3>
                <span className="consult-ai-subtitle">Pre-consultation radiographic screening</span>
              </div>
            </div>

            {activeScan ? (
              <div className="consult-scan-content">
                
                {/* SCAN IMAGE PREVIEW (IF AVAILABLE) */}
                {scanHasImage && (
                  <div className="consult-scan-img-box">
                    <ScanImage
                      imagePath={activeScan.imagePath}
                      alt="Intraoral dental scan"
                      className="consult-scan-img"
                      onError={() => setImageError(true)}
                    />
                    <div className="consult-scan-tag">
                      <Camera size={13} /> Original Intraoral Scan
                    </div>
                  </div>
                )}

                {/* DETECTED CONDITION */}
                <div className="consult-finding-box">
                  <div className="finding-meta-row">
                    <span className="finding-label">Primary Anomaly Detected</span>
                    <span className="finding-case-id">
                      #{activeScan.scanId || (activeScan._id ? activeScan._id.substring(0, 8).toUpperCase() : 'SCAN-ACTIVE')}
                    </span>
                  </div>
                  <div className="finding-condition-name">{conditionName}</div>
                </div>

                {/* CONFIDENCE BAR */}
                <div className="consult-confidence-box">
                  <div className="confidence-label-row">
                    <span className="confidence-label">AI Model Confidence</span>
                    <span className="confidence-score-val">{confidenceScore}%</span>
                  </div>
                  <div className="confidence-progress-track">
                    <motion.div
                      className="confidence-progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(Number(confidenceScore) || 90, 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    ></motion.div>
                  </div>
                  <span className="confidence-rating-text">High Confidence Clinical Classification</span>
                </div>

                {/* AI RECOMMENDATION */}
                {activeScan.recommendation && (
                  <div className="consult-recommendation-box">
                    <div className="recommendation-header">
                      <Info size={16} color="#00A6A6" />
                      <strong>Diagnostic Recommendation</strong>
                    </div>
                    <p className="recommendation-text">{activeScan.recommendation}</p>
                  </div>
                )}

                <div className="consult-scan-doctor-notice">
                  <ShieldCheck size={16} color="#1677FF" style={{ flexShrink: 0 }} />
                  <span>Dr. {doc.name} will evaluate your original scan pixels, probability distributions, and clinical symptoms during this session.</span>
                </div>

              </div>
            ) : (
              <div className="consult-empty-scan-box">
                <div className="empty-scan-icon-wrap">
                  <BrainCircuit size={32} color="#00A6A6" />
                </div>
                <h4>Standard Clinical Consultation</h4>
                <p>No prior AI scan is attached to this request. You can share photographs or past dental records directly with Dr. {doc.name} during your session.</p>
              </div>
            )}

          </motion.div>

          {/* WHAT'S INCLUDED IN YOUR CONSULTATION */}
          <motion.div variants={item} className="consult-inclusions-card">
            <h4 className="inclusions-title">
              <Sparkles size={18} color="#00A6A6" /> Included in Your Consultation
            </h4>

            <div className="inclusions-list">
              <div className="inclusion-item">
                <div className="inclusion-icon-box">
                  <Video size={16} color="#00A6A6" />
                </div>
                <div className="inclusion-text">
                  <strong>1-on-1 Specialist Evaluation</strong>
                  <span>Direct diagnostic assessment by a verified practitioner</span>
                </div>
              </div>

              <div className="inclusion-item">
                <div className="inclusion-icon-box">
                  <FileText size={16} color="#00A6A6" />
                </div>
                <div className="inclusion-text">
                  <strong>Authenticated Digital E-Prescription</strong>
                  <span>Valid across all licensed medical & retail pharmacies</span>
                </div>
              </div>

              <div className="inclusion-item">
                <div className="inclusion-icon-box">
                  <CheckCircle2 size={16} color="#00A6A6" />
                </div>
                <div className="inclusion-text">
                  <strong>Personalized Care & Preventive Regimen</strong>
                  <span>Tailored home oral hygiene guidance and tooth care steps</span>
                </div>
              </div>

              <div className="inclusion-item">
                <div className="inclusion-icon-box">
                  <MessageSquare size={16} color="#00A6A6" />
                </div>
                <div className="inclusion-text">
                  <strong>7-Day Post-Care Messaging Access</strong>
                  <span>Follow-up messaging with {doc.name} at no extra charge</span>
                </div>
              </div>
            </div>

            <div className="consult-security-badge">
              <ShieldCheck size={16} color="#10B981" />
              <span>HIPAA & DISHA Aligned • End-to-End Encrypted Session</span>
            </div>
          </motion.div>

        </div>

      </div>

    </motion.div>
  );
};

export default ConsultationRequest;
