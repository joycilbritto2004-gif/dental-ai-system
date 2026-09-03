import { BrainCircuit, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';

const AdminAIModel = () => {
  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header flex-between mb-6">
        <div>
          <h2>AI Model Configuration</h2>
          <p>Manage and monitor the underlying AI diagnostic engine.</p>
        </div>
      </motion.div>

      <div className="dashboard-grid mt-6">
        <motion.div variants={item} className="card glass-card" style={{ padding: '2rem', background: 'var(--bg-dark)', color: 'white' }}>
          <div className="card-header mb-6 flex-align-center gap-2">
            <BrainCircuit size={24} color="#00f0ff" />
            <h3 className="font-bold" style={{ color: 'white', fontSize: '1.25rem' }}>Current Model Status</h3>
          </div>
          
          <div className="model-details mb-6" style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="model-detail-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Architecture:</span>
              <span className="font-bold text-white">MobileNetV2</span>
            </div>
            <div className="model-detail-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Version:</span>
              <span className="font-bold text-white">v2.4.1</span>
            </div>
            <div className="model-detail-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Status:</span>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>Active</span>
            </div>
            <div className="model-detail-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Last Trained:</span>
              <span className="font-bold text-white">August 25, 2026</span>
            </div>
          </div>
          
          <button className="btn btn-primary w-full" style={{ padding: '0.75rem' }}>Retrain Model (Coming Soon)</button>
        </motion.div>

        <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
          <h3 className="font-bold text-primary mb-6" style={{ fontSize: '1.25rem' }}>System Performance</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="flex-between mb-2">
              <span className="text-muted">Average Inference Time</span>
              <span className="font-bold">120ms</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
              <div style={{ width: '15%', height: '100%', background: '#10b981', borderRadius: '4px' }}></div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="flex-between mb-2">
              <span className="text-muted">Prediction Accuracy (Verified)</span>
              <span className="font-bold text-primary">94.2%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
              <div style={{ width: '94.2%', height: '100%', background: 'var(--primary)', borderRadius: '4px' }}></div>
            </div>
          </div>
          
          <div className="alert alert-info" style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0, 210, 255, 0.1)', borderRadius: '8px', border: '1px solid rgba(0, 210, 255, 0.2)', color: 'var(--primary)' }}>
            <div className="flex-align-center gap-2 mb-2">
              <Activity size={18} />
              <span className="font-bold">System is operating normally</span>
            </div>
            <p className="text-sm">The Flask API is actively handling requests via port 5001.</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminAIModel;
