import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Calendar, Activity, ShieldCheck, Clock, AlertTriangle, Image as ImageIcon, Search } from 'lucide-react';
import '../Dashboard.css';

const PatientReports = () => {
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

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
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setScanHistory(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (confidence) => {
    if (confidence > 90) return { color: 'success', icon: <ShieldCheck size={18} />, text: 'Verified' };
    if (confidence > 70) return { color: 'warning', icon: <Clock size={18} />, text: 'Pending Review' };
    return { color: 'danger', icon: <AlertTriangle size={18} />, text: 'Requires Attention' };
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const filteredReports = scanHistory.filter(scan => 
    (scan.condition && scan.condition.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (scan.scanId && scan.scanId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <motion.div 
      className="dashboard-content"
      initial="hidden"
      animate="show"
      variants={stagger}
    >
      <div className="flex-between mb-6">
        <div>
          <h2>My Reports</h2>
          <p className="text-muted">Access and review your detailed AI dental analysis reports</p>
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
        <motion.div variants={item} className="card text-center mb-6" style={{ padding: '60px 20px', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <FileText size={64} className="text-muted" opacity={0.5} />
          </div>
          <h3 className="mb-2">No reports available yet.</h3>
          <p className="text-muted">Upload an image and complete an AI scan to generate your first report.</p>
        </motion.div>
      ) : (
        <>
          <motion.div variants={item} className="card mb-6" style={{ padding: '16px' }}>
            <div className="search-input-wrapper" style={{ position: 'relative' }}>
              <Search size={20} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search reports by condition or ID..." 
                style={{ paddingLeft: '2.8rem', width: '100%', maxWidth: '400px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </motion.div>
          
          <motion.div variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredReports.map((scan) => {
              const dateObj = new Date(scan.createdAt);
              const status = getStatusInfo(scan.confidence);
              
              return (
                <motion.div key={scan._id || scan.scanId} variants={item} className="card glass-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
                    
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1, minWidth: '300px' }}>
                      {/* Image Thumbnail Placeholder */}
                      <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'rgba(6, 198, 232, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(6, 198, 232, 0.2)' }}>
                        <ImageIcon size={32} color="var(--secondary)" opacity={0.7} />
                      </div>
                      
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, color: 'var(--primary)', textTransform: 'capitalize' }}>
                            {scan.condition.replace('_', ' ')}
                          </h3>
                          <span className={`badge bg-${status.color}-light text-${status.color}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                            {status.icon} {status.text}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '20px', color: 'var(--text-muted)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} />
                            {dateObj.toLocaleDateString()}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Activity size={14} />
                            AI Confidence: <strong style={{ color: 'var(--secondary)' }}>{scan.confidence}%</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <button 
                        className="btn btn-outline" 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={() => navigate(`/dashboard/patient/reports/${scan._id || scan.scanId}`)}
                      >
                        <FileText size={16} /> View Report
                      </button>
                    </div>
                    
                  </div>
                </motion.div>
              );
            })}
            
            {filteredReports.length === 0 && (
              <div className="text-center p-6 text-muted">
                No reports found matching your search.
              </div>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default PatientReports;
