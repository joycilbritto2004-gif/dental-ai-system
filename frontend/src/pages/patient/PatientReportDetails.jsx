import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Calendar, Activity, ShieldCheck, Clock, AlertTriangle, Image as ImageIcon, HeartPulse } from 'lucide-react';
import '../Dashboard.css';

const PatientReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReportDetails();
  }, [id]);

  const fetchReportDetails = async () => {
    try {
      const userStr = localStorage.getItem('dentaai_user');
      if (!userStr) {
        throw new Error('User not found');
      }
      const user = JSON.parse(userStr);

      const response = await fetch(`http://localhost:5000/api/scans/${user._id || user.id}`);
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

  const getStatusInfo = (confidence) => {
    if (confidence > 90) return { color: 'success', icon: <ShieldCheck size={20} />, text: 'Verified' };
    if (confidence > 70) return { color: 'warning', icon: <Clock size={20} />, text: 'Pending Review' };
    return { color: 'danger', icon: <AlertTriangle size={20} />, text: 'Requires Attention' };
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  if (loading) {
    return (
      <div className="dashboard-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Activity className="spin-anim" size={40} color="var(--secondary)" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="dashboard-content">
        <button className="btn btn-outline mb-6" onClick={() => navigate('/dashboard/patient/reports')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> Back to Reports
        </button>
        <div className="card text-center" style={{ padding: '40px' }}>
          <AlertTriangle size={48} className="text-danger mb-4" style={{ margin: '0 auto' }} />
          <h3 className="mb-2">Error Loading Report</h3>
          <p className="text-muted">{error || 'Report not found'}</p>
        </div>
      </div>
    );
  }

  const dateObj = new Date(report.createdAt);
  const status = getStatusInfo(report.confidence);

  return (
    <motion.div 
      className="dashboard-content"
      initial="hidden"
      animate="show"
      variants={stagger}
    >
      <div className="mb-6">
        <button className="btn btn-outline mb-4" onClick={() => navigate('/dashboard/patient/reports')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> Back to Reports
        </button>
        <div className="flex-between">
          <div>
            <h2>Report Details</h2>
            <p className="text-muted">Detailed view of your AI dental scan</p>
          </div>
          <span className={`badge bg-${status.color}-light text-${status.color}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600 }}>
            {status.icon} {status.text}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Left Column - Image & Basic Info */}
        <motion.div variants={item} className="card glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '0' }}>
            <ImageIcon size={20} /> Scan Image
          </h3>
          
          <div style={{ 
            width: '100%', 
            aspectRatio: '4/3', 
            borderRadius: '12px', 
            background: 'var(--bg-dark)', 
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {report.imagePath && report.imagePath !== 'uploaded_image' ? (
              <img 
                src={report.imagePath.startsWith('http') ? report.imagePath : `http://localhost:5000${report.imagePath}`} 
                alt="Dental Scan" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div style={{ display: (report.imagePath && report.imagePath !== 'uploaded_image') ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
              <ImageIcon size={48} opacity={0.5} className="mb-2" />
              <span>Image not available</span>
            </div>
          </div>
          
          <div className="divider" style={{ margin: '0' }}></div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> Date</span>
              <span style={{ fontWeight: 600 }}>{dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={16} /> Report ID</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', opacity: 0.8 }}>{report._id || report.scanId}</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column - Analysis Results */}
        <motion.div variants={item} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card glass-card" style={{ padding: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '20px' }}>
              <Activity size={20} /> AI Analysis Result
            </h3>
            
            <div style={{ marginBottom: '24px' }}>
              <p className="text-muted mb-2">Predicted Condition</p>
              <h2 style={{ color: 'var(--text-light)', textTransform: 'capitalize', margin: 0 }}>
                {report.condition?.replace('_', ' ') || 'Unknown Condition'}
              </h2>
            </div>
            
            <div>
              <div className="flex-between mb-2">
                <p className="text-muted mb-0">AI Confidence Score</p>
                <strong style={{ color: 'var(--secondary)', fontSize: '1.2rem' }}>{report.confidence}%</strong>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${report.confidence}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  style={{ height: '100%', background: `var(--${status.color})`, borderRadius: '4px' }}
                />
              </div>
            </div>
          </div>

          <div className="card glass-card" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '20px' }}>
              <HeartPulse size={20} /> Clinical Notes & Recommendations
            </h3>
            
            <div style={{ flex: 1 }}>
              {report.recommendation ? (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--secondary)' }}>
                  <p style={{ lineHeight: '1.6', margin: 0 }}>{report.recommendation}</p>
                </div>
              ) : (
                <p className="text-muted" style={{ fontStyle: 'italic' }}>
                  No specific recommendations provided for this scan. Please consult your dentist for a professional evaluation.
                </p>
              )}
            </div>

            <div style={{ marginTop: '24px' }}>
              <button 
                onClick={() => navigate(`/dashboard/patient/recommended-doctors?condition=${encodeURIComponent(report.condition || '')}`, { state: { predictionResult: report } })}
                className="btn btn-primary w-full pulse-glow flex-align-center justify-center gap-2"
                style={{ padding: '12px 24px', fontSize: '1.1rem' }}
              >
                Consult a Doctor
              </button>
            </div>
          </div>
          
        </motion.div>
        
      </div>
    </motion.div>
  );
};

export default PatientReportDetails;
