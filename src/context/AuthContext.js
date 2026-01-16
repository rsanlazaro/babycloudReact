// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

/**
 * Permission Levels:
 * 0 = Not visible (hidden)
 * 1 = Visible but not editable (read-only)
 * 2 = Visible and editable (full access)
 */
export const PERMISSION_LEVELS = {
  HIDDEN: 0,
  READ_ONLY: 1,
  FULL_ACCESS: 2,
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [backendWaking, setBackendWaking] = useState(false);

  /**
   * Store raw permission values (0, 1, 2)
   */
  const processPermissions = (access) => {
    const perms = {};

    if (!access || typeof access !== 'object') {
      return perms;
    }

    for (const [key, value] of Object.entries(access)) {
      // Store as number (0, 1, or 2)
      perms[key] = Number(value) || 0;
    }

    return perms;
  };

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      const startTime = Date.now();
      
      try {
        const res = await api.get('/api/users/me');

        const elapsed = Date.now() - startTime;
        
        // If request took more than 5 seconds, show backend waking message
        if (elapsed > 5000) {
          setBackendWaking(true);
          setTimeout(() => setBackendWaking(false), 3000); // Hide after 3 seconds
        }

        // Extract the user object from the response
        const userData = res.data.user || res.data;

        setUserState(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        // Load permissions from localStorage
        const storedPerms = localStorage.getItem('permissions');
        if (storedPerms) {
          setPermissions(JSON.parse(storedPerms));
        }
      } catch (error) {
        console.log('Session check failed:', error?.response?.status);

        const elapsed = Date.now() - startTime;
        
        // Show backend waking message even on error if it took too long
        if (elapsed > 5000) {
          setBackendWaking(true);
          setTimeout(() => setBackendWaking(false), 3000);
        }

        // Only use localStorage as fallback for brief network issues,
        // not for invalid sessions
        if (error?.response?.status === 401) {
          // Session is invalid, clear everything
          localStorage.removeItem('user');
          localStorage.removeItem('permissions');
        } else {
          // Network error - try localStorage
          try {
            const storedUser = localStorage.getItem('user');
            const storedPerms = localStorage.getItem('permissions');

            if (storedUser) setUserState(JSON.parse(storedUser));
            if (storedPerms) setPermissions(JSON.parse(storedPerms));
          } catch (e) {
            console.log('No stored session data');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  /**
   * Login function
   */
  const login = useCallback((userData, accessData) => {
    console.log('Login - User:', userData);
    console.log('Login - Access:', accessData);

    setUserState(userData);
    localStorage.setItem('user', JSON.stringify(userData));

    if (accessData) {
      const perms = processPermissions(accessData);
      setPermissions(perms);
      localStorage.setItem('permissions', JSON.stringify(perms));

      // Debug: count permission levels
      const counts = { hidden: 0, readOnly: 0, fullAccess: 0 };
      Object.values(perms).forEach(v => {
        if (v === 0) counts.hidden++;
        else if (v === 1) counts.readOnly++;
        else if (v === 2) counts.fullAccess++;
      });
      console.log('Permission counts:', counts);
    }
  }, []);

  /**
   * Logout function
   */
  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUserState(null);
      setPermissions({});
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
      window.location.href = '/login';
    }
  }, []);

  /**
   * setUser - for backward compatibility
   */
  const setUser = useCallback((newUserData) => {
    if (newUserData === null) {
      setUserState(null);
      localStorage.removeItem('user');
    } else if (typeof newUserData === 'function') {
      setUserState(newUserData);
    } else {
      setUserState(newUserData);
      localStorage.setItem('user', JSON.stringify(newUserData));
    }
  }, []);

  /**
   * Update user data
   */
  const updateUser = useCallback((newUserData) => {
    setUserState((prev) => {
      const updated = { ...prev, ...newUserData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Get permission level for an access key (0, 1, or 2)
   */
  const getPermissionLevel = useCallback(
    (accessKey) => {
      if (!accessKey) return 0;
      return permissions[accessKey] ?? 0;
    },
    [permissions],
  );

  /**
   * Check if user can VIEW (level >= 1)
   */
  const canView = useCallback(
    (accessKey) => {
      return getPermissionLevel(accessKey) >= 1;
    },
    [getPermissionLevel],
  );

  /**
   * Check if user can EDIT (level >= 2)
   */
  const canEdit = useCallback(
    (accessKey) => {
      return getPermissionLevel(accessKey) >= 2;
    },
    [getPermissionLevel],
  );

  /**
   * Check if user can view ANY of the specified permissions
   */
  const canViewAny = useCallback(
    (accessKeys) => {
      if (!Array.isArray(accessKeys) || accessKeys.length === 0) return false;
      return accessKeys.some((key) => canView(key));
    },
    [canView],
  );

  /**
   * Check if user can edit ANY of the specified permissions
   */
  const canEditAny = useCallback(
    (accessKeys) => {
      if (!Array.isArray(accessKeys) || accessKeys.length === 0) return false;
      return accessKeys.some((key) => canEdit(key));
    },
    [canEdit],
  );

  // Legacy compatibility
  const hasPermission = canView;
  const hasAnyPermission = canViewAny;
  const hasAllPermissions = useCallback(
    (accessKeys) => {
      if (!Array.isArray(accessKeys) || accessKeys.length === 0) return false;
      return accessKeys.every((key) => canView(key));
    },
    [canView],
  );

  const value = {
    user,
    setUser,
    updateUser,
    permissions,
    setPermissions,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    // New permission methods (0/1/2)
    getPermissionLevel,
    canView,      // level >= 1
    canEdit,      // level >= 2
    canViewAny,
    canEditAny,
    PERMISSION_LEVELS,
    // Legacy compatibility
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };

  // Show loading spinner with optional backend waking message
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        gap: '20px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #eb6c9c',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        
        {backendWaking && (
          <div style={{
            textAlign: 'center',
            color: '#666',
            maxWidth: '350px',
            padding: '0 20px'
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '16px' }}>
              🚀 Server is waking up...
            </p>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
              This may take 30-60 seconds on first visit. Subsequent loads will be instant!
            </p>
          </div>
        )}

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useUser = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useUser must be used within an AuthProvider');
  }
  return context;
};

export const useAuth = useUser;

export default AuthContext;