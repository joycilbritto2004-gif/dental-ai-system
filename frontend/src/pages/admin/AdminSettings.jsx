import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Save, ShieldCheck, ShieldAlert, Bell, Database, 
  ArrowLeft, CheckCircle2, Sliders, Globe, Mail, 
  Phone, Clock, Lock, Sparkles, RefreshCw, AlertCircle, 
  HelpCircle, Check, Activity, Layers, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../Dashboard.css';

const DEFAULT_SETTINGS = {
  platformName: 'DentaAI System',
  supportEmail: 'support@dentaai.com',
  supportPhone: '+91 (800) 433-6821',
  timezone: 'Asia/Kolkata (IST UTC+5:30)',
  defaultCurrency: 'INR (₹)',
  defaultFee: '500',
  requireDoctorVerification: true,
  emailNotifications: true,
  autoPurgeScans: false,
  confidenceGating: true,
  auditLogging: true
};

const AdminSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dentaai_platform_settings');
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch (e) {
      console.error("Error loading settings from localStorage:", e);
    }
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field) => {
    setSettings(prev => {
      const next = { ...prev, [field]: !prev[field] };
      try {
        localStorage.setItem('dentaai_platform_settings', JSON.stringify(next));
      } catch (e) {
        console.error("Error auto-saving toggle:", e);
      }
      return next;
    });
    showToast(`Updated: ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is now ${!settings[field] ? 'enabled' : 'disabled'}.`);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      try {
        localStorage.setItem('dentaai_platform_settings', JSON.stringify(settings));
        setIsSaving(false);
        showToast("Platform configurations successfully saved.");
      } catch (err) {
        setIsSaving(false);
        showToast("Error saving platform configurations.", 'error');
      }
    }, 600);
  };

  const handleReset = () => {
    if (window.confirm("Reset all platform settings to institutional defaults?")) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem('dentaai_platform_settings', JSON.stringify(DEFAULT_SETTINGS));
      showToast("Settings reset to institutional defaults.");
    }
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="screening-history-wrapper" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px 48px' }}>
      <motion.div initial="hidden" animate="show" variants={stagger}>
        
        {/* 1. CLINICAL HEADER CARD */}
        <motion.div variants={item} className="screening-header-card" style={{ marginBottom: '24px' }}>
          <div className="screening-header-stripe"></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div className="screening-badge">
                <Sliders size={14} /> Institutional Governance
              </div>
              <h1 className="screening-title">Platform Settings & Governance</h1>
              <p className="screening-subtitle">
                Global configurations, clinical human-in-the-loop safeguards, notification dispatchers, and data compliance policies.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link 
                to="/dashboard/admin" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: '#FFFFFF',
                  border: '1px solid #BFD4E5',
                  color: '#17324D',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(7, 26, 51, 0.04)',
                  transition: 'all 0.15s ease'
                }}
              >
                <ArrowLeft size={16} /> Back to Dashboard
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F0FDFA', border: '1px solid #99E3D8', padding: '8px 14px', borderRadius: '12px', color: '#0F766E', fontSize: '0.82rem', fontWeight: 700 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                HIPAA Security Rules Active
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. TOP 4 MASTER KPI SUMMARY STRIP (100% EQUAL & BALANCED) */}
        <motion.div variants={item} className="doctor-kpi-grid" style={{ marginBottom: '24px' }}>
          
          {/* Card 1: Governance Tier */}
          <div 
            className="doctor-kpi-card"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start', 
              gap: '16px',
              borderLeft: '4px solid #00A6A6',
              padding: '20px 22px'
            }}
          >
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(0, 166, 166, 0.12)', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                Enterprise PRO
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Governance Tier
              </div>
            </div>
          </div>

          {/* Card 2: Safeguards */}
          <div 
            className="doctor-kpi-card"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start', 
              gap: '16px',
              borderLeft: '4px solid #2563EB',
              padding: '20px 22px'
            }}
          >
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(37, 99, 235, 0.12)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserCheck size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                {settings.requireDoctorVerification ? 'Enforced' : 'Advisory'}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Doctor Sign-off Rule
              </div>
            </div>
          </div>

          {/* Card 3: Notifications */}
          <div 
            className="doctor-kpi-card"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start', 
              gap: '16px',
              borderLeft: '4px solid #10B981',
              padding: '20px 22px'
            }}
          >
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.12)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bell size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                {settings.emailNotifications ? 'Real-Time' : 'Muted'}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Alert Dispatcher
              </div>
            </div>
          </div>

          {/* Card 4: Retention */}
          <div 
            className="doctor-kpi-card"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start', 
              gap: '16px',
              borderLeft: '4px solid #F59E0B',
              padding: '20px 22px'
            }}
          >
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Database size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                {settings.autoPurgeScans ? '90 Days' : 'Indefinite'}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Storage Policy
              </div>
            </div>
          </div>

        </motion.div>

        {/* 3. TOAST NOTIFICATION BANNER */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                marginBottom: '20px',
                padding: '14px 20px',
                borderRadius: '14px',
                background: toastMessage.type === 'error' ? '#FEF2F2' : '#ECFDF5',
                border: `1px solid ${toastMessage.type === 'error' ? '#FECACA' : '#A7F3D0'}`,
                color: toastMessage.type === 'error' ? '#DC2626' : '#065F46',
                fontWeight: 700,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 14px rgba(7, 26, 51, 0.05)'
              }}
            >
              {toastMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{toastMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. TWO-COLUMN EQUAL 50/50 LAYOUT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* ================= LEFT COLUMN: GENERAL PREFERENCES & PROTOCOLS ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Card 1: General Preferences */}
            <motion.div 
              variants={item}
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid #BFD4E5',
                padding: '28px',
                boxShadow: '0 6px 24px rgba(7, 26, 51, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', padding: '8px', borderRadius: '10px' }}>
                  <Globe size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    General Preferences
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                    Institutional branding, system identity, and contact channels.
                  </p>
                </div>
              </div>

              <div style={{ height: '1px', background: '#F1F5F9', margin: '18px 0 20px 0' }}></div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Platform Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#17324D', marginBottom: '6px' }}>
                    Platform Display Name
                  </label>
                  <input 
                    type="text" 
                    value={settings.platformName}
                    onChange={(e) => handleInputChange('platformName', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: '12px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#17324D',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Support Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#17324D', marginBottom: '6px' }}>
                    Support & Escalation Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="email" 
                      value={settings.supportEmail}
                      onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px 11px 40px',
                        background: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        borderRadius: '12px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: '#17324D',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Support Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#17324D', marginBottom: '6px' }}>
                    Clinical Emergency Hotline
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text" 
                      value={settings.supportPhone}
                      onChange={(e) => handleInputChange('supportPhone', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px 11px 40px',
                        background: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        borderRadius: '12px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: '#17324D',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Timezone */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#17324D', marginBottom: '6px' }}>
                    Standard Operating Timezone
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Clock size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text" 
                      value={settings.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px 11px 40px',
                        background: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        borderRadius: '12px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: '#17324D',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(0, 166, 166, 0.25)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    {isSaving ? (
                      <>
                        <Activity className="spin-anim" size={16} /> Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Save Preferences
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    style={{
                      padding: '12px 18px',
                      borderRadius: '12px',
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      color: '#64748B',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Reset
                  </button>
                </div>

              </form>
            </motion.div>

            {/* Card 2: Consultation & Billing Parameters */}
            <motion.div 
              variants={item}
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid #BFD4E5',
                padding: '28px',
                boxShadow: '0 6px 24px rgba(7, 26, 51, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', padding: '8px', borderRadius: '10px' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    Consultation & Billing Defaults
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                    Default practitioner baseline rates and remittance parameters.
                  </p>
                </div>
              </div>

              <div style={{ height: '1px', background: '#F1F5F9', margin: '18px 0 20px 0' }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                    Standard Currency
                  </span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#17324D' }}>
                    {settings.defaultCurrency}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                    Razorpay & Stripe Gateway
                  </span>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                    Baseline Specialist Fee
                  </span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#17324D' }}>
                    ₹{settings.defaultFee}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                    Customizable per doctor
                  </span>
                </div>
              </div>
            </motion.div>

          </div>

          {/* ================= RIGHT COLUMN: SECURITY, SAFEGUARDS & FEATURES ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <motion.div 
              variants={item}
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid #BFD4E5',
                padding: '28px',
                boxShadow: '0 6px 24px rgba(7, 26, 51, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', padding: '8px', borderRadius: '10px' }}>
                  <Lock size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    Clinical Safeguards & Feature Toggles
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                    Enforce human verification guardrails, alert dispatchers, and automated retention.
                  </p>
                </div>
              </div>

              <div style={{ height: '1px', background: '#F1F5F9', margin: '18px 0 20px 0' }}></div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Toggle 1: Require Doctor Verification */}
                <div 
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(217, 119, 6, 0.12)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '0.92rem', fontWeight: 800, color: '#17324D' }}>
                        Require Doctor Verification
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
                        Force human dentist review and sign-off on AI results before clinical reports are shared with patients.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div 
                    onClick={() => handleToggle('requireDoctorVerification')}
                    style={{
                      width: '46px',
                      height: '26px',
                      borderRadius: '999px',
                      background: settings.requireDoctorVerification ? '#00A6A6' : '#CBD5E1',
                      padding: '3px',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      transition: 'background 0.2s ease',
                      flexShrink: 0
                    }}
                  >
                    <motion.div 
                      layout
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transform: settings.requireDoctorVerification ? 'translateX(20px)' : 'translateX(0px)',
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Toggle 2: Email Notifications */}
                <div 
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.12)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Bell size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '0.92rem', fontWeight: 800, color: '#17324D' }}>
                        Automated Email & Push Notifications
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
                        Send real-time alerts to clinicians and patients upon new consultations and verification results.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div 
                    onClick={() => handleToggle('emailNotifications')}
                    style={{
                      width: '46px',
                      height: '26px',
                      borderRadius: '999px',
                      background: settings.emailNotifications ? '#00A6A6' : '#CBD5E1',
                      padding: '3px',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      transition: 'background 0.2s ease',
                      flexShrink: 0
                    }}
                  >
                    <motion.div 
                      layout
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transform: settings.emailNotifications ? 'translateX(20px)' : 'translateX(0px)',
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Toggle 3: Auto-Purge Scans */}
                <div 
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Database size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '0.92rem', fontWeight: 800, color: '#17324D' }}>
                        Auto-Purge Scans (90-Day Retention)
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
                        Automatically delete unverified guest screening scans older than 90 days in compliance with storage regulations.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div 
                    onClick={() => handleToggle('autoPurgeScans')}
                    style={{
                      width: '46px',
                      height: '26px',
                      borderRadius: '999px',
                      background: settings.autoPurgeScans ? '#00A6A6' : '#CBD5E1',
                      padding: '3px',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      transition: 'background 0.2s ease',
                      flexShrink: 0
                    }}
                  >
                    <motion.div 
                      layout
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transform: settings.autoPurgeScans ? 'translateX(20px)' : 'translateX(0px)',
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Toggle 4: Confidence Gating */}
                <div 
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(0, 166, 166, 0.12)', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '0.92rem', fontWeight: 800, color: '#17324D' }}>
                        AI Confidence Threshold Gating
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
                        Automatically flag diagnostic inferences below 80% confidence for mandatory secondary specialist review.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div 
                    onClick={() => handleToggle('confidenceGating')}
                    style={{
                      width: '46px',
                      height: '26px',
                      borderRadius: '999px',
                      background: settings.confidenceGating ? '#00A6A6' : '#CBD5E1',
                      padding: '3px',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      transition: 'background 0.2s ease',
                      flexShrink: 0
                    }}
                  >
                    <motion.div 
                      layout
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transform: settings.confidenceGating ? 'translateX(20px)' : 'translateX(0px)',
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Toggle 5: Immutable Audit Logging */}
                <div 
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.12)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '0.92rem', fontWeight: 800, color: '#17324D' }}>
                        Immutable Administrative Audit Logging
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
                        Record all credential approval actions, access restrictions, and model triggers in tamper-evident logs.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div 
                    onClick={() => handleToggle('auditLogging')}
                    style={{
                      width: '46px',
                      height: '26px',
                      borderRadius: '999px',
                      background: settings.auditLogging ? '#00A6A6' : '#CBD5E1',
                      padding: '3px',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      transition: 'background 0.2s ease',
                      flexShrink: 0
                    }}
                  >
                    <motion.div 
                      layout
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transform: settings.auditLogging ? 'translateX(20px)' : 'translateX(0px)',
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </div>
                </div>

              </div>

            </motion.div>

          </div>

        </div>

      </motion.div>
    </div>
  );
};

export default AdminSettings;