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

  useEffect(() => {
    fetchScanHistory();
  }, []);

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
      className="dashboard-view"
      initial="hidden"
      animate="show"
      variants={stagger}
    >
      <motion.div variants={item} className="mb-8 page-header-card" style={{ padding: '32px 40px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', background: 'radial-gradient(circle at top right, rgba(0, 210, 255, 0.12), transparent 70%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--secondary)' }}></div>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <h2 className="font-extrabold mb-2" style={{ color: '#172033', letterSpacing: '-0.5px', fontSize: '2.5rem', lineHeight: '1.2', margin: 0 }}>My Reports</h2>
          <p className="font-medium m-0" style={{ color: '#64748B', fontSize: '1.1rem' }}>View and manage your AI dental analysis reports.</p>
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
        <motion.div variants={item} className="card text-center mb-6" style={{ padding: '60px 20px', background: 'var(--bg-card)', border: '1px dashed var(--border-color)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '50%', border: '1px solid var(--border-color)' }}>
              <FileText size={48} className="text-muted" opacity={0.5} />
            </div>
          </div>
          <h3 className="mb-2" style={{ color: '#172033', fontWeight: 'bold' }}>No Reports Yet</h3>
          <p className="text-muted">Your AI dental analysis reports will appear here after you complete a scan.</p>
        </motion.div>
      ) : (
        <>
          <motion.div variants={item} className="card mb-6" style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
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
                <motion.div key={scan._id || scan.scanId} variants={item} className="card" style={{ padding: '32px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: `var(--${status.color})` }}></div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'space-between', alignItems: 'center' }}>
                    
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flex: '1 1 400px' }}>
                      {/* Image Thumbnail Placeholder */}
                      <div style={{ flexShrink: 0, width: '80px', height: '80px', borderRadius: '16px', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                        <ImageIcon size={32} color="var(--secondary)" opacity={0.7} />
                      </div>
                      
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h4 style={{ color: '#172033', fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ textTransform: 'capitalize' }}>{scan.condition.replace('_', ' ')}</span>
                          <span className={`badge bg-${status.color}-light text-${status.color}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 800 }}>
                            {status.icon} {status.text}
                          </span>
                        </h4>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', color: '#64748B', fontSize: '0.95rem', fontWeight: 500 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={16} />
                            {dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Scan ID: <strong style={{ color: '#172033' }}>{scan.scanId || scan._id}</strong>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={16} />
                            Confidence: <strong style={{ color: 'var(--secondary)' }}>{scan.confidence}%</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', fontWeight: 'bold' }}
                        onClick={() => window.print()}
                      >
                        <FileText size={16} /> Download PDF
                      </button>
                      <button 
                        className="btn btn-primary" 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(0, 210, 255, 0.25)' }}
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


