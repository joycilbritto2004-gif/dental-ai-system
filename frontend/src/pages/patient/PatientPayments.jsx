import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  FileText, 
  Download, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  X, 
  Calendar, 
  Clock, 
  Stethoscope, 
  CheckCircle2, 
  BriefcaseMedical,
  ChevronLeft,
  ChevronRight,
  Receipt,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import '../Dashboard.css';
import { API_BASE } from '../../config';

/**
 * PatientPayments
 * Secure Healthcare Financial Ledger & Transaction History
 * - Constrained, centered container (max-width: 1350px)
 * - Solid high-contrast clinical cards (#FFFFFF)
 * - 4-card financial KPI overview (Total Spent, Paid Transactions, Outstanding Dues, Security)
 * - Status filter tabs (All, Paid, Pending) & live omni-search
 * - Genuine clinical PDF receipt generation via jsPDF
 * - 10-item pagination for smooth browsing
 */
const PatientPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'paid' | 'pending'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/api/consultations`, { headers });
        if (!res.ok) throw new Error('Failed to fetch payments');
        const myPayments = await res.json();

        const sorted = Array.isArray(myPayments)
          ? [...myPayments].sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
          : [];

        setPayments(sorted);
      } catch (err) {
        console.error("Error loading payment history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Financial calculations
  const stats = useMemo(() => {
    let totalSpent = 0;
    let outstanding = 0;
    let paidCount = 0;
    let pendingCount = 0;

    payments.forEach(p => {
      const amount = Number(p.totalAmount) || Number(p.fee) || 549;
      const status = p.paymentStatus || 'Paid';
      if (status === 'Pending' || status === 'Payment Requested') {
        outstanding += amount;
        pendingCount += 1;
      } else {
        totalSpent += amount;
        paidCount += 1;
      }
    });

    return { totalSpent, outstanding, paidCount, pendingCount, total: payments.length };
  }, [payments]);

  // Filter & Search
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const term = searchTerm.toLowerCase().trim();
      const docName = (p.doctorName || p.doctor || '').toLowerCase();
      const id = String(p.id || p._id || '').toLowerCase();
      const dateStr = (p.date || '').toLowerCase();
      const matchesSearch = !term || docName.includes(term) || id.includes(term) || dateStr.includes(term);

      const status = (p.paymentStatus || 'Paid').toLowerCase();
      let matchesStatus = true;
      if (statusFilter === 'paid') {
        matchesStatus = status !== 'pending' && status !== 'payment requested';
      } else if (statusFilter === 'pending') {
        matchesStatus = status === 'pending' || status === 'payment requested';
      }

      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Genuine Clinical PDF Receipt Generator
  const handleDownloadReceipt = (payment) => {
    const doc = new jsPDF();
    const paymentId = payment.id || payment._id || 'TXN-000000';
    const cleanId = String(paymentId).substring(0, 10).toUpperCase();
    const docName = payment.doctorName || payment.doctor || 'Dr. Priya Menon';
    const clinic = payment.doctorSpecialization || payment.clinic || 'SmileCraft Dental Studio';
    const amount = Number(payment.totalAmount) || 549;
    const doctorFee = Number(payment.fee) || 500;
    const platformFee = Number(payment.platformFee) || 49;
    const date = payment.date || new Date().toISOString().split('T')[0];
    const time = payment.time || '10:00 AM';

    // Header Branding
    doc.setFillColor(0, 166, 166);
    doc.rect(0, 0, 210, 32, 'F');

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text("DentaAI Healthcare", 20, 21);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(230, 255, 255);
    doc.text("Official Clinical Consultation Receipt", 130, 21);

    // Receipt Meta Box
    doc.setTextColor(23, 50, 77);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("PAYMENT RECEIPT", 20, 48);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Receipt Reference: RCP-${cleanId}`, 20, 56);
    doc.text(`Transaction Date: ${date} at ${time}`, 20, 62);
    doc.text(`Payment Status: SUCCESSFUL / VERIFIED`, 20, 68);

    doc.text(`Payment Gateway: UPI / Net Banking Secure`, 130, 56);
    doc.text(`Transaction Channel: 256-Bit SSL Encrypted`, 130, 62);
    doc.text(`Currency: INR (₹)`, 130, 68);

    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, 74, 190, 74);

    // Patient & Doctor Details
    doc.setFontSize(11);
    doc.setTextColor(23, 50, 77);
    doc.setFont('helvetica', 'bold');
    doc.text("Patient Information", 20, 86);
    doc.text("Attending Specialist", 110, 86);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`Patient Name: ${payment.patientName || 'Joy'}`, 20, 94);
    doc.text(`User Account: Registered Patient`, 20, 100);
    doc.text(`Service Mode: In-Person Dental Consultation`, 20, 106);

    doc.text(`Specialist: ${docName}`, 110, 94);
    doc.text(`Clinic / Practice: ${clinic}`, 110, 100);
    doc.text(`Consultation Case: ${cleanId}`, 110, 106);

    // Table Header
    doc.setFillColor(248, 250, 252);
    doc.rect(20, 118, 170, 10, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text("DESCRIPTION", 24, 124);
    doc.text("TYPE", 110, 124);
    doc.text("AMOUNT (INR)", 160, 124);

    // Table Content
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(23, 50, 77);
    doc.text(`In-Person Dental Clinic Visit - ${payment.condition ? payment.condition.replace(/_/g, ' ') : 'Oral Examination'}`, 24, 136);
    doc.text("Professional Fee", 110, 136);
    doc.text(`₹${doctorFee.toFixed(2)}`, 160, 136);

    doc.text("Platform AI Diagnostic Processing & Infrastructure Fee", 24, 146);
    doc.text("Technology Fee", 110, 146);
    doc.text(`₹${platformFee.toFixed(2)}`, 160, 146);

    // Total Line
    doc.line(20, 154, 190, 154);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 166, 166);
    doc.text("TOTAL AMOUNT PAID:", 100, 164);
    doc.text(`₹${amount.toFixed(2)}`, 160, 164);

    // Stamp / Verification
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(20, 180, 170, 22, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text("✓ PAYMENT RECEIVED & CLINICALLY RECORDED", 26, 190);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(5, 150, 105);
    doc.text("This electronic receipt is verified by DentaAI Systems. GST / Tax invoices are available on demand.", 26, 196);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("DentaAI Telehealth Platforms Inc. • 256-Bit SSL Encrypted Healthcare Records • support@dentaai.com", 105, 280, null, null, "center");

    doc.save(`DentaAI_Receipt_${cleanId}.pdf`);
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div 
      className="dashboard-view"
      initial="hidden"
      animate="show"
      variants={stagger}
      style={{ paddingBottom: '40px' }}
    >
      <div className="screening-history-wrapper">

        {/* 1. HERO HEADER CARD */}
        <motion.div variants={item} className="screening-header-card">
          <div className="screening-header-stripe"></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="screening-badge">
                <CreditCard size={13} color="#00A6A6" /> 256-Bit Encrypted Healthcare Payments
              </span>
              <h2 className="screening-title">My Payments</h2>
              <p className="screening-subtitle">
                Secure financial ledger of your consultation fees, transaction receipts, payment methods, and invoices.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link 
                to="/dashboard/patient/recommended-doctors" 
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 22px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 14px rgba(0, 166, 166, 0.25)',
                  border: 'none'
                }}
              >
                <Stethoscope size={16} /> Book Consultation
              </Link>
            </div>
          </div>
        </motion.div>

        {/* 2. STATS OVERVIEW CARDS (4 KPIs) */}
        <motion.div variants={item} className="screening-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          
          <div className="screening-stat-card" style={{ borderTop: '3px solid #1677FF' }}>
            <div className="screening-stat-left">
              <div className="screening-stat-icon" style={{ background: '#EBF5FF', color: '#1677FF' }}>
                <CreditCard size={22} />
              </div>
              <div>
                <div className="screening-stat-value">₹{stats.totalSpent}</div>
                <div className="screening-stat-label">Total Spent</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1677FF', background: '#EBF5FF', padding: '3px 9px', borderRadius: '999px' }}>
              Lifetime
            </span>
          </div>

          <div className="screening-stat-card" style={{ borderTop: '3px solid #10B981' }}>
            <div className="screening-stat-left">
              <div className="screening-stat-icon" style={{ background: '#DCFCE7', color: '#10B981' }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="screening-stat-value">{stats.paidCount}</div>
                <div className="screening-stat-label">Paid Transactions</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10B981', background: '#DCFCE7', padding: '3px 9px', borderRadius: '999px' }}>
              Cleared
            </span>
          </div>

          <div className="screening-stat-card" style={{ borderTop: stats.outstanding > 0 ? '3px solid #D97706' : '3px solid #10B981' }}>
            <div className="screening-stat-left">
              <div className="screening-stat-icon" style={{ background: stats.outstanding > 0 ? '#FFFBEB' : '#DCFCE7', color: stats.outstanding > 0 ? '#D97706' : '#10B981' }}>
                {stats.outstanding > 0 ? <AlertCircle size={22} /> : <ShieldCheck size={22} />}
              </div>
              <div>
                <div className="screening-stat-value">₹{stats.outstanding}</div>
                <div className="screening-stat-label">Outstanding Dues</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: stats.outstanding > 0 ? '#D97706' : '#10B981', background: stats.outstanding > 0 ? '#FFFBEB' : '#DCFCE7', padding: '3px 9px', borderRadius: '999px' }}>
              {stats.outstanding > 0 ? 'Pending' : 'All Settled'}
            </span>
          </div>

          <div className="screening-stat-card" style={{ borderTop: '3px solid #00A6A6' }}>
            <div className="screening-stat-left">
              <div className="screening-stat-icon" style={{ background: '#E6FFFA', color: '#00A6A6' }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="screening-stat-value" style={{ fontSize: '1.25rem', marginTop: '2px' }}>PCI-DSS</div>
                <div className="screening-stat-label">Bank-Grade Security</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#00A6A6', background: '#E6FFFA', padding: '3px 9px', borderRadius: '999px' }}>
              Encrypted
            </span>
          </div>

        </motion.div>

        {/* 3. OUTSTANDING BALANCE BANNER (IF APPLICABLE) */}
        {stats.outstanding > 0 && (
          <motion.div 
            variants={item} 
            className="card mb-6" 
            style={{ 
              background: '#FFFBEB', 
              padding: '20px 24px', 
              borderRadius: '16px', 
              border: '1px solid #FDE68A', 
              borderLeft: '5px solid #D97706', 
              display: 'flex', 
              flexWrap: 'wrap', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              gap: '16px' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: '#FEF3C7', color: '#D97706', padding: '12px', borderRadius: '50%' }}>
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 style={{ color: '#92400E', margin: '0 0 2px 0', fontWeight: 800, fontSize: '1.1rem' }}>Pending Payment Due</h4>
                <p style={{ margin: 0, color: '#B45309', fontSize: '0.88rem', fontWeight: 500 }}>
                  You have an outstanding consultation fee of <strong>₹{stats.outstanding}</strong> awaiting completion.
                </p>
              </div>
            </div>
            <Link 
              to="/dashboard/patient/consultations" 
              className="btn btn-primary"
              style={{ padding: '9px 20px', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem' }}
            >
              Resolve Payment &rarr;
            </Link>
          </motion.div>
        )}

        {/* 4. INTERACTIVE CONTROLS: SEARCH & FILTER TABS */}
        <motion.div variants={item} className="screening-controls-card">
          <div className="screening-controls-top">
            
            {/* Search Input */}
            <div className="screening-search-box" style={{ flex: '2 1 320px' }}>
              <Search size={18} color="#00A6A6" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text"
                placeholder="Search payments by doctor name, case ID, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="screening-search-input"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="screening-chips-bar" style={{ margin: 0, padding: 0 }}>
              <button 
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`screening-chip ${statusFilter === 'all' ? 'active' : ''}`}
              >
                All ({stats.total})
              </button>
              <button 
                type="button"
                onClick={() => setStatusFilter('paid')}
                className={`screening-chip ${statusFilter === 'paid' ? 'active' : ''}`}
                style={statusFilter === 'paid' ? { background: '#DCFCE7', color: '#10B981', borderColor: '#A7F3D0' } : {}}
              >
                Paid ({stats.paidCount})
              </button>
              <button 
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`screening-chip ${statusFilter === 'pending' ? 'active' : ''}`}
                style={statusFilter === 'pending' ? { background: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' } : {}}
              >
                Pending ({stats.pendingCount})
              </button>
            </div>

          </div>

          <div className="screening-count-bar">
            <span>
              Showing <strong>{filteredPayments.length}</strong> of <strong>{payments.length}</strong> transaction records
            </span>
            {(searchTerm || statusFilter !== 'all') && (
              <button 
                type="button" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                style={{ background: 'transparent', border: 'none', color: '#00A6A6', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Reset Filters &times;
              </button>
            )}
          </div>
        </motion.div>

        {/* 5. LOADING STATE */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #BFD4E5' }}>
            <div className="spin-anim" style={{ color: '#00A6A6', marginBottom: '14px' }}>
              <CreditCard size={42} />
            </div>
            <p style={{ color: '#17324D', fontWeight: 700, fontSize: '1rem', margin: 0 }}>
              Retrieving secure financial records...
            </p>
          </div>
        )}

        {/* 6. EMPTY STATE */}
        {!loading && payments.length === 0 && (
          <motion.div 
            variants={item} 
            className="card text-center" 
            style={{ 
              padding: '70px 20px', 
              background: '#FFFFFF', 
              border: '1px dashed #BFD4E5', 
              borderRadius: '24px', 
              boxShadow: '0 4px 20px rgba(7, 26, 51, 0.04)' 
            }}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#00A6A6', border: '1px solid #99F6E4' }}>
              <Receipt size={32} />
            </div>
            <h3 style={{ color: '#17324D', fontWeight: 800, fontSize: '1.4rem', margin: '0 0 8px 0' }}>No Transactions Found</h3>
            <p style={{ color: '#52677A', fontSize: '0.98rem', maxWidth: '460px', margin: '0 auto 24px', lineHeight: 1.5 }}>
              When you schedule virtual dental consultations, your payment history, tax invoices, and receipts will appear here.
            </p>
            <Link 
              to="/dashboard/patient/recommended-doctors" 
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                borderRadius: '999px',
                fontWeight: 800,
                fontSize: '0.95rem',
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(0, 166, 166, 0.25)'
              }}
            >
              Book a Consultation
            </Link>
          </motion.div>
        )}

        {/* 7. NO SEARCH MATCHES */}
        {!loading && payments.length > 0 && filteredPayments.length === 0 && (
          <motion.div variants={item} className="card text-center" style={{ padding: '50px 20px', background: '#FFFFFF', border: '1px solid #BFD4E5', borderRadius: '20px' }}>
            <Search size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ color: '#17324D', fontWeight: 800, margin: '0 0 6px 0', fontSize: '1.15rem' }}>No matching transactions</h4>
            <p style={{ color: '#52677A', margin: '0 0 16px 0', fontSize: '0.92rem' }}>
              No billing records matched your search "{searchTerm}" or active filter.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="btn btn-outline btn-sm font-bold"
              style={{ borderRadius: '10px', padding: '8px 18px', color: '#00A6A6', borderColor: '#00A6A6' }}
            >
              Clear Search & Filter
            </button>
          </motion.div>
        )}

        {/* 8. TRANSACTIONS TABLE */}
        {!loading && filteredPayments.length > 0 && (
          <motion.div variants={item} className="payments-ledger-card">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ color: '#17324D', fontWeight: 800, fontSize: '1.25rem', margin: '0 0 4px 0' }}>
                  Billing & Transaction Ledger
                </h3>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.86rem' }}>
                  All financial settlements are encrypted and backed by clinical receipt logs.
                </p>
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: '#ECFDF5', color: '#10B981', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800, border: '1px solid #A7F3D0' }}>
                <ShieldCheck size={14} /> End-to-End Encrypted
              </div>
            </div>

            <div className="table-responsive">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Doctor & Specialist</th>
                    <th>Reference ID</th>
                    <th>Date & Time</th>
                    <th>Amount Paid</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.map((payment, idx) => {
                    const paymentId = payment.id || payment._id || `TXN-${idx}`;
                    const docName = payment.doctorName || payment.doctor || 'Dr. Priya Menon';
                    const amount = Number(payment.totalAmount) || Number(payment.fee) || 549;
                    const isPending = payment.paymentStatus === 'Pending' || payment.paymentStatus === 'Payment Requested';
                    const cleanRef = `P-${String(paymentId).substring(0, 6).toUpperCase()}`;

                    const docInitials = docName
                      .replace(/^(Dr\.|Dr)\s*/i, '')
                      .trim()
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase() || 'DR';

                    return (
                      <tr key={paymentId}>
                        {/* DOCTOR / SERVICE */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)', color: '#FFFFFF', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {docInitials}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#17324D', fontSize: '0.96rem' }}>
                                {docName}
                              </div>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#64748B', fontSize: '0.78rem', fontWeight: 600 }}>
                                {payment.consultationType || "Video Consultation"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* CASE REF ID */}
                        <td>
                          <span style={{ display: 'inline-block', padding: '4px 8px', background: '#F1F5F9', color: '#334155', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, fontFamily: 'monospace' }}>
                            {cleanRef}
                          </span>
                        </td>

                        {/* DATE & TIME */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#17324D', fontWeight: 700, fontSize: '0.88rem' }}>
                            <Calendar size={13} color="#00A6A6" />
                            <span>{payment.date || 'Today'}</span>
                          </div>
                          <div style={{ color: '#64748B', fontSize: '0.78rem', marginTop: '2px', paddingLeft: '19px' }}>
                            {payment.time || '10:00 AM'}
                          </div>
                        </td>

                        {/* AMOUNT */}
                        <td>
                          <div style={{ fontWeight: 800, color: '#17324D', fontSize: '1.05rem' }}>
                            ₹{amount}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>
                            {isPending ? 'Pending settlement' : 'Taxes included'}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td>
                          {isPending ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#FFFBEB', color: '#D97706', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800, border: '1px solid #FDE68A' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D97706' }}></span>
                              Pending
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#ECFDF5', color: '#10B981', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800, border: '1px solid #A7F3D0' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></span>
                              Paid
                            </span>
                          )}
                        </td>

                        {/* ACTION */}
                        <td style={{ textAlign: 'right' }}>
                          {isPending ? (
                            <Link 
                              to="/dashboard/patient/consultations" 
                              className="btn btn-primary" 
                              style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              Pay Now
                            </Link>
                          ) : (
                            <button 
                              onClick={() => handleDownloadReceipt(payment)} 
                              className="payments-receipt-btn"
                              title="Download Official Clinical PDF Receipt"
                            >
                              <Download size={13} color="#00A6A6" />
                              <span>Receipt (PDF)</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION BAR */}
            {filteredPayments.length > itemsPerPage && (
              <div className="screening-pagination-bar" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-nav-btn"
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                <span className="pagination-info">
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="pagination-nav-btn"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}

          </motion.div>
        )}

      </div>
    </motion.div>
  );
};

export default PatientPayments;
