// src/components/BillsProtectedRoute.js
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useBillsAuth } from '../context/BillsAuthContext';

const BillsProtectedRoute = ({ redirectTo = '/dashboard' }) => {
  const { isBillsAuthenticated } = useBillsAuth();
  const location = useLocation();
  
  // Check both context and sessionStorage
  const isAuthenticated = isBillsAuthenticated || sessionStorage.getItem('billsAuth') === 'true';

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location, requiresBillsAuth: true }} replace />;
  }

  return <Outlet />;
};

export default BillsProtectedRoute;