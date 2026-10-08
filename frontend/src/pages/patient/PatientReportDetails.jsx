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

    fetchReportDetails();
  }, [id]);

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
      className="dashboard-view"
      initial="hidden"
      animate="show"
      variants={stagger}
    >
      <div className="mb-8 page-header-card" style={{ padding: '32px 40px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', background: 'radial-gradient(circle at top right, rgba(0, 210, 255, 0.12), transparent 70%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--secondary)' }}></div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div className="flex-between mb-6">
            <button className="btn btn-outline" onClick={() => navigate('/dashboard/patient/reports')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '999px', fontWeight: 'bold' }}>
              <ArrowLeft size={16} /> Back to Reports
            </button>
            <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '999px', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(0, 210, 255, 0.25)' }}>
              <FileText size={16} /> Download PDF
            </button>
          </div>
          <div className="flex-between">
            <div>
              <h2 className="font-extrabold mb-2" style={{ color: '#F8FAFC', letterSpacing: '-0.5px', fontSize: '2.5rem', lineHeight: '1.2', margin: 0 }}>Report Details</h2>
              <p className="font-medium m-0" style={{ color: '#CBD5E1', fontSize: '1.1rem' }}>Professional medical breakdown of your AI dental scan</p>
            </div>
            <span className={`badge bg-${status.color}-light text-${status.color}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600 }}>
              {status.icon} {status.text}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '32px' }}>
        
        {/* Left Column - Image & Basic Info */}
        <motion.div variants={item} className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F8FAFC', marginBottom: '0' }}>
            <ImageIcon size={20} /> Scan Image
          </h3>
          
          <div style={{ 
            width: '100%', 
            aspectRatio: '4/3', 
            borderRadius: '16px', 
            background: 'var(--bg-primary)', 
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-color)'
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
            <div style={{ display: (report.imagePath && report.imagePath !== 'uploaded_image') ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', color: '#CBD5E1' }}>
              <ImageIcon size={48} opacity={0.5} className="mb-2" />
              <span>Image not available</span>
            </div>
          </div>
          
          <div className="divider" style={{ margin: '0', background: 'var(--border-color)' }}></div>
          
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
          
          <div className="card" style={{ padding: '32px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F8FAFC', marginBottom: '20px' }}>
              <Activity size={20} /> AI Analysis Result
            </h3>
            
            <div style={{ marginBottom: '24px' }}>
              <p className="text-muted mb-2 font-semibold">Predicted Condition</p>
              <h2 style={{ color: '#F8FAFC', textTransform: 'capitalize', margin: 0, fontWeight: 'bold' }}>
                {report.condition?.replace('_', ' ') || 'Unknown Condition'}
              </h2>
            </div>
            
            <div>
              <div className="flex-between mb-2">
                <p className="text-muted mb-0">AI Confidence Score</p>
                <strong style={{ color: 'var(--secondary)', fontSize: '1.2rem' }}>{report.confidence}%</strong>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${report.confidence}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  style={{ height: '100%', background: `var(--${status.color})`, borderRadius: '4px' }}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '32px', flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F8FAFC', marginBottom: '20px' }}>
              <HeartPulse size={20} /> Clinical Notes & Recommendations
            </h3>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* AI Recommendations */}
              <div>
                <h5 style={{ color: 'var(--secondary)', margin: '0 0 12px 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>AI Care Suggestions</h5>
                {report.recommendation ? (
                  <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--secondary)' }}>
                    <p style={{ lineHeight: '1.6', margin: 0, fontWeight: 500 }}>{report.recommendation}</p>
                  </div>
                ) : (
                  <p className="text-muted" style={{ fontStyle: 'italic' }}>
                    No specific recommendations provided.
                  </p>
                )}
              </div>

              {/* Doctor Verification Section (Only shown if data exists) */}
              {(report.doctorVerification || report.finalDiagnosis || report.treatmentPlan) && (
                <>
                  <div className="divider" style={{ margin: '0', background: 'var(--border-color)' }}></div>
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F8FAFC', marginBottom: '16px' }}>
                      <ShieldCheck size={20} /> Doctor Verification
                    </h3>
                    
                    {report.finalDiagnosis && (
                      <div className="mb-4">
                        <h5 style={{ color: '#CBD5E1', margin: '0 0 8px 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Final Diagnosis</h5>
                        <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          <p style={{ margin: 0, fontWeight: 500 }}>{report.finalDiagnosis}</p>
                        </div>
                      </div>
                    )}

                    {report.treatmentPlan && (
                      <div className="mb-4">
                        <h5 style={{ color: '#CBD5E1', margin: '0 0 8px 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Treatment Plan</h5>
                        <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          <p style={{ margin: 0, fontWeight: 500 }}>{report.treatmentPlan}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
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


