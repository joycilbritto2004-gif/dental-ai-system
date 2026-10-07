import { Save, ShieldAlert, Bell, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import '../Dashboard.css';

const AdminSettings = () => {
  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="dashboard-header flex-between mb-6">
        <div>
          <h2>Platform Settings</h2>
          <p>Global configurations and feature toggles.</p>
        </div>
      </motion.div>

      <div className="dashboard-grid mt-6">
        <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
          <h3 className="font-bold text-primary mb-6" style={{ fontSize: '1.25rem' }}>General Preferences</h3>
          
          <div className="form-group mb-4">
            <label className="text-sm text-muted mb-2 block">Platform Name</label>
            <input type="text" className="form-control w-full" defaultValue="DentaAI System" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.75rem', borderRadius: '8px' }} />
          </div>
          
          <div className="form-group mb-6">
            <label className="text-sm text-muted mb-2 block">Support Contact Email</label>
            <input type="email" className="form-control w-full" defaultValue="support@dentaai.com" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.75rem', borderRadius: '8px' }} />
          </div>

          <button className="btn btn-primary flex-align-center gap-2"><Save size={18} /> Save Changes</button>
        </motion.div>

        <motion.div variants={item} className="card glass-card" style={{ padding: '2rem' }}>
          <h3 className="font-bold text-primary mb-6" style={{ fontSize: '1.25rem' }}>Security & Features</h3>
          
          <div className="flex-between mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex-align-center gap-3">
              <ShieldAlert className="text-warning" size={20} />
              <div>
                <h4 className="font-bold">Require Doctor Verification</h4>
                <p className="text-xs text-muted">Force human override on AI results before report sharing.</p>
              </div>
            </div>
            <div className="toggle-switch">
              {/* Mock switch */}
              <div style={{ width: '40px', height: '24px', background: 'var(--primary)', borderRadius: '12px', position: 'relative' }}>
                <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', right: '3px', top: '3px' }}></div>
              </div>
            </div>
          </div>

          <div className="flex-between mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex-align-center gap-3">
              <Bell className="text-secondary" size={20} />
              <div>
                <h4 className="font-bold">Email Notifications</h4>
                <p className="text-xs text-muted">Send automated alerts for new consultation bookings.</p>
              </div>
            </div>
            <div className="toggle-switch">
              <div style={{ width: '40px', height: '24px', background: 'var(--primary)', borderRadius: '12px', position: 'relative' }}>
                <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', right: '3px', top: '3px' }}></div>
              </div>
            </div>
          </div>

          <div className="flex-between">
            <div className="flex-align-center gap-3">
              <Database className="text-primary" size={20} />
              <div>
                <h4 className="font-bold">Auto-Purge Scans</h4>
                <p className="text-xs text-muted">Delete unverified AI scans older than 90 days.</p>
              </div>
            </div>
            <div className="toggle-switch">
              <div style={{ width: '40px', height: '24px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', position: 'relative' }}>
                <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', left: '3px', top: '3px' }}></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminSettings;
