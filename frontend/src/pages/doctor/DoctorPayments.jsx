import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, TrendingUp, IndianRupee, Wallet, Calendar, Clock, 
  CheckCircle2, ShieldCheck, ArrowUpRight, Search, Filter, X, 
  LayoutDashboard, Stethoscope, Building2, CreditCard, Receipt, 
  Sparkles, UserCircle, ArrowDownToLine, Printer, Hash, Check
} from 'lucide-react';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const DoctorPayments = () => {
  const [payments, setPayments] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingSettlements, setPendingSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'received', 'pending'

  // Modal states
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const userStr = localStorage.getItem('dentaai_user');
        let DOCTOR_ID = null;
        if (userStr) {
          const user = JSON.parse(userStr);
          DOCTOR_ID = user._id || user.id;
        }
        const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/api/consultations?doctorId=${DOCTOR_ID}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch from backend');
        const stored = await res.json();
        
        const myConsultations = (Array.isArray(stored) ? stored : []).filter(c => c.fee);
        
        let earnings = 0;
        const pending = [];
        const history = [];

        myConsultations.forEach(c => {
          const amount = Number(c.fee) || 0;
          
          if (c.status === "Completed" || c.paymentStatus === "Paid" || c.paymentStatus === "Verified") {
            if (c.status === "Completed") {
              earnings += amount;
            }
            history.push(c);
          } else if (c.status === "Pending" || c.status === "Accepted" || c.status === "In Consultation" || c.status === "Booked") {
            pending.push({ name: c.patientName, amount, date: c.date, id: c.id || c._id });
            history.push(c);
          }
        });

        history.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
        
        setPayments(history);
        setTotalEarnings(earnings);
        setPendingSettlements(pending);
        setWithdrawAmount(earnings > 0 ? String(earnings) : '500');

      } catch (e) {
        console.error("Error loading payments:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const getInitials = (name) => {
    if (!name) return 'PT';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Pending amount calculation
  const pendingAmount = useMemo(() => {
    return pendingSettlements.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [pendingSettlements]);

  // Completed count
  const completedCount = useMemo(() => {
    return payments.filter(p => p.status === 'Completed' || p.paymentStatus === 'Paid' || p.paymentStatus === 'Verified').length;
  }, [payments]);

  // Mean fee calculation
  const avgFee = useMemo(() => {
    if (payments.length === 0) return 500;
    const totalFees = payments.reduce((sum, p) => sum + (Number(p.fee) || 0), 0);
    return Math.round(totalFees / payments.length);
  }, [payments]);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return payments.filter(p => {
      // Status filter
      const isReceived = p.status === 'Completed' || p.paymentStatus === 'Paid' || p.paymentStatus === 'Verified';
      if (statusFilter === 'received' && !isReceived) return false;
      if (statusFilter === 'pending' && isReceived) return false;

      // Search query
      if (!query) return true;
      const pName = (p.patientName || '').toLowerCase();
      const idStr = (p.id || p._id || '').toLowerCase();
      const service = (p.consultationType || 'consultation').toLowerCase();

      return pName.includes(query) || idStr.includes(query) || service.includes(query);
    });
  }, [payments, statusFilter, searchTerm]);

  // Real CSV Statement Export
  const handleExportCSV = () => {
    if (payments.length === 0) {
      alert("No transaction records available to export.");
      return;
    }
    const headers = ["Transaction ID", "Patient Name", "Service Type", "Date", "Fee (INR)", "Payment Status"];
    const rows = payments.map(p => [
      `"${p.id || p._id || 'N/A'}"`,
      `"${p.patientName || 'Unknown Patient'}"`,
      `"${p.consultationType || 'Consultation'}"`,
      `"${p.date || 'N/A'}"`,
      p.fee || 0,
      p.status === 'Completed' || p.paymentStatus === 'Paid' || p.paymentStatus === 'Verified' ? 'Received' : 'In Escrow'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DentaAI_Earnings_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Mock Withdrawal
  const handleConfirmWithdrawal = () => {
    setIsWithdrawing(true);
    setTimeout(() => {
      setIsWithdrawing(false);
      setWithdrawSuccess(true);
      setTimeout(() => {
        setWithdrawSuccess(false);
        setShowWithdrawModal(false);
      }, 2500);
    }, 1200);
  };

  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
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
                <Wallet size={14} /> Revenue &amp; Financial Operations
              </div>
              <h1 className="screening-title">Payments &amp; Earnings</h1>
              <p className="screening-subtitle">
                Track clinical consultation revenues, inspect escrow balances, reconcile patient fees, and manage direct bank payouts.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <Link 
                to="/dashboard/doctor" 
                className="btn btn-outline"
                style={{
                  background: '#FFFFFF',
                  borderColor: '#BFD4E5',
                  color: '#17324D',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <LayoutDashboard size={16} color="#00A6A6" /> Doctor Dashboard
              </Link>

              <button
                onClick={handleExportCSV}
                className="btn btn-outline"
                style={{
                  background: '#FFFFFF',
                  borderColor: '#00A6A6',
                  color: '#00A6A6',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <ArrowDownToLine size={16} /> Export Statement (CSV)
              </button>
            </div>
          </div>
        </motion.div>

        {/* 2. 4 FINANCIAL KPI CARDS */}
        <motion.div variants={item} className="doctor-kpi-grid" style={{ marginBottom: '24px' }}>
          {/* Card 1: Total Realized Revenue */}
          <div className="doctor-kpi-card">
            <div>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '4px' }}>
                Realized Net Earnings
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#10B981', lineHeight: 1.1 }}>
                ₹{totalEarnings.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                ✓ 100% Settled &amp; Available
              </span>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={24} />
            </div>
          </div>

          {/* Card 2: In Escrow / Pending */}
          <div className="doctor-kpi-card">
            <div>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '4px' }}>
                In Escrow Settlement
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#D97706', lineHeight: 1.1 }}>
                ₹{pendingAmount.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                {pendingSettlements.length} Cases in active triage
              </span>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={24} />
            </div>
          </div>

          {/* Card 3: Settled Consultations */}
          <div className="doctor-kpi-card">
            <div>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '4px' }}>
                Paid Consultations
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#00A6A6', lineHeight: 1.1 }}>
                {completedCount}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#00A6A6', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                Finalized Clinical Records
              </span>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={24} />
            </div>
          </div>

          {/* Card 4: Mean Revenue / Consultation */}
          <div className="doctor-kpi-card">
            <div>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '4px' }}>
                Average Consultation Fee
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                ₹{avgFee}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#1677FF', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                Standard Triage Tariffs
              </span>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(22, 119, 255, 0.1)', color: '#1677FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={24} />
            </div>
          </div>
        </motion.div>

        {/* 3. TWO-COLUMN BALANCED FINANCIAL WORKSPACE (1fr 380px) */}
        <div className="doctor-payments-grid">

          {/* LEFT COLUMN: SOLID RECENT TRANSACTIONS TABLE */}
          <motion.div variants={item} className="doctor-table-card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    Recent Clinical Transactions
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
                    Showing {filteredPayments.length} of {payments.length} verified fee remittances
                  </span>
                </div>
              </div>

              {/* Status Filter Buttons */}
              <div style={{ display: 'inline-flex', gap: '4px', background: '#F1F5F9', padding: '4px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <button
                  onClick={() => setStatusFilter('all')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: statusFilter === 'all' ? '#00A6A6' : 'transparent',
                    color: statusFilter === 'all' ? '#FFFFFF' : '#475569',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  All ({payments.length})
                </button>
                <button
                  onClick={() => setStatusFilter('received')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: statusFilter === 'received' ? '#00A6A6' : 'transparent',
                    color: statusFilter === 'received' ? '#FFFFFF' : '#475569',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Received ({completedCount})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: statusFilter === 'pending' ? '#00A6A6' : 'transparent',
                    color: statusFilter === 'pending' ? '#FFFFFF' : '#475569',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  In Escrow ({pendingSettlements.length})
                </button>
              </div>
            </div>

            {/* Omni Search Bar */}
            <div style={{ position: 'relative', marginBottom: '16px', maxWidth: '400px' }}>
              <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search transactions by patient name, ID, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 32px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  color: '#17324D',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Solid Table with Scrollbar */}
            <div 
              className="table-scroll-container" 
              style={{ 
                maxHeight: '560px', 
                overflowY: 'auto', 
                overflowX: 'auto', 
                WebkitOverflowScrolling: 'touch',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                background: '#FFFFFF'
              }}
            >
              <table className="payments-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: '#F8FAFC' }}>
                  <tr>
                    <th style={{ position: 'sticky', top: 0, zIndex: 5, padding: '13px 16px', background: '#F8FAFC', color: '#64748B', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #E2E8F0' }}>
                      Patient
                    </th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 5, padding: '13px 16px', background: '#F8FAFC', color: '#64748B', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #E2E8F0' }}>
                      Service
                    </th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 5, padding: '13px 16px', background: '#F8FAFC', color: '#64748B', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #E2E8F0' }}>
                      Date
                    </th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 5, padding: '13px 16px', background: '#F8FAFC', color: '#64748B', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #E2E8F0' }}>
                      Amount
                    </th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 5, padding: '13px 16px', background: '#F8FAFC', color: '#64748B', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #E2E8F0' }}>
                      Status
                    </th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 5, padding: '13px 16px', background: '#F8FAFC', color: '#64748B', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #E2E8F0', textAlign: 'right' }}>
                      Receipt
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '48px 16px', textAlign: 'center' }}>
                        <div className="spin-anim" style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', marginBottom: '12px' }}>
                          <Wallet size={36} color="#00A6A6" />
                        </div>
                        <p style={{ color: '#64748B', margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>Loading transactions ledger...</p>
                      </td>
                    </tr>
                  ) : filteredPayments.length > 0 ? (
                    filteredPayments.map(p => {
                      const targetId = p.id || p._id;
                      const isReceived = p.status === 'Completed' || p.paymentStatus === 'Paid' || p.paymentStatus === 'Verified';

                      return (
                        <tr 
                          key={targetId}
                          style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s ease' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 166, 166, 0.02)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {/* Patient */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #00A6A6 0%, #17324D 100%)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                flexShrink: 0
                              }}>
                                {getInitials(p.patientName)}
                              </div>
                              <div>
                                <span style={{ fontWeight: 800, color: '#17324D', display: 'block', fontSize: '0.9rem' }}>
                                  {p.patientName || 'Unknown Patient'}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>
                                  ID: P-{targetId ? targetId.toString().substring(0, 6) : '00000'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Service */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                            <span style={{
                              background: '#F1F5F9',
                              color: '#334155',
                              border: '1px solid #CBD5E1',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.76rem',
                              fontWeight: 700
                            }}>
                              {p.consultationType || 'Consultation'}
                            </span>
                          </td>

                          {/* Date */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#17324D', fontSize: '0.84rem', fontWeight: 600 }}>
                              <Calendar size={13} color="#00A6A6" /> {p.date || 'Scheduled'}
                            </div>
                          </td>

                          {/* Amount */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                            <span style={{ fontWeight: 900, color: isReceived ? '#10B981' : '#D97706', fontSize: '0.94rem' }}>
                              +₹{p.fee}
                            </span>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              background: isReceived ? '#DCFCE7' : '#FEF3C7',
                              color: isReceived ? '#15803D' : '#B45309',
                              border: isReceived ? '1px solid #86EFAC' : '1px solid #FDE68A',
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '0.74rem',
                              fontWeight: 800
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isReceived ? '#16A34A' : '#D97706' }} />
                              {isReceived ? 'Received' : 'In Escrow'}
                            </span>
                          </td>

                          {/* Receipt */}
                          <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                            <button
                              onClick={() => setSelectedReceipt(p)}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #BFD4E5',
                                color: '#17324D',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Receipt size={13} color="#00A6A6" /> Receipt
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '48px 16px', textAlign: 'center' }}>
                        <Receipt size={32} color="#94A3B8" style={{ margin: '0 auto 10px' }} />
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800, color: '#17324D' }}>
                          No Transactions Found
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B' }}>
                          {searchTerm || statusFilter !== 'all' 
                            ? 'No transactions match your current search or status filters.' 
                            : 'Consultation transaction records will appear here as appointments are booked.'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: REVENUE SETTLEMENTS & PAYOUTS (380px) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Card 1: Available Balance & Bank Payout */}
            <motion.div variants={item} className="workspace-card" style={{ marginBottom: 0, padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={18} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#17324D' }}>
                    Available Payout Balance
                  </h4>
                </div>

                <span style={{ fontSize: '0.74rem', background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                  Active
                </span>
              </div>

              <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '14px', padding: '18px 20px', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '4px' }}>
                  Net Cleared Funds
                </span>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#15803D', lineHeight: 1 }}>
                  ₹{totalEarnings.toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 500, marginTop: '6px', display: 'block' }}>
                  Real-time earnings calculated from completed cases.
                </span>
              </div>

              <button
                onClick={() => setShowWithdrawModal(true)}
                disabled={totalEarnings === 0}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  background: totalEarnings === 0 ? '#E2E8F0' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: totalEarnings === 0 ? '#94A3B8' : '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.94rem',
                  cursor: totalEarnings === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: totalEarnings === 0 ? 'none' : '0 3px 12px rgba(16, 185, 129, 0.28)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Building2 size={18} /> Withdraw to Bank Account
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#64748B', marginTop: '12px', justifyContent: 'center' }}>
                <ShieldCheck size={14} color="#059669" /> Automatic NEFT/IMPS direct credit
              </div>
            </motion.div>

            {/* Card 2: Pending Settlements in Escrow */}
            <motion.div variants={item} className="workspace-card" style={{ marginBottom: 0, padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={16} />
                </div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#17324D' }}>
                  Pending Settlements in Escrow
                </h4>
              </div>

              <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: '#64748B', lineHeight: 1.4 }}>
                Held securely during active triage; released immediately upon final consultation completion.
              </p>

              {pendingSettlements.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {pendingSettlements.map((p, idx) => (
                    <div 
                      key={idx}
                      style={{
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#92400E', display: 'block' }}>
                          {p.name || 'Patient Case'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#B45309' }}>
                          {p.date || 'In active triage'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#D97706' }}>
                        ₹{p.amount}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px', background: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1', color: '#64748B', fontSize: '0.82rem' }}>
                  <Check size={16} color="#10B981" style={{ margin: '0 auto 4px' }} />
                  All patient fees currently cleared &amp; settled.
                </div>
              )}
            </motion.div>

            {/* Card 3: Bank Account & Payout Method */}
            <motion.div variants={item} className="workspace-card" style={{ marginBottom: 0, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Building2 size={16} color="#00A6A6" />
                <h5 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#17324D' }}>
                  Primary Payout Account
                </h5>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#17324D' }}>
                    HDFC Bank Ltd.
                  </span>
                  <span style={{ fontSize: '0.7rem', background: '#DCFCE7', color: '#15803D', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    Verified
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                  Account: •••••••• 4892 • IFSC: HDFC0001248
                </div>
              </div>
            </motion.div>

          </div>
        </div>

      </motion.div>

      {/* WITHDRAWAL MODAL */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: '#FFFFFF',
                border: '1px solid #BFD4E5',
                borderRadius: '20px',
                padding: '28px 32px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 20px 30px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={22} color="#10B981" />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    Withdraw Consultation Revenues
                  </h3>
                </div>
                <button 
                  onClick={() => setShowWithdrawModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={20} />
                </button>
              </div>

              {withdrawSuccess ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: 800, color: '#15803D' }}>
                    Payout Transfer Initiated!
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569' }}>
                    ₹{withdrawAmount} has been queued for transfer to HDFC Bank (•••• 4892). Funds typically arrive within 24 hours.
                  </p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '0.88rem', color: '#52677A', marginBottom: '18px', lineHeight: 1.5 }}>
                    Transfer your cleared consultation revenues directly to your primary verified bank account.
                  </p>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#17324D', marginBottom: '6px' }}>
                      Withdrawal Amount (INR)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#17324D' }}>₹</span>
                      <input 
                        type="number"
                        max={totalEarnings}
                        min={100}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 28px',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: '#17324D',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#64748B', display: 'block', marginTop: '4px' }}>
                      Available for withdrawal: ₹{totalEarnings}
                    </span>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Receiving Account
                    </span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#17324D', display: 'block' }}>
                      HDFC Bank • Account ending in 4892
                    </span>
                    <span style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 600 }}>
                      ✓ Zero transfer fees on doctor withdrawals
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button 
                      onClick={() => setShowWithdrawModal(false)}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '10px',
                        padding: '9px 18px',
                        fontWeight: 700,
                        color: '#52677A',
                        cursor: 'pointer'
                      }}
                      disabled={isWithdrawing}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleConfirmWithdrawal}
                      style={{
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '9px 22px',
                        fontWeight: 800,
                        color: '#FFFFFF',
                        cursor: isWithdrawing ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                      }}
                      disabled={isWithdrawing}
                    >
                      {isWithdrawing ? 'Initiating Payout...' : 'Confirm Withdrawal'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TRANSACTION RECEIPT MODAL */}
      <AnimatePresence>
        {selectedReceipt && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: '#FFFFFF',
                border: '1px solid #BFD4E5',
                borderRadius: '20px',
                padding: '28px 32px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 20px 30px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={22} color="#00A6A6" />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                    Remittance Receipt
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedReceipt(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Receipt Body */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px 20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Transaction ID</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#17324D', fontFamily: 'monospace' }}>
                    TXN-{selectedReceipt.id ? selectedReceipt.id.toString().substring(0, 8).toUpperCase() : '847291'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Patient Name</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#17324D' }}>
                    {selectedReceipt.patientName}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Service Rendered</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#17324D' }}>
                    {selectedReceipt.consultationType || 'Dental Consultation'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Remittance Date</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#17324D' }}>
                    {selectedReceipt.date}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', paddingTop: '10px', borderTop: '1px dashed #CBD5E1' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#17324D' }}>Net Amount Credited</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10B981' }}>
                    ₹{selectedReceipt.fee}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Status</span>
                  <span style={{ background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 800 }}>
                    Payment Cleared
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  onClick={() => window.print()}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    fontWeight: 700,
                    color: '#52677A',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.84rem'
                  }}
                >
                  <Printer size={15} /> Print
                </button>
                <button 
                  onClick={() => setSelectedReceipt(null)}
                  style={{
                    background: '#00A6A6',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 20px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '0.84rem'
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorPayments;
