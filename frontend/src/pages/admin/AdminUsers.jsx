import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Stethoscope, UserCheck, ShieldCheck, ShieldAlert, 
  Search, ArrowLeft, X, Calendar, Mail, Ban, CheckCircle2, 
  Activity, AlertTriangle, Lock, RefreshCw, KeyRound, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All'); // 'All' | 'patient' | 'doctor' | 'admin'
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Blocked'
  const [confirmModal, setConfirmModal] = useState(null); // { user, targetStatus }
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchUsers = async () => {
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
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAccountStatusUpdate = async (targetUserId, newStatus) => {
    setIsUpdating(true);
    try {
      const userStr = localStorage.getItem('dentaai_user');
      const user = JSON.parse(userStr);
      const adminId = user._id || user.id;

      const token = localStorage.getItem('dentaai_token');
      const headers = { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`${API_BASE}/api/admin/users/${targetUserId}/account-status?userId=${adminId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        showToast(`Account successfully marked as ${newStatus}.`, 'success');
        setConfirmModal(null);
        await fetchUsers();
      } else {
        const data = await res.json();
        showToast(`Failed: ${data.message || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      console.error("Error updating account status:", err);
      showToast("Error updating account status.", 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'US';
    const clean = name.replace(/^Dr\.\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const stats = useMemo(() => {
    let patients = 0;
    let doctors = 0;
    let admins = 0;
    let blocked = 0;
    let active = 0;

    users.forEach(u => {
      if (u.role === 'doctor') doctors++;
      else if (u.role === 'admin') admins++;
      else patients++;

      if (u.accountStatus === 'Blocked') blocked++;
      else active++;
    });

    return {
      total: users.length,
      patients,
      doctors,
      admins,
      blocked,
      active
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase().trim();
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const uid = (u._id || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || email.includes(q) || uid.includes(q);
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      const userStatus = u.accountStatus || 'Active';
      const matchesStatus = statusFilter === 'All' || userStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('dentaai_user') || '{}');
    } catch {
      return {};
    }
  }, []);

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
                <ShieldCheck size={14} /> Institutional Access Control
              </div>
              <h1 className="screening-title">User Management</h1>
              <p className="screening-subtitle">
                Directory of registered patients, licensed clinicians, and institutional administrators with real-time access security.
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
                RBAC Security Active
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. TOP 4 MASTER KPI SUMMARY STRIP (100% EQUAL & BALANCED) */}
        <motion.div variants={item} className="doctor-kpi-grid" style={{ marginBottom: '24px' }}>
          
          {/* Card 1: Total Users */}
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
                Total Accounts
              </div>
            </div>
          </div>

          {/* Card 2: Patients */}
          <div 
            className="doctor-kpi-card"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start', 
              gap: '16px',
              borderLeft: '4px solid #0891B2',
              padding: '20px 22px'
            }}
          >
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(8, 145, 178, 0.12)', color: '#0891B2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserCheck size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                {stats.patients}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Registered Patients
              </div>
            </div>
          </div>

          {/* Card 3: Doctors */}
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
                {stats.doctors}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Licensed Clinicians
              </div>
            </div>
          </div>

          {/* Card 4: Restricted / Blocked Accounts */}
          <div 
            className="doctor-kpi-card"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start', 
              gap: '16px',
              borderLeft: `4px solid ${stats.blocked > 0 ? '#DC2626' : '#10B981'}`,
              padding: '20px 22px'
            }}
          >
            <div 
              style={{ 
                width: '52px', 
                height: '52px', 
                borderRadius: '16px', 
                background: stats.blocked > 0 ? 'rgba(220, 38, 38, 0.12)' : 'rgba(16, 185, 129, 0.12)', 
                color: stats.blocked > 0 ? '#DC2626' : '#059669', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0 
              }}
            >
              {stats.blocked > 0 ? <ShieldAlert size={26} /> : <CheckCircle2 size={26} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                {stats.blocked}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Access Restricted
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
              {toastMessage.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <span>{toastMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. MASTER USER DIRECTORY CARD */}
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
          {/* Top Filter and Search Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '24px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              
              {/* Search Bar */}
              <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  placeholder="Search by name, email, or user UID..."
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
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease'
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

              {/* Status Filter Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Status:
                </span>
                {['All', 'Active', 'Blocked'].map(st => {
                  const isActive = statusFilter === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: '1px solid',
                        background: isActive 
                          ? (st === 'Blocked' ? '#FEF2F2' : '#F0FDFA') 
                          : '#FFFFFF',
                        color: isActive 
                          ? (st === 'Blocked' ? '#DC2626' : '#00A6A6') 
                          : '#64748B',
                        borderColor: isActive 
                          ? (st === 'Blocked' ? '#FECACA' : '#99E3D8') 
                          : '#CBD5E1',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {st === 'All' ? `All (${users.length})` : st === 'Active' ? `Active (${stats.active})` : `Blocked (${stats.blocked})`}
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Role Filter Tabs & Summary Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
              
              {/* Role Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Role:
                </span>
                {[
                  { id: 'All', label: 'All Accounts', count: users.length },
                  { id: 'patient', label: 'Patients', count: stats.patients },
                  { id: 'doctor', label: 'Clinicians', count: stats.doctors },
                  { id: 'admin', label: 'Admins', count: stats.admins }
                ].map(r => {
                  const isActive = roleFilter === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRoleFilter(r.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: '1px solid',
                        background: isActive ? '#17324D' : '#F8FAFC',
                        color: isActive ? '#FFFFFF' : '#475569',
                        borderColor: isActive ? '#17324D' : '#E2E8F0',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {r.label} ({r.count})
                    </button>
                  );
                })}
              </div>

              {/* Result Count and Active Filters Chip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
                  Showing <strong style={{ color: '#17324D' }}>{filteredUsers.length}</strong> of {users.length} registered accounts
                </span>
                {(search || roleFilter !== 'All' || statusFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setRoleFilter('All');
                      setStatusFilter('All');
                    }}
                    style={{
                      background: '#F1F5F9',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      color: '#475569',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <X size={12} /> Reset
                  </button>
                )}
              </div>

            </div>

          </div>

          {/* Table Container */}
          {isLoading ? (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
              <Activity className="spin-anim" size={38} color="#00A6A6" style={{ margin: '0 auto 16px' }} />
              <p style={{ margin: 0, color: '#64748B', fontWeight: 600, fontSize: '0.95rem' }}>
                Loading institutional user directory...
              </p>
            </div>
          ) : (
            <div className="table-scroll-container" style={{ maxHeight: '620px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
              <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      User Details
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      Contact & Email
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      System Role
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      Registration Date
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      Account Status
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2, textAlign: 'right' }}>
                      Access Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(u => {
                      const isSelf = (currentUser._id || currentUser.id) === u._id;
                      const isBlocked = u.accountStatus === 'Blocked';

                      const roleConfig = u.role === 'doctor' 
                        ? { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', icon: <Stethoscope size={13} />, label: 'Doctor' }
                        : u.role === 'admin' 
                        ? { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: <ShieldCheck size={13} />, label: 'Admin' }
                        : { bg: '#F0FDFA', text: '#0D9488', border: '#99E3D8', icon: <UserCheck size={13} />, label: 'Patient' };

                      return (
                        <tr 
                          key={u._id} 
                          style={{ 
                            borderBottom: '1px solid #F1F5F9',
                            background: isSelf ? '#FAFAFA' : '#FFFFFF',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          {/* User Details */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div 
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '50%',
                                  background: u.role === 'doctor'
                                    ? 'linear-gradient(135deg, #2563EB 0%, #06C6E8 100%)'
                                    : u.role === 'admin'
                                    ? 'linear-gradient(135deg, #DC2626 0%, #F59E0B 100%)'
                                    : 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)',
                                  color: '#FFFFFF',
                                  fontWeight: 800,
                                  fontSize: '0.88rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  boxShadow: '0 2px 8px rgba(7, 26, 51, 0.08)'
                                }}
                              >
                                {getInitials(u.name)}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: 800, color: '#17324D', fontSize: '0.92rem' }}>
                                    {u.name || 'Unnamed User'}
                                  </span>
                                  {isSelf && (
                                    <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#E2E8F0', color: '#475569', padding: '1px 6px', borderRadius: '4px' }}>
                                      YOU
                                    </span>
                                  )}
                                  {u.role === 'doctor' && u.isVerifiedDoctor && (
                                    <span title="Verified Dental Practitioner" style={{ color: '#00A6A6', display: 'inline-flex' }}>
                                      <CheckCircle2 size={14} />
                                    </span>
                                  )}
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
                                background: roleConfig.bg,
                                color: roleConfig.text,
                                border: `1px solid ${roleConfig.border}`,
                                borderRadius: '8px',
                                padding: '4px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 700
                              }}
                            >
                              {roleConfig.icon}
                              {roleConfig.label}
                            </span>
                          </td>

                          {/* Registration Date */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={14} color="#94A3B8" />
                              <span style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}>
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
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
                              {isBlocked ? 'Blocked' : 'Active'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            {isSelf ? (
                              <span 
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '6px 12px',
                                  background: '#F1F5F9',
                                  color: '#64748B',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '8px',
                                  fontSize: '0.76rem',
                                  fontWeight: 700
                                }}
                              >
                                Current Admin
                              </span>
                            ) : isBlocked ? (
                              <button
                                onClick={() => setConfirmModal({ user: u, targetStatus: 'Active' })}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '7px 14px',
                                  borderRadius: '10px',
                                  background: '#ECFDF5',
                                  color: '#059669',
                                  border: '1px solid #A7F3D0',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#D1FAE5'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#ECFDF5'}
                              >
                                <CheckCircle2 size={14} /> Restore Access
                              </button>
                            ) : (
                              <button
                                onClick={() => setConfirmModal({ user: u, targetStatus: 'Blocked' })}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '7px 14px',
                                  borderRadius: '10px',
                                  background: '#FEF2F2',
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#FEF2F2'}
                              >
                                <Ban size={14} /> Block Account
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                        <Users size={40} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800, color: '#17324D' }}>
                          No users found
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>
                          No accounts match your search filter "{search}" in category "{roleFilter}".
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

      {/* 5. INSTITUTIONAL CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {confirmModal && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid #BFD4E5',
                padding: '28px 32px',
                maxWidth: '460px',
                width: '100%',
                boxShadow: '0 20px 40px rgba(7, 26, 51, 0.15)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: confirmModal.targetStatus === 'Blocked' ? '#FEF2F2' : '#ECFDF5',
                    color: confirmModal.targetStatus === 'Blocked' ? '#DC2626' : '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {confirmModal.targetStatus === 'Blocked' ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    {confirmModal.targetStatus === 'Blocked' ? 'Restrict Account Access' : 'Restore User Access'}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                    Security privilege verification
                  </p>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#17324D' }}>
                  {confirmModal.user.name || 'Unnamed User'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                  {confirmModal.user.email} &bull; <span style={{ textTransform: 'capitalize' }}>{confirmModal.user.role}</span>
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, margin: '0 0 24px 0' }}>
                {confirmModal.targetStatus === 'Blocked' ? (
                  <>
                    Are you sure you want to block this user? Their active sessions will be revoked and they will be prevented from logging into the <strong>DentaAI PRO</strong> system until restored.
                  </>
                ) : (
                  <>
                    Are you sure you want to restore access for this user? They will be permitted to authenticate and access their dashboard role.
                  </>
                )}
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => setConfirmModal(null)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: '#475569',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleAccountStatusUpdate(confirmModal.user._id, confirmModal.targetStatus)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    background: confirmModal.targetStatus === 'Blocked' ? '#DC2626' : '#059669',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: confirmModal.targetStatus === 'Blocked' 
                      ? '0 4px 12px rgba(220, 38, 38, 0.25)' 
                      : '0 4px 12px rgba(5, 150, 105, 0.25)'
                  }}
                >
                  {isUpdating ? (
                    <>
                      <Activity className="spin-anim" size={16} /> Updating...
                    </>
                  ) : confirmModal.targetStatus === 'Blocked' ? (
                    <>
                      <Ban size={16} /> Confirm Block
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Confirm Restore
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminUsers;