import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AuthProvider } from './context/AuthContext';

import { useColorModes } from '@coreui/react';
import './scss/style.scss';
import './scss/examples.scss';

import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import { BillsAuthProvider } from './context/BillsAuthContext';

const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'));
const Login = React.lazy(() => import('./views/pages/login/Login'));
const Register = React.lazy(() => import('./views/pages/register/Register'));
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'));
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'));
const Unauthorized = React.lazy(() => import('./views/pages/unauthorized/Unauthorized'));
const UploadImage = React.lazy(() => import('./views/pages/uploadImage/UploadImage'));

const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #eb6c9c',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme');
  const storedTheme = useSelector((state) => state.theme);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1]);
    const theme = urlParams.get('theme')?.match(/^[A-Za-z0-9\s]+/)?.[0];
    if (theme) {
      setColorMode(theme);
    }

    if (isColorModeSet()) {
      return;
    }

    setColorMode(storedTheme);
  }, [isColorModeSet, setColorMode, storedTheme]);

  return (
    <AuthProvider>
      <BillsAuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public */}
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />

              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <Register />
                  </PublicOnlyRoute>
                }
              />

              {/* Error pages */}
              <Route path="/404" element={<Page404 />} />
              <Route path="/500" element={<Page500 />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected */}
              <Route element={<ProtectedRoute />}>
                <Route path="/*" element={<DefaultLayout />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </BillsAuthProvider>
    </AuthProvider>
  );
};

export default App;