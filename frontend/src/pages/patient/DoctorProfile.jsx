import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star,
  MapPin,
  BriefcaseMedical,
  Clock,
  Award,
  Languages,
  Phone,
  Mail,
  Calendar,
  ChevronLeft,
  Stethoscope,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BrainCircuit,
  MessageSquare,
  Video,
  FileText,
  BadgeCheck,
  Building2
} from 'lucide-react';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const DoctorProfile = () => {
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

  const [doc, setDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/doctors/${id}`);
        if (res.ok) {
          const data = await res.json();
          // Normalize doc.id to the MongoDB _id string for consistency
          if (data._id && !data.id) data.id = data._id;
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
          Loading Doctor Profile...
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="dashboard-view" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card text-center" style={{ maxWidth: '440px', padding: '40px 24px', background: '#FFFFFF', borderRadius: '24px', border: '1px solid #BFD4E5' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#17324D', marginBottom: '12px' }}>Doctor Not Found</h2>
          <p style={{ color: '#52677A', marginBottom: '24px', fontSize: '0.95rem' }}>The requested doctor profile could not be located or may be inactive.</p>
          <Link to="/dashboard/patient/recommended-doctors" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '12px' }}>
            <ChevronLeft size={16} /> Back to Recommendations
          </Link>
        </div>
      </div>
    );
  }

  const handleConsultationRequest = () => {
    navigate(`/dashboard/patient/consult-request/${doc._id || doc.id}`, { state: { predictionResult: activeScan } });
  };

  // Generate initials for avatar
  const initials = doc.name
    ? doc.name.replace(/^(Dr\.|Dr)\s*/i, '').trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'DR';

  const expertiseList = [
    { label: 'Digital Dental Radiography', icon: '🔍' },
    { label: 'Gingivitis & Periodontal Care', icon: '🦷' },
    { label: 'Calculus & Plaque Assessment', icon: '⚡' },
    { label: 'Caries Risk & Restorations', icon: '🛡️' },
    { label: 'Tooth Whitening & Aesthetics', icon: '✨' },
    { label: 'Clinical E-Prescriptions', icon: '📋' },
    { label: 'Preventive Oral Regimens', icon: '🌿' }
  ];

  return (
    <div className="dashboard-view doctor-profile-view" style={{ minHeight: '100vh', width: '100%' }}>
      <motion.div initial="hidden" animate="show" variants={stagger}>

        {/* TOP NAVIGATION / BREADCRUMB */}
        <motion.div variants={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
            className="doctor-back-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '999px',
              fontSize: '0.92rem',
              fontWeight: 700,
              color: '#17324D',
              background: '#FFFFFF',
              border: '1px solid #BFD4E5',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease'
            }}
          >
            <ChevronLeft size={18} color="#00A6A6" /> Back to Specialists
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#52677A' }}>
              Portal ID: <strong style={{ color: '#17324D' }}>DOC-{(doc._id || doc.id).substring(0, 8).toUpperCase()}</strong>
            </span>
          </div>
        </motion.div>

        {/* HERO PROFILE CARD */}
        <motion.div variants={item} className="doctor-profile-hero-card">
          
          {/* TOP GRADIENT BANNER */}
          <div className="doctor-profile-banner">
            <div className="doctor-banner-overlay-circles" aria-hidden="true"></div>
            
            <div className="doctor-banner-top-row">
              {/* Left verified badge */}
              <div className="doctor-verified-badge">
                <ShieldCheck size={16} className="doctor-badge-icon" />
                <span>DentaAI Verified Specialist</span>
              </div>

              {/* Right live status & rating */}
              <div className="doctor-banner-stats">
                <div className="doctor-active-pill">
                  <span className="doctor-pulse-dot"></span>
                  <span>Active Today</span>
                </div>
                <div className="doctor-rating-pill">
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <span>4.9</span>
                  <small>(128 reviews)</small>
                </div>
              </div>
            </div>
          </div>

          {/* DOCTOR INFO BODY */}
          <div className="doctor-profile-body">
            
            {/* AVATAR + TITLE ROW */}
            <div className="doctor-header-row">
              <div className="doctor-avatar-wrapper">
                <div className="doctor-avatar-box">
                  {doc.profileImage ? (
                    <img src={doc.profileImage} alt={doc.name} className="doctor-avatar-img" />
                  ) : (
                    <span className="doctor-avatar-initials">{initials}</span>
                  )}
                </div>
                <div className="doctor-avatar-check" title="Verified Medical License">
                  <BadgeCheck size={20} color="#FFFFFF" fill="#00A6A6" />
                </div>
              </div>

              <div className="doctor-titles-col">
                <div className="doctor-name-badge-line">
                  <h1 className="doctor-name">{doc.name}</h1>
                  <span className="doctor-licensed-pill">Licensed BDS, MDS</span>
                </div>

                <div className="doctor-subtitles-line">
                  <span className="doctor-specialization-text">{doc.specialization || 'Periodontist & Implantologist'}</span>
                  <span className="doctor-dot-separator">•</span>
                  <span className="doctor-experience-text">
                    <Award size={15} color="#00A6A6" /> {doc.experience || '10+'} Years Clinical Experience
                  </span>
                </div>

                {/* Highlights pill strip */}
                <div className="doctor-highlights-strip">
                  {doc.clinic && (
                    <div className="doctor-highlight-pill">
                      <Building2 size={14} color="#00A6A6" />
                      <span>{doc.clinic}</span>
                    </div>
                  )}
                  {doc.location && (
                    <div className="doctor-highlight-pill">
                      <MapPin size={14} color="#00A6A6" />
                      <span>{doc.location}</span>
                    </div>
                  )}
                  <div className="doctor-highlight-pill">
                    <Languages size={14} color="#00A6A6" />
                    <span>English, Hindi</span>
                  </div>
                  <div className="doctor-highlight-pill accent-pill">
                    <Sparkles size={14} color="#1677FF" />
                    <span>99% Patient Satisfaction</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

        {/* 2-COLUMN MAIN CONTENT GRID */}
        <div className="doctor-profile-grid">
          
          {/* LEFT COLUMN: SPECIALIST DETAILS */}
          <div className="doctor-left-col">
            
            {/* ABOUT SPECIALIST */}
            <motion.div variants={item} className="doctor-section-card">
              <div className="doctor-card-title-row">
                <div className="doctor-card-title-icon">
                  <Stethoscope size={20} color="#00A6A6" />
                </div>
                <div>
                  <h3 className="doctor-card-title">About Specialist</h3>
                  <p className="doctor-card-subtitle">Clinical background, training & care philosophy</p>
                </div>
              </div>

              <p className="doctor-bio-text">
                {doc.about || `${doc.name} is a highly accomplished ${doc.specialization || 'dental specialist'} dedicated to providing compassionate, evidence-based patient care. Leveraging state-of-the-art DentaAI diagnostic intelligence and precision screening, ${doc.name.split(' ')[0]} works collaboratively with patients to formulate tailored therapeutic and preventive oral health regimens.`}
              </p>

              {/* 3 Trust Cards */}
              <div className="doctor-trust-grid">
                <div className="doctor-trust-card">
                  <div className="doctor-trust-icon-box">
                    <ShieldCheck size={20} color="#00A6A6" />
                  </div>
                  <div className="doctor-trust-info">
                    <h4>Verified Credentials</h4>
                    <p>Accredited dental surgeon in active standing with clinical regulatory boards.</p>
                  </div>
                </div>

                <div className="doctor-trust-card">
                  <div className="doctor-trust-icon-box">
                    <BrainCircuit size={20} color="#06C6E8" />
                  </div>
                  <div className="doctor-trust-info">
                    <h4>AI-Assisted Precision</h4>
                    <p>Integrates deep-learning computer vision scans with comprehensive clinical evaluation.</p>
                  </div>
                </div>

                <div className="doctor-trust-card">
                  <div className="doctor-trust-icon-box">
                    <FileText size={20} color="#10B981" />
                  </div>
                  <div className="doctor-trust-info">
                    <h4>Legitimate E-Prescription</h4>
                    <p>Provides tamper-proof, verified digital prescriptions for therapeutics & medications.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* EXPERTISE & DIAGNOSTIC FOCUS */}
            <motion.div variants={item} className="doctor-section-card">
              <div className="doctor-card-title-row">
                <div className="doctor-card-title-icon">
                  <Activity size={20} color="#00A6A6" />
                </div>
                <div>
                  <h3 className="doctor-card-title">Diagnostic & Clinical Focus</h3>
                  <p className="doctor-card-subtitle">Specialized conditions evaluated and treated</p>
                </div>
              </div>

              <div className="doctor-skills-cloud">
                {expertiseList.map((skill, i) => (
                  <div key={i} className="doctor-skill-chip">
                    <span className="skill-chip-emoji">{skill.icon}</span>
                    <span className="skill-chip-text">{skill.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* PATIENT CARE GUARANTEE */}
            <motion.div variants={item} className="doctor-guarantee-card">
              <div className="doctor-guarantee-header">
                <div className="doctor-guarantee-icon-box">
                  <ShieldCheck size={22} color="#00A6A6" />
                </div>
                <div>
                  <h4 className="doctor-guarantee-title">DentaAI Clinical Consultation Guarantee</h4>
                  <p className="doctor-guarantee-subtitle">Official verified standards for all specialist sessions</p>
                </div>
              </div>
              <ul className="doctor-guarantee-list">
                <li>
                  <strong>Direct Specialist Assessment:</strong> Your dental scan and symptoms are personally reviewed by {doc.name}.
                </li>
                <li>
                  <strong>Official Digital Prescription:</strong> Receive an authenticated pharmaceutical and therapeutic care plan directly to your dashboard.
                </li>
                <li>
                  <strong>7-Day Post-Consultation Support:</strong> Follow-up messaging is enabled for 7 full days to clarify any dosage or care instructions.
                </li>
              </ul>
            </motion.div>

          </div>

          {/* RIGHT COLUMN: CONSULTATION BOOKING & CLINICAL CONTACT */}
          <div className="doctor-right-col">
            
            {/* CONSULTATION BOOKING CARD */}
            <motion.div variants={item} className="doctor-booking-card">
              
              <div className="doctor-booking-header">
                <div>
                  <span className="doctor-booking-label">Consultation Fee</span>
                  <div className="doctor-price-row">
                    <span className="doctor-price-currency">₹</span>
                    <span className="doctor-price-amount">{doc.fee || 500}</span>
                    <span className="doctor-price-term">/ session</span>
                  </div>
                </div>
                <div className="doctor-review-tag">
                  <span>AI Scan Included</span>
                </div>
              </div>

              {/* ACTIVE SCAN CONTEXT (IF AVAILABLE) */}
              {activeScan && (
                <div className="doctor-attached-scan-box">
                  <div className="scan-box-header">
                    <BrainCircuit size={16} color="#00A6A6" />
                    <strong>Attached AI Scan Ready</strong>
                  </div>
                  <p className="scan-box-text">
                    Detected Condition: <span>{activeScan.prediction || 'Dental Finding'}</span> ({activeScan.confidence || '94%'} AI confidence). This report will be transmitted to {doc.name} with your booking.
                  </p>
                </div>
              )}

              {/* CONSULTATION PERKS LIST */}
              <div className="doctor-perks-list">
                <div className="doctor-perk-item">
                  <div className="perk-icon-wrap"><Building2 size={16} color="#00A6A6" /></div>
                  <div className="perk-text-wrap">
                    <strong>In-Person Clinical Consultation</strong>
                    <span>Direct physical dental examination & diagnostics at clinic</span>
                  </div>
                </div>

                <div className="doctor-perk-item">
                  <div className="perk-icon-wrap"><FileText size={16} color="#00A6A6" /></div>
                  <div className="perk-text-wrap">
                    <strong>Certified E-Prescription</strong>
                    <span>Valid at all licensed physical and online pharmacies</span>
                  </div>
                </div>

                <div className="doctor-perk-item">
                  <div className="perk-icon-wrap"><Sparkles size={16} color="#00A6A6" /></div>
                  <div className="perk-text-wrap">
                    <strong>Personalized Care & Home Protocol</strong>
                    <span>Customized daily preventive habits and dental hygiene steps</span>
                  </div>
                </div>

                <div className="doctor-perk-item">
                  <div className="perk-icon-wrap"><MessageSquare size={16} color="#00A6A6" /></div>
                  <div className="perk-text-wrap">
                    <strong>7-Day Post Consultation Follow-up</strong>
                    <span>Ask follow-up care questions without additional charges</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button
                onClick={handleConsultationRequest}
                className="doctor-book-btn"
              >
                <span>Book Consultation</span>
                <ArrowRight size={18} />
              </button>

              <div className="doctor-quick-response-info">
                <span className="quick-response-dot"></span>
                <span>Doctor is active • Average response in &lt; 15 mins</span>
              </div>
            </motion.div>

            {/* CLINICAL CONTACT CARD */}
            <motion.div variants={item} className="doctor-contact-card">
              <h4 className="doctor-contact-title">Clinical Contact & Hours</h4>

              <div className="doctor-contact-list">
                <div className="doctor-contact-row">
                  <div className="contact-icon-box">
                    <Mail size={16} color="#00A6A6" />
                  </div>
                  <div className="contact-info-col">
                    <span className="contact-label">Official Email</span>
                    <span className="contact-val">{doc.email}</span>
                  </div>
                </div>

                <div className="doctor-contact-row">
                  <div className="contact-icon-box">
                    <Phone size={16} color="#00A6A6" />
                  </div>
                  <div className="contact-info-col">
                    <span className="contact-label">Clinic Phone</span>
                    <span className="contact-val">{doc.phone || '+91 98765 43210'}</span>
                  </div>
                </div>

                <div className="doctor-contact-row">
                  <div className="contact-icon-box">
                    <Clock size={16} color="#00A6A6" />
                  </div>
                  <div className="contact-info-col">
                    <span className="contact-label">Operating Timings</span>
                    <span className="contact-val">{doc.timings || 'Mon - Sat: 9:00 AM - 6:00 PM'}</span>
                  </div>
                </div>

                {(doc.clinic || doc.location) && (
                  <div className="doctor-contact-row">
                    <div className="contact-icon-box">
                      <Building2 size={16} color="#00A6A6" />
                    </div>
                    <div className="contact-info-col">
                      <span className="contact-label">Clinical Facility</span>
                      {doc.clinic && <span className="contact-val">{doc.clinic}</span>}
                      {doc.location && <span className="contact-subval">{doc.location}</span>}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

          </div>

        </div>

      </motion.div>
    </div>
  );
};

export default DoctorProfile;
