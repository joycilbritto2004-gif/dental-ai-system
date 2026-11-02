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
  Image as ImageIcon, 
  HeartPulse,
  Stethoscope,
  Sparkles
} from 'lucide-react';
import PrecautionsSection from '../../components/PrecautionsSection';
import PersonalPrescriptionSection from '../../components/PersonalPrescriptionSection';
import { getCareSuggestions } from '../../utils/careSuggestions';
import '../Dashboard.css';

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

        const response = await fetch(`http://localhost:5000/api/scans/${user._id || user.id}`, { headers });
        if (!response.ok) {
          throw new Error('Failed to fetch report');
        }

        const data = await response.json();
        const specificReport = data.find(scan => scan._id === id || scan.scanId === id);
        
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

  const getStatusInfo = (confidence) => {
    if (confidence > 90) return { color: 'success', icon: <ShieldCheck size={20} />, text: 'Verified' };
    if (confidence > 70) return { color: 'warning', icon: <Clock size={20} />, text: 'Pending Review' };
    return { color: 'danger', icon: <AlertTriangle size={20} />, text: 'Requires Attention' };
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
  const status = getStatusInfo(report.confidence);

  const hasImage = Boolean(report.imagePath && report.imagePath !== 'uploaded_image' && !imageError);
  const imageUrl = hasImage
    ? (report.imagePath.startsWith('http') ? report.imagePath : `http://localhost:5000${report.imagePath}`)
    : null;

  const careData = getCareSuggestions(report.condition);

  return (
    <motion.div 
      className="dashboard-view report-details-page-wrapper"
      initial="hidden"
      animate="show"
      variants={stagger}
      style={{ paddingBottom: '36px' }}
    >
      {/* Page Header Card */}
      <div className="page-header-card" style={{ padding: '28px 36px', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.75)', boxShadow: '0 8px 32px rgba(10, 25, 48, 0.07)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '45%', background: 'radial-gradient(circle at top right, rgba(0, 166, 166, 0.15), transparent 70%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div className="flex-between mb-4">
            <button 
              className="btn btn-outline" 
              onClick={() => navigate(-1)} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '999px', fontWeight: 700, background: 'rgba(255, 255, 255, 0.85)', border: '1px solid #BFD4E5', color: '#17324D' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => window.print()} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 22px', borderRadius: '999px', fontWeight: 700, background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)', boxShadow: '0 6px 20px rgba(0, 166, 166, 0.3)' }}
            >
              <FileText size={16} /> Download PDF
            </button>
          </div>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 className="font-extrabold" style={{ color: '#17324D', letterSpacing: '-0.5px', fontSize: '2.4rem', lineHeight: '1.2', margin: '0 0 6px 0' }}>
                Report Details
              </h2>
              <p className="font-medium" style={{ color: '#40566F', fontSize: '1.05rem', margin: 0 }}>
                Professional medical breakdown of your AI dental scan
              </p>
            </div>
            <span className={`badge bg-${status.color}-light text-${status.color}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '12px', fontSize: '0.98rem', fontWeight: 700, border: '1px solid rgba(191, 212, 229, 0.6)' }}>
              {status.icon} {status.text}
            </span>
          </div>
        </div>
      </div>

      {/* TOP 2-COLUMN SECTION: Scan Image & AI Analysis Result */}
      <div className="report-columns-grid">
        
        {/* LEFT COLUMN — Scan Image & Case Metadata */}
        <motion.div variants={item} className="report-glass-card report-scan-card">
          <div className="report-card-header">
            <div className="report-header-icon-wrap">
              <ImageIcon size={20} />
            </div>
            <h3 className="report-card-title">Scan Image</h3>
          </div>
          
          {/* Rounded Rectangular Preview Canvas with object-fit: contain */}
          <div className="scan-image-viewer">
            {hasImage ? (
              <img 
                src={imageUrl} 
                alt={`Dental Scan - ${report.condition || 'Analysis'}`} 
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
          
          <div className="divider" style={{ margin: '4px 0', background: 'rgba(191, 212, 229, 0.5)' }}></div>
          
          {/* Metadata Section: Date & Report ID */}
          <div className="report-metadata-list">
            <div className="report-metadata-row">
              <span className="report-metadata-label">
                <Calendar size={16} color="#00A6A6" /> Date
              </span>
              <span className="report-metadata-value">
                {formattedDate} at {formattedTime}
              </span>
            </div>
            <div className="report-metadata-row">
              <span className="report-metadata-label">
                <FileText size={16} color="#00A6A6" /> Report ID
              </span>
              <span className="report-metadata-value" style={{ fontFamily: 'monospace', fontSize: '0.86rem' }}>
                {report.scanId || report._id}
              </span>
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN — AI Analysis Result */}
        <motion.div variants={item} className="report-glass-card ai-analysis-card">
          <div className="report-card-header">
            <div className="report-header-icon-wrap">
              <Activity size={20} />
            </div>
            <h3 className="report-card-title">AI Analysis Result</h3>
          </div>
          
          <div className="predicted-condition-section">
            <span className="predicted-condition-label">Predicted Condition</span>
            <h2 className="predicted-condition-value">
              {report.condition?.replace(/_/g, ' ') || 'Unknown Condition'}
            </h2>
          </div>
          
          {report.confidence !== null && report.confidence !== undefined && !isNaN(Number(report.confidence)) && (
            <div className="confidence-score-block">
              <div className="confidence-header-row">
                <span className="confidence-label">AI Confidence Score</span>
                <span className="confidence-value-teal">
                  {Number(report.confidence).toFixed(1)}%
                </span>
              </div>
              <div className="confidence-progress-track">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, Number(report.confidence)))}%` }}
                  transition={{ duration: 0.9, delay: 0.2 }}
                  className="confidence-progress-fill"
                />
              </div>
            </div>
          )}

          {/* AI Preliminary Note in a subtle inner card */}
          {report.recommendation && (
            <div className="ai-preliminary-card">
              <div className="ai-preliminary-header">
                <Sparkles size={15} />
                <span>AI Preliminary Note</span>
              </div>
              <p className="ai-preliminary-text">{report.recommendation}</p>
            </div>
          )}

          {/* Doctor Verification Section (Only shown if data exists) */}
          {(report.doctorVerification || report.finalDiagnosis || report.treatmentPlan) && (
            <div style={{ marginTop: '4px', paddingTop: '16px', borderTop: '1px solid rgba(191, 212, 229, 0.5)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#17324D', margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: 800 }}>
                <ShieldCheck size={18} color="#00A6A6" /> Doctor Verification
              </h4>
              
              {report.finalDiagnosis && (
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800, color: '#52677A', display: 'block', marginBottom: '4px' }}>
                    Final Diagnosis
                  </span>
                  <div style={{ background: 'rgba(248, 250, 252, 0.85)', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#17324D', fontSize: '0.92rem' }}>{report.finalDiagnosis}</p>
                  </div>
                </div>
              )}

              {report.treatmentPlan && (
                <div>
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800, color: '#52677A', display: 'block', marginBottom: '4px' }}>
                    Treatment Plan
                  </span>
                  <div style={{ background: 'rgba(248, 250, 252, 0.85)', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <p style={{ margin: 0, fontWeight: 500, color: '#17324D', lineHeight: 1.5, fontSize: '0.9rem' }}>{report.treatmentPlan}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* PERSONAL PRESCRIPTION SECTION */}
      <motion.div variants={item}>
        <PersonalPrescriptionSection
          condition={report.condition}
          confidence={report.confidence}
          scanId={report._id || report.scanId}
        />
      </motion.div>

      {/* RECOMMENDATIONS SECTION — Spanning full container width, perfectly aligned with the report columns above */}
      <motion.div variants={item} className="report-glass-card report-recommendations-card">
        <div className="report-card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="report-header-icon-wrap">
              <HeartPulse size={20} />
            </div>
            <div>
              <h3 className="report-card-title">Clinical Notes & Recommendations</h3>
              <span style={{ fontSize: '0.9rem', color: '#40566F', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                Oral health guidance, daily precautions, and clinical evaluation indicators
              </span>
            </div>
          </div>
          {careData.category && (
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              padding: '6px 16px',
              borderRadius: '999px',
              background: '#F1F5F9',
              color: '#475569',
              border: '1px solid #E2E8F0'
            }}>
              {careData.category}
            </span>
          )}
        </div>

        {/* Precautions Section (About, Recommended Daily Precautions, When to See Dentist, Safety Notices) */}
        <div style={{ width: '100%', marginTop: '4px' }}>
          <PrecautionsSection 
            condition={report.condition} 
            confidence={report.confidence} 
            predictionResult={report} 
            showBookingButton={false} 
            hideHeader={true}
          />
        </div>

        {/* Specialist Consultation Action Button */}
        <div style={{ marginTop: '12px', width: '100%' }}>
          <button 
            onClick={() => {
              sessionStorage.setItem('dentaai_active_scan', JSON.stringify(report));
              navigate(`/dashboard/patient/recommended-doctors?condition=${encodeURIComponent(report.condition || '')}`, { state: { predictionResult: report } });
            }}
            className="report-consult-btn"
          >
            <Stethoscope size={19} />
            <span>Consult a Doctor</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PatientReportDetails;


