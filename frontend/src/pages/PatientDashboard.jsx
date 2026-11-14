import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  HeartPulse, 
  CheckCircle2, 
  Clock, 
  Info, 
  X, 
  ShieldCheck, 
  Zap, 
  FileText, 
  Download, 
  Check, 
  FileStack, 
  Activity, 
  AlertTriangle,
  Stethoscope,
  ChevronRight,
  Sparkles,
  UserCheck,
  Calendar,
  MessageSquare,
  Video
} from 'lucide-react';
import { getCareSuggestions } from '../utils/careSuggestions';
import { generatePDF } from '../utils/pdfGenerator';
import { getSocket } from '../utils/socket';
import PersonalPrescriptionSection from '../components/PersonalPrescriptionSection';
import './Dashboard.css';
import { API_BASE } from '../config';

const PatientDashboard = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const isFetchingConsultationsRef = useRef(false);
  const isMountedRef = useRef(true);

  const [userName, setUserName] = useState('');
  
  const fetchScanHistory = async () => {
    try {
      const userStr = localStorage.getItem('dentaai_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const token = localStorage.getItem('dentaai_token');
      const res = await fetch(`${API_BASE}/api/scans/${user._id || user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (isMountedRef.current) {
          setScanHistory(data);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Error fetching history:', err);
      }
    }
  };

  const fetchConsultations = useCallback(async () => {
    if (isFetchingConsultationsRef.current) return;
    isFetchingConsultationsRef.current = true;
    try {
      const userStr = localStorage.getItem('dentaai_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const token = localStorage.getItem('dentaai_token');
      const res = await fetch(`${API_BASE}/api/consultations?patientId=${user._id || user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (isMountedRef.current) {
          setConsultations(Array.isArray(data) ? data : []);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Error fetching consultations:', err);
      }
    } finally {
      isFetchingConsultationsRef.current = false;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchScanHistory();
    fetchConsultations();

    // Socket.IO real-time acceptance event listener
    const socket = getSocket();
    const handleAccepted = () => {
      fetchConsultations();
    };

    if (socket) {
      socket.on('consultation-accepted', handleAccepted);
    }
    
    // Polling every 5 seconds for automatic consultation updates as fallback
    const intervalId = setInterval(() => {
      fetchConsultations();
    }, 5000);

    const userStr = localStorage.getItem('dentaai_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || '');
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
      if (socket) {
        socket.off('consultation-accepted', handleAccepted);
      }
    };
  }, [fetchConsultations]);

  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const totalScans = scanHistory.length;
  const verifiedScans = scanHistory.filter(s => s.confidence > 90).length;
  const pendingScans = scanHistory.filter(s => s.confidence > 70 && s.confidence <= 90).length;
  const healthStatus = totalScans === 0 ? "N/A" : (scanHistory[0].confidence > 90 ? "Good" : scanHistory[0].confidence > 70 ? "Attention" : "Critical");

  const upcomingFollowUp = consultations.find(c => c.followUpDate);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(URL.createObjectURL(e.target.files[0]));
      setImageFile(e.target.files[0]);
      setError(null);
      setPredictionResult(null);
      setShowReport(false);
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setSelectedImage(null);
    setImageFile(null);
    setPredictionResult(null);
    setError(null);
    setShowReport(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const triggerCameraInput = (e) => {
    e?.stopPropagation();
    if (cameraInputRef.current) cameraInputRef.current.click();
  };

  const handleRunAnalysis = async () => {
    if (!imageFile) {
      setError("Please select an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPredictionResult(null);
    setShowReport(false);

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const userToken = localStorage.getItem('dentaai_token');
      const response = await fetch(`${API_BASE}/api/ai/predict`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`
        },
        body: formData,
      }).catch(() => {
        throw new Error("Failed to connect to the AI neural network. Please ensure the AI server is active.");
      });

      let data;
      try {
        data = await response.json();
      } catch(e) {
        console.error("API parse error:", e);
        data = {};
      }

      if (!response.ok) {
        throw new Error(data.error || `Server responded with status: ${response.status}`);
      }
      if (data.error) throw new Error(data.error);

      setTimeout(() => {
        setIsLoading(false);

        // The backend already persisted this record from the model's own output and
        // returned the saved document, so there is nothing to post back from here.
        const finalData = { ...data };
        setScanHistory(prev => [finalData, ...prev]);

        sessionStorage.setItem('dentaai_active_scan', JSON.stringify(finalData));
        setPredictionResult(finalData);
      }, 1500);

    } catch (err) {
      console.error("API Error:", err);
      setError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    generatePDF('ai-report-container', `DentaAI_Report_${new Date().getTime()}.pdf`);
  };

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger} style={{ paddingBottom: '40px' }}>
      
      {/* HERO SECTION */}
      <motion.div variants={item} className="mb-6 page-header-card patient-hero-header">
        <div className="patient-hero-decor"></div>
        <div className="patient-hero-stripe"></div>
        
        <div style={{ position: 'relative', zIndex: 10, flex: 1, minWidth: '280px' }}>
          <div className="patient-hero-badge-wrap">
            <span className="patient-hero-status-pill">
              <span className="live-dot-teal"></span> DentaAI Neural Network Active
            </span>
            <span className="patient-hero-verified-pill">
              <ShieldCheck size={13} color="#166534" /> Verified Patient
            </span>
          </div>
          
          <h2 className="patient-hero-title">
            Welcome back{userName ? `, ${userName}` : ''} 👋
          </h2>
          <p className="patient-hero-sub">
            Monitor your dental health with advanced AI insights, track historical screenings, and connect with certified dental specialists.
          </p>

          <div className="patient-hero-actions">
            <button onClick={triggerFileInput} className="hero-cta-btn primary">
              <Camera size={16} /> Start AI Scan
            </button>
            <Link to="/dashboard/patient/recommended-doctors" className="hero-cta-btn secondary">
              <Stethoscope size={16} /> Book Specialist
            </Link>
            <Link to="/dashboard/patient/consultations" className="hero-cta-btn ghost">
              <Calendar size={16} /> My Appointments
            </Link>
          </div>
        </div>

        {/* Hero Right: Oral Health Standing Card */}
        <div className="patient-hero-health-card">
          <div className="health-card-header">
            <div className="health-icon-badge">
              <HeartPulse size={22} color="#00A6A6" />
            </div>
            <div>
              <span className="health-card-label">Oral Health Standing</span>
              <strong className="health-card-status">{healthStatus} Index</strong>
            </div>
          </div>
          <div className="health-card-divider"></div>
          <div className="health-card-footer">
            <span className="health-card-meta">
              {scanHistory.length > 0 
                ? `Latest: ${scanHistory[0].condition?.replace(/_/g, ' ')} (${scanHistory[0].confidence}%)`
                : 'No screenings yet'}
            </span>
            <Link to="/dashboard/patient/screening-history" className="health-card-link">
              History <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="patient-dashboard-grid">
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          
          {/* UPLOAD CARD */}
          <motion.div variants={item} className="card patient-upload-card">
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontWeight: 800, color: '#17324D', margin: 0, fontSize: '1.35rem' }}>Start a New AI Scan</h3>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#00A6A6', background: 'rgba(0, 166, 166, 0.08)', border: '1px solid rgba(0, 166, 166, 0.2)', padding: '3px 10px', borderRadius: '999px' }}>
                  v2.4 Core
                </span>
              </div>
              <p style={{ color: '#52677A', margin: '4px 0 0 0', fontWeight: 500, fontSize: '0.92rem' }}>
                Upload or snap an intraoral image for instant deep neural network analysis.
              </p>
            </div>
            
            <div 
              className={`upload-zone-scanner ${selectedImage ? 'has-image' : ''}`} 
              onClick={triggerFileInput}
              style={{ padding: selectedImage ? '0' : '32px 20px' }}
            >
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
              <input type="file" ref={cameraInputRef} onChange={handleImageChange} accept="image/*" capture="environment" style={{ display: 'none' }} />
              <AnimatePresence>
                {selectedImage ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ borderRadius: '18px', border: '1px solid #BFD4E5', position: 'relative', overflow: 'hidden' }}>
                    <img src={selectedImage} alt="Preview" className="preview-image" style={{ width: '100%', maxHeight: '380px', objectFit: 'contain', display: 'block', background: '#F8FAFC' }} />
                    <button onClick={handleRemoveImage} style={{ position: 'absolute', top: '12px', right: '12px', background: '#FFFFFF', border: '1px solid #BFD4E5', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', boxShadow: '0 2px 8px rgba(7, 26, 51, 0.15)' }}>
                      <X size={16} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="upload-scanner-icon">
                      <Camera size={26} color="#00A6A6" />
                    </div>
                    <h4 style={{ color: '#17324D', fontWeight: 800, margin: '0 0 4px 0', fontSize: '1.15rem' }}>Drop intraoral scan here</h4>
                    <span style={{ color: '#64748B', fontWeight: 500, fontSize: '0.88rem', display: 'block' }}>or capture directly with your camera / device</span>

                    {/* Touch-Friendly Action Buttons */}
                    <div className="mobile-upload-action-row" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
                      <button 
                        type="button"
                        onClick={triggerCameraInput}
                        className="upload-source-btn camera"
                      >
                        <Camera size={16} /> Snap with Camera
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}
                        className="upload-source-btn file"
                      >
                        <Upload size={16} /> Choose File
                      </button>
                    </div>

                    <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.76rem', display: 'block', marginTop: '14px' }}>
                      Supported formats: JPG, PNG, WEBP (Max 10MB)
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reassurance trust strip */}
            <div className="scanner-reassurance-strip">
              <span className="reassurance-chip">
                <Zap size={14} color="#00A6A6" /> 1.5s Neural Inference
              </span>
              <span className="reassurance-chip">
                <ShieldCheck size={14} color="#10B981" /> 256-Bit SSL Encrypted
              </span>
              <span className="reassurance-chip">
                <HeartPulse size={14} color="#1677FF" /> 6 Clinical Conditions
              </span>
            </div>
            
            {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}><Info size={18} /> {error}</motion.div>}
            
            {selectedImage && !predictionResult && !isLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '24px' }}>
                <button className="btn btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem', boxShadow: '0 4px 15px rgba(0, 210, 255, 0.3)', background: 'var(--gradient-primary)', color: '#FFFFFF', border: 'none' }} onClick={handleRunAnalysis}>
                  <Zap size={18} /> Analyze with DentaAI
                </button>
              </motion.div>
            )}

            {selectedImage && !predictionResult && isLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '24px' }}>
                <button className="btn btn-primary" disabled style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem', background: 'var(--gradient-primary)', color: '#FFFFFF', opacity: 0.85, cursor: 'wait', border: 'none' }}>
                  <Activity className="spin-anim" size={18} /> Analyzing Image...
                </button>
              </motion.div>
            )}

            {/* PREDICTION RESULT CARD */}
            {predictionResult && (() => {
              const confVal = Number(predictionResult.confidence) || 0;
              const confColor = confVal >= 85 ? '#10b981' : confVal >= 65 ? '#f59e0b' : '#ef4444';
              const confLabel = confVal >= 85 ? 'High Confidence' : confVal >= 65 ? 'Moderate' : 'Low Confidence';
              const isLowConfidence = confVal < 65;
              const reportId = predictionResult._id || predictionResult.scanId || predictionResult.id;

              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '24px', padding: '28px', background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: '20px', color: 'var(--text-primary)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(0,210,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
                  <h4 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: 'var(--card-bg)', padding: '8px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex' }}>
                        <ShieldCheck size={24} color="var(--secondary)" />
                      </div>
                      AI Analysis Complete
                    </div>
                    {isLowConfidence && (
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={13} /> Inconclusive / Preliminary
                      </span>
                    )}
                  </h4>
                  <div className="patient-pred-kpi-grid">
                    <div style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: isLowConfidence ? confColor : 'var(--secondary)' }}></div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', paddingLeft: '8px' }}>Detected Condition</span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: isLowConfidence ? '#17324D' : 'var(--secondary)', marginTop: '8px', textTransform: 'capitalize', paddingLeft: '8px' }}>{predictionResult.condition?.replace('_', ' ')}</div>
                    </div>
                    <div style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>AI Confidence</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: confColor }}>{confLabel}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: confColor }}>{predictionResult.confidence}%</div>
                        <div style={{ flex: 1, height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${predictionResult.confidence}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: confColor }}></motion.div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LOW CONFIDENCE CLINICAL ALERT */}
                  {isLowConfidence && (
                    <div style={{ marginBottom: '20px', padding: '14px 16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#b91c1c' }}>
                          Low Confidence Screening ({predictionResult.confidence}%)
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#7f1d1d', marginTop: '4px', lineHeight: 1.5 }}>
                          The neural network detected overlapping visual signs (e.g., tooth spacing combined with active gum inflammation or surface deposits). Because no single condition reached a high certainty threshold, clinical dental examination with intraoral probing or X-rays is recommended.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SIX CLASS PROBABILITIES BREAKDOWN (if available) */}
                  {predictionResult.classProbabilities && typeof predictionResult.classProbabilities === 'object' && Object.keys(predictionResult.classProbabilities).length > 0 && (
                    <div style={{ marginBottom: '20px', background: 'var(--card-bg)', padding: '16px 20px', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                          AI Model Classification Breakdown (All 6 Conditions)
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          Model screening scores • Not confirmed medical probabilities
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {Object.entries(predictionResult.classProbabilities)
                          .sort(([, a], [, b]) => Number(b) - Number(a))
                          .map(([name, prob]) => {
                            const isTopCondition = name.toLowerCase() === (predictionResult.condition || '').replace(/_/g, ' ').toLowerCase() || name === predictionResult.condition;
                            const numProb = Number(prob) || 0;
                            const barColor = isTopCondition ? confColor : 'var(--secondary, #00A6A6)';

                            return (
                              <div 
                                key={name} 
                                style={{ 
                                  background: isTopCondition ? 'rgba(0, 166, 166, 0.06)' : 'var(--card-bg-dark)', 
                                  padding: '10px 14px', 
                                  borderRadius: '10px', 
                                  border: isTopCondition ? '1.5px solid var(--secondary, #00A6A6)' : '1px solid var(--border-color)',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <span style={{ fontSize: '0.88rem', fontWeight: isTopCondition ? 800 : 600, color: isTopCondition ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                    {name.replace(/_/g, ' ')} {isTopCondition && <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FFFFFF', background: confColor, padding: '2px 8px', borderRadius: '999px', marginLeft: '6px' }}>Top Prediction</span>}
                                  </span>
                                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: isTopCondition ? confColor : 'var(--text-primary)' }}>
                                    {numProb.toFixed(2)}%
                                  </span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: 'var(--border-color, #E2E8F0)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: `${Math.min(100, Math.max(0, numProb))}%` }} 
                                    transition={{ duration: 0.8 }} 
                                    style={{ height: '100%', background: barColor, borderRadius: '3px' }} 
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: '24px', background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <HeartPulse size={16} color="var(--secondary)" /> What to do next
                    </h5>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>{predictionResult.recommendation}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => setShowReport(!showReport)} 
                      style={{ 
                        flex: '1 1 180px', 
                        background: 'var(--card-bg)', 
                        border: '1px solid var(--border-color)', 
                        padding: '14px', 
                        borderRadius: '12px', 
                        fontWeight: 700, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px', 
                        cursor: 'pointer', 
                        color: 'var(--text-primary)', 
                        transition: 'all 0.2s', 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)' 
                      }}
                    >
                      <FileText size={18} /> {showReport ? 'Hide Quick Report' : 'View Quick Report'}
                    </button>
                    {reportId && (
                      <Link
                        to={`/dashboard/patient/reports/${reportId}`}
                        style={{
                          flex: '1 1 180px',
                          background: 'var(--secondary, #00A6A6)',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '14px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          boxShadow: '0 4px 12px rgba(0, 166, 166, 0.25)'
                        }}
                      >
                        <ShieldCheck size={18} /> View Full Report Page &rarr;
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })()}

            {/* AI REPORT (Toggled) */}
            {predictionResult && showReport && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} id="ai-report-container" style={{ marginTop: '24px', padding: '24px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                    <ShieldCheck size={20} color="var(--secondary)" /> Diagnostic Report
                  </h3>
                  <button onClick={handleDownloadPDF} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '8px 12px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <Download size={14} /> PDF
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: 'var(--card-bg-dark)', padding: '16px', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Patient</span>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{userName}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Date</span>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Detected Anomaly</span>
                    <span style={{ fontWeight: 800, color: 'var(--secondary)', fontSize: '0.9rem', textTransform: 'capitalize' }}>{predictionResult.condition?.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>AI Model</span>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>DentaAI Core v2</span>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clinical Observation</h4>
                  <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    The uploaded image shows visual features associated with the predicted condition. {predictionResult.recommendation}
                  </p>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recommended Actions</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {getCareSuggestions(predictionResult.condition).suggestions.map((sug, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--secondary)', borderRadius: '50%', padding: '4px', flexShrink: 0, marginTop: '2px' }}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <span style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{sug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* ACTIVE CONSULTATION / SPECIALIST CARD (Balances Left & Right Columns!) */}
          {consultations && consultations.length > 0 ? (
            <motion.div variants={item} className="card patient-consultation-quick-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(0, 166, 166, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Stethoscope size={16} color="#00A6A6" />
                  </div>
                  <h3 style={{ fontWeight: 800, color: '#17324D', margin: 0, fontSize: '1rem' }}>Active Consultations</h3>
                </div>
                <Link to="/dashboard/patient/consultations" style={{ fontSize: '0.8rem', color: '#00A6A6', fontWeight: 800, textDecoration: 'none' }}>
                  View All ({consultations.length}) &rarr;
                </Link>
              </div>

              {(() => {
                const activeC = consultations[0];
                const cleanDocName = `Dr. ${(activeC.doctorName || 'Doctor').replace(/^(Dr\.?\s*)+/i, '').trim()}`;
                const initials = cleanDocName.replace(/^(Dr\.?\s*)+/i, '').trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'DR';
                const isPending = !activeC.status || ['Pending', 'Booked'].includes(activeC.status);

                return (
                  <div>
                    <div className="consultation-quick-top">
                      <div className="consultation-quick-avatar">
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                          <strong style={{ fontSize: '0.95rem', color: '#17324D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cleanDocName}
                          </strong>
                          <span 
                            style={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 800, 
                              padding: '2px 8px', 
                              borderRadius: '999px',
                              background: isPending ? '#FEF3C7' : '#DCFCE7',
                              color: isPending ? '#B45309' : '#15803D',
                              border: isPending ? '1px solid #FDE68A' : '1px solid #BBF7D0',
                              flexShrink: 0
                            }}
                          >
                            {activeC.status || 'Pending'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#00A6A6', fontWeight: 700, display: 'block' }}>
                          {activeC.doctorSpecialization || 'Specialist'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.74rem', color: '#64748B', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={11} color="#00A6A6" /> {activeC.date || 'Scheduled'} {activeC.time ? `@ ${activeC.time}` : ''}
                          </span>
                          <span>•</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {activeC.consultationType === 'Video Consultation' ? <Video size={11} color="#00A6A6" /> : <MessageSquare size={11} color="#1677FF" />}
                            {activeC.consultationType === 'Video Consultation' ? 'Video' : 'Chat'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
                        Case <strong style={{ color: '#17324D' }}>P-{activeC.id ? activeC.id.toString().substring(0, 6) : 'ACTIVE'}</strong>
                      </span>
                      <Link 
                        to={`/dashboard/patient/consultation/${activeC.id || activeC._id}/messages`}
                        className="btn btn-primary btn-sm font-bold"
                        style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '0.8rem', textDecoration: 'none' }}
                      >
                        Open Workspace &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          ) : (
            <motion.div variants={item} className="card patient-consultation-quick-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(0, 166, 166, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Stethoscope size={22} color="#00A6A6" />
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '0.98rem', color: '#17324D', display: 'block', marginBottom: '2px' }}>
                    Connect with a Dental Specialist
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B', lineHeight: 1.4 }}>
                    Have our verified periodontists and dentists review your AI findings and issue clinical prescriptions.
                  </p>
                </div>
              </div>
              <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                <Link 
                  to="/dashboard/patient/recommended-doctors" 
                  className="btn btn-outline btn-sm font-bold"
                  style={{ borderRadius: '10px', padding: '6px 14px', fontSize: '0.82rem' }}
                >
                  <UserCheck size={14} /> Find Specialists &rarr;
                </Link>
              </div>
            </motion.div>
          )}

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TIPS FOR BEST RESULTS (2x2 Grid) */}
          <motion.div variants={item} className="card" style={{ background: '#FFFFFF', border: '1px solid #BFD4E5', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(7, 26, 51, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 800, color: '#17324D', margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={18} color="#00A6A6" /> Photography Tips for Best Results
              </h3>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: '999px' }}>
                Clinical Guide
              </span>
            </div>
            
            <div className="patient-tips-grid">
              <div className="patient-tip-tile">
                <span className="tip-icon-tag">💡 Lighting</span>
                <p className="tip-tile-text">Ensure bright, direct front light across teeth and gums.</p>
              </div>
              <div className="patient-tip-tile">
                <span className="tip-icon-tag">🎯 Focus</span>
                <p className="tip-tile-text">Center clearly on target teeth or specific affected area.</p>
              </div>
              <div className="patient-tip-tile">
                <span className="tip-icon-tag">📐 Angle</span>
                <p className="tip-tile-text">Open mouth gently and take direct upper/lower arch shots.</p>
              </div>
              <div className="patient-tip-tile">
                <span className="tip-icon-tag">📸 Steady</span>
                <p className="tip-tile-text">Keep camera steady; avoid motion blur or light reflection.</p>
              </div>
            </div>
          </motion.div>

          {/* SCREENING HISTORY */}
          <motion.div variants={item} className="card" style={{ background: '#FFFFFF', border: '1px solid #BFD4E5', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(7, 26, 51, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(22, 119, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={15} color="#1677FF" />
                </div>
                <h3 style={{ fontWeight: 800, color: '#17324D', margin: 0, fontSize: '1.05rem' }}>Screening History</h3>
              </div>
              <Link to="/dashboard/patient/screening-history" style={{ fontSize: '0.82rem', color: '#00A6A6', fontWeight: 800, textDecoration: 'none' }}>
                View All &rarr;
              </Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {scanHistory.length === 0 ? (
                <div style={{ padding: '30px 10px', textAlign: 'center', background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
                  <FileStack size={32} color="#94A3B8" style={{ margin: '0 auto 10px' }} />
                  <p style={{ margin: 0, color: '#17324D', fontWeight: 700, fontSize: '0.92rem' }}>No scan history yet</p>
                  <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.82rem' }}>Upload your first image to get started.</p>
                </div>
              ) : (
                scanHistory.slice(0, 4).map((scan, idx) => {
                  const dateObj = new Date(scan.createdAt);
                  const isHigh = scan.confidence > 90;
                  const dotColor = isHigh ? '#10B981' : scan.confidence > 70 ? '#F59E0B' : '#EF4444';
                  const scanReportId = scan._id || scan.scanId || scan.id;
                  
                  return (
                    <Link 
                      key={scanReportId || idx}
                      to={scanReportId ? `/dashboard/patient/reports/${scanReportId}` : '#'}
                      className="patient-history-item"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: dotColor, flexShrink: 0 }}></div>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ margin: '0 0 2px 0', fontSize: '0.92rem', fontWeight: 800, color: '#17324D', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {scan.condition.replace(/_/g, ' ')}
                          </h4>
                          <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
                            {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <span style={{ background: '#F0FDFA', color: '#00A6A6', border: '1px solid #99F6E4', padding: '3px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800 }}>
                          {scan.confidence}%
                        </span>
                        <ChevronRight size={15} color="#94A3B8" />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* PERSONAL PRESCRIPTION SECTION (Below Screening History) */}
          {(predictionResult || (scanHistory && scanHistory.length > 0)) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <PersonalPrescriptionSection
                condition={predictionResult?.condition || scanHistory[0]?.condition}
                confidence={predictionResult?.confidence || scanHistory[0]?.confidence}
                scanId={predictionResult?._id || predictionResult?.id || scanHistory[0]?._id || scanHistory[0]?.id || scanHistory[0]?.scanId}
                style={{ marginTop: 0 }}
              />
            </motion.div>
          )}

        </div>
      </div>
    </motion.div>
  );
};

const KPICard = ({ icon, value, label, color, bg, borderColor, tag }) => (
  <motion.div 
    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} 
    whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(7, 26, 51, 0.08)' }}
    className="patient-kpi-card"
    style={{ borderTop: `3px solid ${borderColor}` }}
  >
    <div className="patient-kpi-card-left">
      <div className="patient-kpi-icon" style={{ background: bg, color: color }}>
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span className="patient-kpi-value">{value}</span>
        <span className="patient-kpi-label">{label}</span>
      </div>
    </div>
    {tag && (
      <span 
        className="patient-kpi-tag" 
        style={{ 
          color: color, 
          background: bg,
          border: `1px solid ${borderColor}40` 
        }}
      >
        {tag}
      </span>
    )}
  </motion.div>
);

export default PatientDashboard;
