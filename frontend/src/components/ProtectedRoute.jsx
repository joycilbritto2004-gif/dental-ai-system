import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const userStr = localStorage.getItem('dentaai_user');
  
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    
    if (!user || !user.role || !['patient', 'doctor', 'admin'].includes(user.role)) {
      // Invalid user payload or unknown role: return to login
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // User doesn't have permission for this route, redirect to their role's dashboard
      return <Navigate to={`/dashboard/${user.role}`} replace />;
    }
    
    return <Outlet />;
  } catch (err) {
    console.error('Error parsing user data:', err);
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
