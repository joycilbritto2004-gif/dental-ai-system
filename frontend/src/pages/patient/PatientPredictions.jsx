import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Clock, ShieldCheck, AlertTriangle, Calendar } from 'lucide-react';
import '../Dashboard.css';

const PatientPredictions = () => {
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchScanHistory = async () => {
    try {
      const userStr = localStorage.getItem('dentaai_user');
      if (!userStr) {
        throw new Error('User not found');
      }
      const user = JSON.parse(userStr);

      const response = await fetch(`http://localhost:5000/api/scans/${user._id || user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch scan history');
      }

      const data = await response.json();
      setScanHistory(data);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScanHistory();
  }, []);

  const getStatusColor = (confidence) => {
    if (confidence > 90) return 'success';
    if (confidence > 70) return 'warning';
    return 'danger';
  };

  const getStatusIcon = (confidence) => {
    if (confidence > 90) return <ShieldCheck size={20} />;
    if (confidence > 70) return <Clock size={20} />;
    return <AlertTriangle size={20} />;
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div 
      className="dashboard-view"
      initial="hidden"
      animate="show"
      variants={stagger}
    >
      <motion.div 
        variants={item} 
        className="mb-8" 
        style={{ 
          background: 'var(--bg-secondary)', 
          padding: '32px 40px', 
          borderRadius: '24px', 
          border: '1px solid var(--border-color)', 
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', background: 'radial-gradient(circle at top right, rgba(0, 210, 255, 0.12), transparent 70%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--secondary)' }}></div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <h2 className="font-extrabold mb-2" style={{ color: '#F8FAFC', letterSpacing: '-0.5px', fontSize: '2.5rem', lineHeight: '1.2' }}>My Predictions</h2>
          <p className="font-medium m-0" style={{ color: '#CBD5E1', fontSize: '1.1rem' }}>Complete history of your AI dental scans</p>
        </div>
      </motion.div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <Activity className="spin-anim" size={40} color="var(--secondary)" />
        </div>
      ) : error ? (
        <div className="card text-center" style={{ padding: '40px' }}>
          <p className="text-danger">{error}</p>
        </div>
      ) : scanHistory.length === 0 ? (
        <motion.div variants={item} className="card text-center" style={{ padding: '80px 20px', background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', color: '#CBD5E1' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '50%', border: '1px solid var(--border-color)' }}>
              <Activity size={48} className="text-secondary" />
            </div>
          </div>
          <h3 className="mb-3 font-extrabold text-primary" style={{ fontSize: '1.5rem' }}>No predictions yet</h3>
          <p className="text-muted mb-8 font-medium" style={{ fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto 32px' }}>Upload a dental image and run an AI scan to see your results here.</p>
          <Link to="/dashboard/patient" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', padding: '0 32px', height: '56px', borderRadius: '999px', fontSize: '1.05rem', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(0, 210, 255, 0.25)' }}>Start First Scan</Link>
        </motion.div>
      ) : (
        <motion.div variants={item} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {scanHistory.map((scan) => {
            const dateObj = new Date(scan.createdAt);
            const color = getStatusColor(scan.confidence);
            
            return (
              <div key={scan._id} className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', padding: '32px', display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'stretch' }}>
                
                {/* LEFT CONTENT */}
                <div style={{ flex: '1 1 400px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ flexShrink: 0, position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: `var(--${color})`, opacity: 0.1, borderRadius: '16px' }}></div>
                    <div style={{ color: `var(--${color})`, zIndex: 1 }}>{getStatusIcon(scan.confidence)}</div>
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ color: '#F8FAFC', fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ textTransform: 'capitalize' }}>{scan.condition.replace('_', ' ')}</span>
                      <span style={{ color: 'var(--secondary)', fontSize: '0.9rem', background: 'rgba(0, 210, 255, 0.1)', padding: '6px 14px', borderRadius: '999px', fontWeight: 800 }}>{scan.confidence}% Confidence</span>
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', color: '#CBD5E1', fontSize: '0.95rem', fontWeight: 500 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} />
                        {dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Scan ID: <strong style={{ color: '#F8FAFC' }}>{scan.scanId}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT AI RECOMMENDATION */}
                {scan.recommendation && (
                  <div style={{ flex: '1 1 400px', background: 'var(--bg-primary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--secondary)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h5 style={{ color: 'var(--secondary)', margin: '0 0 8px 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>AI Recommendation</h5>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text)', margin: 0, lineHeight: '1.6', fontWeight: 500 }}>
                      {scan.recommendation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
};

export default PatientPredictions;
