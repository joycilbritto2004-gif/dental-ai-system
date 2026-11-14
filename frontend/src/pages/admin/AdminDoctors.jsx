import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Stethoscope, ShieldCheck, Search, ArrowLeft, X, 
  CheckCircle2, XCircle, Clock, Award, FileText, 
  Building, Phone, Mail, Activity, AlertTriangle, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Approved' | 'Pending' | 'Rejected'
  const [confirmModal, setConfirmModal] = useState(null); // { doctor, targetStatus }
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchDoctors = async () => {
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
        setDoctors((Array.isArray(data) ? data : []).filter(u => u.role === 'doctor'));
      }
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleStatusUpdate = async (doctorId, newStatus) => {
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

      const res = await fetch(`${API_BASE}/api/admin/users/${doctorId}/doctor-status?userId=${adminId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        showToast(`Practitioner verification status set to ${newStatus}.`, 'success');
        setConfirmModal(null);
        await fetchDoctors();
      } else {
        const data = await res.json();
        showToast(`Failed: ${data.message || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      console.error("Error updating doctor status:", err);
      showToast("Error updating doctor status.", 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'DR';
    const clean = name.replace(/^Dr\.\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const stats = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;

    doctors.forEach(d => {
      const st = d.verificationStatus || (d.isVerifiedDoctor ? 'Approved' : 'Pending');
      if (st === 'Approved') approved++;
      else if (st === 'Rejected') rejected++;
      else pending++;
    });

    return {
      total: doctors.length,
      approved,
      pending,
      rejected
    };
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(u => {
      const q = search.toLowerCase().trim();
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const license = (u.licenseNumber || '').toLowerCase();
      const spec = (u.specialization || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || email.includes(q) || license.includes(q) || spec.includes(q);
      const docStatus = u.verificationStatus || (u.isVerifiedDoctor ? 'Approved' : 'Pending');
      const matchesStatus = statusFilter === 'All' || docStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [doctors, search, statusFilter]);

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
                <Award size={14} /> Medical Board Credentials
              </div>
              <h1 className="screening-title">Doctor Verification Management</h1>
              <p className="screening-subtitle">
                Review dental credentials, state license numbers, and approve or reject clinical practitioner credentials.
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
                DCI Licensing Active
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. TOP 4 MASTER KPI SUMMARY STRIP (100% EQUAL & BALANCED) */}
        <motion.div variants={item} className="doctor-kpi-grid" style={{ marginBottom: '24px' }}>
          
          {/* Card 1: Total Doctors */}
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
                {stats.total}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Practitioner Roster
              </div>
            </div>
          </div>

          {/* Card 2: Approved / Verified Doctors */}
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
                {stats.approved}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Board Certified
              </div>
            </div>
          </div>

          {/* Card 3: Pending Applications */}
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
              <Clock size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                {stats.pending}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Awaiting Verification
              </div>
            </div>
          </div>

          {/* Card 4: Rejected / Revoked */}
          <div 
            className="doctor-kpi-card"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start', 
              gap: '16px',
              borderLeft: `4px solid ${stats.rejected > 0 ? '#DC2626' : '#94A3B8'}`,
              padding: '20px 22px'
            }}
          >
            <div 
              style={{ 
                width: '52px', 
                height: '52px', 
                borderRadius: '16px', 
                background: stats.rejected > 0 ? 'rgba(220, 38, 38, 0.12)' : 'rgba(148, 163, 184, 0.12)', 
                color: stats.rejected > 0 ? '#DC2626' : '#64748B', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0 
              }}
            >
              <XCircle size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                {stats.rejected}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Rejected / Inactive
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

        {/* 4. MASTER DOCTOR DIRECTORY CARD */}
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
                placeholder="Search by doctor name, email, or license..."
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
                { id: 'All', label: 'All Doctors', count: stats.total },
                { id: 'Approved', label: 'Approved', count: stats.approved },
                { id: 'Pending', label: 'Pending', count: stats.pending },
                { id: 'Rejected', label: 'Rejected', count: stats.rejected }
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
                        ? (st.id === 'Approved' ? '#ECFDF5' : st.id === 'Rejected' ? '#FEF2F2' : st.id === 'Pending' ? '#FFFBEB' : '#17324D')
                        : '#FFFFFF',
                      color: isActive 
                        ? (st.id === 'Approved' ? '#059669' : st.id === 'Rejected' ? '#DC2626' : st.id === 'Pending' ? '#B45309' : '#FFFFFF')
                        : '#64748B',
                      borderColor: isActive 
                        ? (st.id === 'Approved' ? '#A7F3D0' : st.id === 'Rejected' ? '#FECACA' : st.id === 'Pending' ? '#FDE68A' : '#17324D')
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
                Loading verified clinician roster...
              </p>
            </div>
          ) : (
            <div className="table-scroll-container" style={{ maxHeight: '620px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
              <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      Practitioner
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      License ID
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      Specialization
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      Experience
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      Verification
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2, textAlign: 'right' }}>
                      Audit Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map(u => {
                      const docStatus = u.verificationStatus || (u.isVerifiedDoctor ? 'Approved' : 'Pending');
                      const isApproved = docStatus === 'Approved';
                      const isRejected = docStatus === 'Rejected';

                      return (
                        <tr 
                          key={u._id} 
                          style={{ 
                            borderBottom: '1px solid #F1F5F9',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          {/* Practitioner */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div 
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #2563EB 0%, #06C6E8 100%)',
                                  color: '#FFFFFF',
                                  fontWeight: 800,
                                  fontSize: '0.88rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)'
                                }}
                              >
                                {getInitials(u.name)}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: 800, color: '#17324D', fontSize: '0.92rem' }}>
                                    {u.name.startsWith('Dr.') ? u.name : `Dr. ${u.name}`}
                                  </span>
                                  {isApproved && (
                                    <span title="Board Certified" style={{ color: '#00A6A6', display: 'inline-flex' }}>
                                      <CheckCircle2 size={14} />
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                  <Mail size={12} color="#94A3B8" /> {u.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* License */}
                          <td style={{ padding: '14px 18px' }}>
                            <span 
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: '#1E40AF',
                                background: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                padding: '3px 8px',
                                borderRadius: '6px'
                              }}
                            >
                              {u.licenseNumber || 'PENDING-LIC'}
                            </span>
                          </td>

                          {/* Specialization */}
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#17324D' }}>
                              {u.specialization || 'General Dentistry'}
                            </span>
                            {u.clinicName && (
                              <div style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <Building size={11} color="#94A3B8" /> {u.clinicName}
                              </div>
                            )}
                          </td>

                          {/* Experience */}
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ fontSize: '0.86rem', color: '#475569', fontWeight: 600 }}>
                              {u.experience ? (u.experience.toString().includes('Year') ? u.experience : `${u.experience} Years`) : '10 Years'}
                            </span>
                          </td>

                          {/* Verification Status */}
                          <td style={{ padding: '14px 18px' }}>
                            <span 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: isApproved ? '#ECFDF5' : isRejected ? '#FEF2F2' : '#FFFBEB',
                                color: isApproved ? '#059669' : isRejected ? '#DC2626' : '#B45309',
                                border: `1px solid ${isApproved ? '#A7F3D0' : isRejected ? '#FECACA' : '#FDE68A'}`,
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
                                  background: isApproved ? '#10B981' : isRejected ? '#DC2626' : '#F59E0B',
                                  boxShadow: isApproved ? '0 0 6px #10B981' : 'none'
                                }} 
                              />
                              {docStatus}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              {!isApproved && (
                                <button
                                  onClick={() => setConfirmModal({ doctor: u, targetStatus: 'Approved' })}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    background: '#ECFDF5',
                                    color: '#059669',
                                    border: '1px solid #A7F3D0',
                                    fontWeight: 700,
                                    fontSize: '0.78rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#D1FAE5'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = '#ECFDF5'}
                                >
                                  <CheckCircle2 size={13} /> Approve
                                </button>
                              )}

                              {!isRejected && (
                                <button
                                  onClick={() => setConfirmModal({ doctor: u, targetStatus: 'Rejected' })}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    background: '#FEF2F2',
                                    color: '#DC2626',
                                    border: '1px solid #FECACA',
                                    fontWeight: 700,
                                    fontSize: '0.78rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = '#FEF2F2'}
                                >
                                  <XCircle size={13} /> Reject
                                </button>
                              )}

                              {isApproved && (
                                <span style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 700, background: '#F0FDF4', padding: '4px 8px', borderRadius: '6px' }}>
                                  Verified
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                        <Stethoscope size={40} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800, color: '#17324D' }}>
                          No doctors found
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>
                          No clinicians match your search filter "{search}".
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

      {/* 5. CONFIRMATION DIALOG MODAL */}
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
                    background: confirmModal.targetStatus === 'Approved' ? '#ECFDF5' : '#FEF2F2',
                    color: confirmModal.targetStatus === 'Approved' ? '#059669' : '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {confirmModal.targetStatus === 'Approved' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    {confirmModal.targetStatus === 'Approved' ? 'Approve Medical Credentials' : 'Reject Practitioner Application'}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#64748B' }}>
                    Practitioner Verification Action
                  </p>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#17324D' }}>
                  {confirmModal.doctor.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                  {confirmModal.doctor.specialization || 'General Dentistry'} &bull; License: {confirmModal.doctor.licenseNumber || 'PENDING-LIC'}
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, margin: '0 0 24px 0' }}>
                {confirmModal.targetStatus === 'Approved' ? (
                  <>
                    Approving will grant <strong>{confirmModal.doctor.name}</strong> official verified credentials, enabling them to review patient AI screenings and accept tele-consultations.
                  </>
                ) : (
                  <>
                    Are you sure you want to reject this doctor's application? Their verification status will be updated to <strong>Rejected</strong>.
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
                  onClick={() => handleStatusUpdate(confirmModal.doctor._id, confirmModal.targetStatus)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    background: confirmModal.targetStatus === 'Approved' ? '#059669' : '#DC2626',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: confirmModal.targetStatus === 'Approved' 
                      ? '0 4px 12px rgba(5, 150, 105, 0.25)' 
                      : '0 4px 12px rgba(220, 38, 38, 0.25)'
                  }}
                >
                  {isUpdating ? (
                    <>
                      <Activity className="spin-anim" size={16} /> Updating...
                    </>
                  ) : confirmModal.targetStatus === 'Approved' ? (
                    <>
                      <CheckCircle2 size={16} /> Confirm Approval
                    </>
                  ) : (
                    <>
                      <XCircle size={16} /> Confirm Rejection
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

export default AdminDoctors;