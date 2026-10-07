import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const userStr = localStorage.getItem('dentaai_user');
  
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // User doesn't have permission, redirect to their own dashboard
      return <Navigate to={`/dashboard/${user.role}`} replace />;
    }
    
    return <Outlet />;
  } catch (err) {
    console.error('Error parsing user data:', err);
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
