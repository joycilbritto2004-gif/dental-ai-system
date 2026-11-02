import { Activity, Server, Database, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';

const AdminActivity = () => {
  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header flex-between mb-6">
        <div>
          <h2>System Activity</h2>
          <p>Real-time audit logs and infrastructure health.</p>
        </div>
      </motion.div>

      <div className="dashboard-grid mt-6">
        <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
          <h3 className="font-bold mb-6" style={{ color: '#17324D', fontSize: '1.25rem' }}>Infrastructure Health</h3>
          
          <div className="flex-align-center gap-4 mb-4 p-4" style={{ background: 'rgba(240, 246, 252, 0.75)', borderRadius: '12px', border: '1px solid rgba(191, 212, 229, 0.60)' }}>
            <Server size={32} color="#008DFF" />
            <div>
              <h4 className="font-bold" style={{ color: '#17324D' }}>Node.js API Server</h4>
              <span className="text-sm flex-align-center gap-1" style={{ color: '#059669', fontWeight: 600 }}><div className="status-dot" style={{ background: '#10b981' }}></div> Online (Port 5000)</span>
            </div>
          </div>

          <div className="flex-align-center gap-4 mb-4 p-4" style={{ background: 'rgba(240, 246, 252, 0.75)', borderRadius: '12px', border: '1px solid rgba(191, 212, 229, 0.60)' }}>
            <Database size={32} color="#1677FF" />
            <div>
              <h4 className="font-bold" style={{ color: '#17324D' }}>MongoDB Database</h4>
              <span className="text-sm flex-align-center gap-1" style={{ color: '#059669', fontWeight: 600 }}><div className="status-dot" style={{ background: '#10b981' }}></div> Connected (127.0.0.1:27017)</span>
            </div>
          </div>

          <div className="flex-align-center gap-4 p-4" style={{ background: 'rgba(240, 246, 252, 0.75)', borderRadius: '12px', border: '1px solid rgba(191, 212, 229, 0.60)' }}>
            <Activity size={32} color="#D97706" />
            <div>
              <h4 className="font-bold" style={{ color: '#17324D' }}>Python AI Engine</h4>
              <span className="text-sm flex-align-center gap-1" style={{ color: '#059669', fontWeight: 600 }}><div className="status-dot" style={{ background: '#10b981' }}></div> Online (Port 5002)</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
          <div className="card-header flex-between mb-6">
            <h3 className="font-bold" style={{ color: '#17324D', fontSize: '1.25rem' }}>Audit Logs</h3>
          </div>
          
          <div className="timeline">
            <div className="timeline-item mb-4 pb-4" style={{ borderBottom: '1px solid rgba(191, 212, 229, 0.40)' }}>
              <div className="flex-between mb-1">
                <span className="font-bold text-sm" style={{ color: '#17324D' }}><ShieldCheck size={14} className="inline mr-1 text-primary" style={{ verticalAlign: 'middle', color: '#1677FF' }} /> Admin Authenticated</span>
                <span className="text-xs" style={{ color: '#536579', fontWeight: 500 }}>Just now</span>
              </div>
              <p className="text-sm" style={{ color: '#536579' }}>Permanent Administrator joycilbritto2004@gmail.com session active</p>
            </div>
            <div className="timeline-item mb-4 pb-4" style={{ borderBottom: '1px solid rgba(191, 212, 229, 0.40)' }}>
              <div className="flex-between mb-1">
                <span className="font-bold text-sm" style={{ color: '#17324D' }}><Activity size={14} className="inline mr-1" style={{ verticalAlign: 'middle', color: '#008DFF' }} /> Database Connected</span>
                <span className="text-xs" style={{ color: '#536579', fontWeight: 500 }}>Active</span>
              </div>
              <p className="text-sm" style={{ color: '#536579' }}>MongoDB WiredTiger storage engine verified and operational</p>
            </div>
            <div className="timeline-item mb-4 pb-4" style={{ borderBottom: '1px solid rgba(191, 212, 229, 0.40)' }}>
              <div className="flex-between mb-1">
                <span className="font-bold text-sm" style={{ color: '#17324D' }}><Activity size={14} className="inline mr-1" style={{ verticalAlign: 'middle', color: '#008DFF' }} /> AI Model Verified</span>
                <span className="text-xs" style={{ color: '#536579', fontWeight: 500 }}>Active</span>
              </div>
              <p className="text-sm" style={{ color: '#536579' }}>MobileNetV2 neural network loaded with 6 diagnostic pathology classes</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminActivity;
