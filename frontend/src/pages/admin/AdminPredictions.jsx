import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  BrainCircuit, Activity, Search, ArrowLeft, X, 
  Calendar, CheckCircle2, Clock, Sparkles, Filter, 
  Layers, User, Eye, ShieldCheck, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';
import { API_BASE } from '../../config';

const CONDITION_COLORS = {
  gingivitis: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', dot: '#10B981' },
  caries: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', dot: '#EF4444' },
  calculus: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', dot: '#F59E0B' },
  hypodontia: { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE', dot: '#6366F1' },
  mouth_ulcer: { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8', dot: '#EC4899' },
  'mouth ulcer': { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8', dot: '#EC4899' },
  tooth_discoloration: { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE', dot: '#8B5CF6' },
  'tooth discoloration': { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE', dot: '#8B5CF6' }
};

const AdminPredictions = () => {
  const [scans, setScans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Verified' | 'Pending'

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const token = localStorage.getItem('dentaai_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/api/scans/all`, { headers });
        if (res.ok) {
          const data = await res.json();
          setScans(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch scans:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchScans();
  }, []);

  const stats = useMemo(() => {
    let verified = 0;
    let highConf = 0;
    let pending = 0;

    scans.forEach(s => {
      const conf = Number(s.confidence) || 0;
      if (conf >= 90) highConf++;
      if (s.isVerified || conf <= 80 || s.status === 'Verified') verified++;
      else pending++;
    });

    return {
      total: scans.length,
      verified,
      highConf,
      pending
    };
  }, [scans]);

  const filteredScans = useMemo(() => {
    return scans.filter(scan => {
      const q = search.toLowerCase().trim();
      const sId = (scan.scanId || scan._id || '').toLowerCase();
      const cond = (scan.condition || '').toLowerCase();
      const pId = (scan.patientId || '').toLowerCase();

      const matchesSearch = !q || sId.includes(q) || cond.includes(q) || pId.includes(q);
      const matchesCond = conditionFilter === 'All' || cond.replace('_', ' ').includes(conditionFilter.toLowerCase());
      
      const conf = Number(scan.confidence) || 0;
      const isScanVerified = scan.isVerified || conf <= 80 || scan.status === 'Verified';
      const matchesStatus = statusFilter === 'All' || 
        (statusFilter === 'Verified' && isScanVerified) || 
        (statusFilter === 'Pending' && !isScanVerified);

      return matchesSearch && matchesCond && matchesStatus;
    });
  }, [scans, search, conditionFilter, statusFilter]);

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
                <BrainCircuit size={14} /> Global Diagnostic Telemetry
              </div>
              <h1 className="screening-title">System Predictions Log</h1>
              <p className="screening-subtitle">
                Comprehensive audit ledger of all dental AI diagnostic inferences, pathology classifications, and confidence thresholds.
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
                Real-Time Neural Telemetry
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. TOP 4 MASTER KPI SUMMARY STRIP (100% EQUAL & BALANCED) */}
        <motion.div variants={item} className="doctor-kpi-grid" style={{ marginBottom: '24px' }}>
          
          {/* Card 1: Total Scans */}
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
              <BrainCircuit size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                {stats.total}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Total Scans Inferred
              </div>
            </div>
          </div>

          {/* Card 2: Verified Scans */}
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
                {stats.verified}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                Clinically Confirmed
              </div>
            </div>
          </div>

          {/* Card 3: High Confidence Scans */}
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
              <Sparkles size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#17324D', lineHeight: 1.1 }}>
                {stats.highConf}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                High Confidence (&gt;90%)
              </div>
            </div>
          </div>

          {/* Card 4: Awaiting Specialist Review */}
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
                Awaiting Clinical Review
              </div>
            </div>
          </div>

        </motion.div>

        {/* 3. MASTER PREDICTIONS LOG CARD */}
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
          {/* Controls: Search and Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '24px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              
              {/* Search */}
              <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  placeholder="Search by Scan ID, condition, or patient UID..."
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

              {/* Status Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Status:
                </span>
                {['All', 'Verified', 'Pending'].map(st => {
                  const isActive = statusFilter === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: '1px solid',
                        background: isActive 
                          ? (st === 'Verified' ? '#ECFDF5' : st === 'Pending' ? '#FFFBEB' : '#17324D')
                          : '#FFFFFF',
                        color: isActive 
                          ? (st === 'Verified' ? '#059669' : st === 'Pending' ? '#B45309' : '#FFFFFF')
                          : '#64748B',
                        borderColor: isActive 
                          ? (st === 'Verified' ? '#A7F3D0' : st === 'Pending' ? '#FDE68A' : '#17324D')
                          : '#CBD5E1',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {st === 'All' ? `All (${scans.length})` : st === 'Verified' ? `Verified (${stats.verified})` : `Pending (${stats.pending})`}
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Condition Filter Badges Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Condition:
              </span>
              {['All', 'Gingivitis', 'Caries', 'Calculus', 'Hypodontia', 'Mouth Ulcer', 'Discoloration'].map(cond => {
                const isActive = conditionFilter === cond;
                return (
                  <button
                    key={cond}
                    onClick={() => setConditionFilter(cond)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid',
                      background: isActive ? '#17324D' : '#F8FAFC',
                      color: isActive ? '#FFFFFF' : '#475569',
                      borderColor: isActive ? '#17324D' : '#E2E8F0',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cond}
                  </button>
                );
              })}

              <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
                Showing <strong style={{ color: '#17324D' }}>{filteredScans.length}</strong> inferences
              </span>
            </div>

          </div>

          {/* Table Container */}
          {isLoading ? (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
              <Activity className="spin-anim" size={38} color="#00A6A6" style={{ margin: '0 auto 16px' }} />
              <p style={{ margin: 0, color: '#64748B', fontWeight: 600, fontSize: '0.95rem' }}>
                Loading neural net diagnostic telemetry...
              </p>
            </div>
          ) : (
            <div className="table-scroll-container" style={{ maxHeight: '620px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
              <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      Scan Identifier
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      Patient UID
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      Condition Inferred
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      Confidence Metric
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      Inference Date
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2 }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScans.length > 0 ? (
                    filteredScans.map(scan => {
                      const conf = Number(scan.confidence) || 0;
                      const isVerified = scan.isVerified || conf <= 80 || scan.status === 'Verified';
                      const cleanCond = (scan.condition || 'General Observation').toLowerCase();
                      const condTheme = CONDITION_COLORS[cleanCond] || { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', dot: '#94A3B8' };

                      return (
                        <tr 
                          key={scan._id || scan.scanId} 
                          style={{ 
                            borderBottom: '1px solid #F1F5F9',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          {/* Scan ID */}
                          <td style={{ padding: '14px 18px' }}>
                            <span 
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '0.84rem',
                                fontWeight: 800,
                                color: '#1E40AF',
                                background: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                padding: '4px 10px',
                                borderRadius: '8px'
                              }}
                            >
                              {scan.scanId || (scan._id ? `SCAN-${scan._id.slice(-8).toUpperCase()}` : 'SCAN-0000')}
                            </span>
                          </td>

                          {/* Patient */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem', fontWeight: 800 }}>
                                <User size={14} />
                              </div>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
                                {scan.patientId ? `${scan.patientId.substring(0, 8)}...` : 'Unknown'}
                              </span>
                            </div>
                          </td>

                          {/* Condition */}
                          <td style={{ padding: '14px 18px' }}>
                            <span 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: condTheme.bg,
                                color: condTheme.text,
                                border: `1px solid ${condTheme.border}`,
                                borderRadius: '8px',
                                padding: '4px 10px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                textTransform: 'capitalize'
                              }}
                            >
                              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: condTheme.dot }} />
                              {scan.condition?.replace('_', ' ') || 'Normal'}
                            </span>
                          </td>

                          {/* Confidence */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '160px' }}>
                              <div style={{ flex: 1, height: '8px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                                <div 
                                  style={{ 
                                    width: `${Math.min(conf, 100)}%`, 
                                    height: '100%', 
                                    background: conf >= 90 ? '#2563EB' : conf >= 75 ? '#00A6A6' : '#D97706',
                                    borderRadius: '999px'
                                  }} 
                                />
                              </div>
                              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#17324D', minWidth: '46px' }}>
                                {conf.toFixed(1)}%
                              </span>
                            </div>
                          </td>

                          {/* Date */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={13} color="#94A3B8" />
                              <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                                {scan.createdAt ? new Date(scan.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
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
                                background: isVerified ? '#ECFDF5' : '#EFF6FF',
                                color: isVerified ? '#059669' : '#2563EB',
                                border: `1px solid ${isVerified ? '#A7F3D0' : '#BFDBFE'}`,
                                borderRadius: '8px',
                                padding: '4px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 700
                              }}
                            >
                              <div 
                                style={{ 
                                  width: '6px', 
                                  height: '6px', 
                                  borderRadius: '50%', 
                                  background: isVerified ? '#10B981' : '#3B82F6',
                                  boxShadow: isVerified ? '0 0 6px #10B981' : 'none'
                                }} 
                              />
                              {isVerified ? 'Verified' : 'Pending Verification'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                        <BrainCircuit size={40} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800, color: '#17324D' }}>
                          No predictions found
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>
                          No diagnostic inferences match your search query "{search}".
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

export default AdminPredictions;