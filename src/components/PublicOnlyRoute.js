// src/components/PublicOnlyRoute.js
import { Navigate } from 'react-router-dom';
import { CSpinner } from '@coreui/react';
import { useUser } from '../context/AuthContext';

const PublicOnlyRoute = ({ children, redirectTo = '/dashboard' }) => {
  const { user, loading } = useUser();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="pt-3 text-center min-vh-100 d-flex align-items-center justify-content-center">
        <CSpinner color="primary" variant="grow" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default PublicOnlyRoute;