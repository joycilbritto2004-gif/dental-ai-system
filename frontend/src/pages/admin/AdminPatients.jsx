import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, UserCheck, ShieldCheck, Search, ArrowLeft, X, 
  Calendar, Mail, Activity, Eye, ChevronRight, FileText, Ban
} from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const AdminPatients = () => {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Blocked'

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const userStr = localStorage.getItem('dentaai_user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        const userId = user._id || user.id;

        const token = localStorage.getItem('dentaai_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const res = await fetch(`${API_BASE}/api/admin/users?userId=${userId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setPatients((Array.isArray(data) ? data : []).filter(u => u.role === 'patient'));
        }
      } catch (err) {
        console.error("Failed to fetch patients", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const getInitials = (name) => {
    if (!name) return 'PT';
    const clean = name.trim();
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const stats = useMemo(() => {
    let active = 0;
    let blocked = 0;
    let newThisMonth = 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    patients.forEach(p => {
      if (p.accountStatus === 'Blocked') blocked++;
      else active++;

      if (p.createdAt) {
        const d = new Date(p.createdAt);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          newThisMonth++;
        }
      }
    });

    return {
      total: patients.length,
      active,
      blocked,
      newThisMonth
    };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter(u => {
      const q = search.toLowerCase().trim();
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const uid = (u._id || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || email.includes(q) || uid.includes(q);
      const userStatus = u.accountStatus || 'Active';
      const matchesStatus = statusFilter === 'All' || userStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [patients, search, statusFilter]);

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
                <UserCheck size={14} /> Intake & Patient Care
              </div>
              <h1 className="screening-title">Patient Management</h1>
              <p className="screening-subtitle">
                Monitor patient accounts, intake registrations, AI scan activities, and institutional access statuses.
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
                HIPAA Compliance Active
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. TOP 4 MASTER KPI SUMMARY STRIP (100% EQUAL & BALANCED) */}
        <motion.div variants={item} className="doctor-kpi-grid" style={{ marginBottom: '24px' }}>
          
          {/* Card 1: Total Patients */}
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
                {stats.total}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Total Patients
              </div>
            </div>
          </div>

          {/* Card 2: Active Accounts */}
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
              <UserCheck size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                {stats.active}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Active Accounts
              </div>
            </div>
          </div>

          {/* Card 3: New Intake This Month */}
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
              <Calendar size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                +{stats.newThisMonth}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                New This Month
              </div>
            </div>
          </div>

          {/* Card 4: Restricted / Blocked Patients */}
          <div 
            className="doctor-kpi-card"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start', 
              gap: '16px',
              borderLeft: `4px solid ${stats.blocked > 0 ? '#DC2626' : '#94A3B8'}`,
              padding: '20px 22px'
            }}
          >
            <div 
              style={{ 
                width: '52px', 
                height: '52px', 
                borderRadius: '16px', 
                background: stats.blocked > 0 ? 'rgba(220, 38, 38, 0.12)' : 'rgba(148, 163, 184, 0.12)', 
                color: stats.blocked > 0 ? '#DC2626' : '#64748B', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0 
              }}
            >
              <Ban size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                {stats.blocked}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Restricted Access
              </div>
            </div>
          </div>

        </motion.div>

        {/* 3. MASTER PATIENT DIRECTORY CARD */}
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
          {/* Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
              <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text"
                placeholder="Search patients by name, email, or UID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 42px',
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '14px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#17324D',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Status:
              </span>
              {[
                { id: 'All', label: 'All Patients', count: stats.total },
                { id: 'Active', label: 'Active', count: stats.active },
                { id: 'Blocked', label: 'Restricted', count: stats.blocked }
              ].map(st => {
                const isActive = statusFilter === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid',
                      background: isActive 
                        ? (st.id === 'Active' ? '#ECFDF5' : st.id === 'Blocked' ? '#FEF2F2' : '#17324D')
                        : '#FFFFFF',
                      color: isActive 
                        ? (st.id === 'Active' ? '#059669' : st.id === 'Blocked' ? '#DC2626' : '#FFFFFF')
                        : '#64748B',
                      borderColor: isActive 
                        ? (st.id === 'Active' ? '#A7F3D0' : st.id === 'Blocked' ? '#FECACA' : '#17324D')
                        : '#CBD5E1',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {st.label} ({st.count})
                  </button>
                );
              })}
            </div>

          </div>

          {/* Table Container */}
          {isLoading ? (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
              <Activity className="spin-anim" size={38} color="#00A6A6" style={{ margin: '0 auto 16px' }} />
              <p style={{ margin: 0, color: '#64748B', fontWeight: 600, fontSize: '0.95rem' }}>
                Loading registered patient registry...
              </p>
            </div>
          ) : (
            <div className="table-scroll-container" style={{ maxHeight: '620px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
              <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      Patient Details
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      Email Address
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      Account Role
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      Registered Date
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      Access Status
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2, textAlign: 'right' }}>
                      Profile
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map(u => {
                      const isBlocked = u.accountStatus === 'Blocked';

                      return (
                        <tr 
                          key={u._id} 
                          style={{ 
                            borderBottom: '1px solid #F1F5F9',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          {/* Patient Details */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div 
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)',
                                  color: '#FFFFFF',
                                  fontWeight: 800,
                                  fontSize: '0.88rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  boxShadow: '0 2px 8px rgba(0, 166, 166, 0.15)'
                                }}
                              >
                                {getInitials(u.name)}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 800, color: '#17324D', fontSize: '0.92rem' }}>
                                  {u.name || 'Unnamed Patient'}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600, marginTop: '2px', fontFamily: 'monospace' }}>
                                  UID: {u._id ? `${u._id.substring(0, 8)}...${u._id.slice(-4)}` : 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Mail size={14} color="#94A3B8" />
                              <span style={{ fontSize: '0.86rem', color: '#475569', fontWeight: 600 }}>
                                {u.email}
                              </span>
                            </div>
                          </td>

                          {/* Role */}
                          <td style={{ padding: '14px 18px' }}>
                            <span 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: '#F0FDFA',
                                color: '#0D9488',
                                border: '1px solid #99E3D8',
                                borderRadius: '8px',
                                padding: '4px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 700
                              }}
                            >
                              <UserCheck size={13} />
                              Patient
                            </span>
                          </td>

                          {/* Registered Date */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={14} color="#94A3B8" />
                              <span style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}>
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                              </span>
                            </div>
                          </td>

                          {/* Access Status */}
                          <td style={{ padding: '14px 18px' }}>
                            <span 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: isBlocked ? '#FEF2F2' : '#ECFDF5',
                                color: isBlocked ? '#DC2626' : '#059669',
                                border: `1px solid ${isBlocked ? '#FECACA' : '#A7F3D0'}`,
                                borderRadius: '8px',
                                padding: '4px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 700
                              }}
                            >
                              <div 
                                style={{ 
                                  width: '7px', 
                                  height: '7px', 
                                  borderRadius: '50%', 
                                  background: isBlocked ? '#DC2626' : '#10B981',
                                  boxShadow: isBlocked ? 'none' : '0 0 6px #10B981'
                                }} 
                              />
                              {isBlocked ? 'Restricted' : 'Active'}
                            </span>
                          </td>

                          {/* Profile action */}
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <Link
                              to="/dashboard/admin/users"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                color: '#64748B',
                                textDecoration: 'none',
                                transition: 'all 0.15s ease'
                              }}
                              title="Manage patient credentials"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#F0FDFA';
                                e.currentTarget.style.color = '#00A6A6';
                                e.currentTarget.style.borderColor = '#99E3D8';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#F8FAFC';
                                e.currentTarget.style.color = '#64748B';
                                e.currentTarget.style.borderColor = '#E2E8F0';
                              }}
                            >
                              <ChevronRight size={16} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                        <Users size={40} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800, color: '#17324D' }}>
                          No patients found
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>
                          No patients match your search filter "{search}".
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </motion.div>

      </motion.div>
    </div>
  );
};

export default AdminPatients;