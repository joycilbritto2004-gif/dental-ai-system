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
        const token = localStorage.getItem('dentaai_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch('http://localhost:5000/api/scans/all', { headers });
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
          <div className="search-bar flex-align-center" style={{ background: 'rgba(255, 255, 255, 0.85)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(191, 212, 229, 0.70)', width: '300px' }}>
            <Search size={18} className="mr-2" style={{ color: '#536579' }} />
            <input 
              type="text" 
              placeholder="Search by condition or scan ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#17324D', outline: 'none', width: '100%', fontWeight: 500 }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center" style={{ color: '#536579' }}><Activity className="animate-spin mx-auto text-primary mb-4" size={32} /> Loading Predictions...</div>
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
                  <motion.tr key={scan._id} whileHover={{ backgroundColor: 'rgba(22, 119, 255, 0.05)' }}>
                    <td className="font-bold" style={{ color: '#1677FF' }}>{scan.scanId}</td>
                    <td className="text-sm" style={{ color: '#536579' }}>{scan.patientId?.substring(0, 8)}...</td>
                    <td className="flex-align-center gap-2" style={{ textTransform: 'capitalize', color: '#102A43', fontWeight: 600 }}>
                      <BrainCircuit size={16} color={scan.confidence > 80 ? "#1677FF" : "#D97706"} />
                      {scan.condition?.replace('_', ' ')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '6px', background: 'rgba(191, 212, 229, 0.40)', borderRadius: '3px' }}>
                          <div style={{ width: `${scan.confidence}%`, height: '100%', background: scan.confidence > 80 ? '#1677FF' : '#D97706', borderRadius: '3px' }}></div>
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#102A43' }}>{scan.confidence}%</span>
                      </div>
                    </td>
                    <td className="text-sm" style={{ color: '#536579' }}>{new Date(scan.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className="badge" style={{ 
                        background: scan.confidence > 80 ? 'rgba(22, 119, 255, 0.10)' : 'rgba(16, 185, 129, 0.12)', 
                        color: scan.confidence > 80 ? '#1677FF' : '#059669',
                        border: `1px solid ${scan.confidence > 80 ? 'rgba(22, 119, 255, 0.25)' : 'rgba(16, 185, 129, 0.35)'}`,
                        fontWeight: 600
                      }}>
                        {scan.confidence > 80 ? 'Pending Verification' : 'Verified'}
                      </span>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="text-center p-4" style={{ color: '#536579' }}>No predictions found.</td>
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
