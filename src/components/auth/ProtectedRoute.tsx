import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, isReadOnly } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute check:', { 
    isAuthenticated, 
    isAdmin, 
    isReadOnly,
    requireAdmin, 
    path: location.pathname 
  });

  // Anyone can access non-admin routes
  if (!requireAdmin) {
    return <Outlet />;
  }

  // For admin routes, check if the user is admin
  if (requireAdmin && !isAdmin) {
    // If in read-only mode, redirect to login
    if (isReadOnly) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    // If logged in but not admin, redirect to home
    return <Navigate to="/" replace />;
  }

  // Render the protected component for admin users
  return <Outlet />;
};

export default ProtectedRoute; 