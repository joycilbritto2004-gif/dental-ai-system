import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Stethoscope, Activity, CheckCircle2, BrainCircuit, ShieldCheck, 
  ChevronRight, Clock, ArrowUpRight, Database, Sparkles, Cpu, Layers, 
  ExternalLink, UserCheck, Server, AlertCircle, Search, ArrowRight,
  Calendar, CreditCard, DollarSign, XCircle, FileText, Bell, RefreshCw,
  MapPin, Video, ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';
import './Dashboard.css';
import { API_BASE } from '../config';

const SUPPORTED_CONDITIONS = [
  { name: 'Gingivitis', desc: 'Gum Inflammation', color: '#10B981' },
  { name: 'Caries', desc: 'Tooth Decay', color: '#EF4444' },
  { name: 'Calculus', desc: 'Hardened Plaque', color: '#F59E0B' },
  { name: 'Hypodontia', desc: 'Missing Teeth', color: '#6366F1' },
  { name: 'Mouth Ulcer', desc: 'Mucosal Lesions', color: '#EC4899' },
  { name: 'Tooth Discoloration', desc: 'Enamel Stains', color: '#8B5CF6' }
];

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    approvedDoctors: 0,
    pendingDoctors: 0,
    rejectedDoctors: 0,
    totalScans: 0,
    pendingScans: 0,
    verifiedScans: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    successfulPayments: 0,
    totalRevenue: 0,
    scansToday: 0,
    appointmentsToday: 0,
    newPatientsThisMonth: 0,
    newDoctorsThisMonth: 0,
    registrationTrends: [],
    scanConditionDistribution: [],
    appointmentDistribution: {},
    revenueTrends: [],
    recentActivity: [],
    recentAuditLogs: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const userStr = localStorage.getItem('dentaai_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const userId = user._id || user.id;

      const token = localStorage.getItem('dentaai_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const statsRes = await fetch(`${API_BASE}/api/admin/stats?userId=${userId}`, { headers });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(prev => ({ ...prev, ...statsData }));
      }
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

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
            Loading institutional telemetry from MongoDB...
          </p>
        </div>
      </div>
    );
  }

  // Max value calculation for bar chart scaling
  const maxRegTrend = Math.max(
    1,
    ...((Array.isArray(stats.registrationTrends) ? stats.registrationTrends : []).map(t => Math.max(t?.patients || 0, t?.doctors || 0)))
  );

  const maxRevenueTrend = Math.max(
    1,
    ...((Array.isArray(stats.revenueTrends) ? stats.revenueTrends : []).map(r => r?.revenue || 0))
  );

  return (
    <div className="screening-history-wrapper" style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 16px 48px' }}>
      <motion.div initial="hidden" animate="show" variants={stagger}>
        
        {/* TOP HEADER BANNER */}
        <motion.div variants={item} className="screening-header-card" style={{ marginBottom: '24px' }}>
          <div className="screening-header-stripe"></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div className="screening-badge">
                <ShieldCheck size={14} /> Central Administrative Authority
              </div>
              <h1 className="screening-title">
                System Executive Dashboard
              </h1>
              <p className="screening-subtitle">
                Real-time MongoDB analytics, institutional credential verification, clinical triage monitoring, and transactional accounting.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={fetchAdminData}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', color: '#17324D', border: '1px solid #BFD4E5', padding: '9px 16px', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 6px rgba(7, 26, 51, 0.04)' }}
              >
                <RefreshCw size={14} /> Refresh Data
              </button>
              <Link
                to="/dashboard/admin/doctors"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#00A6A6', color: '#FFFFFF', textDecoration: 'none', padding: '9px 18px', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 800, boxShadow: '0 4px 14px rgba(0, 166, 166, 0.25)' }}
              >
                <Stethoscope size={15} /> Verify Practitioners {stats.pendingDoctors > 0 && `(${stats.pendingDoctors})`}
              </Link>
            </div>
          </div>
        </motion.div>

        {/* PENDING DOCTOR VERIFICATION ALERT BANNER */}
        {stats.pendingDoctors > 0 && (
          <motion.div variants={item} style={{ background: 'linear-gradient(90deg, #FEF3C7 0%, #FFFBEB 100%)', border: '1px solid #FCD34D', borderRadius: '16px', padding: '16px 22px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F59E0B', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, color: '#92400E', fontSize: '0.98rem', fontWeight: 800 }}>
                  {stats.pendingDoctors} Doctor Credential Application{stats.pendingDoctors > 1 ? 's' : ''} Awaiting Independent Review
                </h4>
                <p style={{ margin: '2px 0 0', color: '#B45309', fontSize: '0.84rem', fontWeight: 500 }}>
                  Per medical regulatory requirements, verify qualifications against the official dental council register before granting clinical workspace privileges.
                </p>
              </div>
            </div>
            <Link
              to="/dashboard/admin/doctors"
              style={{ background: '#D97706', color: '#FFFFFF', padding: '8px 18px', borderRadius: '10px', textDecoration: 'none', fontSize: '0.84rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              Review Dossiers <ArrowRight size={14} />
            </Link>
          </motion.div>
        )}

        {/* 13 REAL MONGODB KPI METRICS GRID */}
        <motion.div variants={item} style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Database size={17} color="#00A6A6" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#17324D' }}>
              Live Platform Indicators
            </h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: '999px' }}>
              Actual Database Records
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
            
            {/* Card 1: Patients */}
            <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Patients</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                  <Users size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#17324D' }}>{stats.totalPatients}</div>
              <div style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 700, marginTop: '2px' }}>+{stats.newPatientsThisMonth} this month</div>
            </div>

            {/* Card 2: Doctors Total */}
            <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Doctors Registered</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A6A6' }}>
                  <Stethoscope size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#17324D' }}>{stats.totalDoctors}</div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>Total practitioner accounts</div>
            </div>

            {/* Card 3: Approved Doctors */}
            <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #BBF7D0', background: '#F0FDF4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Approved Doctors</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#15803D' }}>{stats.approvedDoctors}</div>
              <div style={{ fontSize: '0.76rem', color: '#166534', fontWeight: 700, marginTop: '2px' }}>Verified Dentist Badge</div>
            </div>

            {/* Card 4: Pending Verifications */}
            <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #FDE68A', background: '#FFFBEB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase' }}>Pending Verifications</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                  <Clock size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#B45309' }}>{stats.pendingDoctors}</div>
              <div style={{ fontSize: '0.76rem', color: '#92400E', fontWeight: 700, marginTop: '2px' }}>Awaiting credential review</div>
            </div>

            {/* Card 5: Rejected Doctors */}
            <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #FECACA', background: '#FEF2F2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase' }}>Rejected Applications</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                  <XCircle size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#B91C1C' }}>{stats.rejectedDoctors}</div>
              <div style={{ fontSize: '0.76rem', color: '#991B1B', fontWeight: 700, marginTop: '2px' }}>Credentials not validated</div>
            </div>

            {/* Card 6: Total Dental Scans */}
            <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Total Scans</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
                  <Activity size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#17324D' }}>{stats.totalScans}</div>
              <div style={{ fontSize: '0.76rem', color: '#7C3AED', fontWeight: 700, marginTop: '2px' }}>+{stats.scansToday} inferred today</div>
            </div>

            {/* Card 7: Pending Dental Reviews */}
            <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Pending Scans</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                  <Clock size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#D97706' }}>{stats.pendingScans}</div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>Awaiting doctor sign-off</div>
            </div>

            {/* Card 8: Doctor-Verified Scans */}
            <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Doctor-Verified Scans</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#059669' }}>{stats.verifiedScans}</div>
              <div style={{ fontSize: '0.76rem', color: '#047857', fontWeight: 700, marginTop: '2px' }}>Clinically authenticated</div>
            </div>

            {/* Card 9: Total Appointments */}
            <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Total Appointments</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>
                  <Calendar size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#17324D' }}>{stats.totalAppointments}</div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>In-person & online bookings</div>
            </div>

            {/* Card 10: Pending Appointments */}
            <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Pending Appts</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309' }}>
                  <Clock size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#B45309' }}>{stats.pendingAppointments}</div>
              <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>Awaiting doctor accept</div>
            </div>

            {/* Card 11: Completed Appointments */}
            <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Completed Appts</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#15803D' }}>{stats.completedAppointments}</div>
              <div style={{ fontSize: '0.76rem', color: '#15803D', fontWeight: 700, marginTop: '2px' }}>Treatment concluded</div>
            </div>

            {/* Card 12: Successful Payments */}
            <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Paid Transactions</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                  <CreditCard size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#17324D' }}>{stats.successfulPayments}</div>
              <div style={{ fontSize: '0.76rem', color: '#2563EB', fontWeight: 700, marginTop: '2px' }}>Successfully captured</div>
            </div>

            {/* Card 13: Total Collected Revenue */}
            <div className="card" style={{ padding: '18px', borderRadius: '16px', border: '1px solid #86EFAC', background: '#F0FDF4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Collected Revenue</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
                  <DollarSign size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#14532D' }}>
                ₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#166534', fontWeight: 700, marginTop: '2px' }}>Real booking revenue</div>
            </div>

          </div>
        </motion.div>

        {/* CHARTS SECTION (REAL MONGODB DATA) */}
        <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          
          {/* Chart 1: Registration Velocity */}
          <div className="card" style={{ padding: '22px', borderRadius: '18px', border: '1px solid #BFD4E5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#17324D' }}>
                  Registration Growth (Last 6 Months)
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  Real patient vs. doctor user onboarding counts from MongoDB
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2563EB' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB' }} /> Patients
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#00A6A6' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00A6A6' }} /> Doctors
                </span>
              </div>
            </div>

            {/* SVG/CSS Monthly Histogram */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '170px', padding: '10px 10px 0', borderBottom: '1px solid #E2E8F0', gap: '12px' }}>
              {(stats.registrationTrends || []).map((t, idx) => {
                const patientHeight = Math.max(12, Math.round((t.patients / maxRegTrend) * 140));
                const doctorHeight = Math.max(8, Math.round((t.doctors / maxRegTrend) * 140));
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                      <div 
                        title={`Patients: ${t.patients}`}
                        style={{ width: '14px', height: `${patientHeight}px`, background: '#2563EB', borderRadius: '4px 4px 0 0', transition: 'height 0.4s' }} 
                      />
                      <div 
                        title={`Doctors: ${t.doctors}`}
                        style={{ width: '14px', height: `${doctorHeight}px`, background: '#00A6A6', borderRadius: '4px 4px 0 0', transition: 'height 0.4s' }} 
                      />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginTop: '8px' }}>{t.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 2: Dental Scan Pathology Distribution */}
          <div className="card" style={{ padding: '22px', borderRadius: '18px', border: '1px solid #BFD4E5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#17324D' }}>
                  Pathology Condition Breakdown
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  Aggregated predictions across 6 intraoral disease classes
                </p>
              </div>
              <Link to="/dashboard/admin/predictions" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00A6A6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                All Scans <ChevronRight size={13} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {SUPPORTED_CONDITIONS.map(cond => {
                const match = (Array.isArray(stats.scanConditionDistribution) ? stats.scanConditionDistribution : []).find(c => 
                  c && typeof c._id === 'string' && c._id.toLowerCase().replace('_', ' ') === cond.name.toLowerCase()
                );
                const count = match ? match.count : 0;
                const percentage = stats.totalScans > 0 ? Math.round((count / stats.totalScans) * 100) : 0;
                return (
                  <div key={cond.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: '#17324D' }}>{cond.name}</span>
                      <span style={{ color: '#64748B', fontWeight: 600 }}>{count} ({percentage}%)</span>
                    </div>
                    <div style={{ height: '7px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(percentage, count > 0 ? 4 : 0)}%`, height: '100%', background: cond.color, borderRadius: '999px', transition: 'width 0.4s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 3: Appointments Type & Separation */}
          <div className="card" style={{ padding: '22px', borderRadius: '18px', border: '1px solid #BFD4E5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#17324D' }}>
                  Appointment Mode Breakdown
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  Physical clinic consultation vs. secure online chat
                </p>
              </div>
              <Link to="/dashboard/admin/appointments" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00A6A6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Manage <ChevronRight size={13} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '16px', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803D', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  <MapPin size={14} /> In-Person Clinic
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#14532D', margin: '4px 0' }}>
                  {stats.appointmentDistribution?.inPerson || 0}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 600 }}>₹500 + ₹49 = ₹549 (No Chat)</div>
              </div>

              <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '16px', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6D28D9', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  <Video size={14} /> Online Chat
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#5B21B6', margin: '4px 0' }}>
                  {stats.appointmentDistribution?.onlineChat || 0}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#6D28D9', fontWeight: 600 }}>₹200 + ₹49 = ₹249 (Chat Active)</div>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
              <span>Completed: <strong>{stats.completedAppointments}</strong></span>
              <span>Pending Doctor: <strong>{stats.pendingAppointments}</strong></span>
              <span>Total Volume: <strong>{stats.totalAppointments}</strong></span>
            </div>
          </div>

          {/* Chart 4: Monthly Revenue Real Data */}
          <div className="card" style={{ padding: '22px', borderRadius: '18px', border: '1px solid #BFD4E5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#17324D' }}>
                  Revenue Collection Trend
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  Actual settled consultation earnings over last 6 months
                </p>
              </div>
              <Link to="/dashboard/admin/payments" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00A6A6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Ledger <ChevronRight size={13} />
              </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '170px', padding: '10px 10px 0', borderBottom: '1px solid #E2E8F0', gap: '12px' }}>
              {(stats.revenueTrends || []).map((r, idx) => {
                const barHeight = Math.max(10, Math.round((r.revenue / maxRevenueTrend) * 140));
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div 
                      title={`Revenue: ₹${r.revenue} (${r.transactions} bookings)`}
                      style={{ width: '22px', height: `${barHeight}px`, background: 'linear-gradient(180deg, #10B981 0%, #059669 100%)', borderRadius: '4px 4px 0 0', transition: 'height 0.4s' }} 
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginTop: '8px' }}>{r.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </motion.div>

        {/* QUICK NAVIGATION SHORTCUTS */}
        <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '28px' }}>
          <Link to="/dashboard/admin/doctors" className="card" style={{ padding: '16px', borderRadius: '14px', textDecoration: 'none', border: '1px solid #BFD4E5', display: 'flex', alignItems: 'center', gap: '12px', color: '#17324D' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F0FDFA', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>Doctor Verification</div>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{stats.pendingDoctors} pending review</div>
            </div>
          </Link>

          <Link to="/dashboard/admin/patients" className="card" style={{ padding: '16px', borderRadius: '14px', textDecoration: 'none', border: '1px solid #BFD4E5', display: 'flex', alignItems: 'center', gap: '12px', color: '#17324D' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>Patient Management</div>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{stats.totalPatients} registered</div>
            </div>
          </Link>

          <Link to="/dashboard/admin/appointments" className="card" style={{ padding: '16px', borderRadius: '14px', textDecoration: 'none', border: '1px solid #BFD4E5', display: 'flex', alignItems: 'center', gap: '12px', color: '#17324D' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>Appointments</div>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{stats.totalAppointments} records</div>
            </div>
          </Link>

          <Link to="/dashboard/admin/payments" className="card" style={{ padding: '16px', borderRadius: '14px', textDecoration: 'none', border: '1px solid #BFD4E5', display: 'flex', alignItems: 'center', gap: '12px', color: '#17324D' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>Financial Ledger</div>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>₹{stats.totalRevenue} collected</div>
            </div>
          </Link>

          <Link to="/dashboard/admin/activity" className="card" style={{ padding: '16px', borderRadius: '14px', textDecoration: 'none', border: '1px solid #BFD4E5', display: 'flex', alignItems: 'center', gap: '12px', color: '#17324D' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>Audit Trail</div>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Immutable logs</div>
            </div>
          </Link>
        </motion.div>

        {/* BOTTOM SECTION: RECENT ACTIVITY & AUDIT LOGS */}
        <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
          
          {/* Recent Consultations */}
          <div className="card" style={{ padding: '22px', borderRadius: '18px', border: '1px solid #BFD4E5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#17324D' }}>
                Recent Consultations
              </h4>
              <Link to="/dashboard/admin/appointments" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00A6A6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View All <ChevronRight size={13} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(!Array.isArray(stats.recentActivity) || stats.recentActivity.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#64748B', fontSize: '0.86rem' }}>
                  No consultations booked yet.
                </div>
              ) : (
                stats.recentActivity.filter(Boolean).slice(0, 5).map((act, i) => (
                  <div key={act._id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#17324D', fontSize: '0.86rem' }}>
                        {act.patientName || 'Patient'} → {act.doctorName || 'Doctor'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                        {act.consultationType || 'Consultation'} • {act.date || 'Scheduled'}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '999px', background: act.status === 'Completed' ? '#DCFCE7' : act.status === 'Accepted' ? '#DBEAFE' : '#FEF3C7', color: act.status === 'Completed' ? '#15803D' : act.status === 'Accepted' ? '#1D4ED8' : '#B45309' }}>
                      {act.status || 'Pending'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Audit Events */}
          <div className="card" style={{ padding: '22px', borderRadius: '18px', border: '1px solid #BFD4E5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#17324D' }}>
                Administrative Audit Events
              </h4>
              <Link to="/dashboard/admin/activity" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00A6A6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Full Audit Trail <ChevronRight size={13} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(!Array.isArray(stats.recentAuditLogs) || stats.recentAuditLogs.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#64748B', fontSize: '0.86rem' }}>
                  No administrative events recorded yet.
                </div>
              ) : (
                stats.recentAuditLogs.filter(Boolean).slice(0, 5).map((log, i) => (
                  <div key={log._id || log.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#17324D', fontSize: '0.86rem' }}>
                        {log.action ? log.action.replace(/_/g, ' ') : 'Audit Action'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                        By {log.adminName || 'Admin'} on {log.targetName || log.targetType || 'System'}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Logged'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </motion.div>

      </motion.div>
    </div>
  );
};

export default AdminDashboard;
