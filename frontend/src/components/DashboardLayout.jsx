import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Activity, UserCircle, LogOut, LayoutDashboard, HeartPulse, Stethoscope, BriefcaseMedical, Users, CheckCircle2, BrainCircuit, Settings, FileText, MessageSquare, CreditCard, History, Video, Bell, Menu, X } from 'lucide-react';
import { getSocket, registerUserSocket } from '../utils/socket';
import './DashboardLayout.css';
import { API_BASE } from '../config';

const DashboardLayout = () => {
  const [userName, setUserName] = useState('');
  const location = useLocation();
  const currentPath = location.pathname;

  let role = 'patient';
  if (currentPath.startsWith('/dashboard/doctor')) role = 'doctor';
  if (currentPath.startsWith('/dashboard/admin')) role = 'admin';

  const [userId, setUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [acceptedToast, setAcceptedToast] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close mobile navigation drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPath]);

  // Accessible keyboard listener: close mobile drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const userStr = localStorage.getItem('dentaai_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        
        if (user) {
          let name = user.name || user.firstName || user.username || '';
          if (role === 'doctor' && name && !name.startsWith('Dr.')) {
            name = `Dr. ${name}`;
          }
          setUserName(name);
        }
        
        if (user.role === role || role === 'doctor') {
          setUserId(user._id || user.id);
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, [role]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [userId]);

  // Real-time socket event listener for accepted consultations
  useEffect(() => {
    if (!userId) return;
    registerUserSocket(userId);
    const socket = getSocket();

    const handleConsultationAccepted = (payload) => {
      fetchNotifications();
      if (role === 'patient') {
        setAcceptedToast(payload);
      }
    };

    if (socket) {
      socket.on('consultation-accepted', handleConsultationAccepted);
    }

    return () => {
      if (socket) {
        socket.off('consultation-accepted', handleConsultationAccepted);
      }
    };
  }, [userId, role, fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    try {
      await fetch(`${API_BASE}/api/notifications/${notif.id || notif._id}/read`, {
        method: 'PUT'
      });
      fetchNotifications();
      setShowNotifications(false);
      if (notif.consultationId) {
        if (role === 'doctor') {
          navigate(`/dashboard/doctor/consultation/${notif.consultationId}`);
        } else {
          navigate(`/dashboard/patient/consultation/${notif.consultationId}/messages`, {
            state: { consultationId: notif.consultationId }
          });
        }
      }
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={`dashboard-layout ${role === 'patient' ? 'patient-portal-theme' : ''} ${role === 'doctor' ? 'doctor-portal-theme' : ''} ${role === 'admin' ? 'admin-portal-theme' : ''}`}>
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileMenuOpen(false)} 
          aria-hidden="true" 
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`dashboard-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
        aria-label={`${role} portal navigation`}
      >
        <div className="sidebar-brand">
          <BriefcaseMedical className="brand-icon" size={28} style={{ color: '#17324D' }} />
          <span className="brand-text" style={{ color: '#17324D' }}>DentaAI</span>
          <button
            type="button"
            className="mobile-sidebar-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link to={`/dashboard/${role}`} className={`sidebar-link ${currentPath === `/dashboard/${role}` ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          
          {role === 'patient' && (
            <>
              <Link to="/dashboard/patient/screening-history" className={`sidebar-link ${currentPath === '/dashboard/patient/screening-history' || currentPath === '/dashboard/patient/history' ? 'active' : ''}`}>
                <History size={20} />
                <span>Screening History</span>
              </Link>
              <Link to="/dashboard/patient/reports" className={`sidebar-link ${currentPath === '/dashboard/patient/reports' ? 'active' : ''}`}>
                <FileText size={20} />
                <span>My Reports</span>
              </Link>
              <Link to="/dashboard/patient/predictions" className={`sidebar-link ${currentPath === '/dashboard/patient/predictions' ? 'active' : ''}`}>
                <Activity size={20} />
                <span>My Predictions</span>
              </Link>
              <Link to="/dashboard/patient/recommended-doctors" className={`sidebar-link ${currentPath === '/dashboard/patient/recommended-doctors' ? 'active' : ''}`}>
                <Stethoscope size={20} />
                <span>Find a Dentist</span>
              </Link>
              <Link to="/dashboard/patient/consultations" className={`sidebar-link ${currentPath === '/dashboard/patient/consultations' ? 'active' : ''}`}>
                <Video size={20} />
                <span>My Appointments</span>
              </Link>
              <Link to="/dashboard/patient/payments" className={`sidebar-link ${currentPath === '/dashboard/patient/payments' ? 'active' : ''}`}>
                <CreditCard size={20} />
                <span>Payments</span>
              </Link>
            </>
          )}

          {role === 'doctor' && (
            <>
              <Link to="/dashboard/doctor/reviews" className={`sidebar-link ${currentPath === '/dashboard/doctor/reviews' ? 'active' : ''}`}>
                <Stethoscope size={20} />
                <span>Pending Reviews</span>
              </Link>
              <Link to="/dashboard/doctor/cases" className={`sidebar-link ${currentPath === '/dashboard/doctor/cases' ? 'active' : ''}`}>
                <Users size={20} />
                <span>Patient Cases</span>
              </Link>
              <Link to="/dashboard/doctor/verified" className={`sidebar-link ${currentPath === '/dashboard/doctor/verified' ? 'active' : ''}`}>
                <CheckCircle2 size={20} />
                <span>Verified Cases</span>
              </Link>
              <Link to="/dashboard/doctor/consultations" className={`sidebar-link ${currentPath === '/dashboard/doctor/consultations' ? 'active' : ''}`}>
                <Video size={20} />
                <span>Consultation Requests</span>
              </Link>
              <Link to="/dashboard/doctor/payments" className={`sidebar-link ${currentPath === '/dashboard/doctor/payments' ? 'active' : ''}`}>
                <CreditCard size={20} />
                <span>Payments</span>
              </Link>
              <Link to="/dashboard/doctor/history" className={`sidebar-link ${currentPath === '/dashboard/doctor/history' ? 'active' : ''}`}>
                <History size={20} />
                <span>Consultation History</span>
              </Link>
            </>
          )}

          {role === 'admin' && (
            <>
              <Link to="/dashboard/admin/users" className={`sidebar-link ${currentPath === '/dashboard/admin/users' ? 'active' : ''}`}>
                <Users size={20} />
                <span>User Management</span>
              </Link>
              <Link to="/dashboard/admin/doctors" className={`sidebar-link ${currentPath === '/dashboard/admin/doctors' ? 'active' : ''}`}>
                <Stethoscope size={20} />
                <span>Doctors</span>
              </Link>
              <Link to="/dashboard/admin/patients" className={`sidebar-link ${currentPath === '/dashboard/admin/patients' ? 'active' : ''}`}>
                <UserCircle size={20} />
                <span>Patients</span>
              </Link>
              <Link to="/dashboard/admin/ai-model" className={`sidebar-link ${currentPath === '/dashboard/admin/ai-model' ? 'active' : ''}`}>
                <BrainCircuit size={20} />
                <span>AI Model</span>
              </Link>
              <Link to="/dashboard/admin/predictions" className={`sidebar-link ${currentPath === '/dashboard/admin/predictions' ? 'active' : ''}`}>
                <Activity size={20} />
                <span>Predictions</span>
              </Link>
              <Link to="/dashboard/admin/activity" className={`sidebar-link ${currentPath === '/dashboard/admin/activity' ? 'active' : ''}`}>
                <Activity size={20} />
                <span>System Activity</span>
              </Link>
              <Link to="/dashboard/admin/settings" className={`sidebar-link ${currentPath === '/dashboard/admin/settings' ? 'active' : ''}`}>
                <Settings size={20} />
                <span>Settings</span>
              </Link>
            </>
          )}

          {role === 'patient' && (
            <Link to="/dashboard/patient/health-tips" className={`sidebar-link ${currentPath === '/dashboard/patient/health-tips' ? 'active' : ''}`}>
              <HeartPulse size={20} />
              <span>Health Tips</span>
            </Link>
          )}

          {role !== 'admin' && (
            <Link to={role === 'doctor' ? '/dashboard/doctor/profile' : '/dashboard/patient/profile'} className={`sidebar-link ${currentPath === (role === 'doctor' ? '/dashboard/doctor/profile' : '/dashboard/patient/profile') ? 'active' : ''}`}>
              <UserCircle size={20} />
              <span>My Profile</span>
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <Link 
            to="/" 
            className="sidebar-link text-logout"
            onClick={() => {
              localStorage.removeItem('dentaai_token');
              localStorage.removeItem('dentaai_user');
            }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`dashboard-main ${(role === 'patient' || role === 'doctor' || role === 'admin') ? 'patient-dashboard-main' : ''}`}>
        <header className="dashboard-header-top">
          <div className="header-left-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="header-title">
              <h3>{role.charAt(0).toUpperCase() + role.slice(1)} Portal</h3>
            </div>
          </div>
          <div className="header-user">
            
            {/* Notification Bell */}
            <div className="notification-bell-container" ref={dropdownRef} style={{ position: 'relative', marginRight: '1rem' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', color: 'var(--text-primary)', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(6, 198, 232, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '5px', right: '5px', background: 'var(--danger)', color: 'white', fontSize: '10px', fontWeight: 'bold', minWidth: '16px', height: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div style={{ position: 'absolute', top: '50px', right: '0', width: '320px', background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-glass)', zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--primary)' }}>Notifications</h4>
                    {unreadCount > 0 && <span style={{ fontSize: '12px', color: 'var(--secondary)', fontWeight: 'bold' }}>{unreadCount} New</span>}
                  </div>
                  
                  <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ margin: 0 }}>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif._id || notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', background: notif.isRead ? 'transparent' : 'rgba(6, 198, 232, 0.05)', transition: 'background 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(6, 198, 232, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(6, 198, 232, 0.05)'}
                        >
                          <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', color: notif.isRead ? 'var(--text-primary)' : 'var(--primary)' }}>{notif.title}</h5>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{notif.message}</p>
                          <span style={{ display: 'block', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            {new Date(notif.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="user-info">
              <span className="user-name">Welcome, {userName || 'User'}</span>
            </div>
            <div className="user-avatar-circle">
              <UserCircle size={24} />
            </div>
          </div>
        </header>

        {/* Real-time In-App Notification Toast for Consultation Acceptance */}
        {acceptedToast && (
          <div 
            className="in-app-acceptance-toast"
            style={{
              position: 'fixed',
              top: '84px',
              right: '24px',
              zIndex: 9999,
              background: '#ffffff',
              border: '1px solid #10b981',
              borderLeft: '6px solid #10b981',
              borderRadius: '16px',
              boxShadow: '0 12px 36px rgba(15, 23, 42, 0.16)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              maxWidth: '480px'
            }}
          >
            <div style={{ background: 'rgba(16, 185, 129, 0.14)', color: '#059669', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={24} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ margin: '0 0 2px 0', fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                Consultation Request Accepted!
              </h4>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#475569', lineHeight: 1.35 }}>
                Dr. {acceptedToast.doctorName || 'Your doctor'} has accepted your consultation. Messaging is now active.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={() => {
                  const cId = acceptedToast.consultationId || acceptedToast.id;
                  navigate(`/dashboard/patient/consultation/${cId}/messages`, { state: { consultationId: cId } });
                  setAcceptedToast(null);
                }}
                className="btn btn-primary btn-sm"
                style={{ padding: '8px 16px', borderRadius: '10px', fontWeight: 800, fontSize: '0.84rem', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(22, 119, 255, 0.25)' }}
              >
                Open Chat
              </button>
              <button
                onClick={() => setAcceptedToast(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', display: 'flex', alignItems: 'center' }}
                aria-label="Close notification"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
