// src/App.js
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AuthProvider } from './context/AuthContext';

import { CSpinner, useColorModes } from '@coreui/react';
import './scss/style.scss';
import './scss/examples.scss';

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'));

// Pages
const Login = React.lazy(() => import('./views/pages/login/Login'));
const Register = React.lazy(() => import('./views/pages/register/Register'));
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'));
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'));
const Unauthorized = React.lazy(() => import('./views/pages/unauthorized/Unauthorized'));
const UploadImage = React.lazy(() => import('./views/pages/uploadImage/UploadImage'));
const ProtectedRoute = React.lazy(() => import('./components/ProtectedRoute'));
const PublicOnlyRoute = React.lazy(() => import('./components/PublicOnlyRoute'));

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme');
  const storedTheme = useSelector((state) => state.theme);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1]);
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0];
    if (theme) {
      setColorMode(theme);
    }

    if (isColorModeSet()) {
      return;
    }

    setColorMode(storedTheme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="pt-3 text-center">
              <CSpinner color="primary" variant="grow" />
            </div>
          }
        >
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
    </AuthProvider>
  );
};

export default App;