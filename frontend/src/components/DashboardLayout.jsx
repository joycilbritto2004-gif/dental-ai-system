import { Link, useLocation, Outlet } from 'react-router-dom';
import { Activity, Image as ImageIcon, UserCircle, LogOut, LayoutDashboard, HeartPulse, Stethoscope, BriefcaseMedical, Users, CheckCircle2, BrainCircuit, Settings, FileText, MessageSquare, CreditCard, History, Video } from 'lucide-react';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  let role = 'patient';
  if (currentPath.includes('doctor')) role = 'doctor';
  if (currentPath.includes('admin')) role = 'admin';

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
              <Link to="/dashboard/patient" className={`sidebar-link ${currentPath === '/dashboard/patient' ? 'active' : ''}`}>
                <ImageIcon size={20} />
                <span>Upload Image</span>
              </Link>
              <Link to="/dashboard/patient/predictions" className={`sidebar-link ${currentPath.includes('/predictions') ? 'active' : ''}`}>
                <Activity size={20} />
                <span>My Predictions</span>
              </Link>
              <Link to="/dashboard/patient/reports" className={`sidebar-link ${currentPath.includes('/reports') ? 'active' : ''}`}>
                <FileText size={20} />
                <span>My Reports</span>
              </Link>
              <Link to="/dashboard/patient/doctors" className={`sidebar-link ${currentPath.includes('/doctors') ? 'active' : ''}`}>
                <Stethoscope size={20} />
                <span>Recommended Doctors</span>
              </Link>
              <Link to="/dashboard/patient/consultations" className={`sidebar-link ${currentPath.includes('/patient/consultations') ? 'active' : ''}`}>
                <Video size={20} />
                <span>My Consultations</span>
              </Link>
              <Link to="/dashboard/patient/messages" className={`sidebar-link ${currentPath.includes('/patient/messages') ? 'active' : ''}`}>
                <MessageSquare size={20} />
                <span>Messages</span>
              </Link>
              <Link to="/dashboard/patient/payments" className={`sidebar-link ${currentPath.includes('/patient/payments') ? 'active' : ''}`}>
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
            <Link to="#" className="sidebar-link">
              <HeartPulse size={20} />
              <span>Health Tips</span>
            </Link>
          )}

          {role !== 'admin' && (
            <Link to={role === 'doctor' ? '/dashboard/doctor/profile' : '#'} className={`sidebar-link ${currentPath.includes('/profile') ? 'active' : ''}`}>
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
      <main className="dashboard-main">
        <header className="dashboard-header-top">
          <div className="header-title">
            <h3>{role.charAt(0).toUpperCase() + role.slice(1)} Portal</h3>
          </div>
          <div className="header-user">
            <div className="user-info">
              <span className="user-name">Welcome, {role === 'patient' ? 'Jane' : role === 'doctor' ? 'Dr. Smith' : 'Admin'}</span>
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
