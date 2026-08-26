import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Activity, Image as ImageIcon, HeartPulse, CheckCircle2, Clock, Info, X, ShieldCheck, Search, User, MapPin, Calendar, DollarSign, Star, Zap, AlertCircle } from 'lucide-react';
import './Dashboard.css';

const recommendedDoctors = [
  { id: 1, name: "Dr. Ananya Sharma", spec: "General & Cosmetic Dentist", clinic: "SmileCare Dental Clinic", exp: "12 years", fee: "₹500", loc: "Bengaluru, Karnataka", rating: 4.8 },
  { id: 2, name: "Dr. Rahul Nair", spec: "Endodontist", clinic: "DentalCare Advanced Clinic", exp: "10 years", fee: "₹700", loc: "Kochi, Kerala", rating: 4.9 },
  { id: 3, name: "Dr. Priya Menon", spec: "Orthodontist", clinic: "Perfect Smile Dental Centre", exp: "9 years", fee: "₹600", loc: "Mangaluru, Karnataka", rating: 4.7 },
  { id: 4, name: "Dr. Arjun Patel", spec: "Oral & Maxillofacial Surgeon", clinic: "City Dental Hospital", exp: "14 years", fee: "₹900", loc: "Mumbai, Maharashtra", rating: 4.9 },
];

const PatientDashboard = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);
  const [showDoctors, setShowDoctors] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchScanHistory();
  }, []);

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

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(URL.createObjectURL(e.target.files[0]));
      setImageFile(e.target.files[0]);
      setError(null);
      setPredictionResult(null);
      setShowDoctors(false);
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setSelectedImage(null);
    setImageFile(null);
    setPredictionResult(null);
    setError(null);
    setShowDoctors(false);
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
    setShowDoctors(false);

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await fetch('http://localhost:5002/api/ai/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Add a slight delay for dramatic effect
      setTimeout(async () => {
        setPredictionResult(data);
        setIsLoading(false);

        // Save scan result to backend
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
              imagePath: 'uploaded_image' // Hardcoded for demo if no real upload path
            };

            const saveRes = await fetch('http://localhost:5000/api/scans', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (saveRes.ok) {
              const newScan = await saveRes.json();
              setScanHistory(prev => [newScan, ...prev]);
            }
          }
        } catch (saveErr) {
          console.error("Failed to save scan history", saveErr);
        }
      }, 1500);

    } catch (err) {
      console.error("API Error:", err);
      setError("Failed to connect to the AI neural network. Please ensure the AI server is active.");
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="dashboard-view"
      initial="hidden"
      animate="show"
      variants={stagger}
    >
      <motion.div variants={item} className="dashboard-header">
        <h2>Welcome back 👋</h2>
        <p>Monitor your dental health with advanced AI insights.</p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={stagger} className="kpi-grid">
        <KPICard icon={<ImageIcon size={24} />} value="12" label="Total Scans" color="blue" />
        <KPICard icon={<Clock size={24} />} value="2" label="Pending Review" color="warning" />
        <KPICard icon={<CheckCircle2 size={24} />} value="10" label="Verified Results" color="success" />
        <KPICard icon={<HeartPulse size={24} />} value="Good" label="Health Status" color="primary" />
      </motion.div>

      <div className="dashboard-grid mt-6">
        <div className="dashboard-left-col">
          
          {/* Futuristic Upload Zone */}
          <motion.div variants={item} className="card">
            <div className="card-header">
              <h3>Initiate AI Scan</h3>
            </div>
            <p className="text-muted mb-4">
              Upload a clear intraoral image for neural network analysis.
            </p>
            
            <div 
              className={`upload-zone interactive ${selectedImage ? 'has-image' : ''}`} 
              onClick={triggerFileInput}
              style={{
                background: selectedImage ? 'transparent' : 'rgba(0, 210, 255, 0.05)',
                borderColor: selectedImage ? 'transparent' : 'rgba(0, 210, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
              
              <AnimatePresence>
                {selectedImage ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="image-preview-container"
                    style={{ borderRadius: '12px', border: '1px solid var(--border-glass)' }}
                  >
                    <img src={selectedImage} alt="Preview" className="preview-image" style={{ borderRadius: '12px' }} />
                    <button className="remove-image-btn" onClick={handleRemoveImage}>
                      <X size={20} />
                    </button>

                    {/* Scanning Animation Overlay */}
                    {isLoading && (
                      <motion.div 
                        className="scanning-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(10, 25, 47, 0.6)' }}
                      >
                        <motion.div 
                          className="laser-scanner"
                          animate={{ y: ['0%', '100%', '0%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          style={{
                            width: '100%', height: '4px', background: '#00f0ff',
                            boxShadow: '0 0 20px #00f0ff, 0 0 40px #00f0ff'
                          }}
                        />
                        <div style={{ position: 'absolute', bottom: '20px', left: 0, width: '100%', textAlign: 'center', color: '#00f0ff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px' }}>
                          Processing Neural Network...
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div className="upload-placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="upload-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.1), rgba(58, 134, 255, 0.1))', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
                      <Upload size={32} color="#00f0ff" />
                    </div>
                    <h4 style={{ color: 'var(--primary)' }}>Drop intraoral image here</h4>
                    <span className="upload-hint">Supported formats: JPG, PNG (Max 10MB)</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="alert alert-danger mt-4" style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '14px' }}>
                <Info size={16} className="inline mr-2" /> {error}
              </motion.div>
            )}
            
            {selectedImage && !predictionResult && !isLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="upload-actions mt-6">
                <button className="btn btn-primary w-full pulse-glow" onClick={handleRunAnalysis}>
                  <Zap size={18} /> Initialize Scan
                </button>
              </motion.div>
            )}

            {/* Premium AI Result Card */}
            {predictionResult && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="prediction-result mt-6" 
                style={{ padding: '24px', background: 'var(--bg-dark)', border: '1px solid rgba(0, 210, 255, 0.3)', borderRadius: '16px', color: 'white', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at top right, rgba(0, 210, 255, 0.15), transparent 70%)', pointerEvents: 'none' }}></div>
                
                <h4 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#00f0ff' }}>
                  <ShieldCheck size={24} /> Neural Network Analysis Complete
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', position: 'relative', zIndex: 2 }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Detected Anomaly</span>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginTop: '4px', textTransform: 'capitalize' }}>
                      {predictionResult.condition?.replace('_', ' ')}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Confidence Score</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#00f0ff' }}>{predictionResult.confidence}%</div>
                      <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${predictionResult.confidence}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: '#00f0ff', boxShadow: '0 0 10px #00f0ff' }}></motion.div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 210, 255, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(0, 210, 255, 0.2)', position: 'relative', zIndex: 2 }}>
                  <span style={{ fontSize: '12px', color: '#00f0ff', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={14} /> Clinical Recommendation
                  </span>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                    {predictionResult.recommendation}
                  </p>
                </div>
              </motion.div>
            )}

            {predictionResult && !showDoctors && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                <button className="btn btn-primary w-full" onClick={() => setShowDoctors(true)}>
                  <Search size={18} /> Connect with a Specialist
                </button>
              </motion.div>
            )}

            {showDoctors && (
              <motion.div 
                className="recommended-doctors mt-8"
                initial="hidden"
                animate="show"
                variants={stagger}
              >
                <h4 style={{ margin: '0 0 20px 0', color: 'var(--primary)', fontSize: '1.25rem', fontWeight: 700 }}>Recommended Specialists</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {recommendedDoctors.map((doc) => (
                    <motion.div key={doc.id} variants={item} whileHover={{ y: -5 }} style={{ display: 'flex', flexDirection: 'column', padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', backdropFilter: 'blur(20px)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 10px rgba(0, 210, 255, 0.3)' }}>
                            <User size={28} />
                          </div>
                          <div>
                            <h5 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--primary)', fontWeight: 700 }}>{doc.name}</h5>
                            <span style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'block' }}>{doc.spec} &bull; {doc.clinic}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.1)', padding: '6px 12px', borderRadius: '999px', color: '#d97706', fontSize: '14px', fontWeight: 700 }}>
                          <Star size={14} fill="currentColor" /> {doc.rating}
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', fontSize: '14px', color: 'var(--text-main)', background: 'rgba(255,255,255,0.5)', padding: '12px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} className="text-secondary" /> {doc.exp} exp.</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} className="text-secondary" /> {doc.loc}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={16} className="text-secondary" /> {doc.fee} / visit</div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Link to={`/dashboard/patient/doctor/${doc.id}`} state={{ predictionResult }} className="btn btn-outline">View Profile</Link>
                        <Link to={`/dashboard/patient/consult-request/${doc.id}`} state={{ predictionResult }} className="btn btn-primary">Consult Now</Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="dashboard-right-col">
          <motion.div variants={item} className="card health-tip-card" style={{ background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.1), rgba(255, 255, 255, 0.8))', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
            <div className="tip-icon" style={{ background: 'var(--primary)', color: '#00f0ff' }}>
              <Info size={24} />
            </div>
            <div className="tip-content">
              <h4 style={{ color: 'var(--primary)' }}>System Tip</h4>
              <p>For the most accurate AI prediction, ensure your intraoral images are well-lit and clearly focused on the affected area.</p>
            </div>
          </motion.div>

          <motion.div variants={item} className="card">
            <div className="card-header">
              <h3>History</h3>
            </div>
            <div className="list-group">
              {scanHistory.length === 0 ? (
                <div className="text-center" style={{ padding: '30px 10px' }}>
                  <p className="text-muted mb-2">No scan history yet</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Upload a dental image and run an AI scan to see your results here.</p>
                </div>
              ) : (
                scanHistory.slice(0, 5).map((scan) => {
                  const dateObj = new Date(scan.createdAt);
                  const color = scan.confidence > 90 ? 'success' : scan.confidence > 70 ? 'warning' : 'danger';
                  const icon = scan.confidence > 90 ? <ShieldCheck size={18} /> : scan.confidence > 70 ? <Clock size={18} /> : <AlertCircle size={18} />;
                  return (
                    <div key={scan._id || scan.scanId} className="list-item" style={{ background: 'rgba(255,255,255,0.5)' }}>
                      <div className="list-info">
                        <div className={`list-icon`} style={{ background: `var(--${color})`, opacity: 0.1, position: 'absolute', width: '36px', height: '36px', borderRadius: '8px' }}></div>
                        <div className="list-icon" style={{ color: `var(--${color})`, position: 'relative' }}>{icon}</div>
                        <div>
                          <h4 style={{ color: 'var(--primary)' }}>{scan.condition.replace('_', ' ')} <span style={{fontSize:'0.8rem', opacity:0.7}}>({scan.confidence}%)</span></h4>
                          <p>{dateObj.toLocaleDateString()}</p>
                        </div>
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

const KPICard = ({ icon, value, label, color }) => (
  <motion.div 
    className="kpi-card glass-card"
    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
    whileHover={{ y: -5 }}
    style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', background: 'var(--bg-card)' }}
  >
    <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: `var(--${color})`, opacity: 0.1, borderRadius: '16px' }}></div>
      <div style={{ color: color === 'primary' ? 'var(--secondary)' : `var(--${color})`, zIndex: 1 }}>{icon}</div>
    </div>
    <div>
      <span style={{ display: 'block', fontSize: '28px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.2 }}>{value}</span>
      <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
    </div>
  </motion.div>
);

export default PatientDashboard;
