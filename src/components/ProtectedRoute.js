// src/components/ProtectedRoute.js
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { CSpinner } from '@coreui/react';
import { useUser, getGuestHomePath, GUEST_ALLOWED_PATHS } from '../context/AuthContext';

/**
 * ProtectedRoute - Only checks if user is authenticated
 * Permission checks should be done inside individual components
 */
const ProtectedRoute = ({ redirectTo = '/login' }) => {
  const { user, loading } = useUser();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="pt-3 text-center min-vh-100 d-flex align-items-center justify-content-center">
        <CSpinner color="primary" variant="grow" />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Guests may only visit their allowed paths; anything else → their preview
  if (user.isGuest) {
    const allowed = GUEST_ALLOWED_PATHS(user).includes(location.pathname.replace(/\/+$/, ''));
    if (!allowed) {
      return <Navigate to={getGuestHomePath(user)} replace />;
    }
  }

  // Authenticated - render children
  return <Outlet />;
};

export default ProtectedRoute;