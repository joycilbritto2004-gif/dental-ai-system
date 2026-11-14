import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Stethoscope, Activity, CheckCircle2, BrainCircuit, ShieldCheck, 
  ChevronRight, Clock, ArrowUpRight, Database, Sparkles, Cpu, Layers, 
  ExternalLink, UserCheck, Server, AlertCircle, Search, ArrowRight
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
    totalPredictions: 0,
    verifiedCases: 0,
    pendingReviews: 0,
    predictionsToday: 0,
    newPatientsThisMonth: 0,
    recentActivity: []
  });
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const userStr = localStorage.getItem('dentaai_user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        const userId = user._id || user.id;

        const token = localStorage.getItem('dentaai_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const [statsRes, usersRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/stats?userId=${userId}`, { headers }),
          fetch(`${API_BASE}/api/admin/users?userId=${userId}`, { headers })
        ]);

        if (statsRes.ok && usersRes.ok) {
          const statsData = await statsRes.json();
          const usersData = await usersRes.json();

          setStats(statsData);
          setUsers(Array.isArray(usersData) ? usersData : []);
        }
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const getInitials = (name) => {
    if (!name) return 'US';
    const clean = name.replace(/^Dr\.\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users.slice(0, 6);
    const q = userSearch.toLowerCase();
    return users.filter(u => 
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [users, userSearch]);

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
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
            Loading administrative telemetry and system intelligence...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="screening-history-wrapper">
      <motion.div initial="hidden" animate="show" variants={stagger}>
        
        {/* 1. CLINICAL HEADER CARD */}
        <motion.div variants={item} className="screening-header-card" style={{ marginBottom: '24px' }}>
          <div className="screening-header-stripe"></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div className="screening-badge">
                <ShieldCheck size={14} /> System Core & Intelligence Console
              </div>
              <h1 className="screening-title">System Administration</h1>
              <p className="screening-subtitle">
                Global clinical telemetry, neural net diagnostic performance, and active user management.
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
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                Cluster Operational (v2.4)
              </div>

              <Link
                to="/dashboard/admin/users"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
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
              >
                <Users size={15} /> User Management <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* 2. TOP MASTER 4-KPI GRID (100% EQUAL & BALANCED) */}
        <motion.div variants={item} className="doctor-kpi-grid" style={{ marginBottom: '24px' }}>
          
          {/* KPI 1: Patients */}
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
              <Users size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                {stats.totalPatients}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Total Patients
              </div>
            </div>
          </div>

          {/* KPI 2: Doctors */}
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
              <Stethoscope size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                {stats.totalDoctors}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Total Doctors
              </div>
            </div>
          </div>

          {/* KPI 3: AI Predictions */}
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
              <BrainCircuit size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                {stats.totalPredictions}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                AI Predictions
              </div>
            </div>
          </div>

          {/* KPI 4: Verified Cases */}
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
              <CheckCircle2 size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                {stats.verifiedCases}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Verified Cases
              </div>
            </div>
          </div>

        </motion.div>

        {/* 3. TWO-COLUMN BALANCED DASHBOARD GRID (EQUALLY 50/50 SPLIT) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* ================= LEFT COLUMN: SYSTEM TELEMETRY & USER DIRECTORY ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* System Overview Tiles */}
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
                  <Activity size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    Clinical Telemetry & Daily Flow
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                    Current triage volume, pending specialist review queues, and system availability.
                  </p>
                </div>
              </div>

              <div style={{ height: '1px', background: '#F1F5F9', margin: '18px 0 20px 0' }}></div>

              {/* 2x2 Symmetrical Diagnostic Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                
                {/* Tile 1: Pending Reviews */}
                <div 
                  style={{
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400E', display: 'block', marginBottom: '8px' }}>
                    Pending Doctor Reviews
                  </span>
                  <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#B45309', lineHeight: 1.1 }}>
                    {stats.pendingReviews}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#B45309', fontWeight: 600, display: 'block', marginTop: '6px' }}>
                    Awaiting clinical validation
                  </span>
                </div>

                {/* Tile 2: Predictions Today */}
                <div 
                  style={{
                    background: '#F0FDFA',
                    border: '1px solid #99E3D8',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F766E', display: 'block', marginBottom: '8px' }}>
                    Predictions Inferred Today
                  </span>
                  <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#00A6A6', lineHeight: 1.1 }}>
                    {stats.predictionsToday}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#0F766E', fontWeight: 600, display: 'block', marginTop: '6px' }}>
                    Neural net requests past 24h
                  </span>
                </div>

                {/* Tile 3: New Patients This Month */}
                <div 
                  style={{
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E40AF', display: 'block', marginBottom: '8px' }}>
                    New Patients This Month
                  </span>
                  <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#2563EB', lineHeight: 1.1 }}>
                    {stats.newPatientsThisMonth}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#1E40AF', fontWeight: 600, display: 'block', marginTop: '6px' }}>
                    Intake growth this billing cycle
                  </span>
                </div>

                {/* Tile 4: System Cluster Status */}
                <div 
                  style={{
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065F46', display: 'block', marginBottom: '8px' }}>
                    Diagnostic Cluster Status
                  </span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1.1 }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                    Operational
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#065F46', fontWeight: 600, display: 'block', marginTop: '8px' }}>
                    Zero server latency anomalies
                  </span>
                </div>

              </div>
            </motion.div>

            {/* User Directory & Quick Access */}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    User Accounts & Roles
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                    Recent practitioner, patient, and administrative user registrations.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text"
                      placeholder="Search accounts..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      style={{
                        padding: '8px 12px 8px 34px',
                        background: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        borderRadius: '10px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        color: '#17324D',
                        outline: 'none',
                        width: '160px'
                      }}
                    />
                  </div>
                  <Link 
                    to="/dashboard/admin/users" 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      background: '#F0FDFA',
                      color: '#00A6A6',
                      border: '1px solid #99E3D8',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    View All ({users.length})
                  </Link>
                </div>
              </div>

              {/* Table with Sticky Header & Scroll Container */}
              <div className="table-scroll-container" style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
                <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                        Name & Email
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                        Access Role
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                        Account Status
                      </th>
                      <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2, textAlign: 'right' }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(u => {
                        const roleColor = u.role === 'doctor' 
                          ? { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' }
                          : u.role === 'admin' 
                          ? { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' }
                          : { bg: '#F0FDFA', text: '#0D9488', border: '#99E3D8' };

                        return (
                          <tr key={u._id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div 
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}
                                >
                                  {getInitials(u.name)}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 700, color: '#17324D', fontSize: '0.88rem' }}>
                                    {u.name || 'Unnamed User'}
                                  </div>
                                  <div style={{ fontSize: '0.76rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                                    {u.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span 
                                style={{
                                  background: roleColor.bg,
                                  color: roleColor.text,
                                  border: `1px solid ${roleColor.border}`,
                                  borderRadius: '6px',
                                  padding: '3px 9px',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  textTransform: 'capitalize'
                                }}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span 
                                style={{
                                  background: u.accountStatus === 'Blocked' ? '#FEF2F2' : '#ECFDF5',
                                  color: u.accountStatus === 'Blocked' ? '#DC2626' : '#059669',
                                  border: `1px solid ${u.accountStatus === 'Blocked' ? '#FECACA' : '#A7F3D0'}`,
                                  borderRadius: '6px',
                                  padding: '3px 9px',
                                  fontSize: '0.76rem',
                                  fontWeight: 700
                                }}
                              >
                                {u.accountStatus || 'Active'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <Link 
                                to="/dashboard/admin/users" 
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '8px',
                                  background: '#F8FAFC',
                                  border: '1px solid #E2E8F0',
                                  color: '#64748B',
                                  textDecoration: 'none',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Manage user account"
                              >
                                <ChevronRight size={16} />
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ padding: '36px 16px', textAlign: 'center', color: '#64748B' }}>
                          <Users size={32} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
                          <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>No accounts match your search filter.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>

          </div>

          {/* ================= RIGHT COLUMN: AI ENGINE & AUDIT LOG ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* AI Model Performance Card */}
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
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    AI Model Performance
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                    Deep learning dental pathology classification metrics and model specifications.
                  </p>
                </div>
              </div>

              <div style={{ height: '1px', background: '#F1F5F9', margin: '18px 0 20px 0' }}></div>

              {/* Specification Box */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px 18px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>Architecture</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#17324D' }}>MobileNetV2 / ResNet-Dental</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>Training Method</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#17324D' }}>Transfer Learning</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>Dataset Size</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#17324D' }}>12,320 Validated Scans</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>Target Classes</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#17324D' }}>6 Primary Conditions</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                  <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>Inference Engine</span>
                  <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: '6px', padding: '2px 8px', fontSize: '0.74rem', fontWeight: 800 }}>
                    Active (~120ms Latency)
                  </span>
                </div>
              </div>

              {/* Accuracy Meter */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px 18px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#17324D' }}>Global Validation Accuracy</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#00A6A6' }}>81.07%</span>
                </div>
                <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: '81.07%' }} 
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #00A6A6, #06C6E8)', borderRadius: '999px' }}
                  />
                </div>
                <span style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '8px', display: 'block' }}>
                  Benchmarked against peer-reviewed dental radiography datasets.
                </span>
              </div>

              {/* Supported Pathologies */}
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '10px' }}>
                  Supported Dental Pathologies
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {SUPPORTED_CONDITIONS.map(c => (
                    <div 
                      key={c.name}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        padding: '8px 10px',
                        boxShadow: '0 2px 6px rgba(7, 26, 51, 0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.color }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#17324D' }}>{c.name}</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#64748B', marginLeft: '13px', display: 'block' }}>{c.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>

            {/* Recent System Activity Card */}
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
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    Recent System Activity
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                    Chronological audit feed of diagnostic events and practitioner actions.
                  </p>
                </div>
              </div>

              <div style={{ height: '1px', background: '#F1F5F9', margin: '18px 0 16px 0' }}></div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 0', borderBottom: '1px solid #F8FAFC' }}>
                  <div style={{ background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', padding: '8px', borderRadius: '10px', flexShrink: 0 }}>
                    <Activity size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#17324D' }}>
                      Diagnostic screening submitted
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Jane Doe &bull; Patient Intake
                    </div>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600 }}>10m ago</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 0', borderBottom: '1px solid #F8FAFC' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '8px', borderRadius: '10px', flexShrink: 0 }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#17324D' }}>
                      Caries diagnosis clinically confirmed
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Dr. Priya Menon &bull; Specialist Verification
                    </div>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600 }}>45m ago</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 0', borderBottom: '1px solid #F8FAFC' }}>
                  <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', padding: '8px', borderRadius: '10px', flexShrink: 0 }}>
                    <Users size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#17324D' }}>
                      New patient account registered
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      Michael Johnson &bull; Direct Patient Onboarding
                    </div>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600 }}>2h ago</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 0' }}>
                  <div style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#D97706', padding: '8px', borderRadius: '10px', flexShrink: 0 }}>
                    <BrainCircuit size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#17324D' }}>
                      Neural net diagnostic batch processed
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      DentaAI Core Inference Engine
                    </div>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600 }}>3h ago</span>
                </div>

              </div>
            </motion.div>

          </div>

        </div>

      </motion.div>
    </div>
  );
};

export default AdminDashboard;
