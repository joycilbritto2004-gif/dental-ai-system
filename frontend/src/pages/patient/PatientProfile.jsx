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
  const [initialData, setInitialData] = useState({
    name: '',
    phone: ''
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
        const initialName = data.name || '';
        const initialPhone = data.phone || '';
        setInitialData({
          name: initialName,
          phone: initialPhone
        });
        setFormData({
          name: initialName,
          email: data.email || '',
          phone: initialPhone,
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

  // Change detection: compare trimmed current values against the initial snapshot
  const currentName = (formData.name || '').trim();
  const currentPhone = (formData.phone || '').trim();
  const initialName = (initialData.name || '').trim();
  const initialPhone = (initialData.phone || '').trim();

  const isNameChanged = currentName !== initialName;
  const isPhoneChanged = currentPhone !== initialPhone;
  const isPasswordEntered = Boolean(formData.password && formData.password.length > 0);
  const isConfirmEntered = Boolean(formData.confirmPassword && formData.confirmPassword.length > 0);

  // Enable Save Changes only when at least one editable field has genuinely changed
  const isModified = isNameChanged || isPhoneChanged || isPasswordEntered || isConfirmEntered;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. No-Change Protection
    if (!isModified) {
      setMessage({ type: 'info', text: 'No changes to save.' });
      return;
    }

    // 2. Validate Name
    if (isNameChanged && !currentName) {
      setMessage({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }

    // 3. Password Validation
    if (isPasswordEntered || isConfirmEntered) {
      if (!formData.password) {
        setMessage({ type: 'error', text: 'Please enter a new password.' });
        return;
      }
      if (!formData.confirmPassword) {
        setMessage({ type: 'error', text: 'Please confirm your new password.' });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match. Please verify your new password.' });
        return;
      }
      if (formData.password.length < 8) {
        setMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
        return;
      }
      if (!/[A-Z]/.test(formData.password)) {
        setMessage({ type: 'error', text: 'New password must contain at least one uppercase letter.' });
        return;
      }
      if (!/[a-z]/.test(formData.password)) {
        setMessage({ type: 'error', text: 'New password must contain at least one lowercase letter.' });
        return;
      }
      if (!/[0-9]/.test(formData.password)) {
        setMessage({ type: 'error', text: 'New password must contain at least one number.' });
        return;
      }
      if (!/[^A-Za-z0-9]/.test(formData.password)) {
        setMessage({ type: 'error', text: 'New password must contain at least one special character or symbol.' });
        return;
      }
    }

    // 4. Submit ONLY the fields that have actually changed
    const payload = {};
    if (isNameChanged) {
      payload.name = currentName;
    }
    if (isPhoneChanged) {
      payload.phone = currentPhone;
    }
    if (isPasswordEntered) {
      payload.password = formData.password;
    }

    if (Object.keys(payload).length === 0) {
      setMessage({ type: 'info', text: 'No changes to save.' });
      return;
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
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        const updatedName = data.name !== undefined ? data.name : (payload.name !== undefined ? payload.name : initialData.name);
        const updatedPhone = data.phone !== undefined ? data.phone : (payload.phone !== undefined ? payload.phone : initialData.phone);

        // Update snapshot of original values only after backend confirms successful save
        setInitialData({
          name: updatedName,
          phone: updatedPhone
        });

        // Reset password fields and synchronize form data
        setFormData(prev => ({
          ...prev,
          name: updatedName,
          phone: updatedPhone,
          password: '',
          confirmPassword: ''
        }));

        setUserData(prev => ({ ...prev, ...data }));

        // Display success message only after successful database update
        setMessage({ type: 'success', text: 'Changes saved successfully.' });

        // Update local storage user profile name & phone if present
        const userStr = localStorage.getItem('dentaai_user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (payload.name) user.name = updatedName;
            if (payload.phone !== undefined) user.phone = updatedPhone;
            localStorage.setItem('dentaai_user', JSON.stringify(user));
            window.dispatchEvent(new Event('storage'));
          } catch (e) {
            console.warn('Could not update dentaai_user in localStorage:', e);
          }
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
                <span style={{ color: '#64748B', fontWeight: 600 }}>Member Since</span>
                <span style={{ color: '#17324D', fontWeight: 700 }}>
                  {formattedJoinDate}
                </span>
              </div>
            </div>
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
                background: message.type === 'error' ? '#FEF2F2' : message.type === 'info' ? '#F0F9FF' : '#ECFDF5',
                color: message.type === 'error' ? '#991B1B' : message.type === 'info' ? '#0369A1' : '#065F46',
                border: `1px solid ${message.type === 'error' ? '#FCA5A5' : message.type === 'info' ? '#BAE6FD' : '#A7F3D0'}`,
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)'
              }}
            >
              {message.type === 'success' ? (
                <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
              ) : message.type === 'info' ? (
                <Sparkles size={20} color="#0284C7" style={{ flexShrink: 0 }} />
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
                  Recommended: Use at least 8 characters with a mix of uppercase and lowercase letters, numbers, and symbols for maximum security.
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
                <CheckCircle2 size={16} color={isModified ? "#059669" : "#94A3B8"} />
                <span style={{ fontSize: '0.84rem', color: isModified ? '#17324D' : '#94A3B8', fontWeight: 600 }}>
                  {isModified 
                    ? 'Unsaved changes ready to submit' 
                    : 'All information is up to date'}
                </span>
              </div>

              <button
                type="submit"
                disabled={!isModified || saving}
                style={{
                  padding: '12px 32px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: (!isModified || saving) ? '#94A3B8' : '#00A6A6',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: (!isModified || saving) ? 'not-allowed' : 'pointer',
                  boxShadow: (!isModified || saving) ? 'none' : '0 4px 16px rgba(0, 166, 166, 0.3)',
                  transition: 'all 0.2s ease',
                  opacity: (!isModified || saving) ? 0.6 : 1
                }}
              >
                {saving ? (
                  <>
                    <Activity className="spin-anim" size={18} /> Saving...
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
