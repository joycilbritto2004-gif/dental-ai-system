import { useState, useEffect } from 'react';
import { Activity, Search, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';

const AdminPredictions = () => {
  const [scans, setScans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/scans/all');
        if (res.ok) {
          const data = await res.json();
          setScans(data);
        }
      } catch (err) {
        console.error("Failed to fetch scans:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchScans();
  }, []);

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const filteredScans = scans.filter(scan => 
    scan.scanId?.toLowerCase().includes(search.toLowerCase()) || 
    scan.condition?.toLowerCase().includes(search.toLowerCase()) ||
    scan.patientId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header flex-between mb-6">
        <div>
          <h2>System Predictions</h2>
          <p>Global log of all AI inferences and diagnostic results.</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
        <div className="flex-between mb-6">
          <div className="search-bar flex-align-center" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', width: '300px' }}>
            <Search size={18} className="text-muted mr-2" />
            <input 
              type="text" 
              placeholder="Search by condition or scan ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', outline: 'none', width: '100%' }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center"><Activity className="animate-spin mx-auto text-primary mb-4" size={32} /> Loading Predictions...</div>
        ) : (
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Scan ID</th>
                  <th>Patient ID</th>
                  <th>Condition Detected</th>
                  <th>Confidence</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredScans.length > 0 ? filteredScans.map(scan => (
                  <motion.tr key={scan._id} whileHover={{ backgroundColor: 'rgba(0, 210, 255, 0.05)' }}>
                    <td className="font-bold text-primary">{scan.scanId}</td>
                    <td className="text-muted text-sm">{scan.patientId?.substring(0, 8)}...</td>
                    <td className="flex-align-center gap-2" style={{ textTransform: 'capitalize' }}>
                      <BrainCircuit size={16} className={scan.confidence > 80 ? "text-primary" : "text-warning"} />
                      {scan.condition.replace('_', ' ')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px' }}>
                          <div style={{ width: `${scan.confidence}%`, height: '100%', background: scan.confidence > 80 ? 'var(--primary)' : '#f59e0b', borderRadius: '3px' }}></div>
                        </div>
                        <span className="text-sm font-bold">{scan.confidence}%</span>
                      </div>
                    </td>
                    <td className="text-muted text-sm">{new Date(scan.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className="badge" style={{ background: scan.confidence > 80 ? 'rgba(0, 210, 255, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: scan.confidence > 80 ? 'var(--secondary)' : '#059669' }}>
                        {scan.confidence > 80 ? 'Pending Verification' : 'Verified'}
                      </span>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="text-center p-4 text-muted">No predictions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AdminPredictions;
