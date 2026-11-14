import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  UserCircle, 
  Save, 
  Phone, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ShieldCheck, 
  ShieldAlert,
  Sparkles, 
  Calendar, 
  KeyRound, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  ArrowLeft,
  Activity,
  Fingerprint,
  FileCheck,
  Stethoscope,
  AlertTriangle,
  Upload
} from 'lucide-react';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const PatientProfile = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('dentaai_token');
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          password: '',
          confirmPassword: ''
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to load profile details from server.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server connection error. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      return setMessage({ type: 'error', text: 'Passwords do not match. Please verify your new password.' });
    }

    if (formData.password && formData.password.length < 6) {
      return setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
    }
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const token = localStorage.getItem('dentaai_token');
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          ...(formData.password ? { password: formData.password } : {})
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Your profile and security credentials have been updated successfully!' });
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        setUserData(prev => ({ ...prev, ...data }));
        
        // Update local storage user profile name
        const userStr = localStorage.getItem('dentaai_user');
        if (userStr) {
           const user = JSON.parse(userStr);
           user.name = data.name;
           if (data.phone) user.phone = data.phone;
           localStorage.setItem('dentaai_user', JSON.stringify(user));
           window.dispatchEvent(new Event('storage'));
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile settings.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server error occurred while saving profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'PT';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formattedJoinDate = userData?.createdAt 
    ? new Date(userData.createdAt).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric'
      })
    : 'Recent Member';

  if (loading) {
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
            Loading your profile and security credentials...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="screening-history-wrapper">
      
      {/* 1. CLINICAL HEADER CARD */}
      <div className="screening-header-card">
        <div className="screening-header-stripe"></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div className="screening-badge">
              <ShieldCheck size={14} /> Account & Identity Security
            </div>
            <h1 className="screening-title">My Profile</h1>
            <p className="screening-subtitle">
              Manage your personal dental health credentials, contact details, and account security settings.
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
              <ShieldCheck size={15} /> 256-Bit SSL Encrypted
            </div>
            <Link 
              to="/dashboard/patient" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                background: '#FFFFFF',
                color: '#17324D',
                border: '1px solid #BFD4E5',
                fontWeight: 700,
                fontSize: '0.85rem',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(7, 26, 51, 0.04)',
                transition: 'all 0.2s ease'
              }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* 2. TWO-COLUMN BALANCED CLINICAL LAYOUT */}
      <div className="patient-profile-layout">
        
        {/* LEFT COLUMN: PATIENT IDENTITY & CREDENTIALS CARD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="patient-profile-card" style={{ textAlign: 'center' }}>
            {/* Avatar Circle with Initials */}
            <div className="patient-avatar-large">
              {getInitials(formData.name)}
            </div>

            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.45rem', fontWeight: 800, color: '#17324D', letterSpacing: '-0.3px' }}>
              {formData.name || 'Patient'}
            </h2>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '999px', background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', border: '1px solid rgba(0, 166, 166, 0.2)', fontSize: '0.78rem', fontWeight: 800, marginBottom: '8px' }}>
              <CheckCircle2 size={13} /> Verified Patient Account
            </div>

            <p style={{ margin: '0 0 20px 0', fontSize: '0.86rem', color: '#64748B', fontWeight: 500 }}>
              {formData.email}
            </p>

            <div style={{ height: '1px', background: '#F1F5F9', margin: '16px 0' }}></div>

            {/* Account Metadata List */}
            <div style={{ textAlign: 'left' }}>
              <div className="patient-meta-row">
                <span style={{ color: '#64748B', fontWeight: 600 }}>Patient ID</span>
                <span style={{ color: '#17324D', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.84rem' }}>
                  USR-{userData?._id ? userData._id.substring(userData._id.length - 8).toUpperCase() : 'PATIENT'}
                </span>
              </div>

              <div className="patient-meta-row">
                <span style={{ color: '#64748B', fontWeight: 600 }}>Account Status</span>
                <span style={{ color: '#059669', fontWeight: 800, background: '#ECFDF5', padding: '2px 8px', borderRadius: '6px', fontSize: '0.76rem', border: '1px solid #A7F3D0' }}>
                  Active & Verified
                </span>
              </div>

              <div className="patient-meta-row">
                <span style={{ color: '#64748B', fontWeight: 600 }}>Portal Role</span>
                <span style={{ color: '#00A6A6', fontWeight: 700 }}>
                  Patient (Self-Care)
                </span>
              </div>

              <div className="patient-meta-row">
                <span style={{ color: '#64748B', fontWeight: 600 }}>Member Since</span>
                <span style={{ color: '#17324D', fontWeight: 700 }}>
                  {formattedJoinDate}
                </span>
              </div>

              <div className="patient-meta-row">
                <span style={{ color: '#64748B', fontWeight: 600 }}>Data Security</span>
                <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} /> End-to-End
                </span>
              </div>
            </div>
          </div>

          {/* Quick Trust & Privacy Box */}
          <div 
            style={{ 
              background: '#F8FAFC', 
              border: '1px solid #E2E8F0', 
              borderRadius: '20px', 
              padding: '22px 24px', 
              boxShadow: '0 4px 16px rgba(7, 26, 51, 0.02)' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ background: 'rgba(0, 166, 166, 0.12)', padding: '8px', borderRadius: '10px', color: '#00A6A6' }}>
                <Fingerprint size={20} />
              </div>
              <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: '#17324D' }}>
                HIPAA & Medical Privacy
              </h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B', lineHeight: 1.55, fontWeight: 500 }}>
              Your dental scans, diagnostic predictions, and personal clinical history are encrypted and strictly accessible only by you and licensed doctors you consult.
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: PROFILE DETAILS & SECURITY UPDATE FORMS */}
        <div>
          
          {/* Notification Alert Toast */}
          {message.text && (
            <div 
              style={{ 
                padding: '16px 20px', 
                borderRadius: '16px', 
                marginBottom: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                fontWeight: 600, 
                fontSize: '0.9rem',
                background: message.type === 'error' ? '#FEF2F2' : '#ECFDF5', 
                color: message.type === 'error' ? '#991B1B' : '#065F46', 
                border: `1px solid ${message.type === 'error' ? '#FCA5A5' : '#A7F3D0'}`,
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)'
              }}
            >
              {message.type === 'success' ? (
                <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
              ) : (
                <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* SECTION 1: PERSONAL INFORMATION */}
            <div className="patient-profile-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
                <div style={{ background: 'rgba(0, 166, 166, 0.12)', padding: '10px', borderRadius: '12px', color: '#00A6A6' }}>
                  <UserCircle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#17324D' }}>
                    Personal Information
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>
                    Your primary contact details and identity in the DentaAI clinical system
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                
                {/* Full Name */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#17324D', fontWeight: 700, marginBottom: '8px', fontSize: '0.86rem' }}>
                    <UserIcon size={15} color="#00A6A6" /> Full Name
                  </label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    className="patient-input-field" 
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#17324D', fontWeight: 700, marginBottom: '8px', fontSize: '0.86rem' }}>
                    <Phone size={15} color="#00A6A6" /> Phone Number
                  </label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    className="patient-input-field" 
                    placeholder="+91 98765 43210" 
                  />
                </div>

                {/* Email Address (Read Only) */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#17324D', fontWeight: 700, fontSize: '0.86rem' }}>
                      <Mail size={15} color="#00A6A6" /> Email Address
                    </label>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: '6px' }}>
                      Locked & Verified
                    </span>
                  </div>
                  <input 
                    type="email" 
                    value={formData.email} 
                    disabled 
                    className="patient-input-field" 
                    title="Email is verified and cannot be changed"
                  />
                </div>

                {/* Account Role */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#17324D', fontWeight: 700, fontSize: '0.86rem' }}>
                      <ShieldCheck size={15} color="#00A6A6" /> Access Role
                    </label>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '6px' }}>
                      Verified
                    </span>
                  </div>
                  <input 
                    type="text" 
                    value="Patient (Self-Care Portal)" 
                    disabled 
                    className="patient-input-field" 
                  />
                </div>

              </div>
            </div>

            {/* SECTION 2: CHANGE PASSWORD */}
            <div className="patient-profile-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
                <div style={{ background: 'rgba(0, 166, 166, 0.12)', padding: '10px', borderRadius: '12px', color: '#00A6A6' }}>
                  <KeyRound size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#17324D' }}>
                    Security & Password
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>
                    Update your account access credentials. Leave blank if unchanged.
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                
                {/* New Password */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#17324D', fontWeight: 700, marginBottom: '8px', fontSize: '0.86rem' }}>
                    <Lock size={15} color="#00A6A6" /> New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      name="password" 
                      value={formData.password} 
                      onChange={handleChange} 
                      className="patient-input-field" 
                      placeholder="Enter minimum 6 characters"
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#17324D', fontWeight: 700, marginBottom: '8px', fontSize: '0.86rem' }}>
                    <Lock size={15} color="#00A6A6" /> Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      name="confirmPassword" 
                      value={formData.confirmPassword} 
                      onChange={handleChange} 
                      className="patient-input-field" 
                      placeholder="Re-enter your new password"
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

              </div>

              {/* Password Requirement Hint */}
              <div 
                style={{ 
                  marginTop: '18px', 
                  background: '#F8FAFC', 
                  border: '1px solid #E2E8F0', 
                  borderRadius: '12px', 
                  padding: '12px 16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px' 
                }}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00A6A6', flexShrink: 0 }}></div>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>
                  Recommended: Use at least 8 characters with a mix of letters, numbers, and symbols for maximum security.
                </span>
              </div>
            </div>

            {/* ACTION BAR CARD */}
            <div 
              style={{ 
                background: '#FFFFFF', 
                border: '1px solid #BFD4E5', 
                borderRadius: '20px', 
                padding: '20px 28px', 
                boxShadow: '0 4px 18px rgba(7, 26, 51, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#059669" />
                <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>
                  Changes will be saved immediately to your DentaAI account
                </span>
              </div>

              <button 
                type="submit" 
                disabled={saving} 
                style={{ 
                  padding: '12px 32px', 
                  borderRadius: '12px', 
                  fontWeight: 800, 
                  fontSize: '0.92rem',
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: '#00A6A6', 
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 166, 166, 0.3)',
                  transition: 'all 0.2s ease',
                  opacity: saving ? 0.75 : 1
                }}
              >
                {saving ? (
                  <>
                    <Activity className="spin-anim" size={18} /> Saving Changes...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Save Changes
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
};

export default PatientProfile;
