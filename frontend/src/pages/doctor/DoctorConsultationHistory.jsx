import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, History, Eye, UserCircle, Search, Filter, 
  MessageSquare, CheckCircle2, XCircle, TrendingUp, Stethoscope, 
  Clock, X, ArrowUpDown, ShieldCheck, LayoutDashboard, 
  FileText, Check, ArrowDownToLine 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getConsultationStatusMeta } from '../../utils/consultationStatus';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const CONDITIONS = ['All', 'Gingivitis', 'Caries', 'Calculus', 'Mouth Ulcer', 'Tooth Discoloration', 'Hypodontia'];

const DoctorConsultationHistory = () => {
  const [historyCases, setHistoryCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Completed', 'Rejected'
  const [conditionFilter, setConditionFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
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
        
        const myHistory = (Array.isArray(stored) ? stored : []).filter(c => (
          c.status === "Completed" || 
          c.status === "Verified" || 
          c.status === "Rejected" ||
          c.status === "Cancelled"
        ));
        
        myHistory.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
        setHistoryCases(myHistory);
      } catch (e) {
        console.error("Error loading history:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getInitials = (name) => {
    if (!name) return 'PT';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatDateTime = (req) => {
    if (req.date) {
      return `${req.date}${req.time ? ` @ ${req.time}` : ''}`;
    }
    if (req.updatedAt || req.createdAt) {
      const d = new Date(req.updatedAt || req.createdAt);
      return !isNaN(d.getTime()) 
        ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : 'Finalized';
    }
    return 'Finalized';
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = historyCases.length;
    const completed = historyCases.filter(c => c.status === 'Completed' || c.status === 'Verified').length;
    const declined = historyCases.filter(c => c.status === 'Rejected' || c.status === 'Cancelled').length;
    const totalRevenue = historyCases
      .filter(c => c.status === 'Completed' || c.status === 'Verified')
      .reduce((sum, c) => sum + (Number(c.fee) || Number(c.totalAmount) || 0), 0);
    const followUps = historyCases.filter(c => Boolean(c.followUpDate)).length;

    return { total, completed, declined, totalRevenue, followUps };
  }, [historyCases]);

  // Filtered & Sorted Cases
  const filteredCases = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return historyCases
      .filter(req => {
        const pName = (req.patientName || '').toLowerCase();
        const idStr = (req.id || req._id || '').toLowerCase();
        const finalDiag = (req.finalDiagnosis || '').toLowerCase();
        const cond = (req.scanId?.condition || req.condition || '').toLowerCase();
        const reason = (req.rejectionReason || '').toLowerCase();

        const matchesSearch = !query || 
          pName.includes(query) || 
          idStr.includes(query) || 
          finalDiag.includes(query) || 
          cond.includes(query) || 
          reason.includes(query);

        const matchesStatus = statusFilter === 'All' || 
          (statusFilter === 'Completed' && (req.status === 'Completed' || req.status === 'Verified')) ||
          (statusFilter === 'Rejected' && (req.status === 'Rejected' || req.status === 'Cancelled')) ||
          (statusFilter === req.status);

        const matchesCondition = conditionFilter === 'All' || cond.includes(conditionFilter.toLowerCase());

        return matchesSearch && matchesStatus && matchesCondition;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date || a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.updatedAt || b.createdAt || 0).getTime();
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [historyCases, searchTerm, statusFilter, conditionFilter, sortBy]);

  // CSV Export
  const handleExportCSV = () => {
    if (historyCases.length === 0) {
      alert("No consultation history records available to export.");
      return;
    }
    const headers = ["Consultation ID", "Patient Name", "Diagnosis / Pathology", "Date", "Fee (INR)", "Status"];
    const rows = historyCases.map(c => [
      `"${c.id || c._id || 'N/A'}"`,
      `"${c.patientName || 'Unknown Patient'}"`,
      `"${(c.finalDiagnosis || c.condition || 'Consultation').replace(/"/g, '""')}"`,
      `"${c.date || 'N/A'}"`,
      c.fee || c.totalAmount || 0,
      c.status || 'Completed'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DentaAI_Consultation_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                <History size={14} /> Historical Consultation Archive
              </div>
              <h1 className="screening-title">Consultation History</h1>
              <p className="screening-subtitle">
                A complete chronological audit log of all your finalized, verified, and concluded patient consultations.
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
                <ArrowDownToLine size={16} /> Export History (CSV)
              </button>
            </div>
          </div>
        </motion.div>

        {/* 2. 4 CLINICAL KPI METRIC CARDS */}
        <motion.div variants={item} className="doctor-kpi-grid" style={{ marginBottom: '24px' }}>
          {/* Card 1: Total Past Consultations */}
          <div className="doctor-kpi-card">
            <div>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '4px' }}>
                Total Past Cases
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                {stats.total}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                Archived Records
              </span>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(23, 50, 77, 0.08)', color: '#17324D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <History size={24} />
            </div>
          </div>

          {/* Card 2: Successfully Finalized */}
          <div className="doctor-kpi-card">
            <div>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '4px' }}>
                Completed &amp; Verified
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#10B981', lineHeight: 1.1 }}>
                {stats.completed}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                ✓ Dispatched Assessments
              </span>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={24} />
            </div>
          </div>

          {/* Card 3: Total Revenue Realized */}
          <div className="doctor-kpi-card">
            <div>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '4px' }}>
                Realized Revenue
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#00A6A6', lineHeight: 1.1 }}>
                ₹{stats.totalRevenue.toLocaleString('en-IN')}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#00A6A6', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                From Finalized Sessions
              </span>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={24} />
            </div>
          </div>

          {/* Card 4: Scheduled Follow-ups */}
          <div className="doctor-kpi-card">
            <div>
              <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '4px' }}>
                Follow-ups Scheduled
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#1677FF', lineHeight: 1.1 }}>
                {stats.followUps}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#1677FF', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                Post-Care Recall Cases
              </span>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(22, 119, 255, 0.1)', color: '#1677FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Calendar size={24} />
            </div>
          </div>
        </motion.div>

        {/* 3. SEARCH & FILTER CONTROLS */}
        <motion.div variants={item} className="workspace-card" style={{ padding: '18px 24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            
            {/* Omni Search Input */}
            <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '440px' }}>
              <Search size={16} color="#64748B" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search patient, diagnosis, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 34px 9px 40px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  color: '#17324D',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Status Tabs & Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Status Tabs */}
              <div style={{ display: 'inline-flex', gap: '4px', background: '#F1F5F9', padding: '4px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <button
                  onClick={() => setStatusFilter('All')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: statusFilter === 'All' ? '#00A6A6' : 'transparent',
                    color: statusFilter === 'All' ? '#FFFFFF' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  All ({historyCases.length})
                </button>
                <button
                  onClick={() => setStatusFilter('Completed')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: statusFilter === 'Completed' ? '#00A6A6' : 'transparent',
                    color: statusFilter === 'Completed' ? '#FFFFFF' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Completed ({stats.completed})
                </button>
                <button
                  onClick={() => setStatusFilter('Rejected')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: statusFilter === 'Rejected' ? '#00A6A6' : 'transparent',
                    color: statusFilter === 'Rejected' ? '#FFFFFF' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Declined ({stats.declined})
                </button>
              </div>

              {/* Sort Toggle */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#17324D',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="newest">Most Recent</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Condition Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
              <Filter size={13} /> Pathology:
            </span>
            {CONDITIONS.map(cond => {
              const active = conditionFilter === cond;
              return (
                <button
                  key={cond}
                  onClick={() => setConditionFilter(cond)}
                  style={{
                    padding: '4px 11px',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: active ? '1.5px solid #00A6A6' : '1px solid #E2E8F0',
                    background: active ? '#F0FDFA' : '#FFFFFF',
                    color: active ? '#00A6A6' : '#52677A',
                    boxShadow: active ? '0 2px 6px rgba(0, 166, 166, 0.12)' : 'none'
                  }}
                >
                  {cond}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* 4. SOLID TABLE CARD WITH CUSTOM SCROLLBAR */}
        <motion.div variants={item} className="doctor-table-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <History size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D' }}>
                  Past Consultations Ledger
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
                  Showing {filteredCases.length} of {historyCases.length} archived consultations
                </span>
              </div>
            </div>

            <span style={{
              background: '#F0FDFA',
              color: '#00A6A6',
              border: '1px solid #99E3D8',
              padding: '4px 14px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 800
            }}>
              {filteredCases.length} Cases Displayed
            </span>
          </div>

          {/* Table Container with Dedicated Vertical Scrollbar & Sticky Header */}
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
                    Diagnosis / Clinical Notes
                  </th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, padding: '13px 16px', background: '#F8FAFC', color: '#64748B', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #E2E8F0' }}>
                    Date &amp; Time
                  </th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, padding: '13px 16px', background: '#F8FAFC', color: '#64748B', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #E2E8F0' }}>
                    Fee
                  </th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, padding: '13px 16px', background: '#F8FAFC', color: '#64748B', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #E2E8F0' }}>
                    Status
                  </th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 5, padding: '13px 16px', background: '#F8FAFC', color: '#64748B', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1.5px solid #E2E8F0', textAlign: 'right' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '48px 16px', textAlign: 'center' }}>
                      <div className="spin-anim" style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', marginBottom: '12px' }}>
                        <History size={36} color="#00A6A6" />
                      </div>
                      <p style={{ color: '#64748B', margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>Loading consultation history records...</p>
                    </td>
                  </tr>
                ) : filteredCases.length > 0 ? (
                  filteredCases.map(req => {
                    const targetId = req.id || req._id;
                    const statusMeta = getConsultationStatusMeta(req.status);
                    const isRejected = req.status === 'Rejected' || req.status === 'Cancelled';
                    const feeAmount = req.fee || req.totalAmount || 500;

                    const displayDiag = req.finalDiagnosis && req.finalDiagnosis.trim() !== ''
                      ? req.finalDiagnosis
                      : req.condition && req.condition !== 'N/A'
                        ? req.condition.replace(/_/g, ' ')
                        : 'Clinical Dental Consultation';

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
                              width: '40px',
                              height: '40px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #00A6A6 0%, #17324D 100%)',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              fontSize: '0.9rem',
                              boxShadow: '0 2px 8px rgba(0, 166, 166, 0.2)',
                              flexShrink: 0
                            }}>
                              {getInitials(req.patientName)}
                            </div>
                            <div>
                              <span style={{ fontWeight: 800, color: '#17324D', display: 'block', fontSize: '0.92rem' }}>
                                {req.patientName || 'Unknown Patient'}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>
                                ID: P-{targetId ? targetId.toString().substring(0, 6) : '00000'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Diagnosis / Notes */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle', maxWidth: '340px' }}>
                          {isRejected ? (
                            <div>
                              <span style={{ color: '#DC2626', fontWeight: 700, fontSize: '0.86rem', display: 'block' }}>
                                Request Declined
                              </span>
                              {req.rejectionReason && (
                                <div style={{ fontSize: '0.76rem', color: '#991B1B', fontStyle: 'italic', marginTop: '2px', lineHeight: 1.4 }}>
                                  Reason: &ldquo;{req.rejectionReason}&rdquo;
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span style={{ fontWeight: 800, color: '#17324D', fontSize: '0.9rem', display: 'block', lineHeight: 1.4 }}>
                                {displayDiag}
                              </span>
                              {req.followUpDate && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '1px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, marginTop: '3px' }}>
                                  <Calendar size={11} color="#1D4ED8" /> Follow-up: {req.followUpDate}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Date */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#17324D', fontSize: '0.84rem', fontWeight: 600 }}>
                            <Calendar size={13} color="#00A6A6" /> {formatDateTime(req)}
                          </div>
                        </td>

                        {/* Fee */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <span style={{ fontWeight: 800, color: '#17324D', fontSize: '0.92rem' }}>
                            ₹{feeAmount}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: statusMeta.bg,
                            color: statusMeta.color,
                            border: `1px solid ${statusMeta.border}`,
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '0.74rem',
                            fontWeight: 800
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusMeta.color }} />
                            {statusMeta.label}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            <Link 
                              to={`/dashboard/doctor/consultation/${targetId}`} 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#FFFFFF',
                                color: '#17324D',
                                border: '1px solid #BFD4E5',
                                padding: '6px 12px',
                                borderRadius: '7px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                boxShadow: '0 1px 3px rgba(7, 26, 51, 0.03)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Eye size={13} color="#00A6A6" /> View
                            </Link>

                            <Link 
                              to={`/dashboard/doctor/consultation/${targetId}/messages`} 
                              state={{ consultationId: targetId }} 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#F0FDFA',
                                color: '#00A6A6',
                                border: '1px solid #99E3D8',
                                padding: '6px 12px',
                                borderRadius: '7px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <MessageSquare size={13} /> Chat
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ padding: '52px 16px', textAlign: 'center' }}>
                      <History size={36} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 800, color: '#17324D' }}>
                        {searchTerm || statusFilter !== 'All' || conditionFilter !== 'All' ? 'No Matching Consultations Found' : 'No Consultation History Yet'}
                      </h4>
                      <p style={{ margin: '0 auto 16px', fontSize: '0.88rem', color: '#64748B', maxWidth: '420px', lineHeight: 1.5 }}>
                        {searchTerm || statusFilter !== 'All' || conditionFilter !== 'All'
                          ? 'Try adjusting your search terms or filter selections to view other past records.'
                          : 'Finalized consultations will appear in this chronological log once completed.'}
                      </p>
                      {(searchTerm || statusFilter !== 'All' || conditionFilter !== 'All') && (
                        <button
                          onClick={() => { setSearchTerm(''); setStatusFilter('All'); setConditionFilter('All'); }}
                          style={{
                            background: '#00A6A6',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 18px',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            cursor: 'pointer'
                          }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default DoctorConsultationHistory;
