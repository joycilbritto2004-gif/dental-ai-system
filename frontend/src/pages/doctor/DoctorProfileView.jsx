import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserCircle, Save, MapPin, Building2, GraduationCap, Languages, 
  DollarSign, CheckCircle2, AlertCircle, ShieldCheck, Stethoscope, 
  Clock, Phone, FileText, ArrowLeft, ExternalLink, Copy, Check, 
  Sparkles, BadgeCheck, Eye, Star, Activity, Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const SPECIALTY_PRESETS = [
  'Periodontist & Implantologist',
  'Orthodontist',
  'Endodontist',
  'Oral & Maxillofacial Surgeon',
  'Prosthodontist',
  'Pediatric Dentist',
  'Cosmetic Dentist',
  'General Dental Surgeon'
];

const DoctorProfileView = () => {
  const [profile, setProfile] = useState({
    name: "",
    specialization: "General Dentist",
    clinic: "Premium Dental Care",
    experience: "10 Years",
    location: "Mumbai, Maharashtra",
    fee: "500",
    languages: "English, Hindi",
    phone: "",
    bio: ""
  });

  const [initialProfile, setInitialProfile] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedUid, setCopiedUid] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const userStr = localStorage.getItem('dentaai_user');
        let localUser = null;
        if (userStr) {
          try {
            localUser = JSON.parse(userStr);
            if (localUser._id || localUser.id) {
              setDoctorId(localUser._id || localUser.id);
            }
          } catch (e) {
            console.error('Failed to parse local user:', e);
          }
        }

        const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/api/auth/profile`, { headers });

        if (res.ok) {
          const user = await res.json();
          if (user._id || user.id) {
            setDoctorId(user._id || user.id);
          }
          const loadedData = {
            name: user.name || localUser?.name || 'Dr. Doctor',
            specialization: user.specialization || localUser?.specialization || 'Periodontist & Implantologist',
            clinic: user.clinic || localUser?.clinic || 'SmileCraft Dental Studio',
            location: user.location || localUser?.location || 'Mumbai, Maharashtra',
            experience: user.experience || localUser?.experience || '10 Years',
            fee: user.fee !== undefined ? String(user.fee) : (localUser?.fee !== undefined ? String(localUser.fee) : '500'),
            languages: user.languages || localUser?.languages || 'English, Hindi',
            phone: user.phone || localUser?.phone || '',
            bio: user.bio || localUser?.bio || 'Specialized dental clinician dedicated to advanced diagnostic imaging, periodontal restorations, and evidence-based patient rehabilitation.'
          };
          setProfile(loadedData);
          setInitialProfile(loadedData);
        } else if (localUser) {
          const loadedData = {
            name: localUser.name || 'Dr. Doctor',
            specialization: localUser.specialization || 'Periodontist & Implantologist',
            clinic: localUser.clinic || 'SmileCraft Dental Studio',
            location: localUser.location || 'Mumbai, Maharashtra',
            experience: localUser.experience || '10 Years',
            fee: localUser.fee !== undefined ? String(localUser.fee) : '500',
            languages: localUser.languages || 'English, Hindi',
            phone: localUser.phone || '',
            bio: localUser.bio || 'Specialized dental clinician dedicated to advanced diagnostic imaging, periodontal restorations, and evidence-based patient rehabilitation.'
          };
          setProfile(loadedData);
          setInitialProfile(loadedData);
        }
      } catch (err) {
        console.error('Error fetching doctor profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
    setErrorMessage('');
  };

  const handleSelectSpecialty = (spec) => {
    setProfile(prev => ({ ...prev, specialization: spec }));
    setIsSaved(false);
    setErrorMessage('');
  };

  const handleReset = () => {
    if (initialProfile) {
      setProfile(initialProfile);
      setErrorMessage('');
      setIsSaved(false);
    }
  };

  const handleCopyUid = () => {
    if (!doctorId) return;
    const formatted = `DOC-${doctorId.substring(Math.max(0, doctorId.length - 6)).toUpperCase()}`;
    navigator.clipboard?.writeText(formatted);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setIsSaved(false);

    try {
      if (!profile.name.trim()) {
        throw new Error('Please enter your full professional name.');
      }

      const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: profile.name.trim(),
          specialization: profile.specialization.trim(),
          clinic: profile.clinic.trim(),
          location: profile.location.trim(),
          experience: profile.experience.trim(),
          languages: profile.languages.trim(),
          phone: profile.phone.trim(),
          bio: profile.bio.trim(),
          fee: Number(profile.fee) || 0
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update profile settings.');
      }

      const updatedUser = await res.json();

      // Update local storage so topbar and other views immediately reflect changes
      const userStr = localStorage.getItem('dentaai_user');
      if (userStr) {
        try {
          const current = JSON.parse(userStr);
          const merged = {
            ...current,
            name: updatedUser.name || profile.name.trim(),
            specialization: updatedUser.specialization || profile.specialization.trim(),
            clinic: updatedUser.clinic || profile.clinic.trim(),
            location: updatedUser.location || profile.location.trim(),
            experience: updatedUser.experience || profile.experience.trim(),
            languages: updatedUser.languages || profile.languages.trim(),
            phone: updatedUser.phone || profile.phone.trim(),
            bio: updatedUser.bio || profile.bio.trim(),
            fee: updatedUser.fee !== undefined ? updatedUser.fee : Number(profile.fee)
          };
          localStorage.setItem('dentaai_user', JSON.stringify(merged));
          window.dispatchEvent(new Event('storage'));
        } catch (e) {
          console.error('Error updating localStorage:', e);
        }
      }

      setInitialProfile({ ...profile });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setErrorMessage(err.message || 'Error saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'DR';
    const clean = name.replace(/^Dr\.\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayUid = doctorId 
    ? `DOC-${doctorId.substring(Math.max(0, doctorId.length - 6)).toUpperCase()}` 
    : 'DOC-8F3A2B';

  if (isLoading) {
    return (
      <div className="screening-history-wrapper">
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '80px 20px', 
            background: '#FFFFFF', 
            borderRadius: '24px', 
            border: '1px solid #BFD4E5', 
            boxShadow: '0 6px 24px rgba(7, 26, 51, 0.04)' 
          }}
        >
          <Activity className="spin-anim" size={38} color="#00A6A6" style={{ marginBottom: '16px' }} />
          <p style={{ margin: 0, color: '#64748B', fontWeight: 600, fontSize: '0.95rem' }}>
            Loading doctor credentials and clinical settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="screening-history-wrapper">
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }}
      >
        
        {/* 1. CLINICAL HEADER CARD */}
        <div className="screening-header-card" style={{ marginBottom: '24px' }}>
          <div className="screening-header-stripe"></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div className="screening-badge">
                <Stethoscope size={14} /> Doctor Practice & Medical Credentials
              </div>
              <h1 className="screening-title">My Profile</h1>
              <p className="screening-subtitle">
                Manage your professional medical credentials, clinic details, consultation fee, and public practice presence.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '9px 16px', 
                  borderRadius: '999px', 
                  background: '#ECFDF5', 
                  color: '#059669', 
                  border: '1px solid #A7F3D0', 
                  fontSize: '0.8rem', 
                  fontWeight: 700 
                }}
              >
                <BadgeCheck size={15} /> Board Certified Specialist
              </div>

              {doctorId && (
                <Link
                  to={`/dashboard/patient/doctors/${doctorId}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '9px 18px',
                    borderRadius: '12px',
                    background: '#F0FDFA',
                    color: '#00A6A6',
                    border: '1px solid #99E3D8',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  title="View how your profile appears to prospective patients"
                >
                  <Eye size={15} /> Preview Public Listing <ExternalLink size={13} />
                </Link>
              )}

              <Link 
                to="/dashboard/doctor" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '12px',
                  background: '#FFFFFF',
                  color: '#17324D',
                  border: '1px solid #BFD4E5',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(7, 26, 51, 0.04)',
                  transition: 'all 0.2s ease'
                }}
              >
                <ArrowLeft size={15} /> Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* 2. TWO-COLUMN BALANCED CLINICAL LAYOUT */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 360px) 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* ================= LEFT COLUMN: SPECIALIST IDENTITY & TRUST DOSSIER ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Primary Profile Summary Card */}
            <div 
              style={{ 
                background: '#FFFFFF', 
                border: '1px solid #BFD4E5', 
                borderRadius: '24px', 
                padding: '32px 24px', 
                boxShadow: '0 6px 24px rgba(7, 26, 51, 0.04)',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              {/* Avatar Circle with Doctor Initials */}
              <div 
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  boxShadow: '0 8px 24px rgba(0, 166, 166, 0.25)',
                  margin: '0 auto 16px auto',
                  border: '4px solid #FFFFFF',
                  position: 'relative'
                }}
              >
                {getInitials(profile.name)}
                <div 
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    background: '#FFFFFF',
                    borderRadius: '50%',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  <BadgeCheck size={22} color="#00A6A6" />
                </div>
              </div>

              {/* Doctor Name & Specialty */}
              <h2 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', fontWeight: 800, color: '#17324D', letterSpacing: '-0.3px' }}>
                {profile.name || 'Dr. Doctor'}
              </h2>

              <p style={{ margin: '0 0 14px 0', fontSize: '0.9rem', color: '#00A6A6', fontWeight: 700 }}>
                {profile.specialization || 'Dental Specialist'}
              </p>

              {/* Rating & Review Badge */}
              <div 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '5px 14px', 
                  borderRadius: '999px', 
                  background: '#FEF3C7', 
                  color: '#92400E', 
                  border: '1px solid #FDE68A', 
                  fontSize: '0.78rem', 
                  fontWeight: 700,
                  marginBottom: '18px'
                }}
              >
                <Star size={13} fill="#D97706" color="#D97706" /> 4.9 / 5.0 (148 Patient Reviews)
              </div>

              <div style={{ height: '1px', background: '#F1F5F9', margin: '14px 0' }}></div>

              {/* Metadata Key-Value List */}
              <div style={{ textAlign: 'left' }}>
                <div className="patient-meta-row">
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Doctor UID</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#17324D', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.84rem' }}>
                      {displayUid}
                    </span>
                    <button
                      onClick={handleCopyUid}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        color: copiedUid ? '#059669' : '#94A3B8'
                      }}
                      title="Copy Doctor UID"
                    >
                      {copiedUid ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                <div className="patient-meta-row">
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Account Status</span>
                  <span style={{ color: '#059669', fontWeight: 800, background: '#ECFDF5', padding: '3px 9px', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid #A7F3D0' }}>
                    Active & Verified
                  </span>
                </div>

                <div className="patient-meta-row">
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Clinic Practice</span>
                  <span style={{ color: '#17324D', fontWeight: 700, fontSize: '0.86rem', textAlign: 'right', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={profile.clinic}>
                    {profile.clinic || 'SmileCraft Dental'}
                  </span>
                </div>

                <div className="patient-meta-row">
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Location</span>
                  <span style={{ color: '#17324D', fontWeight: 700, fontSize: '0.86rem', textAlign: 'right' }}>
                    {profile.location || 'Mumbai, MH'}
                  </span>
                </div>

                <div className="patient-meta-row">
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Experience</span>
                  <span style={{ color: '#17324D', fontWeight: 700, fontSize: '0.86rem' }}>
                    {profile.experience || '10 Years'}
                  </span>
                </div>

                <div className="patient-meta-row">
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Consultation Rate</span>
                  <span style={{ color: '#00A6A6', fontWeight: 800, fontSize: '0.94rem' }}>
                    ₹{profile.fee || '500'} <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 500 }}>/ case</span>
                  </span>
                </div>

                <div className="patient-meta-row">
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Languages</span>
                  <span style={{ color: '#17324D', fontWeight: 700, fontSize: '0.82rem', textAlign: 'right' }}>
                    {profile.languages || 'English, Hindi'}
                  </span>
                </div>

                <div className="patient-meta-row">
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Triage Authority</span>
                  <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}>
                    <ShieldCheck size={14} /> Full Prescriptions
                  </span>
                </div>
              </div>

              {doctorId && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                  <Link
                    to={`/dashboard/patient/doctors/${doctorId}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '11px 16px',
                      borderRadius: '12px',
                      background: '#F8FAFC',
                      color: '#17324D',
                      border: '1px solid #CBD5E1',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                  >
                    <Eye size={15} color="#00A6A6" /> View Public Patient View
                  </Link>
                </div>
              )}
            </div>

            {/* Compliance & Regulatory Card */}
            <div 
              style={{ 
                background: '#F8FAFC', 
                border: '1px solid #E2E8F0', 
                borderRadius: '20px', 
                padding: '24px', 
                boxShadow: '0 4px 16px rgba(7, 26, 51, 0.02)' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ background: 'rgba(0, 166, 166, 0.12)', padding: '8px', borderRadius: '10px', color: '#00A6A6' }}>
                  <ShieldCheck size={20} />
                </div>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#17324D' }}>
                  Compliance & Regulatory
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                  <CheckCircle2 size={15} color="#059669" /> DCI Registered Dental Practitioner
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                  <CheckCircle2 size={15} color="#059669" /> HIPAA & DISHA Telemedicine Standards
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                  <CheckCircle2 size={15} color="#059669" /> Verified Digital Rx Authority
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                  <CheckCircle2 size={15} color="#059669" /> 256-Bit SSL Encrypted Health Triage
                </div>
              </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: PRACTICE CREDENTIALS & SETTINGS FORM ================= */}
          <div>
            
            {/* Feedback Notifications */}
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                  padding: '16px 20px', 
                  borderRadius: '16px', 
                  marginBottom: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  fontWeight: 600, 
                  fontSize: '0.9rem',
                  background: '#FEF2F2', 
                  color: '#991B1B', 
                  border: '1px solid #FCA5A5',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)'
                }}
              >
                <AlertCircle size={20} color="#DC2626" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {isSaved && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                  padding: '16px 20px', 
                  borderRadius: '16px', 
                  marginBottom: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  fontWeight: 600, 
                  fontSize: '0.9rem',
                  background: '#ECFDF5', 
                  color: '#065F46', 
                  border: '1px solid #A7F3D0',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)'
                }}
              >
                <CheckCircle2 size={20} color="#059669" />
                <span>Doctor profile and practice credentials saved successfully! Changes are live across all patient listings.</span>
              </motion.div>
            )}

            {/* Section 1: Professional Details Form */}
            <div 
              style={{ 
                background: '#FFFFFF', 
                border: '1px solid #BFD4E5', 
                borderRadius: '24px', 
                padding: '32px', 
                boxShadow: '0 6px 24px rgba(7, 26, 51, 0.04)',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', padding: '9px', borderRadius: '12px' }}>
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#17324D' }}>
                    Clinical Practice & Practice Details
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.86rem', color: '#64748B' }}>
                    Information shown on patient consultation listings, digital prescriptions, and invoice statements.
                  </p>
                </div>
              </div>

              <div style={{ height: '1px', background: '#F1F5F9', margin: '20px 0 24px 0' }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                
                {/* 1. Full Name */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: 700, color: '#17324D', marginBottom: '8px' }}>
                    <UserCircle size={16} color="#00A6A6" /> Professional Full Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    className="patient-input-field" 
                    name="name" 
                    value={profile.name} 
                    onChange={handleChange} 
                    placeholder="e.g. Dr. Priya Menon" 
                    style={{ background: '#FFFFFF', border: '1px solid #CBD5E1' }}
                  />
                  <span style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '5px', display: 'block' }}>
                    Appears with "Dr." prefix on official clinical reports.
                  </span>
                </div>

                {/* 2. Specialization */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: 700, color: '#17324D', marginBottom: '8px' }}>
                    <GraduationCap size={16} color="#00A6A6" /> Specialization / Field <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    className="patient-input-field" 
                    name="specialization" 
                    value={profile.specialization} 
                    onChange={handleChange} 
                    placeholder="e.g. Periodontist & Implantologist" 
                    style={{ background: '#FFFFFF', border: '1px solid #CBD5E1' }}
                  />
                  {/* Specialty Presets */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {SPECIALTY_PRESETS.slice(0, 4).map((spec) => (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => handleSelectSpecialty(spec)}
                        style={{
                          background: profile.specialization === spec ? '#E0F2FE' : '#F1F5F9',
                          color: profile.specialization === spec ? '#0284C7' : '#64748B',
                          border: profile.specialization === spec ? '1px solid #BAE6FD' : '1px solid transparent',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Clinic Name */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: 700, color: '#17324D', marginBottom: '8px' }}>
                    <Building2 size={16} color="#00A6A6" /> Clinic / Hospital Name
                  </label>
                  <input 
                    type="text" 
                    className="patient-input-field" 
                    name="clinic" 
                    value={profile.clinic} 
                    onChange={handleChange} 
                    placeholder="e.g. SmileCraft Dental Studio" 
                    style={{ background: '#FFFFFF', border: '1px solid #CBD5E1' }}
                  />
                </div>

                {/* 4. Location */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: 700, color: '#17324D', marginBottom: '8px' }}>
                    <MapPin size={16} color="#00A6A6" /> Practice Location (City, State)
                  </label>
                  <input 
                    type="text" 
                    className="patient-input-field" 
                    name="location" 
                    value={profile.location} 
                    onChange={handleChange} 
                    placeholder="e.g. Mumbai, Maharashtra" 
                    style={{ background: '#FFFFFF', border: '1px solid #CBD5E1' }}
                  />
                </div>

                {/* 5. Experience */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: 700, color: '#17324D', marginBottom: '8px' }}>
                    <Clock size={16} color="#00A6A6" /> Clinical Experience
                  </label>
                  <input 
                    type="text" 
                    className="patient-input-field" 
                    name="experience" 
                    value={profile.experience} 
                    onChange={handleChange} 
                    placeholder="e.g. 10 Years" 
                    style={{ background: '#FFFFFF', border: '1px solid #CBD5E1' }}
                  />
                </div>

                {/* 6. Consultation Fee */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: 700, color: '#17324D', marginBottom: '8px' }}>
                    <DollarSign size={16} color="#00A6A6" /> Consultation Fee (₹)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" 
                      min="0" 
                      step="50" 
                      className="patient-input-field" 
                      name="fee" 
                      value={profile.fee} 
                      onChange={handleChange} 
                      placeholder="500" 
                      style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', paddingLeft: '36px' }}
                    />
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748B', fontSize: '0.95rem' }}>
                      ₹
                    </span>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: '#94A3B8', marginTop: '5px', display: 'block' }}>
                    Standard charge credited to your earnings upon case completion.
                  </span>
                </div>

                {/* 7. Languages Spoken */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: 700, color: '#17324D', marginBottom: '8px' }}>
                    <Languages size={16} color="#00A6A6" /> Languages Spoken
                  </label>
                  <input 
                    type="text" 
                    className="patient-input-field" 
                    name="languages" 
                    value={profile.languages} 
                    onChange={handleChange} 
                    placeholder="e.g. English, Hindi, Marathi" 
                    style={{ background: '#FFFFFF', border: '1px solid #CBD5E1' }}
                  />
                </div>

                {/* 8. Phone Contact */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: 700, color: '#17324D', marginBottom: '8px' }}>
                    <Phone size={16} color="#00A6A6" /> Emergency / Direct Phone
                  </label>
                  <input 
                    type="tel" 
                    className="patient-input-field" 
                    name="phone" 
                    value={profile.phone} 
                    onChange={handleChange} 
                    placeholder="e.g. +91 98765 43210" 
                    style={{ background: '#FFFFFF', border: '1px solid #CBD5E1' }}
                  />
                </div>

              </div>
            </div>

            {/* Section 2: Clinical Philosophy & Bio */}
            <div 
              style={{ 
                background: '#FFFFFF', 
                border: '1px solid #BFD4E5', 
                borderRadius: '24px', 
                padding: '32px', 
                boxShadow: '0 6px 24px rgba(7, 26, 51, 0.04)',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', padding: '9px', borderRadius: '12px' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#17324D' }}>
                    Clinical Bio & Patient Philosophy
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.86rem', color: '#64748B' }}>
                    Describe your clinical background, specialized treatments, and approach to preventive dental health.
                  </p>
                </div>
              </div>

              <div style={{ height: '1px', background: '#F1F5F9', margin: '20px 0 24px 0' }}></div>

              <div>
                <textarea 
                  rows={4} 
                  className="patient-input-field" 
                  name="bio" 
                  value={profile.bio} 
                  onChange={handleChange} 
                  placeholder="Provide an overview of your clinical training, specialized dental procedures (e.g. dental implants, periodontal flap surgeries, laser therapy), and your patient care philosophy..."
                  style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', resize: 'vertical', minHeight: '100px', lineHeight: 1.6 }}
                />
                <span style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '6px', display: 'block' }}>
                  This statement is displayed on your public DentaAI doctor profile card to patients seeking specialized consultations.
                </span>
              </div>
            </div>

            {/* Section 3: Bottom Form Actions */}
            <div 
              style={{ 
                background: '#FFFFFF', 
                border: '1px solid #BFD4E5', 
                borderRadius: '20px', 
                padding: '20px 28px', 
                boxShadow: '0 4px 16px rgba(7, 26, 51, 0.03)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    background: '#F1F5F9',
                    color: '#475569',
                    border: '1px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '10px 20px',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Reset Changes
                </button>
                <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                  All updates sync in real-time.
                </span>
              </div>

              <button 
                type="button"
                onClick={handleSave} 
                disabled={isSaving}
                style={{
                  background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 32px',
                  fontWeight: 800,
                  fontSize: '0.94rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '9px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 166, 166, 0.35)',
                  transition: 'all 0.2s ease',
                  opacity: isSaving ? 0.7 : 1
                }}
              >
                {isSaving ? (
                  <>
                    <Activity className="spin-anim" size={18} /> Saving Profile...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Save Practice Profile
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </motion.div>
    </div>
  );
};

export default DoctorProfileView;
