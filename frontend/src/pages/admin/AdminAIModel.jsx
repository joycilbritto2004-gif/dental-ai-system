import { BrainCircuit, Activity } from 'lucide-react';
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

      <div className="dashboard-grid">
        <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
          <div className="card-header mb-6 flex-align-center gap-2">
            <BrainCircuit size={24} color="#1677FF" />
            <h3 className="font-bold text-primary" style={{ color: '#17324D', fontSize: '1.25rem' }}>Current Model Status</h3>
          </div>
          
          <div className="model-details mb-6" style={{ background: 'rgba(240, 246, 252, 0.75)', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(191, 212, 229, 0.60)' }}>
            <div className="model-detail-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(191, 212, 229, 0.40)' }}>
              <span className="model-detail-label" style={{ color: '#536579', fontWeight: 600 }}>Architecture:</span>
              <span className="model-detail-value font-bold" style={{ color: '#102A43' }}>MobileNetV2</span>
            </div>
            <div className="model-detail-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(191, 212, 229, 0.40)' }}>
              <span className="model-detail-label" style={{ color: '#536579', fontWeight: 600 }}>Version:</span>
              <span className="model-detail-value font-bold" style={{ color: '#102A43' }}>v2.4.1</span>
            </div>
            <div className="model-detail-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(191, 212, 229, 0.40)' }}>
              <span className="model-detail-label" style={{ color: '#536579', fontWeight: 600 }}>Status:</span>
              <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.35)', fontWeight: 700 }}>Active</span>
            </div>
            <div className="model-detail-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0' }}>
              <span className="model-detail-label" style={{ color: '#536579', fontWeight: 600 }}>Last Trained:</span>
              <span className="model-detail-value font-bold" style={{ color: '#102A43' }}>August 25, 2026</span>
            </div>
          </div>
          
          <button className="btn btn-primary w-full" style={{ padding: '0.75rem' }}>Retrain Model (Coming Soon)</button>
        </motion.div>

        <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
          <h3 className="font-bold text-primary mb-6" style={{ color: '#17324D', fontSize: '1.25rem' }}>System Performance</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="flex-between mb-2">
              <span className="text-muted" style={{ color: '#536579', fontWeight: 600 }}>Average Inference Time</span>
              <span className="font-bold text-primary" style={{ color: '#102A43' }}>120ms</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(191, 212, 229, 0.40)', borderRadius: '4px' }}>
              <div style={{ width: '15%', height: '100%', background: '#10B981', borderRadius: '4px' }}></div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="flex-between mb-2">
              <span className="text-muted" style={{ color: '#536579', fontWeight: 600 }}>Prediction Accuracy (Verified)</span>
              <span className="font-bold text-primary" style={{ color: '#102A43' }}>94.2%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(191, 212, 229, 0.40)', borderRadius: '4px' }}>
              <div style={{ width: '94.2%', height: '100%', background: '#1677FF', borderRadius: '4px' }}></div>
            </div>
          </div>
          
          <div className="alert alert-info" style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(22, 119, 255, 0.08)', borderRadius: '12px', border: '1px solid rgba(22, 119, 255, 0.22)', color: '#17324D' }}>
            <div className="flex-align-center gap-2 mb-2">
              <Activity size={18} color="#1677FF" />
              <span className="font-bold" style={{ color: '#17324D' }}>System is operating normally</span>
            </div>
            <p className="text-sm" style={{ color: '#536579', margin: 0 }}>The Python AI service is actively handling requests via port 5002.</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminAIModel;
