import { Activity, Search, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';

const AdminPredictions = () => {
  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

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
              style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', outline: 'none', width: '100%' }}
            />
          </div>
        </div>

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
              <motion.tr whileHover={{ backgroundColor: 'rgba(0, 210, 255, 0.05)' }}>
                <td className="font-bold text-primary">SCAN-843253</td>
                <td className="text-muted text-sm">6a964f860...</td>
                <td className="flex-align-center gap-2">
                  <BrainCircuit size={16} className="text-warning" />
                  Gingivitis
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px' }}>
                      <div style={{ width: '47%', height: '100%', background: '#f59e0b', borderRadius: '3px' }}></div>
                    </div>
                    <span className="text-sm font-bold">47%</span>
                  </div>
                </td>
                <td className="text-muted text-sm">Today, 02:30 PM</td>
                <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>Verified</span></td>
              </motion.tr>
              <motion.tr whileHover={{ backgroundColor: 'rgba(0, 210, 255, 0.05)' }}>
                <td className="font-bold text-primary">SCAN-127347</td>
                <td className="text-muted text-sm">6a8eeb894...</td>
                <td className="flex-align-center gap-2">
                  <BrainCircuit size={16} className="text-primary" />
                  Tooth Discoloration
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px' }}>
                      <div style={{ width: '95%', height: '100%', background: 'var(--primary)', borderRadius: '3px' }}></div>
                    </div>
                    <span className="text-sm font-bold">95%</span>
                  </div>
                </td>
                <td className="text-muted text-sm">Yesterday, 07:40 PM</td>
                <td><span className="badge" style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--secondary)' }}>Pending Verification</span></td>
              </motion.tr>
              {/* Note: This is currently a mock UI view to satisfy sidebar routing. Connect to /api/admin/predictions if available later. */}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminPredictions;
