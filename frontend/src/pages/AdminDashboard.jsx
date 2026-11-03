import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Stethoscope, Activity, CheckCircle2, BrainCircuit, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import './Dashboard.css';
import { API_BASE } from '../config';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalPredictions: 0,
    verifiedCases: 0,
    pendingReviews: 0,
    predictionsToday: 0,
    newPatientsThisMonth: 0,
    recentActivity: []
  });
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const userStr = localStorage.getItem('dentaai_user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        const userId = user._id || user.id;

        const token = localStorage.getItem('dentaai_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const [statsRes, usersRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/stats?userId=${userId}`, { headers }),
          fetch(`${API_BASE}/api/admin/users?userId=${userId}`, { headers })
        ]);

        if (statsRes.ok && usersRes.ok) {
          const statsData = await statsRes.json();
          const usersData = await usersRes.json();

          setStats(statsData);
          setUsers(usersData);
        }
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  if (isLoading) {
    return <div className="p-8 text-center"><Activity className="animate-spin mx-auto text-primary mb-4" size={32} /> Loading Admin Data...</div>;
  }

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
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid #00D2FF' }}>
          <div className="kpi-icon bg-blue-light text-blue" style={{ borderRadius: '14px', background: 'rgba(0, 210, 255, 0.12)', color: '#008DFF' }}><Users size={26} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">{stats.totalPatients}</span>
            <span className="kpi-label">Total Patients</span>
          </div>
        </div>
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid #1677FF' }}>
          <div className="kpi-icon bg-primary text-white" style={{ borderRadius: '14px', background: 'linear-gradient(135deg, #1677FF, #00A6A6)', color: '#FFFFFF' }}><Stethoscope size={26} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">{stats.totalDoctors}</span>
            <span className="kpi-label">Total Doctors</span>
          </div>
        </div>
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="kpi-icon bg-warning-light text-warning" style={{ borderRadius: '14px', background: 'rgba(245, 158, 11, 0.12)', color: '#D97706' }}><BrainCircuit size={26} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">{stats.totalPredictions}</span>
            <span className="kpi-label">AI Predictions</span>
          </div>
        </div>
        <div className="kpi-card glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="kpi-icon bg-success-light text-success" style={{ borderRadius: '14px', background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}><CheckCircle2 size={26} /></div>
          <div className="kpi-content">
            <span className="kpi-value text-primary">{stats.verifiedCases}</span>
            <span className="kpi-label">Verified Cases</span>
          </div>
        </div>
      </motion.div>

      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <div className="dashboard-left-col">
          {/* 1. SYSTEM OVERVIEW */}
          <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
            <div className="card-header mb-6">
              <h3 className="font-bold text-primary" style={{ fontSize: '1.25rem' }}>System Overview</h3>
            </div>
            <div className="overview-grid">
              <div className="overview-item">
                <span className="overview-label text-muted">Pending Doctor Reviews</span>
                <h4 className="overview-value text-warning" style={{ color: '#d97706' }}>{stats.pendingReviews}</h4>
              </div>
              <div className="overview-item">
                <span className="overview-label text-muted">Predictions Today</span>
                <h4 className="overview-value text-secondary" style={{ color: '#008dff' }}>{stats.predictionsToday}</h4>
              </div>
              <div className="overview-item">
                <span className="overview-label text-muted">New Patients This Month</span>
                <h4 className="overview-value text-primary" style={{ color: '#1677ff' }}>{stats.newPatientsThisMonth}</h4>
              </div>
              <div className="overview-item">
                <span className="overview-label text-muted">System Status</span>
                <h4 className="overview-value text-success flex-align-center gap-2" style={{ color: '#059669' }}>
                  <div className="status-dot" style={{ background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div> Operational
                </h4>
              </div>
            </div>
          </motion.div>

          {/* 2. USER MANAGEMENT */}
          <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
            <div className="card-header flex-between mb-6">
              <h3 className="font-bold text-primary" style={{ fontSize: '1.25rem' }}>User Management</h3>
              <Link to="/dashboard/admin/users" className="btn btn-outline btn-sm">View All</Link>
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
                  {users.slice(0, 5).map(u => (
                    <motion.tr key={u._id} whileHover={{ backgroundColor: 'rgba(22, 119, 255, 0.05)' }}>
                      <td className="font-bold" style={{ color: '#17324D' }}>{u.name}</td>
                      <td className="text-sm" style={{ color: '#536579' }}>{u.email}</td>
                      <td>
                        <span className="badge" style={{
                          background: u.role === 'doctor' ? 'rgba(22, 119, 255, 0.12)' : u.role === 'admin' ? 'rgba(220, 38, 38, 0.12)' : 'rgba(0, 141, 255, 0.10)',
                          color: u.role === 'doctor' ? '#1677FF' : u.role === 'admin' ? '#DC2626' : '#008DFF',
                          border: `1px solid ${u.role === 'doctor' ? 'rgba(22, 119, 255, 0.35)' : u.role === 'admin' ? 'rgba(220, 38, 38, 0.35)' : 'rgba(0, 141, 255, 0.25)'}`,
                          fontWeight: 600
                        }}>
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      </td>
                      <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.35)', fontWeight: 700 }}>Active</span></td>
                      <td>
                        <Link to="/dashboard/admin/users" className="icon-btn hover:text-secondary" style={{ color: '#536579' }}>
                          <ChevronRight size={18} />
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="dashboard-right-col">
          {/* 3. AI MODEL PERFORMANCE CARD */}
          <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
            <div className="card-header mb-6 flex-align-center gap-2">
              <BrainCircuit size={24} color="#1677FF" />
              <h3 className="font-bold text-primary" style={{ color: '#17324D', fontSize: '1.25rem' }}>AI Model Performance</h3>
            </div>

            <div className="model-details mb-6" style={{ background: 'rgba(240, 246, 252, 0.75)', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(191, 212, 229, 0.60)' }}>
              <div className="model-detail-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(191, 212, 229, 0.40)' }}>
                <span className="model-detail-label" style={{ color: '#536579', fontWeight: 600 }}>Architecture:</span>
                <span className="model-detail-value font-bold" style={{ color: '#102A43' }}>MobileNetV2</span>
              </div>
              <div className="model-detail-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(191, 212, 229, 0.40)' }}>
                <span className="model-detail-label" style={{ color: '#536579', fontWeight: 600 }}>Training Method:</span>
                <span className="model-detail-value font-bold" style={{ color: '#102A43' }}>Transfer Learning</span>
              </div>
              <div className="model-detail-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(191, 212, 229, 0.40)' }}>
                <span className="model-detail-label" style={{ color: '#536579', fontWeight: 600 }}>Dataset Size:</span>
                <span className="model-detail-value font-bold" style={{ color: '#102A43' }}>12,320 Dental Images</span>
              </div>
              <div className="model-detail-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(191, 212, 229, 0.40)' }}>
                <span className="model-detail-label" style={{ color: '#536579', fontWeight: 600 }}>Conditions:</span>
                <span className="model-detail-value font-bold" style={{ color: '#102A43' }}>6</span>
              </div>
              <div className="model-detail-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0' }}>
                <span className="model-detail-label" style={{ color: '#536579', fontWeight: 600 }}>Status:</span>
                <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.35)', fontWeight: 700 }}>Active</span>
              </div>
            </div>

            <div className="accuracy-section mb-6" style={{ background: 'rgba(240, 246, 252, 0.75)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(191, 212, 229, 0.60)' }}>
              <div className="flex-between mb-3">
                <span className="font-bold" style={{ color: '#536579', fontWeight: 600 }}>Global Test Accuracy</span>
                <span className="font-bold" style={{ color: '#1677FF', fontSize: '1.2rem', fontWeight: 800 }}>81.07%</span>
              </div>
              <div className="progress-bar-lg" style={{ height: '8px', background: 'rgba(191, 212, 229, 0.40)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: '81.07%' }} transition={{ duration: 1.5 }} className="progress-fill" style={{ height: '100%', background: 'linear-gradient(90deg, #1677FF, #00D2FF)', borderRadius: '4px' }}></motion.div>
              </div>
            </div>

            <h4 className="text-sm font-bold mb-3" style={{ color: '#536579', letterSpacing: '0.5px' }}>SUPPORTED PATHOLOGIES</h4>
            <div className="condition-badges">
              {['Calculus', 'Caries', 'Gingivitis', 'Hypodontia', 'Mouth Ulcer', 'Tooth Discoloration'].map((condition, i) => (
                <motion.span
                  key={condition}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="condition-badge"
                  style={{ background: 'rgba(22, 119, 255, 0.08)', color: '#1677FF', border: '1px solid rgba(22, 119, 255, 0.25)', fontWeight: 600, padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem' }}
                >
                  {condition}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* 4. RECENT SYSTEM ACTIVITY */}
          <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
            <div className="card-header mb-6">
              <h3 className="font-bold text-primary" style={{ color: '#17324D', fontSize: '1.25rem' }}>Recent System Activity</h3>
            </div>
            <div className="list-group" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="list-item">
                <div className="list-info flex-align-center gap-3">
                  <div className="list-icon" style={{ background: 'rgba(0, 210, 255, 0.1)', color: '#008DFF' }}><Activity size={20} /></div>
                  <div>
                    <h4 className="font-bold mb-1" style={{ color: '#17324D' }}>New prediction submitted</h4>
                    <p className="text-sm" style={{ color: '#536579' }}>Jane Doe &bull; Patient</p>
                  </div>
                </div>
                <span className="text-sm font-bold" style={{ color: '#536579' }}>10m ago</span>
              </div>
              <div className="list-item">
                <div className="list-info flex-align-center gap-3">
                  <div className="list-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}><ShieldCheck size={20} /></div>
                  <div>
                    <h4 className="font-bold mb-1" style={{ color: '#17324D' }}>Verified a Caries prediction</h4>
                    <p className="text-sm" style={{ color: '#536579' }}>Dr. Smith &bull; Doctor</p>
                  </div>
                </div>
                <span className="text-sm font-bold" style={{ color: '#536579' }}>45m ago</span>
              </div>
              <div className="list-item">
                <div className="list-info flex-align-center gap-3">
                  <div className="list-icon" style={{ background: 'rgba(22, 119, 255, 0.1)', color: '#1677FF' }}><Users size={20} /></div>
                  <div>
                    <h4 className="font-bold mb-1" style={{ color: '#17324D' }}>New patient account created</h4>
                    <p className="text-sm" style={{ color: '#536579' }}>Michael Johnson &bull; Patient</p>
                  </div>
                </div>
                <span className="text-sm font-bold" style={{ color: '#536579' }}>2h ago</span>
              </div>
              <div className="list-item">
                <div className="list-info flex-align-center gap-3">
                  <div className="list-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}><BrainCircuit size={20} /></div>
                  <div>
                    <h4 className="font-bold mb-1" style={{ color: '#17324D' }}>AI model analysis completed</h4>
                    <p className="text-sm" style={{ color: '#536579' }}>System Engine</p>
                  </div>
                </div>
                <span className="text-sm font-bold" style={{ color: '#536579' }}>3h ago</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
