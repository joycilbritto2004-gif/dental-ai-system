import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Activity, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon, 
  HeartPulse,
  Stethoscope,
  Sparkles,
  Info,
  UserCheck,
  Camera,
  Check
} from 'lucide-react';
import PrecautionsSection from '../../components/PrecautionsSection';
import PersonalPrescriptionSection from '../../components/PersonalPrescriptionSection';
import { getCareSuggestions } from '../../utils/careSuggestions';
import '../Dashboard.css';
import { API_BASE } from '../../config';
import ScanImage from '../../components/ScanImage';
import { hasScanImage } from '../../utils/scanImage';

const PatientReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchReportDetails = async () => {
      try {
        const userStr = localStorage.getItem('dentaai_user');
        if (!userStr) {
          throw new Error('User not found');
        }
        const user = JSON.parse(userStr);
        const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        let specificReport = null;

        // 1. Fetch from patient scan history list
        try {
          const response = await fetch(`${API_BASE}/api/scans/${user._id || user.id}`, { headers });
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              specificReport = data.find(scan => scan._id === id || scan.scanId === id);
            }
          }
        } catch (fetchErr) {
          console.warn('Patient scan list fetch failed, trying direct detail endpoint:', fetchErr);
        }

        // 2. Fallback to direct scan detail endpoint
        if (!specificReport) {
          const detailRes = await fetch(`${API_BASE}/api/scans/detail/${id}`, { headers });
          if (detailRes.ok) {
            specificReport = await detailRes.json();
          }
        }
        
        if (!specificReport) {
          throw new Error('Report not found');
        }
        
        setReport(specificReport);
      } catch (err) {
        console.error('Error fetching report details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();
  }, [id]);

  useEffect(() => {
    setImageError(false);
  }, [id, report?.imagePath]);

  // Clinical Verification Status helper (NEVER uses AI confidence to determine verification)
  const getClinicalStatusInfo = (scan) => {
    const rawStatus = scan?.status || 'Pending';
    switch (rawStatus) {
      case 'Verified':
        return {
          key: 'Verified',
          text: 'Doctor Verified',
          color: 'success',
          icon: <ShieldCheck size={18} />,
          badgeStyle: {
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#059669',
            border: '1px solid rgba(16, 185, 129, 0.35)'
          }
        };
      case 'Needs Rescan':
        return {
          key: 'Needs Rescan',
          text: 'Needs Rescan',
          color: 'warning',
          icon: <AlertTriangle size={18} />,
          badgeStyle: {
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#D97706',
            border: '1px solid rgba(245, 158, 11, 0.35)'
          }
        };
      case 'Rejected':
        return {
          key: 'Rejected',
          text: 'Review Declined',
          color: 'danger',
          icon: <AlertCircle size={18} />,
          badgeStyle: {
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#DC2626',
            border: '1px solid rgba(239, 68, 68, 0.35)'
          }
        };
      case 'Pending':
      default:
        return {
          key: 'Pending',
          text: 'Awaiting Doctor Review',
          color: 'warning',
          icon: <Clock size={18} />,
          badgeStyle: {
            background: 'rgba(217, 119, 6, 0.12)',
            color: '#B45309',
            border: '1px solid rgba(217, 119, 6, 0.35)'
          }
        };
    }
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return null;
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return null;
    const dateStr = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${dateStr} at ${timeStr}`;
  };

  const getDoctorDisplayName = (verifiedBy) => {
    if (!verifiedBy) return null;
    if (typeof verifiedBy === 'object' && verifiedBy.name) {
      const trimmedName = String(verifiedBy.name).trim();
      return trimmedName || null;
    }
    if (typeof verifiedBy === 'string' && verifiedBy.trim()) {
      if (/^[a-fA-F0-9]{24}$/.test(verifiedBy)) {
        return null; // Omit raw ObjectId string rather than inventing or showing hash
      }
      return verifiedBy.trim() || null;
    }
    return null;
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  if (loading) {
    return (
      <div className="dashboard-view" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Activity className="spin-anim" size={40} color="var(--secondary)" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="dashboard-view">
        <button className="btn btn-outline mb-6" onClick={() => navigate('/dashboard/patient/reports')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> Back to Reports
        </button>
        <div className="report-glass-card text-center" style={{ padding: '40px' }}>
          <AlertTriangle size={48} className="text-danger mb-4" style={{ margin: '0 auto' }} />
          <h3 className="mb-2">Error Loading Report</h3>
          <p className="text-muted">{error || 'Report not found'}</p>
        </div>
      </div>
    );
  }

  const dateObj = new Date(report.createdAt || Date.now());
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const clinicalStatus = getClinicalStatusInfo(report);
  const hasImage = hasScanImage(report.imagePath) && !imageError;
  const verifiedDoctorName = getDoctorDisplayName(report.verifiedBy);
  const verifiedAtFormatted = formatDateTime(report.verifiedAt);
  const careData = getCareSuggestions(report.finalDiagnosis || report.condition);

  // Original AI fields (strictly unmutated)
  const originalAiCondition = report.condition || report.predictedCondition || 'Unknown Condition';
  const rawConfidence = report.confidence !== null && report.confidence !== undefined && !isNaN(Number(report.confidence))
    ? Number(report.confidence)
    : null;

  return (
    <motion.div 
      className="dashboard-view report-details-page-wrapper"
      initial="hidden"
      animate="show"
      variants={stagger}
      style={{ paddingBottom: '36px' }}
    >
      <div className="report-page-container">
        
        {/* Page Header Card */}
        <motion.div variants={item} className="page-header-card report-page-header" style={{ padding: '24px 32px', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.75)', boxShadow: '0 8px 32px rgba(10, 25, 48, 0.07)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '45%', background: 'radial-gradient(circle at top right, rgba(0, 166, 166, 0.15), transparent 70%)', pointerEvents: 'none' }}></div>
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div className="report-header-nav-row flex-between mb-3">
              <button 
                className="btn btn-outline report-back-btn" 
                onClick={() => navigate(-1)} 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '999px', fontWeight: 700, background: 'rgba(255, 255, 255, 0.85)', border: '1px solid #BFD4E5', color: '#17324D' }}
              >
                <ArrowLeft size={16} /> Back to Dashboard
              </button>
              <div className="report-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span 
                  className="clinical-status-pill" 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    padding: '7px 16px', 
                    borderRadius: '10px', 
                    fontSize: '0.9rem', 
                    fontWeight: 700,
                    ...clinicalStatus.badgeStyle
                  }}
                >
                  {clinicalStatus.icon} {clinicalStatus.text}
                </span>
                <button 
                  className="btn btn-primary report-pdf-btn" 
                  onClick={() => window.print()} 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '999px', fontWeight: 700, background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)', boxShadow: '0 4px 15px rgba(0, 166, 166, 0.3)' }}
                >
                  <FileText size={16} /> Download PDF
                </button>
              </div>
            </div>
            <div className="report-header-title-row flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 className="report-header-title font-extrabold" style={{ color: '#17324D', letterSpacing: '-0.5px', fontSize: '2.1rem', lineHeight: '1.2', margin: '0 0 4px 0' }}>
                  Clinical Diagnostic Report
                </h2>
                <p className="report-header-sub font-medium" style={{ color: '#40566F', fontSize: '0.98rem', margin: 0 }}>
                  Intraoral dental scan analysis & clinical assessment summary
                </p>
              </div>
              <div className="report-header-date" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.75)', padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(191, 212, 229, 0.6)', fontSize: '0.85rem', color: '#52677A' }}>
                <Calendar size={15} color="#00A6A6" /> {formattedDate} at {formattedTime}
              </div>
            </div>
          </div>
        </motion.div>

        {/* =========================================================================
            SECTION 1: AI PRELIMINARY SCREENING
            (Clearly separated, displays AI predictions, scores, 6-class breakdown,
             uploaded image, and preliminary screening disclaimer)
           ========================================================================= */}
        <motion.div 
          variants={item} 
          className="report-glass-card"
          style={{
            padding: '30px 32px',
            borderRadius: '24px',
            border: '1.5px solid #BFD4E5',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(246, 250, 254, 0.95) 100%)',
            boxShadow: '0 10px 32px rgba(10, 25, 48, 0.06)'
          }}
        >
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1.5px solid #E2E8F0', paddingBottom: '18px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(0, 166, 166, 0.12)', color: '#00A6A6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#17324D', letterSpacing: '-0.3px' }}>
                  Section 1: AI Preliminary Screening
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.88rem', color: '#64748B', fontWeight: 500 }}>
                  Automated computer-vision analysis • MobileNetV2 Deep Learning Model
                </p>
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#007A78', fontWeight: 700, background: 'rgba(0, 166, 166, 0.1)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(0, 166, 166, 0.25)' }}>
              Preliminary Screening Only
            </span>
          </div>

          {/* AI Screening Content: 2-Column Responsive Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 400px) 1fr', gap: '28px', alignItems: 'start' }} className="ai-screening-grid">
            
            {/* Left: Uploaded Dental Image + Metadata */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="scan-image-viewer" style={{ border: '1.5px solid #BFD4E5', borderRadius: '16px' }}>
                {hasImage ? (
                  <ScanImage
                    imagePath={report.imagePath}
                    alt={`Dental Scan - ${originalAiCondition}`}
                    className="scan-image-img"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="scan-image-empty-state">
                    <div className="scan-image-empty-icon">
                      <ImageIcon size={34} strokeWidth={1.8} />
                    </div>
                    <p className="scan-image-empty-title">No scan image available</p>
                    <p className="scan-image-empty-sub">Original image reference was not recorded or is inaccessible</p>
                  </div>
                )}
              </div>

              <div className="report-metadata-list">
                <div className="report-metadata-row">
                  <span className="report-metadata-label">
                    <Calendar size={15} color="#00A6A6" /> Date Captured
                  </span>
                  <span className="report-metadata-value" style={{ fontSize: '0.88rem' }}>
                    {formattedDate}
                  </span>
                </div>
                <div className="report-metadata-row">
                  <span className="report-metadata-label">
                    <FileText size={15} color="#00A6A6" /> Scan Reference ID
                  </span>
                  <span className="report-metadata-value" style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                    {report.scanId || report._id}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: AI Prediction, Confidence, 6-Class Probabilities, Note */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Primary Detected Condition */}
              <div style={{ background: '#FFFFFF', padding: '20px 22px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 800, color: '#52677A', display: 'block', marginBottom: '6px' }}>
                  AI-Detected Primary Condition
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#17324D', margin: 0, textTransform: 'capitalize' }}>
                    {originalAiCondition.replace(/_/g, ' ')}
                  </h2>
                  {rawConfidence !== null && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00A6A6', background: 'rgba(0, 166, 166, 0.1)', padding: '5px 14px', borderRadius: '10px', border: '1px solid rgba(0, 166, 166, 0.25)', display: 'inline-block' }}>
                        {rawConfidence.toFixed(1)}% Match
                      </span>
                    </div>
                  )}
                </div>

                {/* Model Score Progress Bar */}
                {rawConfidence !== null && (
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                      <span>Model Statistical Match Probability</span>
                      <span style={{ color: '#D97706', fontWeight: 700 }}>* Screening score • Not clinical confirmation</span>
                    </div>
                    <div className="confidence-progress-track" style={{ height: '8px' }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, rawConfidence))}%` }}
                        transition={{ duration: 0.9, delay: 0.2 }}
                        className="confidence-progress-fill"
                        style={{ background: 'linear-gradient(90deg, #00A6A6 0%, #06C6E8 100%)' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Six-Class Classification Probabilities */}
              {report.classProbabilities && typeof report.classProbabilities === 'object' && Object.keys(report.classProbabilities).length > 0 ? (
                <div style={{ background: '#FFFFFF', padding: '18px 22px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#52677A', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                      Six-Class Classification Probabilities
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                      Full multi-class distribution
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(report.classProbabilities)
                      .sort(([, a], [, b]) => Number(b) - Number(a))
                      .map(([name, prob]) => {
                        const isTop = name.toLowerCase() === originalAiCondition.replace(/_/g, ' ').toLowerCase() || name === originalAiCondition;
                        const numProb = Number(prob) || 0;
                        return (
                          <div 
                            key={name}
                            style={{
                              background: isTop ? 'rgba(0, 166, 166, 0.07)' : '#F8FAFC',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: isTop ? '1.5px solid #00A6A6' : '1px solid #E2E8F0'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.84rem', fontWeight: isTop ? 800 : 600, color: '#17324D' }}>
                                {name.replace(/_/g, ' ')} {isTop && <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#FFFFFF', background: '#00A6A6', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px' }}>Top Score</span>}
                              </span>
                              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: isTop ? '#00A6A6' : '#52677A' }}>
                                {numProb.toFixed(2)}%
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '5px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                              <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${Math.min(100, Math.max(0, numProb))}%` }} 
                                transition={{ duration: 0.8 }} 
                                style={{ height: '100%', background: isTop ? '#00A6A6' : '#94A3B8', borderRadius: '3px' }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: '12px', border: '1px dashed #CBD5E1', fontSize: '0.84rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={16} color="#64748B" style={{ flexShrink: 0 }} />
                  <span>Six-class probability distribution was not recorded for this historical scan.</span>
                </div>
              )}

              {/* AI Preliminary Guidance Callout */}
              {report.recommendation && (
                <div className="ai-preliminary-card">
                  <div className="ai-preliminary-header">
                    <Sparkles size={15} />
                    <span>AI Preliminary Guidance</span>
                  </div>
                  <p className="ai-preliminary-text">{report.recommendation}</p>
                </div>
              )}

              {/* Preliminary Screening Disclaimer */}
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h5 style={{ margin: '0 0 3px 0', fontSize: '0.86rem', fontWeight: 800, color: '#92400E' }}>
                    AI Screening Disclaimer
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#78350F', lineHeight: 1.5 }}>
                    This automated assessment was generated by a deep-learning algorithm for preliminary triage. It does not constitute a definitive medical diagnosis, prescription, or clinical treatment directive. Clinical evaluation by an authorized licensed dental practitioner is required.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </motion.div>

        {/* =========================================================================
            SECTION 2: DOCTOR-VERIFIED CLINICAL ASSESSMENT
            (Clearly separated, displays Final Diagnosis, Secondary Findings,
             Doctor Notes, Treatment Plan, Verifying Doctor, Verification Timestamp,
             or safe "Awaiting Doctor Review" state without fabricated data)
           ========================================================================= */}
        <motion.div 
          variants={item} 
          className="report-glass-card"
          style={{
            padding: '30px 32px',
            borderRadius: '24px',
            border: report.status === 'Verified' ? '2px solid #10B981' : (report.status === 'Needs Rescan' ? '2px solid #F59E0B' : (report.status === 'Rejected' ? '2px solid #EF4444' : '1.5px solid #F59E0B')),
            background: report.status === 'Verified' ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 253, 249, 0.95) 100%)' : '#FFFFFF',
            boxShadow: '0 10px 32px rgba(10, 25, 48, 0.06)'
          }}
        >
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1.5px solid #E2E8F0', paddingBottom: '18px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: report.status === 'Verified' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: report.status === 'Verified' ? '#059669' : '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#17324D', letterSpacing: '-0.3px' }}>
                  Section 2: Doctor-Verified Clinical Assessment
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.88rem', color: '#64748B', fontWeight: 500 }}>
                  Official evaluation & clinical treatment directives by an authorized licensed dentist
                </p>
              </div>
            </div>

            <span 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '6px 16px', 
                borderRadius: '8px', 
                fontSize: '0.88rem', 
                fontWeight: 700,
                ...clinicalStatus.badgeStyle
              }}
            >
              {clinicalStatus.icon} {clinicalStatus.text}
            </span>
          </div>

          {/* =====================================================================
              CASE A: STATUS IS VERIFIED
              Displays Final Diagnosis, Secondary Findings, Doctor Notes,
              Treatment Plan, Verifying Doctor, and Verification Date
             ===================================================================== */}
          {report.status === 'Verified' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              
              {/* Verifying Doctor Credentials Header Banner */}
              <div style={{ background: '#FFFFFF', padding: '18px 24px', borderRadius: '16px', border: '1px solid #D1FAE5', boxShadow: '0 2px 12px rgba(16, 185, 129, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                    <UserCheck size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#17324D' }}>
                        {verifiedDoctorName || 'Authorized Licensed Dentist'}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
                        Licensed Medical Practitioner
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '3px', fontSize: '0.84rem', color: '#64748B' }}>
                      {report.verifiedBy?.specialization && (
                        <span>Specialization: <strong style={{ color: '#17324D' }}>{report.verifiedBy.specialization}</strong></span>
                      )}
                      {report.verifiedBy?.licenseNumber && (
                        <span>• License: <strong style={{ color: '#17324D' }}>{report.verifiedBy.licenseNumber}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {verifiedAtFormatted && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', padding: '8px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.84rem', color: '#475569' }}>
                    <Calendar size={15} color="#059669" />
                    <span>Verified on: <strong style={{ color: '#17324D' }}>{verifiedAtFormatted}</strong></span>
                  </div>
                )}
              </div>

              {/* Diagnosis Block: Final Diagnosis & Override / Confirmation Indicator */}
              <div style={{ background: '#FFFFFF', padding: '22px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 800, color: '#52677A' }}>
                  Final Clinical Diagnosis
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#065F46', margin: 0, textTransform: 'capitalize' }}>
                    {report.finalDiagnosis || originalAiCondition.replace(/_/g, ' ')}
                  </h2>

                  {/* Override or Confirmation Badge */}
                  {report.isOverridden ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#B45309', background: '#FEF3C7', padding: '6px 14px', borderRadius: '8px', border: '1px solid #FCD34D' }}>
                      <AlertCircle size={16} />
                      Revised by Doctor (AI screening originally suggested: {originalAiCondition.replace(/_/g, ' ')})
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '6px 14px', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                      <CheckCircle2 size={16} />
                      Clinically Confirmed (Agrees with preliminary AI screening)
                    </span>
                  )}
                </div>
              </div>

              {/* Secondary Clinical Findings */}
              {report.secondaryFindings && Array.isArray(report.secondaryFindings) && report.secondaryFindings.length > 0 && (
                <div style={{ background: '#FFFFFF', padding: '20px 24px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 800, color: '#52677A', display: 'block', marginBottom: '10px' }}>
                    Secondary Clinical Findings & Co-occurring Observations
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {report.secondaryFindings.map((finding, idx) => (
                      <span 
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(0, 166, 166, 0.08)',
                          color: '#007A78',
                          border: '1px solid rgba(0, 166, 166, 0.25)',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.86rem',
                          fontWeight: 700
                        }}
                      >
                        <Check size={14} /> {finding}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctor's Clinical Notes */}
              {report.doctorNotes && report.doctorNotes.trim() && (
                <div style={{ background: '#FFFFFF', padding: '20px 24px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <FileText size={18} color="#059669" />
                    <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 800, color: '#52677A' }}>
                      Doctor's Clinical Notes & Observations
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.96rem', lineHeight: 1.6, color: '#17324D', fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                    {report.doctorNotes}
                  </p>
                </div>
              )}

              {/* Doctor's Prescribed Treatment Plan */}
              {report.treatmentPlan && report.treatmentPlan.trim() && (
                <div style={{ background: 'linear-gradient(135deg, #F0FDF9 0%, #ECFDF5 100%)', padding: '22px 24px', borderRadius: '16px', border: '1.5px solid #99E3D8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <HeartPulse size={20} color="#059669" />
                    <span style={{ fontSize: '0.84rem', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 800, color: '#065F46' }}>
                      Prescribed Clinical Treatment Plan
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: 1.6, color: '#17324D', fontWeight: 600, whiteSpace: 'pre-wrap' }}>
                    {report.treatmentPlan}
                  </p>
                </div>
              )}

            </div>
          ) : report.status === 'Needs Rescan' ? (
            /* =====================================================================
                CASE B: STATUS IS NEEDS RESCAN
                Prompt the patient to take a new scan with doctor notes if any
               ===================================================================== */
            <div style={{ padding: '32px 24px', textAlign: 'center', background: '#FFFBEB', borderRadius: '18px', border: '1.5px solid #FCD34D' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <Camera size={32} />
              </div>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#92400E', margin: '0 0 8px 0' }}>
                New Dental Scan Requested by Doctor
              </h4>
              <p style={{ fontSize: '0.95rem', color: '#78350F', maxWidth: '580px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                The reviewing dental practitioner inspected this submission and requested a new image with better illumination, angle, or focus before finalizing your clinical assessment.
              </p>

              {report.doctorNotes && (
                <div style={{ maxWidth: '540px', margin: '0 auto 20px auto', background: '#FFFFFF', padding: '14px 20px', borderRadius: '12px', border: '1px solid #FDE68A', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Doctor's Instructions
                  </span>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: '#17324D' }}>
                    {report.doctorNotes}
                  </p>
                </div>
              )}

              {verifiedDoctorName && (
                <p style={{ fontSize: '0.85rem', color: '#B45309', margin: '0 0 20px 0' }}>
                  Requested by <strong>{verifiedDoctorName}</strong> {verifiedAtFormatted ? `on ${verifiedAtFormatted}` : ''}
                </p>
              )}

              <button 
                onClick={() => navigate('/dashboard/patient/scan')}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '999px', fontWeight: 700, fontSize: '0.95rem', background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)' }}
              >
                <Camera size={18} /> Take New Dental Scan
              </button>
            </div>
          ) : report.status === 'Rejected' ? (
            /* =====================================================================
                CASE C: STATUS IS REJECTED / REVIEW DECLINED
               ===================================================================== */
            <div style={{ padding: '32px 24px', textAlign: 'center', background: '#FEF2F2', borderRadius: '18px', border: '1.5px solid #FCA5A5' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <AlertCircle size={32} />
              </div>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#991B1B', margin: '0 0 8px 0' }}>
                Clinical Review Declined
              </h4>
              <p style={{ fontSize: '0.95rem', color: '#7F1D1D', maxWidth: '580px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                This submission could not be verified by the clinical team. Please review the doctor's explanation below or contact support.
              </p>

              {report.doctorNotes && (
                <div style={{ maxWidth: '540px', margin: '0 auto 20px auto', background: '#FFFFFF', padding: '14px 20px', borderRadius: '12px', border: '1px solid #FECACA', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Clinical Note
                  </span>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: '#17324D' }}>
                    {report.doctorNotes}
                  </p>
                </div>
              )}

              {verifiedDoctorName && (
                <p style={{ fontSize: '0.85rem', color: '#991B1B', margin: '0 0 20px 0' }}>
                  Reviewed by <strong>{verifiedDoctorName}</strong> {verifiedAtFormatted ? `on ${verifiedAtFormatted}` : ''}
                </p>
              )}
            </div>
          ) : (
            /* =====================================================================
                CASE D: STATUS IS PENDING (Awaiting Doctor Review)
                NEVER invents doctor names, dates, diagnoses or prescriptions
               ===================================================================== */
            <div style={{ padding: '36px 24px', textAlign: 'center', background: '#FFFDF5', borderRadius: '18px', border: '1.5px solid #FDE68A' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <Clock size={32} />
              </div>
              <h4 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#92400E', margin: '0 0 8px 0' }}>
                Awaiting Doctor Review
              </h4>
              <p style={{ fontSize: '0.95rem', color: '#78350F', maxWidth: '620px', margin: '0 auto 20px auto', lineHeight: 1.6 }}>
                This dental scan is currently in the clinical review queue. An authorized licensed dental practitioner will examine the intraoral image, evaluate the preliminary AI screening scores, and publish the official clinical diagnosis and personalized treatment plan.
              </p>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', padding: '10px 20px', borderRadius: '12px', border: '1px solid #FDE68A', fontSize: '0.88rem', color: '#78350F', marginBottom: '24px' }}>
                <Calendar size={16} color="#D97706" />
                <span>Submitted on: <strong>{formattedDate} at {formattedTime}</strong></span>
                <span>•</span>
                <span>Status: <strong style={{ color: '#B45309' }}>Pending Clinical Verification</strong></span>
              </div>

              <div>
                <button 
                  onClick={() => {
                    sessionStorage.setItem('dentaai_active_scan', JSON.stringify(report));
                    navigate(`/dashboard/patient/recommended-doctors?condition=${encodeURIComponent(report.condition || '')}`, { state: { predictionResult: report } });
                  }}
                  className="report-consult-btn"
                  style={{ maxWidth: '320px', margin: '0 auto' }}
                >
                  <Stethoscope size={18} />
                  <span>Consult a Doctor Now</span>
                </button>
              </div>
            </div>
          )}

        </motion.div>

        {/* =========================================================================
            SUPPORTING CLINICAL CARE & PRESCRIPTION SECTIONS
            (Preserves personal prescription, oral precautions, and doctor consultation)
           ========================================================================= */}
        <div className="report-main-grid" style={{ marginTop: '8px' }}>
          
          {/* LEFT: Personal Prescription & Specialist Consultation CTA */}
          <div className="report-left-column">
            
            {/* Personal Prescription Card */}
            <motion.div variants={item} className="report-prescription-card-wrap" style={{ width: '100%' }}>
              <PersonalPrescriptionSection
                condition={report.finalDiagnosis || report.condition}
                confidence={report.confidence}
                scanId={report._id || report.scanId}
                style={{ marginTop: 0 }}
              />
            </motion.div>

            {/* Specialist Consultation Action Card */}
            <motion.div variants={item} className="report-consult-action-card report-consult-card-wrap">
              <div className="consult-action-header">
                <div className="consult-action-icon-circle">
                  <Stethoscope size={22} />
                </div>
                <div>
                  <h4 className="consult-action-title">Doctor Consultation</h4>
                  <p className="consult-action-desc">Connect with an authorized dentist for live clinical evaluation & follow-up.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  sessionStorage.setItem('dentaai_active_scan', JSON.stringify(report));
                  navigate(`/dashboard/patient/recommended-doctors?condition=${encodeURIComponent(report.finalDiagnosis || report.condition || '')}`, { state: { predictionResult: report } });
                }}
                className="report-consult-btn"
              >
                <Stethoscope size={18} />
                <span>Consult a Doctor</span>
              </button>
            </motion.div>

          </div>

          {/* RIGHT: Oral Care Guidance & Daily Precautions */}
          <div className="report-right-column">
            
            <motion.div variants={item} className="report-glass-card report-recommendations-card report-precautions-card-wrap">
              <div className="report-card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="report-header-icon-wrap">
                    <HeartPulse size={20} />
                  </div>
                  <div>
                    <h3 className="report-card-title">Oral Care Guidance & Precautions</h3>
                    <span style={{ fontSize: '0.88rem', color: '#40566F', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                      Daily hygiene precautions and clinical monitoring indicators
                    </span>
                  </div>
                </div>
                {careData.category && (
                  <span style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    padding: '5px 14px',
                    borderRadius: '999px',
                    background: '#F1F5F9',
                    color: '#475569',
                    border: '1px solid #E2E8F0'
                  }}>
                    {careData.category}
                  </span>
                )}
              </div>

              {/* Precautions Section */}
              <div style={{ width: '100%', marginTop: '4px' }}>
                <PrecautionsSection 
                  condition={report.finalDiagnosis || report.condition} 
                  confidence={report.confidence} 
                  predictionResult={report} 
                  showBookingButton={false} 
                  hideHeader={true}
                />
              </div>
            </motion.div>

          </div>

        </div>

      </div>
    </motion.div>
  );
};

export default PatientReportDetails;
