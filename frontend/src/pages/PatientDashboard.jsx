import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, HeartPulse, CheckCircle2, Clock, Info, X, ShieldCheck, Search, Calendar, Zap, FileText, Download, Check, FileStack, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getCareSuggestions } from '../utils/careSuggestions';
import { generatePDF } from '../utils/pdfGenerator';
import './Dashboard.css';

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

  const [userName, setUserName] = useState('');
  
  const fetchScanHistory = async () => {
    try {
      const userStr = localStorage.getItem('dentaai_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const res = await fetch(`http://localhost:5000/api/scans/${user._id || user.id}`);
      if (res.ok) {
        const data = await res.json();
        setScanHistory(data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const fetchConsultations = async () => {
    try {
      const userStr = localStorage.getItem('dentaai_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const res = await fetch(`http://localhost:5000/api/consultations?patientId=${user._id || user.id}`);
      if (res.ok) {
        const data = await res.json();
        setConsultations(data);
      }
    } catch (err) {
      console.error('Error fetching consultations:', err);
    }
  };

  useEffect(() => {
    fetchScanHistory();
    fetchConsultations();
    const userStr = localStorage.getItem('dentaai_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || '');
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const totalScans = scanHistory.length;
  const verifiedScans = scanHistory.filter(s => s.confidence > 90).length;
  const pendingScans = scanHistory.filter(s => s.confidence > 70 && s.confidence <= 90).length;
  const healthStatus = totalScans === 0 ? "N/A" : (scanHistory[0].confidence > 90 ? "Good" : scanHistory[0].confidence > 70 ? "Attention" : "Critical");

  // Chart data (sorted oldest to newest)
  const chartData = [...scanHistory].reverse().map(scan => {
    const d = new Date(scan.createdAt);
    return {
      name: `${d.getDate()}/${d.getMonth()+1}`,
      confidence: scan.confidence,
      condition: scan.condition.replace('_', ' ')
    };
  });

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
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
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
      const response = await fetch('http://localhost:5000/api/ai/predict', {
        method: 'POST',
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

      setTimeout(async () => {
        setIsLoading(false);
        let finalData = { ...data };

        try {
          const userStr = localStorage.getItem('dentaai_user');
          if (userStr) {
            const user = JSON.parse(userStr);
            const scanId = `SCAN-${Math.floor(Math.random() * 1000000)}`;
            const payload = {
              patientId: user._id || user.id,
              condition: data.condition,
              confidence: data.confidence,
              recommendation: data.recommendation,
              scanId,
              imagePath: data.imagePath || 'uploaded_image'
            };

            const saveRes = await fetch('http://localhost:5000/api/scans', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (saveRes.ok) {
              const newScan = await saveRes.json();
              setScanHistory(prev => [newScan, ...prev]);
              finalData = { ...finalData, _id: newScan._id, date: newScan.createdAt };
            }
          }
        } catch (saveErr) {
          console.error("Failed to save scan history", saveErr);
        }
        
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
      <motion.div variants={item} className="mb-6" style={{ background: 'var(--card-bg)', padding: '36px 40px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '40%', background: 'radial-gradient(circle at top right, rgba(0, 210, 255, 0.08), transparent 70%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--secondary)' }}></div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--secondary)', marginBottom: '8px', display: 'block' }}>Patient Portal</span>
          <h2 className="font-extrabold mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px', fontSize: '2.5rem', lineHeight: '1.2', margin: 0 }}>Welcome back{userName ? `, ${userName}` : ''} 👋</h2>
          <p className="font-medium m-0" style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Monitor your dental health with advanced AI insights and professional guidance.</p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={stagger} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <KPICard icon={<ImageIcon size={24} />} value={totalScans.toString()} label="Total Scans" color="#0ea5e9" bg="rgba(14, 165, 233, 0.1)" />
        <KPICard icon={<Clock size={24} />} value={pendingScans.toString()} label="Pending Reviews" color="#f59e0b" bg="rgba(245, 158, 11, 0.1)" />
        <KPICard icon={<CheckCircle2 size={24} />} value={verifiedScans.toString()} label="Verified Results" color="#10b981" bg="rgba(16, 185, 129, 0.1)" />
        <KPICard icon={<HeartPulse size={24} />} value={healthStatus} label="Health Status" color="#00d2ff" bg="rgba(0, 210, 255, 0.1)" />
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* UPLOAD CARD */}
          <motion.div variants={item} className="card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', fontSize: '1.5rem' }}>Start a New AI Scan</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontWeight: 500, fontSize: '1rem' }}>Upload a clear intraoral image for neural network analysis.</p>
            </div>
            
            <div className={`upload-zone interactive ${selectedImage ? 'has-image' : ''}`} onClick={triggerFileInput}
              style={{ 
                background: selectedImage ? 'var(--card-bg)' : 'var(--card-bg-dark)', 
                border: selectedImage ? 'none' : '2px dashed rgba(0, 210, 255, 0.4)', 
                borderRadius: '16px',
                padding: selectedImage ? '0' : '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative', 
                overflow: 'hidden' 
              }}>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
              <AnimatePresence>
                {selectedImage ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative' }}>
                    <img src={selectedImage} alt="Preview" className="preview-image" style={{ borderRadius: '16px', width: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block' }} />
                    <button onClick={handleRemoveImage} style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <X size={16} />
                    </button>
                    {isLoading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>
                        <div style={{ width: '60px', height: '60px', border: '4px solid rgba(0, 210, 255, 0.2)', borderTopColor: 'var(--secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
                        <div style={{ color: 'var(--secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Analyzing Image...</div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ background: 'rgba(0, 210, 255, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Upload size={28} color="var(--secondary)" />
                    </div>
                    <h4 style={{ color: 'var(--text-primary)', fontWeight: 800, margin: '0 0 8px 0', fontSize: '1.1rem' }}>Drop intraoral image here</h4>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem', display: 'block' }}>or click to browse from your device</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem', display: 'block', marginTop: '12px', opacity: 0.7 }}>Supported formats: JPG, PNG (Max 10MB)</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}><Info size={18} /> {error}</motion.div>}
            
            {selectedImage && !predictionResult && !isLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '24px' }}>
                <button className="btn btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem', boxShadow: '0 4px 15px rgba(0, 210, 255, 0.3)' }} onClick={handleRunAnalysis}>
                  <Zap size={18} /> Analyze with DentaAI
                </button>
              </motion.div>
            )}

            {/* PREDICTION RESULT CARD */}
            {predictionResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '24px', padding: '28px', background: 'rgba(0, 210, 255, 0.05)', border: '2px solid rgba(0, 210, 255, 0.3)', borderRadius: '20px', color: 'var(--text-primary)', boxShadow: '0 8px 32px rgba(0, 210, 255, 0.1)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(0,210,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
                <h4 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.25rem' }}>
                  <div style={{ background: 'var(--card-bg)', padding: '8px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex' }}>
                    <ShieldCheck size={24} color="var(--secondary)" />
                  </div>
                  AI Analysis Complete
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--secondary)' }}></div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', paddingLeft: '8px' }}>Detected Condition</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '8px', textTransform: 'capitalize', paddingLeft: '8px' }}>{predictionResult.condition?.replace('_', ' ')}</div>
                  </div>
                  <div style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>AI Confidence</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>{predictionResult.confidence}%</div>
                      <div style={{ flex: 1, height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${predictionResult.confidence}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: 'var(--secondary)' }}></motion.div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '24px', background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HeartPulse size={16} color="var(--secondary)" /> What to do next
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>{predictionResult.recommendation}</p>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <button onClick={() => setShowReport(!showReport)} style={{ flex: 1, background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <FileText size={18} /> {showReport ? 'Hide Full Report' : 'View Full Report'}
                  </button>
                  <Link to={`/dashboard/patient/recommended-doctors`} state={{ predictionResult }} style={{ flex: 1, background: 'var(--secondary)', color: '#FFFFFF', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0, 210, 255, 0.3)' }}>
                    <Search size={18} /> Professional Verification
                  </Link>
                </div>
              </motion.div>
            )}

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

          {/* DENTAL HEALTH PROGRESS */}
          <motion.div variants={item} className="card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', fontSize: '1.25rem' }}>AI Health Progression</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 24px 0', fontWeight: 500, fontSize: '0.9rem' }}>Track confidence trends across your recent scan history.</p>
            
            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} dx={-10} />
                    <Tooltip 
                      contentStyle={{ background: '#FFFFFF', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 700 }} 
                      itemStyle={{ color: 'var(--secondary)', fontWeight: 800 }} 
                      labelStyle={{ color: '#CBD5E1', marginBottom: '4px' }}
                    />
                    <Line type="monotone" dataKey="confidence" stroke="var(--secondary)" strokeWidth={3} dot={{ fill: '#FFFFFF', stroke: 'var(--secondary)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: 'var(--secondary)', stroke: '#FFFFFF', strokeWidth: 2 }} name="Confidence %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--card-bg-dark)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                <div style={{ background: 'var(--card-bg)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <HeartPulse size={24} color="var(--text-muted)" />
                </div>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontWeight: 800 }}>No Progression Data</h4>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Your health chart will generate after you complete your first AI scan.</p>
              </div>
            )}
          </motion.div>

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CONSULTATION CTA */}
          <motion.div variants={item} style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1e293b 100%)', borderRadius: '24px', padding: '32px', color: '#FFFFFF', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', background: 'var(--secondary)', opacity: 0.15, borderRadius: '50%', filter: 'blur(30px)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(0, 210, 255, 0.2)', padding: '10px', borderRadius: '12px', color: 'var(--secondary)' }}><ShieldCheck size={24} /></div>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>Need Professional Verification?</h3>
            </div>
            <p style={{ margin: '0 0 24px 0', fontSize: '1rem', opacity: 0.9, lineHeight: 1.5, fontWeight: 500 }}>Connect with verified dental specialists to review your AI scan results and get a personalized care plan.</p>
            <Link to="/dashboard/patient/recommended-doctors" state={{ predictionResult }} style={{ background: 'var(--secondary)', color: '#FFFFFF', padding: '14px 24px', borderRadius: '12px', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0, 210, 255, 0.25)' }}>
              Get Verified by a Dentist <ArrowRight size={18} />
            </Link>
          </motion.div>

          {/* UPCOMING FOLLOW-UP (If exists) */}
          {upcomingFollowUp && (
            <motion.div variants={item} className="card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(0, 210, 255, 0.1)', padding: '8px', borderRadius: '12px', color: 'var(--secondary)' }}><Calendar size={20} /></div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 800 }}>Upcoming Follow-up</h3>
              </div>
              <div style={{ background: 'var(--card-bg-dark)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <p style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontWeight: 800, fontSize: '1rem' }}>{new Date(upcomingFollowUp.followUpDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.5 }}>{upcomingFollowUp.followUpNote || 'Follow-up consultation scheduled.'}</p>
                <Link to={`/dashboard/patient/consultations`} style={{ display: 'block', textAlign: 'center', background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', color: 'var(--text-primary)', fontSize: '0.9rem' }}>View Consultation</Link>
              </div>
            </motion.div>
          )}

          {/* TIPS FOR BEST RESULTS */}
          <motion.div variants={item} className="card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="var(--text-muted)" /> Tips for Best Results
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <CheckCircle2 size={16} color="var(--secondary)" />
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Use clear, well-lit images</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <CheckCircle2 size={16} color="var(--secondary)" />
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Focus clearly on the affected area</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <CheckCircle2 size={16} color="var(--secondary)" />
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Avoid blurry or extremely dark photos</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <CheckCircle2 size={16} color="var(--secondary)" />
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Keep the camera steady while capturing</span>
              </div>
            </div>
          </motion.div>

          {/* RECENT SCANS */}
          <motion.div variants={item} className="card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontSize: '1.1rem' }}>Screening History</h3>
              <Link to="/dashboard/patient/reports" style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 700, textDecoration: 'none' }}>View All</Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {scanHistory.length === 0 ? (
                <div style={{ padding: '30px 10px', textAlign: 'center', background: 'var(--card-bg-dark)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                  <FileStack size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>No scan history yet</p>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Upload your first image to get started.</p>
                </div>
              ) : (
                scanHistory.slice(0, 4).map((scan) => {
                  const dateObj = new Date(scan.createdAt);
                  const dotColor = scan.confidence > 90 ? '#10b981' : scan.confidence > 70 ? '#f59e0b' : '#ef4444';
                  
                  return (
                    <div key={scan._id || scan.scanId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--card-bg-dark)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: dotColor }}></div>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{scan.condition.replace('_', ' ')}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <div style={{ background: 'var(--card-bg)', padding: '4px 10px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        {scan.confidence}%
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
};

const KPICard = ({ icon, value, label, color, bg }) => (
  <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}
    style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', background: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', transition: 'all 0.2s' }}>
    <div style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color: color, borderRadius: '16px', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <span style={{ display: 'block', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</span>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    </div>
  </motion.div>
);

export default PatientDashboard;
