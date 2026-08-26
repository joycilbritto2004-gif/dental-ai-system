import { ShieldCheck, Clock, CheckCircle2, AlertTriangle, UserCircle, ChevronRight, Activity, BrainCircuit, Scan, Eye, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import './Dashboard.css';

const DoctorDashboard = () => {
  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      {/* 1. Header */}
      <motion.div variants={item} className="dashboard-header mb-6">
        <h2>Doctor Portal</h2>
        <p>Welcome back, Dr. Smith. Review pending AI diagnostics and provide clinical verification.</p>
      </motion.div>

      {/* 2. Statistics Cards */}
      <motion.div variants={item} className="kpi-grid mb-6">
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="kpi-icon bg-warning-light text-warning" style={{ borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)' }}><Clock size={28} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">8</span>
            <span className="kpi-label">Pending Reviews</span>
          </div>
        </div>
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <div className="kpi-icon bg-blue-light text-blue" style={{ borderRadius: '12px', background: 'rgba(0, 210, 255, 0.1)' }}><Activity size={28} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">14</span>
            <span className="kpi-label">Cases Today</span>
          </div>
        </div>
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="kpi-icon bg-success-light text-success" style={{ borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)' }}><CheckCircle2 size={28} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">1,024</span>
            <span className="kpi-label">Verified Cases</span>
          </div>
        </div>
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div className="kpi-icon text-white" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, var(--secondary), var(--accent))' }}><BrainCircuit size={28} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">94.2%</span>
            <span className="kpi-label">AI Accuracy</span>
          </div>
        </div>
      </motion.div>

      <div className="dashboard-grid mt-6">
        {/* 3. Main Review Workspace */}
        <motion.div variants={item} className="card review-workspace-card glass-card" style={{ padding: '2rem' }}>
          <div className="card-header flex-between mb-6">
            <h3 className="font-bold text-primary flex-align-center gap-2" style={{ fontSize: '1.25rem' }}>
              <ShieldCheck size={24} className="text-secondary" /> Active Case Review
            </h3>
            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.3)' }}>Awaiting Verification</span>
          </div>
          
          <div className="workspace-two-col">
            {/* LEFT SIDE: Patient Image */}
            <div className="workspace-left">
              <div className="patient-meta-box glass-card" style={{ background: 'var(--bg-card)', marginBottom: '1.5rem', borderRadius: '16px', padding: '1.5rem' }}>
                <div className="flex-between">
                  <div className="patient-id-group flex-align-center gap-3">
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <UserCircle size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-primary" style={{ fontSize: '1.1rem' }}>Jane Doe</h4>
                      <p className="text-sm text-muted">ID: P-98214</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary" style={{ background: 'rgba(0, 210, 255, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>Oct 24, 2023</p>
                    <p className="text-sm text-muted mt-1">Intraoral X-Ray</p>
                  </div>
                </div>
              </div>

              <div className="xray-preview-large" style={{ background: 'var(--bg-dark)', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                <div className="xray-placeholder-scan" style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(0, 210, 255, 0.1) 0%, transparent 70%)' }}></div>
                  <Scan size={56} color="#00f0ff" className="mb-4" style={{ filter: 'drop-shadow(0 0 10px rgba(0, 210, 255, 0.5))', zIndex: 1 }} />
                  <span className="text-white font-bold" style={{ zIndex: 1, letterSpacing: '1px', textTransform: 'uppercase' }}>Encrypted Dental Imaging</span>
                  <div style={{ position: 'absolute', top: '50%', width: '100%', height: '2px', background: 'rgba(0, 240, 255, 0.4)', boxShadow: '0 0 15px #00f0ff', zIndex: 2, animation: 'scanBounce 3s infinite linear' }}></div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: AI & Verification */}
            <div className="workspace-right">
              {/* AI Analysis Result */}
              <div className="ai-result-box mb-6" style={{ background: 'var(--bg-dark)', color: 'white', borderRadius: '16px', border: '1px solid rgba(0, 210, 255, 0.3)' }}>
                <div className="result-header mb-4 flex-align-center gap-2">
                  <BrainCircuit size={20} color="#00f0ff" />
                  <span className="font-bold" style={{ color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Neural Net Diagnosis</span>
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Identified Pathology</span>
                  <div className="disease-name-lg mt-1" style={{ fontSize: '2rem', color: 'white' }}>Caries</div>
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="confidence-label mb-2">
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Algorithmic Confidence</span>
                    <span className="font-bold text-secondary" style={{ fontSize: '1.2rem' }}>92%</span>
                  </div>
                  <div className="progress-bar-lg" style={{ height: '8px', background: 'rgba(255,255,255,0.1)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} transition={{ duration: 1 }} className="progress-fill" style={{ background: '#00f0ff', boxShadow: '0 0 10px #00f0ff' }}></motion.div>
                  </div>
                </div>
                
                <p className="text-sm mt-4" style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                  * AI provides assisted preliminary detection. Final diagnosis requires clinical verification.
                </p>
              </div>

              {/* DOCTOR VERIFICATION */}
              <div className="verification-form glass-card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                <h4 className="form-section-title font-bold text-primary mb-4" style={{ fontSize: '1.1rem' }}>Clinical Verification</h4>
                
                <div className="form-group mb-4">
                  <label className="form-label font-bold text-primary">Final Diagnosis</label>
                  <select className="form-input" style={{ background: 'rgba(255,255,255,0.8)' }}>
                    <option>Confirm AI: Caries</option>
                    <option>Calculus</option>
                    <option>Gingivitis</option>
                    <option>Hypodontia</option>
                    <option>Mouth Ulcer</option>
                    <option>Tooth Discoloration</option>
                    <option>No Issues Detected</option>
                  </select>
                </div>
                
                <div className="form-group mb-5">
                  <label className="form-label font-bold text-primary">Clinical Remarks</label>
                  <textarea className="form-input" rows="3" placeholder="Enter treatment plan or notes for the patient..." style={{ background: 'rgba(255,255,255,0.8)', resize: 'vertical' }}></textarea>
                </div>

                <div className="verification-actions flex gap-3">
                  <button className="btn btn-success flex-1 flex-align-center justify-center gap-2 pulse-glow" style={{ padding: '12px' }}>
                    <CheckCircle2 size={18} /> Verify Result
                  </button>
                  <button className="btn btn-outline flex-1 flex-align-center justify-center gap-2 text-danger" style={{ padding: '12px' }}>
                    <AlertTriangle size={18} /> Override AI
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 4. Pending Cases */}
      <motion.div variants={item} className="dashboard-grid mt-6">
        <div className="card glass-card" style={{ padding: '2rem' }}>
          <div className="card-header mb-6">
            <h3 className="font-bold text-primary" style={{ fontSize: '1.25rem' }}>Pending Cases Queue</h3>
          </div>
          
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>AI Prediction</th>
                  <th>Confidence</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <motion.tr whileHover={{ backgroundColor: 'rgba(0, 210, 255, 0.05)' }}>
                  <td>
                    <div className="flex-align-center gap-3">
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--secondary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <UserCircle size={20} />
                      </div>
                      <span className="font-bold text-primary">Jane Doe</span>
                    </div>
                  </td>
                  <td className="text-main font-bold">Caries</td>
                  <td>
                    <span className="confidence-pill" style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--secondary)' }}>92%</span>
                  </td>
                  <td className="text-muted">Today, 09:41 AM</td>
                  <td><span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.3)' }}>Awaiting Review</span></td>
                  <td><button className="btn btn-primary btn-sm flex-align-center gap-1"><Eye size={14} /> Review</button></td>
                </motion.tr>
                <motion.tr whileHover={{ backgroundColor: 'rgba(0, 210, 255, 0.05)' }}>
                  <td>
                    <div className="flex-align-center gap-3">
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <UserCircle size={20} />
                      </div>
                      <span className="font-bold text-primary">John Smith</span>
                    </div>
                  </td>
                  <td className="text-main font-bold">Gingivitis</td>
                  <td>
                    <span className="confidence-pill" style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--secondary)' }}>88%</span>
                  </td>
                  <td className="text-muted">Today, 08:15 AM</td>
                  <td><span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.3)' }}>Awaiting Review</span></td>
                  <td><button className="btn btn-outline btn-sm flex-align-center gap-1"><Eye size={14} /> Review</button></td>
                </motion.tr>
                <motion.tr whileHover={{ backgroundColor: 'rgba(0, 210, 255, 0.05)' }}>
                  <td>
                    <div className="flex-align-center gap-3">
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <UserCircle size={20} />
                      </div>
                      <span className="font-bold text-primary">Emily Chen</span>
                    </div>
                  </td>
                  <td className="text-main font-bold">Calculus</td>
                  <td>
                    <span className="confidence-pill" style={{ background: 'rgba(0, 210, 255, 0.1)', color: 'var(--secondary)' }}>76%</span>
                  </td>
                  <td className="text-muted">Yesterday</td>
                  <td><span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.3)' }}>Awaiting Review</span></td>
                  <td><button className="btn btn-outline btn-sm flex-align-center gap-1"><Eye size={14} /> Review</button></td>
                </motion.tr>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DoctorDashboard;
