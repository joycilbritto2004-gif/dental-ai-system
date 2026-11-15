import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, Search, ArrowLeft, RefreshCw, 
  CheckCircle2, Clock, XCircle, AlertCircle, 
  ChevronRight, ChevronLeft, Download, ShieldCheck, 
  Calendar, ArrowUpRight, DollarSign, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState({
    totalTransactions: 0,
    successfulCount: 0,
    pendingCount: 0,
    failedCount: 0,
    refundedCount: 0,
    totalCollectedRevenue: 0
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Paid' | 'Pending' | 'Failed'
  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'In-Person' | 'Online'
  const [selectedTx, setSelectedTx] = useState(null);

  const fetchPayments = useCallback(async (pageToLoad = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('dentaai_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const params = new URLSearchParams({
        page: pageToLoad,
        limit: 15,
        search,
        status: statusFilter,
        type: typeFilter
      });

      const res = await fetch(`${API_BASE}/api/admin/payments?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        if (data.metrics) setMetrics(data.metrics);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchPayments]);

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
      case 'Successful':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', icon: <CheckCircle2 size={13} />, label: 'Captured' };
      case 'Pending':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D', icon: <Clock size={13} />, label: 'Pending Settlement' };
      case 'Failed':
      case 'Cancelled':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5', icon: <XCircle size={13} />, label: 'Declined' };
      case 'Refunded':
        return { bg: '#E0E7FF', text: '#3730A3', border: '#A5B4FC', icon: <RefreshCw size={13} />, label: 'Refunded' };
      default:
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', icon: <Clock size={13} />, label: status };
    }
  };

  return (
    <div className="screening-history-wrapper" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px 48px' }}>
      <motion.div initial="hidden" animate="show" variants={stagger}>
        
        {/* Navigation Breadcrumb */}
        <motion.div variants={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/dashboard/admin" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
              <ArrowLeft size={16} /> Admin Console
            </Link>
            <span style={{ color: '#CBD5E1' }}>/</span>
            <span style={{ color: '#17324D', fontWeight: 800, fontSize: '0.95rem' }}>Payment & Financial Ledger</span>
          </div>
          <button 
            onClick={() => fetchPayments(pagination.page)} 
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #BFD4E5', padding: '7px 14px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, color: '#17324D', cursor: 'pointer' }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} /> Refresh Ledger
          </button>
        </motion.div>

        {/* Title Header Card */}
        <motion.div variants={item} className="screening-header-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #0F2942 0%, #17324D 100%)', color: '#FFFFFF', padding: '28px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', padding: '5px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                <CreditCard size={13} color="#38BDF8" /> Institutional Financial Audit
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '4px 0 6px', color: '#FFFFFF' }}>
                Payment Management
              </h2>
              <p style={{ color: '#93C5FD', margin: 0, fontSize: '0.92rem', maxWidth: '640px' }}>
                Live financial transactions from actual Consultation bookings. Revenue is strictly derived from verified successful payments.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Financial KPI Cards */}
        <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px', borderRadius: '16px', border: '1px solid #BFD4E5', background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Total Collected Revenue</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
                <DollarSign size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#14532D' }}>₹{metrics.totalCollectedRevenue.toLocaleString('en-IN')}</div>
            <span style={{ fontSize: '0.76rem', color: '#166534', fontWeight: 700 }}>Strictly settled & captured payments</span>
          </div>

          <div className="card" style={{ padding: '20px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Successful Payments</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#17324D' }}>{metrics.successfulCount}</div>
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Completed order checkouts</span>
          </div>

          <div className="card" style={{ padding: '20px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Pending Settlements</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                <Clock size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#D97706' }}>{metrics.pendingCount}</div>
            <span style={{ fontSize: '0.76rem', color: '#B45309', fontWeight: 600 }}>Awaiting payment gateway confirmation</span>
          </div>

          <div className="card" style={{ padding: '20px', borderRadius: '16px', border: '1px solid #BFD4E5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Failed / Cancelled</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                <XCircle size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#DC2626' }}>{metrics.failedCount}</div>
            <span style={{ fontSize: '0.76rem', color: '#B91C1C', fontWeight: 600 }}>Uncollected transactions</span>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div variants={item} className="card" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid #BFD4E5', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '8px 14px' }}>
              <Search size={16} color="#64748B" />
              <input
                type="text"
                placeholder="Search transaction ID, patient, or practitioner..."
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
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px 12px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600, color: '#17324D', outline: 'none' }}
                >
                  <option value="All">All Transactions</option>
                  <option value="Paid">Paid (Successful)</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed / Cancelled</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Service Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '8px 12px', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600, color: '#17324D', outline: 'none' }}
                >
                  <option value="All">All Services</option>
                  <option value="In-Person">In-Person Clinic (₹549)</option>
                  <option value="Online">Online Chat (₹249)</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Transactions Table */}
        <motion.div variants={item} className="card" style={{ padding: '0', borderRadius: '18px', border: '1px solid #BFD4E5', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Transaction Reference</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Patient & Doctor</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Service Mode</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Net Total</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                      <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 12px', display: 'block', color: '#00A6A6' }} />
                      Loading financial ledger from MongoDB...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                      No payment transactions found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const statusBadge = getStatusBadge(p.paymentStatus || 'Paid');
                    const isInPerson = String(p.consultationType || '').toLowerCase().includes('in-person') || String(p.consultationType || '').toLowerCase().includes('clinic');
                    return (
                      <tr key={p._id || p.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#17324D', fontSize: '0.88rem' }}>
                            {p.transactionId || `TXN_${String(p._id).slice(-8).toUpperCase()}`}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Booking Ref: #{String(p._id).slice(-8)}</div>
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 700, color: '#17324D', fontSize: '0.9rem' }}>{p.patientName || 'Patient'}</div>
                          <div style={{ fontSize: '0.76rem', color: '#00A6A6', fontWeight: 600 }}>to {p.doctorName || 'Practitioner'}</div>
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 600, color: '#17324D', fontSize: '0.84rem' }}>
                            {isInPerson ? 'In-Person Clinic Consultation' : 'Online Chat Consultation'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                            Fee: ₹{p.fee || (isInPerson ? 500 : 200)} + Platform: ₹{p.platformFee || 49}
                          </div>
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 900, color: p.paymentStatus === 'Paid' ? '#059669' : '#17324D', fontSize: '1rem' }}>
                            ₹{p.totalAmount || (isInPerson ? 549 : 249)}
                          </div>
                        </td>

                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: statusBadge.bg, color: statusBadge.text, border: `1px solid ${statusBadge.border}`, padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                            {statusBadge.icon} {statusBadge.label}
                          </span>
                        </td>

                        <td style={{ padding: '16px 20px', color: '#64748B', fontSize: '0.84rem' }}>
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recorded'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} records)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchPayments(pagination.page - 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: pagination.page <= 1 ? '#94A3B8' : '#17324D', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchPayments(pagination.page + 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: pagination.page >= pagination.pages ? '#94A3B8' : '#17324D', cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer' }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </motion.div>

      </motion.div>
    </div>
  );
};

export default AdminPayments;
