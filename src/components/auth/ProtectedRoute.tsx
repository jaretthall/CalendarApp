import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requireAdmin = false }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute check:', { 
    isAuthenticated, 
    isAdmin, 
    requireAdmin, 
    path: location.pathname 
  });

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Temporarily bypass admin check for debugging
  // if (requireAdmin && !isAdmin) {
  //   // Redirect to home page if admin access is required but user is not an admin
  //   return <Navigate to="/" replace />;
  // }

  // Render the protected component
  return <Outlet />;
};

export default ProtectedRoute; 