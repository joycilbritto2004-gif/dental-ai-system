import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, User, Stethoscope, Shield, BriefcaseMedical, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import './Auth.css';

const Register = () => {
  const [role, setRole] = useState('patient');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await api.register(formData.name, formData.email, formData.password, role, formData.phone);
      
      localStorage.setItem('dentaai_token', data.token);
      localStorage.setItem('dentaai_user', JSON.stringify({
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role
      }));

      navigate(`/dashboard/${data.role}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-split-layout">
      {/* Left Medical Panel */}
      <div className="auth-visual">
        <div className="auth-visual-overlay"></div>
        <motion.div 
          className="visual-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="visual-icon-glow">
            <BriefcaseMedical size={64} className="text-secondary mb-4" />
          </div>
          <h2>Join DentaAI</h2>
          <p>Register today to get access to advanced deep learning dental diagnostics and secure telemedicine features.</p>
        </motion.div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-container">
        <motion.div 
          className="auth-form-wrapper glass-card"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="auth-header">
            <h2>Create Account</h2>
            <p className="text-muted">Register your access profile</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="alert-error mb-4 flex-align-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="role-cards">
            <motion.div whileHover={{ y: -2 }} className={`role-card ${role === 'patient' ? 'active' : ''}`} onClick={() => setRole('patient')}>
              <User size={24} />
              <span>Patient</span>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} className={`role-card ${role === 'doctor' ? 'active' : ''}`} onClick={() => setRole('doctor')}>
              <Stethoscope size={24} />
              <span>Doctor</span>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} className={`role-card ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>
              <Shield size={24} />
              <span>Admin</span>
            </motion.div>
          </div>

          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group mb-4">
              <label className="form-label">Full Name</label>
              <input type="text" name="name" className="form-input" placeholder="John Doe" value={formData.name} onChange={handleChange} required disabled={isLoading} />
            </div>
            <div className="form-group mb-4">
              <label className="form-label">Email Address</label>
              <input type="email" name="email" className="form-input" placeholder="john@example.com" value={formData.email} onChange={handleChange} required disabled={isLoading} />
            </div>
            <div className="form-group mb-4">
              <label className="form-label">Phone Number</label>
              <input type="text" name="phone" className="form-input" placeholder="Enter phone number" value={formData.phone} onChange={handleChange} required disabled={isLoading} />
            </div>
            <div className="form-group mb-6">
              <label className="form-label">Password</label>
              <input type="password" name="password" className="form-input" placeholder="Create password" value={formData.password} onChange={handleChange} required disabled={isLoading} />
            </div>
            
            <button type="submit" className={`btn btn-primary auth-submit w-full ${!isLoading ? 'pulse-glow' : ''}`} disabled={isLoading}>
              <UserPlus size={18} /> {isLoading ? 'Registering...' : 'Secure Registration'}
            </button>
          </form>

          <div className="auth-footer mt-6">
            <p className="text-muted">Already registered? <Link to="/login" className="text-secondary font-semibold">Sign in</Link></p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
