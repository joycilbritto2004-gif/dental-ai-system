import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Activity, Image as ImageIcon, UserCircle, LogOut, LayoutDashboard, HeartPulse, Stethoscope, BriefcaseMedical, Users, CheckCircle2, BrainCircuit, Settings, FileText, MessageSquare, CreditCard, History, Video, Bell } from 'lucide-react';
import './DashboardLayout.css';

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
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('dentaai_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || user.firstName || user.username || '');
        setUserId(user._id || user.id);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [userId]);

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
      await fetch(`http://localhost:5000/api/notifications/${notif.id || notif._id}/read`, {
        method: 'PUT'
      });
      fetchNotifications();
      setShowNotifications(false);
      if (notif.consultationId) {
        if (role === 'doctor') {
          navigate(`/dashboard/doctor/consultation/${notif.consultationId}`);
        } else {
          navigate(`/dashboard/patient/consultations`);
        }
      }
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="dashboard-layout">
      {/* Deep Navy Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <BriefcaseMedical className="brand-icon" size={28} />
          <span className="brand-text">DentaAI</span>
        </div>

        <nav className="sidebar-nav">
          <Link to={`/dashboard/${role}`} className={`sidebar-link ${currentPath === `/dashboard/${role}` ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          
          {role === 'patient' && (
            <>

              <Link to="/dashboard/patient/predictions" className={`sidebar-link ${currentPath.startsWith('/dashboard/patient/predictions') ? 'active' : ''}`}>
                <Activity size={20} />
                <span>My Predictions</span>
              </Link>
              <Link to="/dashboard/patient/reports" className={`sidebar-link ${currentPath.startsWith('/dashboard/patient/reports') ? 'active' : ''}`}>
                <FileText size={20} />
                <span>My Reports</span>
              </Link>
              <Link to="/dashboard/patient/recommended-doctors" className={`sidebar-link ${currentPath.startsWith('/dashboard/patient/recommended-doctors') ? 'active' : ''}`}>
                <Stethoscope size={20} />
                <span>Recommended Doctors</span>
              </Link>
              <Link to="/dashboard/patient/consultations" className={`sidebar-link ${currentPath.startsWith('/dashboard/patient/consult') ? 'active' : ''}`}>
                <Video size={20} />
                <span>My Consultations</span>
              </Link>
              <Link to="/dashboard/patient/messages" className={`sidebar-link ${currentPath.startsWith('/dashboard/patient/messages') ? 'active' : ''}`}>
                <MessageSquare size={20} />
                <span>Messages</span>
              </Link>
              <Link to="/dashboard/patient/payments" className={`sidebar-link ${currentPath.startsWith('/dashboard/patient/payment') ? 'active' : ''}`}>
                <CreditCard size={20} />
                <span>Payments</span>
              </Link>
            </>
          )}

          {role === 'doctor' && (
            <>
              <Link to="/dashboard/doctor/reviews" className={`sidebar-link ${currentPath.includes('/doctor/reviews') ? 'active' : ''}`}>
                <Stethoscope size={20} />
                <span>Pending Reviews</span>
              </Link>
              <Link to="/dashboard/doctor/cases" className={`sidebar-link ${currentPath.includes('/doctor/cases') ? 'active' : ''}`}>
                <Users size={20} />
                <span>Patient Cases</span>
              </Link>
              <Link to="/dashboard/doctor/verified" className={`sidebar-link ${currentPath.includes('/doctor/verified') ? 'active' : ''}`}>
                <CheckCircle2 size={20} />
                <span>Verified Cases</span>
              </Link>
              <Link to="/dashboard/doctor/consultations" className={`sidebar-link ${currentPath.includes('/doctor/consultations') ? 'active' : ''}`}>
                <Video size={20} />
                <span>Consultation Requests</span>
              </Link>
              <Link to="/dashboard/doctor/messages" className={`sidebar-link ${currentPath.includes('/doctor/messages') ? 'active' : ''}`}>
                <MessageSquare size={20} />
                <span>Messages</span>
              </Link>
              <Link to="/dashboard/doctor/payments" className={`sidebar-link ${currentPath.includes('/doctor/payments') ? 'active' : ''}`}>
                <CreditCard size={20} />
                <span>Payments</span>
              </Link>
              <Link to="/dashboard/doctor/history" className={`sidebar-link ${currentPath.includes('/history') ? 'active' : ''}`}>
                <History size={20} />
                <span>Consultation History</span>
              </Link>
            </>
          )}

          {role === 'admin' && (
            <>
              <Link to="#" className="sidebar-link">
                <Users size={20} />
                <span>User Management</span>
              </Link>
              <Link to="#" className="sidebar-link">
                <Stethoscope size={20} />
                <span>Doctors</span>
              </Link>
              <Link to="#" className="sidebar-link">
                <UserCircle size={20} />
                <span>Patients</span>
              </Link>
              <Link to="#" className="sidebar-link">
                <BrainCircuit size={20} />
                <span>AI Model</span>
              </Link>
              <Link to="#" className="sidebar-link">
                <Activity size={20} />
                <span>Predictions</span>
              </Link>
              <Link to="#" className="sidebar-link">
                <Activity size={20} />
                <span>System Activity</span>
              </Link>
              <Link to="#" className="sidebar-link">
                <Settings size={20} />
                <span>Settings</span>
              </Link>
            </>
          )}

          {role === 'patient' && (
            <Link to="/dashboard/patient/health-tips" className={`sidebar-link ${currentPath.startsWith('/dashboard/patient/health-tips') ? 'active' : ''}`}>
              <HeartPulse size={20} />
              <span>Health Tips</span>
            </Link>
          )}

          {role !== 'admin' && (
            <Link to={role === 'doctor' ? '/dashboard/doctor/profile' : '/dashboard/patient/profile'} className={`sidebar-link ${role === 'doctor' ? currentPath.startsWith('/dashboard/doctor/profile') ? 'active' : '' : currentPath.startsWith('/dashboard/patient/profile') ? 'active' : ''}`}>
              <UserCircle size={20} />
              <span>My Profile</span>
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="sidebar-link text-logout">
            <LogOut size={20} />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`dashboard-main ${role === 'patient' ? 'patient-dashboard-main' : ''}`}>
        <header className="dashboard-header-top">
          <div className="header-title">
            <h3>{role.charAt(0).toUpperCase() + role.slice(1)} Portal</h3>
          </div>
          <div className="header-user">
            
            {/* Notification Bell */}
            <div className="notification-bell-container" ref={dropdownRef} style={{ position: 'relative', marginRight: '1rem' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', color: 'var(--text-main)', transition: 'background 0.2s' }}
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
                          <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', color: notif.isRead ? 'var(--text-main)' : 'var(--primary)' }}>{notif.title}</h5>
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
              <span className="user-name">Welcome, {userName || (role === 'patient' ? 'Patient' : role === 'doctor' ? 'Dr. Smith' : 'Admin')}</span>
            </div>
            <div className="user-avatar-circle">
              <UserCircle size={24} />
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
