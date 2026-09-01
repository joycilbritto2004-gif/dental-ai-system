import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, ShieldCheck, AlertTriangle, Calendar } from 'lucide-react';
import '../Dashboard.css';

const PatientPredictions = () => {
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchScanHistory();
  }, []);

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
      className="dashboard-content"
      initial="hidden"
      animate="show"
      variants={stagger}
    >
      <div className="flex-between mb-6">
        <div>
          <h2>My Predictions</h2>
          <p className="text-muted">Complete history of your AI dental scans</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <Activity className="spin-anim" size={40} color="var(--secondary)" />
        </div>
      ) : error ? (
        <div className="card text-center" style={{ padding: '40px' }}>
          <p className="text-danger">{error}</p>
        </div>
      ) : scanHistory.length === 0 ? (
        <motion.div variants={item} className="card text-center" style={{ padding: '60px 20px', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', color: 'var(--text-muted)' }}>
            <Activity size={64} opacity={0.5} />
          </div>
          <h3 className="mb-2">No scan history yet</h3>
          <p className="text-muted mb-6">Upload a dental image and run an AI scan to see your results here.</p>
        </motion.div>
      ) : (
        <motion.div variants={item} className="dashboard-grid">
          <div className="dashboard-left-col" style={{ width: '100%' }}>
            <div className="list-group">
              {scanHistory.map((scan) => {
                const dateObj = new Date(scan.createdAt);
                const color = getStatusColor(scan.confidence);
                
                return (
                  <div key={scan._id} className="list-item glass-card mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="list-info" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div className={`list-icon`} style={{ background: `var(--${color})`, opacity: 0.1, position: 'absolute', width: '48px', height: '48px', borderRadius: '12px' }}></div>
                      <div className="list-icon" style={{ color: `var(--${color})`, position: 'relative', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getStatusIcon(scan.confidence)}
                      </div>
                      <div>
                        <h4 style={{ color: 'var(--primary)', fontSize: '1.2rem', marginBottom: '4px' }}>
                          {scan.condition.replace('_', ' ')} <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>({scan.confidence}%)</span>
                        </h4>
                        <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={14} />
                            {dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            Scan ID: {scan.scanId}
                          </span>
                        </div>
                      </div>
                    </div>
                    {scan.recommendation && (
                      <div className="list-action" style={{ maxWidth: '300px', textAlign: 'right' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>{scan.recommendation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PatientPredictions;
