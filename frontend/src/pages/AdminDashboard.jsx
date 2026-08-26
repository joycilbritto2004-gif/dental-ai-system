import { Users, Stethoscope, Activity, CheckCircle2, AlertCircle, BrainCircuit, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import './Dashboard.css';

const AdminDashboard = () => {
  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header flex-between mb-6">
        <div>
          <h2>System Administration</h2>
          <p>Global metrics, AI performance monitoring, and system activity.</p>
        </div>
      </motion.div>

      {/* TOP STATISTICS CARDS */}
      <motion.div variants={item} className="kpi-grid mb-6">
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <div className="kpi-icon bg-blue-light text-blue" style={{ borderRadius: '12px', background: 'rgba(0, 210, 255, 0.1)' }}><Users size={28} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">1,248</span>
            <span className="kpi-label">Total Patients</span>
          </div>
        </div>
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="kpi-icon bg-primary text-white" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), #1e3a8a)' }}><Stethoscope size={28} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">42</span>
            <span className="kpi-label">Total Doctors</span>
          </div>
        </div>
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="kpi-icon bg-warning-light text-warning" style={{ borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)' }}><BrainCircuit size={28} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">3,856</span>
            <span className="kpi-label">AI Predictions</span>
          </div>
        </div>
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="kpi-icon bg-success-light text-success" style={{ borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)' }}><CheckCircle2 size={28} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">2,941</span>
            <span className="kpi-label">Verified Cases</span>
          </div>
        </div>
      </motion.div>

      <div className="dashboard-grid mt-6">
        {/* LEFT COLUMN */}
        <div className="dashboard-left-col">
          {/* 1. SYSTEM OVERVIEW */}
          <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
            <div className="card-header mb-6">
              <h3 className="font-bold text-primary" style={{ fontSize: '1.25rem' }}>System Overview</h3>
            </div>
            <div className="overview-grid">
              <div className="overview-item" style={{ background: 'var(--bg-card)' }}>
                <span className="text-muted">Pending Doctor Reviews</span>
                <h4 className="text-warning" style={{ color: '#d97706' }}>8</h4>
              </div>
              <div className="overview-item" style={{ background: 'var(--bg-card)' }}>
                <span className="text-muted">Predictions Today</span>
                <h4 className="text-secondary">24</h4>
              </div>
              <div className="overview-item" style={{ background: 'var(--bg-card)' }}>
                <span className="text-muted">New Patients This Month</span>
                <h4 className="text-primary">86</h4>
              </div>
              <div className="overview-item" style={{ background: 'var(--bg-card)' }}>
                <span className="text-muted">System Status</span>
                <h4 className="text-success flex-align-center gap-2" style={{ color: '#059669' }}>
                  <div className="status-dot" style={{ background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div> Operational
                </h4>
              </div>
            </div>
          </motion.div>

          {/* 2. USER MANAGEMENT */}
          <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
            <div className="card-header flex-between mb-6">
              <h3 className="font-bold text-primary" style={{ fontSize: '1.25rem' }}>User Management</h3>
              <button className="btn btn-outline btn-sm">View All</button>
            </div>
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <motion.tr whileHover={{ backgroundColor: 'rgba(0, 210, 255, 0.05)' }}>
                    <td className="font-bold text-primary">Jane Doe</td>
                    <td className="text-muted text-sm">john@email.com</td>
                    <td><span className="badge" style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--secondary)' }}>Patient</span></td>
                    <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Active</span></td>
                    <td><button className="icon-btn text-muted hover:text-secondary"><ChevronRight size={18} /></button></td>
                  </motion.tr>
                  <motion.tr whileHover={{ backgroundColor: 'rgba(0, 210, 255, 0.05)' }}>
                    <td className="font-bold text-primary">Dr. Smith</td>
                    <td className="text-muted text-sm">drsmith@dentaai.com</td>
                    <td><span className="badge" style={{ background: 'var(--primary)', color: 'white' }}>Doctor</span></td>
                    <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Active</span></td>
                    <td><button className="icon-btn text-muted hover:text-secondary"><ChevronRight size={18} /></button></td>
                  </motion.tr>
                  <motion.tr whileHover={{ backgroundColor: 'rgba(0, 210, 255, 0.05)' }}>
                    <td className="font-bold text-primary">Michael Johnson</td>
                    <td className="text-muted text-sm">michael@email.com</td>
                    <td><span className="badge" style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--secondary)' }}>Patient</span></td>
                    <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Active</span></td>
                    <td><button className="icon-btn text-muted hover:text-secondary"><ChevronRight size={18} /></button></td>
                  </motion.tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="dashboard-right-col">
          {/* 3. AI MODEL PERFORMANCE CARD */}
          <motion.div variants={item} className="card glass-card" style={{ padding: '2rem', background: 'var(--bg-dark)', color: 'white' }}>
            <div className="card-header mb-6 flex-align-center gap-2">
              <BrainCircuit size={24} color="#00f0ff" />
              <h3 className="font-bold" style={{ color: 'white', fontSize: '1.25rem' }}>AI Model Performance</h3>
            </div>
            
            <div className="model-details mb-6" style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="model-detail-row">
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Architecture:</span>
                <span className="font-bold text-white">MobileNetV2</span>
              </div>
              <div className="model-detail-row">
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Training Method:</span>
                <span className="font-bold text-white">Transfer Learning</span>
              </div>
              <div className="model-detail-row">
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Dataset Size:</span>
                <span className="font-bold text-white">12,320 Dental Images</span>
              </div>
              <div className="model-detail-row">
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Conditions:</span>
                <span className="font-bold text-white">6</span>
              </div>
              <div className="model-detail-row">
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Status:</span>
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.5)' }}>Active</span>
              </div>
            </div>

            <div className="accuracy-section mb-6" style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex-between mb-3">
                <span className="font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>Global Test Accuracy</span>
                <span className="font-bold" style={{ color: '#00f0ff', fontSize: '1.2rem' }}>81.07%</span>
              </div>
              <div className="progress-bar-lg" style={{ height: '8px', background: 'rgba(255,255,255,0.1)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: '81.07%' }} transition={{ duration: 1.5 }} className="progress-fill" style={{ background: '#00f0ff', boxShadow: '0 0 10px #00f0ff' }}></motion.div>
              </div>
            </div>

            <h4 className="text-sm font-bold mb-3" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>SUPPORTED PATHOLOGIES</h4>
            <div className="condition-badges">
              {['Calculus', 'Caries', 'Gingivitis', 'Hypodontia', 'Mouth Ulcer', 'Tooth Discoloration'].map((condition, i) => (
                <motion.span 
                  key={condition}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="condition-badge" 
                  style={{ background: 'rgba(0, 210, 255, 0.1)', color: '#00f0ff', border: '1px solid rgba(0, 210, 255, 0.3)' }}
                >
                  {condition}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* 4. RECENT SYSTEM ACTIVITY */}
          <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
            <div className="card-header mb-6">
              <h3 className="font-bold text-primary" style={{ fontSize: '1.25rem' }}>Recent System Activity</h3>
            </div>
            <div className="list-group" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="list-item glass-card" style={{ border: 'none', background: 'var(--bg-card)' }}>
                <div className="list-info flex-align-center gap-3">
                  <div className="list-icon" style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--secondary)' }}><Activity size={20} /></div>
                  <div>
                    <h4 className="font-bold text-primary mb-1">New prediction submitted</h4>
                    <p className="text-sm text-muted">Jane Doe &bull; Patient</p>
                  </div>
                </div>
                <span className="text-muted text-sm font-bold">10m ago</span>
              </div>
              <div className="list-item glass-card" style={{ border: 'none', background: 'var(--bg-card)' }}>
                <div className="list-info flex-align-center gap-3">
                  <div className="list-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}><ShieldCheck size={20} /></div>
                  <div>
                    <h4 className="font-bold text-primary mb-1">Verified a Caries prediction</h4>
                    <p className="text-sm text-muted">Dr. Smith &bull; Doctor</p>
                  </div>
                </div>
                <span className="text-muted text-sm font-bold">45m ago</span>
              </div>
              <div className="list-item glass-card" style={{ border: 'none', background: 'var(--bg-card)' }}>
                <div className="list-info flex-align-center gap-3">
                  <div className="list-icon" style={{ background: 'var(--primary)', color: 'white' }}><Users size={20} /></div>
                  <div>
                    <h4 className="font-bold text-primary mb-1">New patient account created</h4>
                    <p className="text-sm text-muted">Michael Johnson &bull; Patient</p>
                  </div>
                </div>
                <span className="text-muted text-sm font-bold">2h ago</span>
              </div>
              <div className="list-item glass-card" style={{ border: 'none', background: 'var(--bg-card)' }}>
                <div className="list-info flex-align-center gap-3">
                  <div className="list-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}><BrainCircuit size={20} /></div>
                  <div>
                    <h4 className="font-bold text-primary mb-1">AI model analysis completed</h4>
                    <p className="text-sm text-muted">System Engine</p>
                  </div>
                </div>
                <span className="text-muted text-sm font-bold">3h ago</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
