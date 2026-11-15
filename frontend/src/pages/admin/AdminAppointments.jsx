import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Clock, Search, ArrowLeft, Filter, 
  MapPin, Video, CheckCircle2, AlertCircle, XCircle, 
  CreditCard, ChevronRight, ChevronLeft, RefreshCw, Eye, X, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    inPerson: 0,
    onlineChat: 0,
    pending: 0,
    accepted: 0,
    completed: 0,
    rejected: 0
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'In-Person' | 'Online'
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'Accepted' | 'Completed' | 'Rejected'
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const fetchAppointments = useCallback(async (pageToLoad = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('dentaai_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const params = new URLSearchParams({
        page: pageToLoad,
        limit: 15,
        search,
        type: typeFilter,
        status: statusFilter
      });

      const res = await fetch(`${API_BASE}/api/admin/appointments?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
        if (data.metrics) setMetrics(data.metrics);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAppointments(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchAppointments]);

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
      case 'Verified':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', icon: <CheckCircle2 size={13} /> };
      case 'Accepted':
      case 'In Consultation':
        return { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD', icon: <Clock size={13} /> };
      case 'Pending':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D', icon: <Clock size={13} /> };
      case 'Rejected':
      case 'Cancelled':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5', icon: <XCircle size={13} /> };
      default:
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', icon: <Clock size={13} /> };
    }
  };

  const isInPerson = (type) => {
    return String(type || '').toLowerCase().includes('in-person') || String(type || '').toLowerCase().includes('clinic');
  };

  return (
    <div className="screening-history-wrapper" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px 48px' }}>
      <motion.div initial="hidden" animate="show" variants={stagger}>
        
        {/* Header Navigation */}
        <motion.div variants={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/dashboard/admin" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
              <ArrowLeft size={16} /> Admin Console
            </Link>
            <span style={{ color: '#CBD5E1' }}>/</span>
            <span style={{ color: '#17324D', fontWeight: 800, fontSize: '0.95rem' }}>Appointment Management</span>
          </div>
          <button 
            onClick={() => fetchAppointments(pagination.page)} 
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #BFD4E5', padding: '7px 14px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, color: '#17324D', cursor: 'pointer' }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} /> Refresh
          </button>
        </motion.div>

        {/* Title Header Card */}
        <motion.div variants={item} className="screening-header-card" style={{ marginBottom: '24px' }}>
          <div className="screening-header-stripe"></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div>
              <div className="screening-badge">
                <Calendar size={14} /> Clinical Scheduling Records
              </div>
              <h1 className="screening-title">
                Appointment Management
              </h1>
              <p className="screening-subtitle">
                Monitor all in-person clinic and online chat consultations. Verify fee structures, appointment status, and strictly enforced physical clinic attendance vs chat boundaries.
              </p>
            </div>
          </div>
        </motion.div>

        {/* KPI Metrics Row */}
        <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Total Bookings</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                <Calendar size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#17324D' }}>{metrics.total}</div>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Lifetime consultations</span>
          </div>

          <div className="card" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>In-Person Clinic</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
                <MapPin size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#16A34A' }}>{metrics.inPerson}</div>
            <span style={{ fontSize: '0.78rem', color: '#15803D', fontWeight: 600 }}>₹500 + ₹49 = ₹549 (No Chat)</span>
          </div>

          <div className="card" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Online Chat</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
                <Video size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#7C3AED' }}>{metrics.onlineChat}</div>
            <span style={{ fontSize: '0.78rem', color: '#6D28D9', fontWeight: 600 }}>₹200 + ₹49 = ₹249 (Chat Enabled)</span>
          </div>

          <div className="card" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Pending Review</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                <Clock size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#D97706' }}>{metrics.pending}</div>
            <span style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 600 }}>Awaiting practitioner action</span>
          </div>

          <div className="card" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Completed</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#059669' }}>{metrics.completed}</div>
            <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600 }}>Successfully concluded</span>
          </div>
        </motion.div>

        {/* Clinical Boundary Advisory Pill */}
        <motion.div variants={item} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={20} color="#0284C7" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
            <strong>Access Separation Policy:</strong> In-person clinic appointments (₹549) strictly require physical presence at the doctor&apos;s clinic and will never have chat access unlocked. Online chat consultations (₹249) grant secure end-to-end communication solely between the booked patient and the assigned doctor.
          </div>
        </motion.div>

        {/* Filter & Search Bar */}
        <motion.div variants={item} className="card" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid #BFD4E5', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '8px 14px' }}>
              <Search size={16} color="#64748B" />
              <input
                type="text"
                placeholder="Search by patient, doctor, clinic, or transaction ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.88rem', color: '#17324D', fontWeight: 500 }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px 12px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600, color: '#17324D', outline: 'none' }}
                >
                  <option value="All">All Types</option>
                  <option value="In-Person">In-Person Clinic</option>
                  <option value="Online">Online Chat</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px 12px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600, color: '#17324D', outline: 'none' }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Appointments Table Card */}
        <motion.div variants={item} className="card" style={{ padding: '0', borderRadius: '18px', border: '1px solid #BFD4E5', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patient</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Doctor</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Schedule</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fee Breakdown</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                      <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 12px', display: 'block', color: '#00A6A6' }} />
                      Loading appointments from MongoDB...
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                      No appointment records found matching the active criteria.
                    </td>
                  </tr>
                ) : (
                  appointments.map((appt) => {
                    const inPerson = isInPerson(appt.consultationType);
                    const statusBadge = getStatusBadge(appt.status);
                    return (
                      <tr key={appt._id || appt.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 700, color: '#17324D', fontSize: '0.92rem' }}>{appt.patientName || 'Anonymous Patient'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Ref: #{String(appt.transactionId || appt._id).slice(-8)}</div>
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 700, color: '#17324D', fontSize: '0.92rem' }}>{appt.doctorName || 'Dr. Specialist'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#00A6A6', fontWeight: 600 }}>{appt.doctorSpecialization || 'Dentist'}</div>
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          {inPerson ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                              <MapPin size={12} /> In-Person Clinic
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                              <Video size={12} /> Online Chat
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 600, color: '#17324D', fontSize: '0.86rem' }}>{appt.date || 'Flexible'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{appt.time || 'Pending Schedule'}</div>
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 800, color: '#17324D', fontSize: '0.92rem' }}>₹{appt.totalAmount || (inPerson ? 549 : 249)}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Fee: ₹{appt.fee || (inPerson ? 500 : 200)} + Platform: ₹{appt.platformFee || 49}</div>
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: statusBadge.bg, color: statusBadge.text, border: `1px solid ${statusBadge.border}`, padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                            {statusBadge.icon} {appt.status || 'Pending'}
                          </span>
                        </td>

                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedAppointment(appt)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, color: '#17324D', cursor: 'pointer' }}
                          >
                            <Eye size={13} /> View Dossier
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} records)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchAppointments(pagination.page - 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: pagination.page <= 1 ? '#94A3B8' : '#17324D', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchAppointments(pagination.page + 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: pagination.page >= pagination.pages ? '#94A3B8' : '#17324D', cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer' }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Appointment Dossier Modal */}
        <AnimatePresence>
          {selectedAppointment && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 26, 51, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="card" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', borderRadius: '22px', position: 'relative' }}>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  style={{ position: 'absolute', top: '20px', right: '20px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={16} />
                </button>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EFF6FF', color: '#2563EB', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                  Consultation Record Dossier
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#17324D', margin: '4px 0 16px' }}>
                  #{selectedAppointment.transactionId || String(selectedAppointment._id).slice(-8)}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Patient</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#17324D', marginTop: '2px' }}>{selectedAppointment.patientName}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>ID: {selectedAppointment.patientId}</div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Practitioner</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#17324D', marginTop: '2px' }}>{selectedAppointment.doctorName}</div>
                    <div style={{ fontSize: '0.78rem', color: '#00A6A6', fontWeight: 600 }}>{selectedAppointment.doctorSpecialization}</div>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#17324D', marginBottom: '12px' }}>Financial Breakdown</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#475569', marginBottom: '6px' }}>
                    <span>Consultation Professional Fee:</span>
                    <span style={{ fontWeight: 700 }}>₹{selectedAppointment.fee || (isInPerson(selectedAppointment.consultationType) ? 500 : 200)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#475569', marginBottom: '6px' }}>
                    <span>Platform Service Fee:</span>
                    <span style={{ fontWeight: 700 }}>₹{selectedAppointment.platformFee || 49}</span>
                  </div>
                  <div style={{ height: '1px', background: '#E2E8F0', margin: '8px 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.98rem', color: '#17324D', fontWeight: 900 }}>
                    <span>Total Amount Paid:</span>
                    <span style={{ color: '#059669' }}>₹{selectedAppointment.totalAmount || (isInPerson(selectedAppointment.consultationType) ? 549 : 249)}</span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '6px' }}>
                    Payment Status: <strong style={{ color: selectedAppointment.paymentStatus === 'Paid' ? '#059669' : '#D97706' }}>{selectedAppointment.paymentStatus || 'Paid'}</strong>
                  </div>
                </div>

                {selectedAppointment.message && (
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>Patient Clinical Note</div>
                    <div style={{ fontSize: '0.88rem', color: '#334155', marginTop: '4px', lineHeight: 1.5 }}>{selectedAppointment.message}</div>
                  </div>
                )}

                {selectedAppointment.finalDiagnosis && (
                  <div style={{ background: '#F0FDF4', padding: '14px', borderRadius: '12px', border: '1px solid #BBF7D0', marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.76rem', color: '#15803D', fontWeight: 800, textTransform: 'uppercase' }}>Doctor Clinical Diagnosis</div>
                    <div style={{ fontSize: '0.92rem', color: '#14532D', marginTop: '4px', fontWeight: 700 }}>{selectedAppointment.finalDiagnosis}</div>
                    {selectedAppointment.treatmentPlan && (
                      <div style={{ fontSize: '0.84rem', color: '#166534', marginTop: '6px' }}>Plan: {selectedAppointment.treatmentPlan}</div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    style={{ background: '#17324D', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Close Dossier
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};

export default AdminAppointments;
