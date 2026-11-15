import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Activity, UserCircle, LogOut, LayoutDashboard, HeartPulse, Stethoscope, BriefcaseMedical, Users, CheckCircle2, BrainCircuit, Settings, FileText, MessageSquare, CreditCard, History, Video, Bell, Menu, X, Calendar, ChevronDown } from 'lucide-react';
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [acceptedToast, setAcceptedToast] = useState(null);
  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);
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

  const [badgeCounts, setBadgeCounts] = useState({ pending: 0, consultations: 0 });

  const updateUserData = useCallback(() => {
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

  useEffect(() => {
    updateUserData();
    window.addEventListener('storage', updateUserData);
    return () => window.removeEventListener('storage', updateUserData);
  }, [updateUserData]);

  // Live badge counts for doctors
  useEffect(() => {
    if (role !== 'doctor' || !userId) return;
    const fetchBadges = async () => {
      try {
        const token = localStorage.getItem('dentaai_token') || localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const [pendingRes, consultRes] = await Promise.all([
          fetch(`${API_BASE}/api/ai/pending-reviews`, { headers }),
          fetch(`${API_BASE}/api/consultations?doctorId=${userId}`, { headers })
        ]);
        let pCount = 0;
        let cCount = 0;
        if (pendingRes.ok) {
          const pData = await pendingRes.json();
          pCount = Array.isArray(pData) ? pData.length : 0;
        }
        if (consultRes.ok) {
          const cData = await consultRes.json();
          if (Array.isArray(cData)) {
            cCount = cData.filter(c => c.status === 'In Progress' || c.status === 'Accepted' || c.status === 'Pending').length;
          }
        }
        setBadgeCounts({ pending: pCount, consultations: cCount });
      } catch (err) {
        // Quiet fail
      }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 12000);
    return () => clearInterval(interval);
  }, [role, userId]);

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
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
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

  const todayFormatted = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  const getInitials = (name) => {
    if (!name) return role === 'doctor' ? 'DR' : 'PT';
    const clean = name.replace(/^Dr\.\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('dentaai_token');
    localStorage.removeItem('dentaai_user');
    navigate('/');
  };

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
        <div className="sidebar-brand" style={{ padding: '20px 22px', height: 'auto', minHeight: '74px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.45)' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #00A6A6 0%, #06C6E8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(0, 166, 166, 0.25)',
            flexShrink: 0
          }}>
            <BriefcaseMedical size={22} color="#FFFFFF" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#17324D', letterSpacing: '-0.4px', lineHeight: 1.1 }}>
              DentaAI
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {role === 'doctor' ? 'Clinical Workspace' : role === 'patient' ? 'Patient Portal' : 'Admin Console'}
            </span>
          </div>
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
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </Link>
          
          {role === 'doctor' && (
            <>
              <div className="sidebar-section-label">
                <span>Clinical Triage</span>
              </div>
              <Link to="/dashboard/doctor/reviews" className={`sidebar-link ${currentPath === '/dashboard/doctor/reviews' ? 'active' : ''}`}>
                <Stethoscope size={19} />
                <span>Pending Reviews</span>
                {badgeCounts.pending > 0 && (
                  <span className={`sidebar-badge-counter ${currentPath === '/dashboard/doctor/reviews' ? 'sidebar-badge-active' : 'sidebar-badge-amber'}`}>
                    {badgeCounts.pending}
                  </span>
                )}
              </Link>
              <Link to="/dashboard/doctor/cases" className={`sidebar-link ${currentPath === '/dashboard/doctor/cases' ? 'active' : ''}`}>
                <Users size={19} />
                <span>Patient Cases</span>
              </Link>
              <Link to="/dashboard/doctor/verified" className={`sidebar-link ${currentPath === '/dashboard/doctor/verified' ? 'active' : ''}`}>
                <CheckCircle2 size={19} />
                <span>Verified Cases</span>
              </Link>

              <div className="sidebar-section-label">
                <span>Consultations</span>
              </div>
              <Link to="/dashboard/doctor/consultations" className={`sidebar-link ${currentPath === '/dashboard/doctor/consultations' ? 'active' : ''}`}>
                <Video size={19} />
                <span>Consultation Requests</span>
                {badgeCounts.consultations > 0 && (
                  <span className={`sidebar-badge-counter ${currentPath === '/dashboard/doctor/consultations' ? 'sidebar-badge-active' : 'sidebar-badge-teal'}`}>
                    {badgeCounts.consultations}
                  </span>
                )}
              </Link>
              <Link to="/dashboard/doctor/payments" className={`sidebar-link ${currentPath === '/dashboard/doctor/payments' ? 'active' : ''}`}>
                <CreditCard size={19} />
                <span>Payments & Earnings</span>
              </Link>
              <Link to="/dashboard/doctor/history" className={`sidebar-link ${currentPath === '/dashboard/doctor/history' ? 'active' : ''}`}>
                <History size={19} />
                <span>Consultation History</span>
              </Link>

              <div className="sidebar-section-label">
                <span>Account & Practice</span>
              </div>
              <Link to="/dashboard/doctor/profile" className={`sidebar-link ${currentPath === '/dashboard/doctor/profile' ? 'active' : ''}`}>
                <UserCircle size={19} />
                <span>My Profile</span>
              </Link>
            </>
          )}

          {role === 'patient' && (
            <>
              <div className="sidebar-section-label">
                <span>Diagnostic Care</span>
              </div>
              <Link to="/dashboard/patient/screening-history" className={`sidebar-link ${currentPath === '/dashboard/patient/screening-history' || currentPath === '/dashboard/patient/history' ? 'active' : ''}`}>
                <History size={19} />
                <span>Screening History</span>
              </Link>
              <Link to="/dashboard/patient/reports" className={`sidebar-link ${currentPath === '/dashboard/patient/reports' ? 'active' : ''}`}>
                <FileText size={19} />
                <span>My Reports</span>
              </Link>
              <Link to="/dashboard/patient/predictions" className={`sidebar-link ${currentPath === '/dashboard/patient/predictions' ? 'active' : ''}`}>
                <Activity size={19} />
                <span>My Predictions</span>
              </Link>

              <div className="sidebar-section-label">
                <span>Clinical Services</span>
              </div>
              <Link to="/dashboard/patient/recommended-doctors" className={`sidebar-link ${currentPath === '/dashboard/patient/recommended-doctors' ? 'active' : ''}`}>
                <Stethoscope size={19} />
                <span>Find a Dentist</span>
              </Link>
              <Link to="/dashboard/patient/consultations" className={`sidebar-link ${currentPath === '/dashboard/patient/consultations' ? 'active' : ''}`}>
                <Video size={19} />
                <span>My Appointments</span>
              </Link>
              <Link to="/dashboard/patient/payments" className={`sidebar-link ${currentPath === '/dashboard/patient/payments' ? 'active' : ''}`}>
                <CreditCard size={19} />
                <span>Payments</span>
              </Link>

              <div className="sidebar-section-label">
                <span>Wellness & Profile</span>
              </div>
              <Link to="/dashboard/patient/health-tips" className={`sidebar-link ${currentPath === '/dashboard/patient/health-tips' ? 'active' : ''}`}>
                <HeartPulse size={19} />
                <span>Health Tips</span>
              </Link>
              <Link to="/dashboard/patient/profile" className={`sidebar-link ${currentPath === '/dashboard/patient/profile' ? 'active' : ''}`}>
                <UserCircle size={19} />
                <span>My Profile</span>
              </Link>
            </>
          )}

          {role === 'admin' && (
            <>
              <div className="sidebar-section-label">
                <span>Management</span>
              </div>
              <Link to="/dashboard/admin" className={`sidebar-link ${currentPath === '/dashboard/admin' ? 'active' : ''}`}>
                <LayoutDashboard size={19} />
                <span>Overview</span>
              </Link>
              <Link to="/dashboard/admin/doctors" className={`sidebar-link ${currentPath === '/dashboard/admin/doctors' ? 'active' : ''}`}>
                <Stethoscope size={19} />
                <span>Doctor Verification</span>
              </Link>
              <Link to="/dashboard/admin/patients" className={`sidebar-link ${currentPath === '/dashboard/admin/patients' ? 'active' : ''}`}>
                <UserCircle size={19} />
                <span>Patients</span>
              </Link>
              <Link to="/dashboard/admin/appointments" className={`sidebar-link ${currentPath === '/dashboard/admin/appointments' ? 'active' : ''}`}>
                <Calendar size={19} />
                <span>Appointments</span>
              </Link>
              <Link to="/dashboard/admin/payments" className={`sidebar-link ${currentPath === '/dashboard/admin/payments' ? 'active' : ''}`}>
                <CreditCard size={19} />
                <span>Payments & Revenue</span>
              </Link>

              <div className="sidebar-section-label">
                <span>Clinical & Intelligence</span>
              </div>
              <Link to="/dashboard/admin/predictions" className={`sidebar-link ${currentPath === '/dashboard/admin/predictions' ? 'active' : ''}`}>
                <Activity size={19} />
                <span>Dental Scans</span>
              </Link>
              <Link to="/dashboard/admin/ai-model" className={`sidebar-link ${currentPath === '/dashboard/admin/ai-model' ? 'active' : ''}`}>
                <BrainCircuit size={19} />
                <span>AI Diagnostics</span>
              </Link>

              <div className="sidebar-section-label">
                <span>Governance & Alerts</span>
              </div>
              <Link to="/dashboard/admin/notifications" className={`sidebar-link ${currentPath === '/dashboard/admin/notifications' ? 'active' : ''}`}>
                <Bell size={19} />
                <span>Notifications</span>
              </Link>
              <Link to="/dashboard/admin/activity" className={`sidebar-link ${currentPath === '/dashboard/admin/activity' ? 'active' : ''}`}>
                <ShieldCheck size={19} />
                <span>Audit Logs</span>
              </Link>
              <Link to="/dashboard/admin/users" className={`sidebar-link ${currentPath === '/dashboard/admin/users' ? 'active' : ''}`}>
                <Users size={19} />
                <span>All Users</span>
              </Link>
              <Link to="/dashboard/admin/settings" className={`sidebar-link ${currentPath === '/dashboard/admin/settings' ? 'active' : ''}`}>
                <Settings size={19} />
                <span>Settings</span>
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-dossier">
            <div className="sidebar-user-avatar">
              {getInitials(userName)}
              <span className="sidebar-user-status-dot" title="Active & Online" />
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name" title={userName || (role === 'doctor' ? 'Dr. Doctor' : 'Patient')}>
                {userName || (role === 'doctor' ? 'Dr. Doctor' : 'Patient')}
              </span>
              <span className="sidebar-user-role">
                {role === 'doctor' ? 'Verified Specialist' : role === 'patient' ? 'Active Patient' : 'Portal Administrator'}
              </span>
            </div>
            <button 
              type="button"
              className="sidebar-logout-btn"
              onClick={handleLogout}
              title="Logout from portal"
              aria-label="Logout"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`dashboard-main ${(role === 'patient' || role === 'doctor' || role === 'admin') ? 'patient-dashboard-main' : ''}`}>
        <header className="dashboard-header-top">
          {/* Left: Mobile hamburger + Portal Title + Status Badge */}
          <div className="header-left-group" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#17324D', letterSpacing: '-0.3px' }}>
                {role.charAt(0).toUpperCase() + role.slice(1)} Portal
              </h3>

              <div className="topbar-date-chip">
                <Calendar size={13} color="#00A6A6" />
                <span>{todayFormatted}</span>
              </div>
            </div>
          </div>

          {/* Right: Notifications + User Account Dropdown */}
          <div className="header-user" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            
            {/* Notification Bell */}
            <div className="notification-bell-container" ref={dropdownRef} style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="topbar-bell-btn"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="topbar-bell-badge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="topbar-notifications-dropdown">
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Bell size={16} color="#00A6A6" />
                      <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#17324D' }}>Notifications</h4>
                    </div>
                    {unreadCount > 0 && (
                      <span style={{ fontSize: '0.74rem', background: 'rgba(0, 166, 166, 0.1)', color: '#00A6A6', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
                        {unreadCount} Unread
                      </span>
                    )}
                  </div>
                  
                  <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748B' }}>
                        <Bell size={28} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
                        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>All caught up! No notifications.</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif._id || notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          style={{ 
                            padding: '14px 18px', 
                            borderBottom: '1px solid #F1F5F9', 
                            cursor: 'pointer', 
                            background: notif.isRead ? '#FFFFFF' : '#F0FDFA', 
                            transition: 'background 0.15s ease' 
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                          onMouseLeave={(e) => e.currentTarget.style.background = notif.isRead ? '#FFFFFF' : '#F0FDFA'}
                        >
                          <h5 style={{ margin: '0 0 4px 0', fontSize: '0.86rem', fontWeight: 700, color: notif.isRead ? '#17324D' : '#00A6A6' }}>
                            {notif.title}
                          </h5>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', lineHeight: '1.4' }}>
                            {notif.message}
                          </p>
                          <span style={{ display: 'block', marginTop: '6px', fontSize: '0.72rem', color: '#94A3B8' }}>
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive User Account Pill & Dropdown */}
            <div className="topbar-user-menu-container" ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowUserMenu(prev => !prev)}
                className="topbar-user-pill-btn"
                aria-expanded={showUserMenu}
                aria-label="User account menu"
              >
                <div className="topbar-user-avatar">
                  {getInitials(userName)}
                  <span className="topbar-user-online-dot" />
                </div>
                <div className="topbar-user-text-stack">
                  <span className="topbar-user-name">
                    {userName || (role === 'doctor' ? 'Dr. Doctor' : 'Patient')}
                  </span>
                </div>
                <ChevronDown size={14} color="#64748B" style={{ transition: 'transform 0.2s', transform: showUserMenu ? 'rotate(180deg)' : 'none' }} />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="topbar-user-dropdown">
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                    <p style={{ margin: '0 0 2px 0', fontSize: '0.88rem', fontWeight: 800, color: '#17324D' }}>
                      {userName || 'User'}
                    </p>
                    <span style={{ fontSize: '0.74rem', color: '#64748B', display: 'block', textTransform: 'capitalize' }}>
                      {role} Account • Active
                    </span>
                  </div>

                  <div style={{ padding: '6px' }}>
                    <Link
                      to={role === 'doctor' ? '/dashboard/doctor/profile' : '/dashboard/patient/profile'}
                      onClick={() => setShowUserMenu(false)}
                      className="topbar-dropdown-item"
                    >
                      <UserCircle size={16} color="#00A6A6" />
                      <span>My Profile & Practice</span>
                    </Link>

                    {role === 'doctor' && (
                      <>
                        <Link
                          to="/dashboard/doctor/consultations"
                          onClick={() => setShowUserMenu(false)}
                          className="topbar-dropdown-item"
                        >
                          <Video size={16} color="#00A6A6" />
                          <span>Consultation Requests</span>
                        </Link>
                        <Link
                          to="/dashboard/doctor/payments"
                          onClick={() => setShowUserMenu(false)}
                          className="topbar-dropdown-item"
                        >
                          <CreditCard size={16} color="#00A6A6" />
                          <span>Payments & Earnings</span>
                        </Link>
                      </>
                    )}

                    {role === 'patient' && (
                      <>
                        <Link
                          to="/dashboard/patient/consultations"
                          onClick={() => setShowUserMenu(false)}
                          className="topbar-dropdown-item"
                        >
                          <Video size={16} color="#00A6A6" />
                          <span>My Appointments</span>
                        </Link>
                        <Link
                          to="/dashboard/patient/reports"
                          onClick={() => setShowUserMenu(false)}
                          className="topbar-dropdown-item"
                        >
                          <FileText size={16} color="#00A6A6" />
                          <span>Clinical Reports</span>
                        </Link>
                      </>
                    )}

                    <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 0' }} />

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="topbar-dropdown-item topbar-dropdown-logout"
                    >
                      <LogOut size={16} color="#DC2626" />
                      <span>Logout from Session</span>
                    </button>
                  </div>
                </div>
              )}
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

        {/* Mobile Bottom Navigation Bar for Native-like App Feel */}
        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          {role === 'patient' && (
            <>
              <Link to="/dashboard/patient" className={`bottom-nav-item ${currentPath === '/dashboard/patient' ? 'active' : ''}`}>
                <LayoutDashboard size={20} />
                <span>Home</span>
              </Link>
              <Link to="/dashboard/patient/screening-history" className={`bottom-nav-item ${currentPath.includes('history') ? 'active' : ''}`}>
                <History size={20} />
                <span>History</span>
              </Link>
              <Link to="/dashboard/patient/recommended-doctors" className={`bottom-nav-item ${currentPath.includes('doctors') ? 'active' : ''}`}>
                <Stethoscope size={20} />
                <span>Dentists</span>
              </Link>
              <Link to="/dashboard/patient/consultations" className={`bottom-nav-item ${currentPath.includes('consultations') ? 'active' : ''}`}>
                <Video size={20} />
                <span>Appts</span>
              </Link>
              <Link to="/dashboard/patient/profile" className={`bottom-nav-item ${currentPath.includes('profile') ? 'active' : ''}`}>
                <UserCircle size={20} />
                <span>Profile</span>
              </Link>
            </>
          )}

          {role === 'doctor' && (
            <>
              <Link to="/dashboard/doctor" className={`bottom-nav-item ${currentPath === '/dashboard/doctor' ? 'active' : ''}`}>
                <LayoutDashboard size={20} />
                <span>Home</span>
              </Link>
              <Link to="/dashboard/doctor/reviews" className={`bottom-nav-item ${currentPath.includes('reviews') ? 'active' : ''}`}>
                <Stethoscope size={20} />
                <span>Reviews</span>
              </Link>
              <Link to="/dashboard/doctor/cases" className={`bottom-nav-item ${currentPath.includes('cases') ? 'active' : ''}`}>
                <Users size={20} />
                <span>Cases</span>
              </Link>
              <Link to="/dashboard/doctor/consultations" className={`bottom-nav-item ${currentPath.includes('consultations') ? 'active' : ''}`}>
                <Video size={20} />
                <span>Requests</span>
              </Link>
              <Link to="/dashboard/doctor/profile" className={`bottom-nav-item ${currentPath.includes('profile') ? 'active' : ''}`}>
                <UserCircle size={20} />
                <span>Profile</span>
              </Link>
            </>
          )}

          {role === 'admin' && (
            <>
              <Link to="/dashboard/admin" className={`bottom-nav-item ${currentPath === '/dashboard/admin' ? 'active' : ''}`}>
                <LayoutDashboard size={20} />
                <span>Home</span>
              </Link>
              <Link to="/dashboard/admin/doctors" className={`bottom-nav-item ${currentPath.includes('doctors') ? 'active' : ''}`}>
                <Stethoscope size={20} />
                <span>Doctors</span>
              </Link>
              <Link to="/dashboard/admin/patients" className={`bottom-nav-item ${currentPath.includes('patients') ? 'active' : ''}`}>
                <UserCircle size={20} />
                <span>Patients</span>
              </Link>
              <Link to="/dashboard/admin/appointments" className={`bottom-nav-item ${currentPath.includes('appointments') ? 'active' : ''}`}>
                <Calendar size={20} />
                <span>Appts</span>
              </Link>
              <Link to="/dashboard/admin/payments" className={`bottom-nav-item ${currentPath.includes('payments') ? 'active' : ''}`}>
                <CreditCard size={20} />
                <span>Pay</span>
              </Link>
              <Link to="/dashboard/admin/settings" className={`bottom-nav-item ${currentPath.includes('settings') ? 'active' : ''}`}>
                <Settings size={20} />
                <span>Settings</span>
              </Link>
            </>
          )}
        </nav>
      </main>
    </div>
  );
};

export default DashboardLayout;
