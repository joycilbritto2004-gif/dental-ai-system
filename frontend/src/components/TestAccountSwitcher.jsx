import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle, Shield, Stethoscope, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const TestAccountSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Determine current role from active session
    const userStr = localStorage.getItem('dentaai_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentRole(user.role);
        // Backup the active session to its role-specific slot
        localStorage.setItem(`dentaai_saved_${user.role}`, userStr);
        localStorage.setItem(`dentaai_saved_token_${user.role}`, localStorage.getItem('dentaai_token') || '');
      } catch (e) {
        console.error(e);
      }
    } else {
      setCurrentRole(null);
    }
  }, [location.pathname]); // Re-run on navigation to keep it synced

  const switchRole = (targetRole) => {
    // 1. Backup current session if exists
    const userStr = localStorage.getItem('dentaai_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        localStorage.setItem(`dentaai_saved_${user.role}`, userStr);
        localStorage.setItem(`dentaai_saved_token_${user.role}`, localStorage.getItem('dentaai_token') || '');
      } catch (e) {
        console.error("Error backing up session:", e);
      }
    }

    // 2. Restore target session
    const targetUserStr = localStorage.getItem(`dentaai_saved_${targetRole}`);
    const targetToken = localStorage.getItem(`dentaai_saved_token_${targetRole}`);

    if (targetUserStr && targetToken) {
      localStorage.setItem('dentaai_user', targetUserStr);
      localStorage.setItem('dentaai_token', targetToken);
      // Hard reload to reset all states
      window.location.href = `/dashboard/${targetRole}`;
    } else {
      // If no saved session, go to login and clear current
      localStorage.removeItem('dentaai_user');
      localStorage.removeItem('dentaai_token');
      // Tell them they need to login once
      alert(`No active session found for ${targetRole}. Please login manually once. Your session will be saved for quick switching next time.`);
      window.location.href = '/login';
    }
  };

  if (!import.meta.env.DEV) return null; // Safety net: Only render in development

  const roles = [
    { id: 'admin', icon: Shield, color: '#ef4444', label: 'Admin' },
    { id: 'doctor', icon: Stethoscope, color: '#00d2ff', label: 'Doctor' },
    { id: 'patient', icon: UserCircle, color: '#10b981', label: 'Patient' }
  ];

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{
              background: 'rgba(10, 25, 47, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 210, 255, 0.2)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              width: '240px'
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Test Account Switcher
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => switchRole(role.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: currentRole === role.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    border: `1px solid ${currentRole === role.id ? role.color : 'rgba(255, 255, 255, 0.05)'}`,
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: currentRole === role.id ? 1 : 0.7
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.opacity = '1'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = currentRole === role.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent'; e.currentTarget.style.opacity = currentRole === role.id ? '1' : '0.7'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <role.icon size={16} color={role.color} />
                    <span style={{ fontSize: '0.9rem' }}>{role.label}</span>
                  </div>
                  {currentRole === role.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: role.color }}></div>}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--secondary), var(--accent))',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0, 210, 255, 0.4)',
          transition: 'transform 0.2s',
          marginLeft: 'auto'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title="Test Account Switcher"
      >
        <Settings size={24} />
      </button>
    </div>
  );
};

export default TestAccountSwitcher;
