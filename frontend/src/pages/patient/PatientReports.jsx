import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  Search, 
  FileStack, 
  Activity, 
  Sparkles, 
  Stethoscope,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  CheckCircle2,
  History,
  Clock
} from 'lucide-react';
import '../Dashboard.css';
import { API_BASE } from '../../config';
import ScanImage from '../../components/ScanImage';
import { hasScanImage } from '../../utils/scanImage';

/**
 * PatientReports
 * Comprehensive Diagnostic Archive for Patient AI Dental Reports
 * - Eliminates 1200px empty space with a clean, centered container (max-width: 1350px)
 * - Solid white high-contrast cards (#FFFFFF) preventing background image bleed-through
 * - Displays authentic intraoral scan photos with fallback protection
 * - Dual view modes: Visual Clinical Card Grid & Compact Structured List
 * - Condition filter chips & certainty sorting
 * - Pagination for effortlessly browsing through extensive report histories
 */
const PatientReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedCertainty, setSelectedCertainty] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const navigate = useNavigate();

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const userStr = localStorage.getItem('dentaai_user');
      if (!userStr) {
        throw new Error('User authentication session not found. Please log in again.');
      }
      const user = JSON.parse(userStr);
      const token = localStorage.getItem('dentaai_token');

      const response = await fetch(`${API_BASE}/api/scans/${user._id || user.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: Failed to fetch medical reports.`);
      }

      const data = await response.json();
      const sorted = Array.isArray(data) 
        ? [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];
      setReports(sorted);
    } catch (err) {
      console.error('Error fetching patient reports:', err);
      setError(err.message || 'An error occurred while loading your diagnostic reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCondition, selectedCertainty, sortBy]);

  const getConfidenceTheme = (score) => {
    const num = Number(score) || 0;
    if (num >= 85) {
      return {
        color: '#10B981',
        bg: '#ECFDF5',
        border: '#A7F3D0',
        label: 'High Certainty'
      };
    }
    if (num >= 65) {
      return {
        color: '#D97706',
        bg: '#FFFBEB',
        border: '#FDE68A',
        label: 'Moderate Certainty'
      };
    }
    return {
      color: '#DC2626',
      bg: '#FEF2F2',
      border: '#FECACA',
      label: 'Preliminary'
    };
  };

  // Conditions list with counts
  const conditionStats = useMemo(() => {
    const counts = {};
    reports.forEach((r) => {
      const cond = r.condition ? r.condition.replace(/_/g, ' ') : 'Unspecified';
      counts[cond] = (counts[cond] || 0) + 1;
    });
    return counts;
  }, [reports]);

  // Filter & Sort
  const filteredAndSortedReports = useMemo(() => {
    return reports
      .filter((report) => {
        const term = searchTerm.toLowerCase().trim();
        const condition = (report.condition || '').toLowerCase().replace(/_/g, ' ');
        const id = (report.scanId || report._id || '').toLowerCase();
        const dateStr = report.createdAt ? new Date(report.createdAt).toLocaleDateString().toLowerCase() : '';
        const matchesSearch = !term || condition.includes(term) || id.includes(term) || dateStr.includes(term);

        const condClean = report.condition ? report.condition.replace(/_/g, ' ') : 'Unspecified';
        const matchesCondition = selectedCondition === 'all' || condClean === selectedCondition;

        const score = Number(report.confidence) || 0;
        let matchesCertainty = true;
        if (selectedCertainty === 'high') matchesCertainty = score >= 85;
        else if (selectedCertainty === 'moderate') matchesCertainty = score >= 65 && score < 85;
        else if (selectedCertainty === 'low') matchesCertainty = score < 65;

        return matchesSearch && matchesCondition && matchesCertainty;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'highest') return (Number(b.confidence) || 0) - (Number(a.confidence) || 0);
        if (sortBy === 'lowest') return (Number(a.confidence) || 0) - (Number(b.confidence) || 0);
        return 0;
      });
  }, [reports, searchTerm, selectedCondition, selectedCertainty, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedReports.length / itemsPerPage) || 1;
  const paginatedReports = filteredAndSortedReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalReports = reports.length;
  const highConfidenceCount = reports.filter(r => r.confidence && Number(r.confidence) >= 85).length;

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
        
        {/* 1. TOP CLINICAL HEADER CARD */}
        <motion.div variants={item} className="screening-header-card">
          <div className="screening-header-stripe"></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="screening-badge">
                <FileText size={13} color="#00A6A6" /> Verified Medical Records
              </span>
              <h2 className="screening-title">My Reports</h2>
              <p className="screening-subtitle">
                Comprehensive diagnostic archive of all AI dental analysis reports, condition evaluations, and verified clinical findings.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link 
                to="/dashboard/patient" 
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
                <Sparkles size={16} /> Start New Scan
              </Link>
            </div>
          </div>
        </motion.div>

        {/* 2. STATS OVERVIEW CARDS (Solid White, High Contrast) */}
        <motion.div variants={item} className="screening-stats-grid">
          
          <div className="screening-stat-card" style={{ borderTop: '3px solid #1677FF' }}>
            <div className="screening-stat-left">
              <div className="screening-stat-icon" style={{ background: '#EBF5FF', color: '#1677FF' }}>
                <FileText size={24} />
              </div>
              <div>
                <div className="screening-stat-value">{totalReports}</div>
                <div className="screening-stat-label">Total Reports</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1677FF', background: '#EBF5FF', padding: '3px 9px', borderRadius: '999px' }}>
              All Scans
            </span>
          </div>

          <div className="screening-stat-card" style={{ borderTop: '3px solid #10B981' }}>
            <div className="screening-stat-left">
              <div className="screening-stat-icon" style={{ background: '#DCFCE7', color: '#10B981' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="screening-stat-value">{highConfidenceCount}</div>
                <div className="screening-stat-label">High Certainty (&ge;85%)</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10B981', background: '#DCFCE7', padding: '3px 9px', borderRadius: '999px' }}>
              Validated
            </span>
          </div>

          <div className="screening-stat-card" style={{ borderTop: '3px solid #00A6A6' }}>
            <div className="screening-stat-left">
              <div className="screening-stat-icon" style={{ background: '#E6FFFA', color: '#00A6A6' }}>
                <Stethoscope size={24} />
              </div>
              <div>
                <div className="screening-stat-value" style={{ fontSize: '1.25rem', marginTop: '2px' }}>Dentist Review</div>
                <Link to="/dashboard/patient/recommended-doctors" style={{ fontSize: '0.8rem', color: '#00A6A6', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  Find Specialists &rarr;
                </Link>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#00A6A6', background: '#E6FFFA', padding: '3px 9px', borderRadius: '999px' }}>
              Specialist Care
            </span>
          </div>

        </motion.div>

        {/* 3. INTERACTIVE SEARCH, FILTERS & CONTROLS BAR */}
        <motion.div variants={item} className="screening-controls-card">
          
          <div className="screening-controls-top">
            
            {/* Search Input */}
            <div className="screening-search-box">
              <Search size={18} color="#00A6A6" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text"
                placeholder="Search reports by condition, scan ID, or date..."
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

            {/* Actions: Sort & View Toggle */}
            <div className="screening-actions-group">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="screening-sort-select"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="highest">Sort: Highest Score</option>
                <option value="lowest">Sort: Lowest Score</option>
              </select>

              {/* Grid / List Switcher */}
              <div className="screening-view-toggle">
                <button 
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                >
                  <LayoutGrid size={15} /> Grid
                </button>
                <button 
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                >
                  <List size={15} /> List
                </button>
              </div>
            </div>

          </div>

          {/* Condition Filter Chips Bar */}
          <div className="screening-chips-bar">
            <button 
              type="button"
              onClick={() => setSelectedCondition('all')}
              className={`screening-chip ${selectedCondition === 'all' ? 'active' : ''}`}
            >
              All Conditions ({totalReports})
            </button>

            {Object.entries(conditionStats).map(([condName, count]) => (
              <button 
                key={condName}
                type="button"
                onClick={() => setSelectedCondition(condName)}
                className={`screening-chip ${selectedCondition === condName ? 'active' : ''}`}
              >
                {condName} ({count})
              </button>
            ))}

            <button 
              type="button"
              onClick={() => setSelectedCertainty(selectedCertainty === 'high' ? 'all' : 'high')}
              className={`screening-chip ${selectedCertainty === 'high' ? 'active' : ''}`}
              style={selectedCertainty === 'high' ? { borderColor: '#10B981', color: '#10B981', background: '#ECFDF5' } : {}}
            >
              <CheckCircle2 size={12} color={selectedCertainty === 'high' ? '#10B981' : '#64748B'} />
              High Confidence (&ge;85%)
            </button>
          </div>

          {/* Count and Clear filters bar */}
          <div className="screening-count-bar">
            <span>
              Showing <strong>{filteredAndSortedReports.length}</strong> of <strong>{totalReports}</strong> diagnostic reports
            </span>
            {(searchTerm || selectedCondition !== 'all' || selectedCertainty !== 'all' || sortBy !== 'newest') && (
              <button 
                type="button" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCondition('all');
                  setSelectedCertainty('all');
                  setSortBy('newest');
                }}
                style={{ background: 'transparent', border: 'none', color: '#00A6A6', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Reset Filters &times;
              </button>
            )}
          </div>

        </motion.div>

        {/* 4. LOADING STATE */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #BFD4E5' }}>
            <Activity className="spin-anim" size={42} color="#00A6A6" />
            <p style={{ marginTop: '16px', color: '#17324D', fontWeight: 700, fontSize: '1rem' }}>
              Retrieving diagnostic reports archive...
            </p>
          </div>
        )}

        {/* 5. ERROR STATE */}
        {!loading && error && (
          <motion.div variants={item} className="card" style={{ padding: '36px', textAlign: 'center', background: '#FFFFFF', border: '1px solid #FECACA', borderRadius: '20px' }}>
            <AlertTriangle size={42} color="#DC2626" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ color: '#17324D', fontWeight: 800, margin: '0 0 8px 0' }}>Could Not Load Reports</h3>
            <p style={{ color: '#B91C1C', maxWidth: '500px', margin: '0 auto 20px', fontSize: '0.92rem' }}>{error}</p>
            <button 
              onClick={fetchReports} 
              className="btn btn-outline" 
              style={{ padding: '10px 22px', borderRadius: '12px', fontWeight: 700, borderColor: '#00A6A6', color: '#00A6A6' }}
            >
              Retry Connection
            </button>
          </motion.div>
        )}

        {/* 6. EMPTY STATE */}
        {!loading && !error && reports.length === 0 && (
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
              <FileStack size={32} />
            </div>
            <h3 style={{ color: '#17324D', fontWeight: 800, fontSize: '1.4rem', margin: '0 0 8px 0' }}>No Reports Yet</h3>
            <p style={{ color: '#52677A', fontSize: '0.98rem', maxWidth: '460px', margin: '0 auto 24px', lineHeight: 1.5 }}>
              Upload an intraoral dental photo on your dashboard to perform an AI scan. Your results, confidence evaluations, and verified clinical reports will automatically appear here.
            </p>
            <Link 
              to="/dashboard/patient" 
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
              Start Your First Scan
            </Link>
          </motion.div>
        )}

        {/* 7. NO SEARCH / FILTER MATCHES */}
        {!loading && !error && reports.length > 0 && filteredAndSortedReports.length === 0 && (
          <motion.div variants={item} className="card text-center" style={{ padding: '50px 20px', background: '#FFFFFF', border: '1px solid #BFD4E5', borderRadius: '20px' }}>
            <FileStack size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ color: '#17324D', fontWeight: 800, margin: '0 0 6px 0', fontSize: '1.15rem' }}>No matching reports</h4>
            <p style={{ color: '#52677A', margin: '0 0 16px 0', fontSize: '0.92rem' }}>
              No diagnostic records matched your search "{searchTerm}" or active condition filter.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCondition('all');
                setSelectedCertainty('all');
              }}
              className="btn btn-outline btn-sm font-bold"
              style={{ borderRadius: '10px', padding: '8px 18px', color: '#00A6A6', borderColor: '#00A6A6' }}
            >
              Clear Search & Filter
            </button>
          </motion.div>
        )}

        {/* 8. REPORT RECORDS DISPLAY: GRID VIEW */}
        {!loading && !error && filteredAndSortedReports.length > 0 && viewMode === 'grid' && (
          <motion.div variants={stagger} className="screening-records-grid">
            {paginatedReports.map((scan) => {
              const dateObj = new Date(scan.createdAt);
              const confTheme = getConfidenceTheme(scan.confidence);
              const reportId = scan._id || scan.scanId || scan.id;

              return (
                <motion.div
                  key={reportId}
                  variants={item}
                  className="screening-grid-card"
                >
                  {/* Card Header: Condition & Scan ID */}
                  <div className="grid-card-header">
                    <span className="grid-condition-badge">
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: confTheme.color, boxShadow: `0 0 0 2px ${confTheme.color}33` }}></span>
                      {scan.condition ? scan.condition.replace(/_/g, ' ') : 'General Checkup'}
                    </span>
                    <span className="grid-scan-id-tag">
                      {scan.scanId ? scan.scanId : `P-${reportId.toString().substring(0, 6)}`}
                    </span>
                  </div>

                  {/* Thumbnail / Image Preview */}
                  <div className="grid-card-thumbnail-wrap">
                    {hasScanImage(scan.imagePath) ? (
                      <ScanImage
                        imagePath={scan.imagePath}
                        alt={scan.condition ? `${scan.condition.replace(/_/g, ' ')} Intraoral Scan` : 'Intraoral Dental Scan'}
                        className="grid-card-thumbnail"
                        fallback={
                          <div className="grid-card-thumb-placeholder">
                            <History size={30} color="#00A6A6" />
                            <span>Intraoral Dental Scan</span>
                          </div>
                        }
                      />
                    ) : (
                      <div className="grid-card-thumb-placeholder">
                        <History size={30} color="#00A6A6" />
                        <span>Intraoral Dental Scan</span>
                      </div>
                    )}
                  </div>

                  {/* Captured Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                    <Calendar size={13} color="#00A6A6" />
                    <span>{dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* AI Confidence Meter Box */}
                  <div className="grid-confidence-box">
                    <div className="grid-conf-row">
                      <span className="grid-conf-label">AI Neural Score</span>
                      <span className="grid-conf-score" style={{ color: confTheme.color }}>
                        {Number(scan.confidence || 0).toFixed(1)}%
                      </span>
                    </div>

                    <div className="grid-conf-meter">
                      <div 
                        className="grid-conf-meter-bar"
                        style={{ 
                          width: `${Math.min(100, Math.max(0, Number(scan.confidence) || 0))}%`,
                          background: confTheme.color 
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                      <span style={{ color: confTheme.color, fontWeight: 800 }}>{confTheme.label}</span>
                      <span>Verified Model</span>
                    </div>
                  </div>

                  {/* Recommendation Snippet */}
                  {scan.recommendation && (
                    <div className="grid-rec-snippet">
                      <span style={{ fontWeight: 700, color: '#00A6A6' }}>Clinical Note: </span>
                      {scan.recommendation}
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="grid-actions-row">
                    <Link
                      to={`/dashboard/patient/reports/${reportId}`}
                      className="screening-btn-primary"
                    >
                      <Eye size={14} />
                      <span>View Report</span>
                    </Link>

                    <Link
                      to={`/dashboard/patient/recommended-doctors?condition=${encodeURIComponent(scan.condition || '')}`}
                      state={{ predictionResult: scan }}
                      className="screening-btn-secondary"
                    >
                      <Stethoscope size={14} color="#00A6A6" />
                      <span>Consult</span>
                    </Link>
                  </div>

                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* 9. REPORT RECORDS DISPLAY: LIST VIEW */}
        {!loading && !error && filteredAndSortedReports.length > 0 && viewMode === 'list' && (
          <motion.div variants={stagger} className="screening-records-list">
            {paginatedReports.map((scan) => {
              const dateObj = new Date(scan.createdAt);
              const confTheme = getConfidenceTheme(scan.confidence);
              const reportId = scan._id || scan.scanId || scan.id;

              return (
                <motion.div
                  key={reportId}
                  variants={item}
                  className="screening-list-item"
                >
                  {/* Left: Thumbnail & Condition Details */}
                  <div className="list-item-left">
                    {hasScanImage(scan.imagePath) ? (
                      <ScanImage 
                        imagePath={scan.imagePath} 
                        alt={scan.condition || 'Scan'} 
                        className="list-thumb-mini"
                        fallback={
                          <div className="list-thumb-mini list-thumb-placeholder">
                            <History size={20} color="#00A6A6" />
                          </div>
                        }
                      />
                    ) : (
                      <div className="list-thumb-mini list-thumb-placeholder">
                        <History size={20} color="#00A6A6" />
                      </div>
                    )}

                    <div>
                      <h4 className="list-condition-title">
                        {scan.condition ? scan.condition.replace(/_/g, ' ') : 'Intraoral Scan'}
                      </h4>
                      <div className="list-meta-row">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} color="#00A6A6" />
                          {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span>•</span>
                        <span>ID: <strong style={{ color: '#17324D' }}>{scan.scanId || `P-${reportId.toString().substring(0, 6)}`}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Confidence Meter */}
                  <div className="list-item-mid">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '4px' }}>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>AI Score</span>
                        <strong style={{ color: confTheme.color }}>{Number(scan.confidence || 0).toFixed(1)}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, Math.max(0, Number(scan.confidence) || 0))}%`, height: '100%', background: confTheme.color, borderRadius: '999px' }}></div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: confTheme.color, background: confTheme.bg, border: `1px solid ${confTheme.border}`, padding: '3px 9px', borderRadius: '999px', flexShrink: 0 }}>
                      {confTheme.label}
                    </span>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="list-item-right">
                    <Link
                      to={`/dashboard/patient/reports/${reportId}`}
                      className="screening-btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                    >
                      <span>View Report</span>
                      <ArrowRight size={14} />
                    </Link>

                    <Link
                      to={`/dashboard/patient/recommended-doctors?condition=${encodeURIComponent(scan.condition || '')}`}
                      state={{ predictionResult: scan }}
                      className="screening-btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                    >
                      <Stethoscope size={14} color="#00A6A6" />
                      <span>Consult</span>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* 10. PAGINATION BAR */}
        {!loading && !error && filteredAndSortedReports.length > itemsPerPage && (
          <div className="screening-pagination-bar">
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

      </div>
    </motion.div>
  );
};

export default PatientReports;
