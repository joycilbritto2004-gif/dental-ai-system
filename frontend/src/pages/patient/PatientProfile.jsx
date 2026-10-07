import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Save, Phone, Mail, Lock, User as UserIcon, ShieldCheck } from 'lucide-react';
import '../Dashboard.css';

const PatientProfile = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('dentaai_token');
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          password: '',
          confirmPassword: ''
        });
        setUserRole(data.role || 'Patient');
      } else {
        setMessage({ type: 'error', text: 'Failed to load profile.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server error. Could not connect.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      return setMessage({ type: 'error', text: 'Passwords do not match.' });
    }
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const token = localStorage.getItem('dentaai_token');
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          ...(formData.password ? { password: formData.password } : {})
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        
        // Update local storage name to reflect across the app
        const userStr = localStorage.getItem('dentaai_user');
        if (userStr) {
           const user = JSON.parse(userStr);
           user.name = data.name;
           localStorage.setItem('dentaai_user', JSON.stringify(user));
           window.dispatchEvent(new Event('storage'));
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server error. Please try again later.' });
    } finally {
      setSaving(false);
    }
  };

  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  if (loading) return <div className="dashboard-view" style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}><div className="spin-anim"><UserCircle size={40} color="var(--secondary)" /></div></div>;

  return (
    <motion.div className="dashboard-view" initial="hidden" animate="show" variants={stagger}>
      <motion.div variants={item} className="mb-6" style={{ background: 'var(--bg-secondary)', padding: '32px 40px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
        <div className="flex-between">
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--secondary)', marginBottom: '8px', display: 'block' }}>Account Settings</span>
            <h2 className="font-extrabold mb-2" style={{ color: 'var(--primary)', fontSize: '2rem', margin: 0 }}>My Profile</h2>
            <p className="font-medium m-0" style={{ color: 'var(--text-muted)' }}>Manage your personal information and security settings.</p>
          </div>
          <div style={{ background: 'rgba(0, 210, 255, 0.1)', padding: '16px', borderRadius: '50%', color: 'var(--secondary)' }}>
            <UserCircle size={40} />
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', maxWidth: '800px' }}>
        {message.text && (
          <div style={{ padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: message.type === 'error' ? '#ef4444' : '#10b981', border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}` }}>
            {message.type === 'success' ? <ShieldCheck size={20} /> : <UserCircle size={20} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}><UserIcon size={16} /> Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="form-control" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '12px 16px', borderRadius: '12px', width: '100%' }} />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}><Phone size={16} /> Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="form-control" placeholder="+1 234 567 8900" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '12px 16px', borderRadius: '12px', width: '100%' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}><Mail size={16} /> Email Address (Read-Only)</label>
            <input type="email" value={formData.email} disabled className="form-control" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '12px 16px', borderRadius: '12px', width: '100%', opacity: 0.7, cursor: 'not-allowed' }} />
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}><ShieldCheck size={16} /> Role</label>
            <input type="text" value={userRole.charAt(0).toUpperCase() + userRole.slice(1)} disabled className="form-control" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--secondary)', fontWeight: 'bold', padding: '12px 16px', borderRadius: '12px', width: '100%', opacity: 0.9, cursor: 'not-allowed' }} />
          </div>

          <div className="divider" style={{ background: 'var(--border-color)', height: '1px', margin: '8px 0' }}></div>

          <h4 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.1rem', fontWeight: 800 }}>Change Password</h4>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Leave blank if you do not wish to change your password.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}><Lock size={16} /> New Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-control" placeholder="••••••••" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '12px 16px', borderRadius: '12px', width: '100%' }} />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}><Lock size={16} /> Confirm New Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="form-control" placeholder="••••••••" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '12px 16px', borderRadius: '12px', width: '100%' }} />
            </div>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '12px 32px', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.7 : 1 }}>
              <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </motion.div>
    </motion.div>
  );
};

export default PatientProfile;
