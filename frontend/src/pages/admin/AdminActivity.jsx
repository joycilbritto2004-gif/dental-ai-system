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
          <h3 className="font-bold text-primary mb-6" style={{ fontSize: '1.25rem' }}>Infrastructure Health</h3>
          
          <div className="flex-align-center gap-4 mb-4 p-4" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Server size={32} className="text-secondary" />
            <div>
              <h4 className="font-bold">Node.js API Server</h4>
              <span className="text-success text-sm flex-align-center gap-1"><div className="status-dot" style={{ background: '#10b981' }}></div> Online (Port 5000)</span>
            </div>
          </div>

          <div className="flex-align-center gap-4 mb-4 p-4" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Database size={32} className="text-primary" />
            <div>
              <h4 className="font-bold">MongoDB Database</h4>
              <span className="text-success text-sm flex-align-center gap-1"><div className="status-dot" style={{ background: '#10b981' }}></div> Connected (127.0.0.1)</span>
            </div>
          </div>

          <div className="flex-align-center gap-4 p-4" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Activity size={32} className="text-warning" />
            <div>
              <h4 className="font-bold">Flask AI Engine</h4>
              <span className="text-success text-sm flex-align-center gap-1"><div className="status-dot" style={{ background: '#10b981' }}></div> Online (Port 5001)</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
          <div className="card-header flex-between mb-6">
            <h3 className="font-bold text-primary" style={{ fontSize: '1.25rem' }}>Audit Logs</h3>
          </div>
          
          <div className="timeline">
            <div className="timeline-item mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex-between mb-1">
                <span className="font-bold text-sm"><ShieldCheck size={14} className="inline mr-1 text-primary" /> Admin Login</span>
                <span className="text-muted text-xs">2 mins ago</span>
              </div>
              <p className="text-muted text-sm">admin@dentaai.com authenticated successfully via IP 192.168.1.5</p>
            </div>
            <div className="timeline-item mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex-between mb-1">
                <span className="font-bold text-sm"><Activity size={14} className="inline mr-1 text-secondary" /> Payment Processed</span>
                <span className="text-muted text-xs">15 mins ago</span>
              </div>
              <p className="text-muted text-sm">Consultation fee of ₹649 captured for TXN-AI-617156533</p>
            </div>
            <div className="timeline-item mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex-between mb-1">
                <span className="font-bold text-sm"><Activity size={14} className="inline mr-1 text-secondary" /> New Consultation Request</span>
                <span className="text-muted text-xs">1 hour ago</span>
              </div>
              <p className="text-muted text-sm">Patient Joycil Britto requested Dr. Priya Menon</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminActivity;
